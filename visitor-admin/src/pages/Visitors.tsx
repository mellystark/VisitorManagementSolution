import React, { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import type { VisitorDto } from "../types/visitor";
import { getToken } from "../utils/auth";

const MySwal = withReactContent(Swal);

const showToast = (
  message: string,
  icon: "success" | "error" | "warning" | "info"
) => {
  MySwal.fire({
    toast: true,
    position: "top-end",
    icon,
    title: message,
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  });
};

interface LogItem {
  id: number;
  visitorName: string;
  entryTime: string;
  exitTime?: string;
}

const API_BASE = "https://localhost:7023"; // gerekiyorsa burayı güncelle

const Visitors: React.FC = () => {
  const [visitors, setVisitors] = useState<VisitorDto[]>([]);
  const [loading, setLoading] = useState(true);

  // SignalR connection ref
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    fetchVisitors();
    startSignalR();

    return () => {
      // cleanup: disconnect ve handler'ları kaldır
      const conn = connectionRef.current;
      if (conn) {
        try {
          conn.off("VisitorAdded");
          conn.off("VisitorUpdated");
          conn.off("VisitorDeleted");
          conn.stop().catch((e) => console.warn("SignalR stop error", e));
        } catch (e) {
          console.warn("SignalR cleanup error", e);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/Visitor`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Ziyaretçi listesi alınamadı");
      const data: VisitorDto[] = await res.json();
      setVisitors(
        data.sort(
          (a, b) =>
            new Date((b as any).createdAt || 0).getTime() -
            new Date((a as any).createdAt || 0).getTime()
        )
      );
      showToast("Ziyaretçiler yüklendi", "success");
    } catch (err) {
      console.error("Ziyaretçi listesi alınamadı", err);
      showToast("Ziyaretçiler yüklenemedi", "error");
    } finally {
      setLoading(false);
    }
  };

  // SignalR başlat
  const startSignalR = async () => {
    // eğer önceki bağlantı varsa önce temizle
    if (connectionRef.current) {
      try {
        await connectionRef.current.stop();
      } catch {}
      connectionRef.current = null;
    }

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/visitorHub`, {
        accessTokenFactory: () => getToken() ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Event handlerlar: idempotent şekilde state güncelle
    conn.on("VisitorAdded", (visitor: VisitorDto) => {
      setVisitors((prev) => {
        // eğer varsa güncelle, yoksa ekle -> createdAt'e göre sıralı döndür
        const exists = prev.some((p) => p.id === visitor.id);
        const next = exists
          ? prev.map((p) => (p.id === visitor.id ? visitor : p))
          : [visitor, ...prev];
        return next.sort(
          (a, b) =>
            new Date((b as any).createdAt || 0).getTime() -
            new Date((a as any).createdAt || 0).getTime()
        );
      });
      // istersen toast göster: showToast("Yeni ziyaretçi eklendi", "info");
    });

    conn.on("VisitorUpdated", (visitor: VisitorDto) => {
      setVisitors((prev) =>
        prev.map((p) => (p.id === visitor.id ? visitor : p))
      );
      // showToast("Ziyaretçi güncellendi", "info");
    });

    conn.on("VisitorDeleted", (id: number) => {
      setVisitors((prev) => prev.filter((p) => p.id !== id));
      // showToast("Ziyaretçi silindi", "info");
    });

    conn.onreconnecting((err) => {
      console.warn("SignalR reconnecting", err);
      // showToast("Bağlantı kopuyor, yeniden bağlanılıyor...", "warning");
    });

    conn.onreconnected(() => {
      console.log("SignalR reconnected");
      // Yeniden bağlandıktan sonra tam güncel liste istiyorsan uncomment:
      // fetchVisitors();
    });

    try {
      await conn.start();
      console.log("SignalR connected");
      connectionRef.current = conn;
    } catch (err) {
      console.error("SignalR connection error:", err);
      // istersen birkaç saniye sonra yeniden dene:
      setTimeout(() => startSignalR(), 5000);
    }
  };

  // --- mevcut handler'ların olduğu kısım (handleDelete, handleEdit, handleExportCsv, handleShowLogs)
  // Bunlar backend çağrısı yapıyor ve local state'i güncelliyor; signalR eventleri de gelecektir, idempotent şekilde işleniyor.

  const handleDelete = async (id: number) => {
    const result = await MySwal.fire({
      title: "Emin misiniz?",
      text: "Bu ziyaretçiyi silmek istiyorsunuz!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Evet, sil!",
      cancelButtonText: "İptal",
    });

    if (result.isConfirmed) {
      try {
        const token = getToken();
        const res = await fetch(`${API_BASE}/api/Visitor/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          // local update (signalR event'i de gelecektir, ama bu idempotent)
          setVisitors((prev) => prev.filter((v) => v.id !== id));
          showToast("Ziyaretçi silindi", "success");
        } else {
          showToast("Silme başarısız", "error");
        }
      } catch (err) {
        console.error("Silme hatası:", err);
        showToast("Silme sırasında hata oluştu", "error");
      }
    }
  };

  const handleExportCsv = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/Visitor/export-csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        Swal.fire("Hata", "CSV indirme başarısız", "error");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Visitors_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      Swal.fire("Başarılı", "CSV indirildi", "success");
    } catch (err) {
      console.error("CSV indirme hatası:", err);
      Swal.fire("Hata", "CSV indirilirken hata oluştu", "error");
    }
  };

  const handleEdit = (visitor: VisitorDto) => {
    MySwal.fire({
      title: "Ziyaretçi Düzenle",
      html: `
        <input id="swal-name" class="swal2-input" placeholder="İsim" value="${
          visitor.fullName || ""
        }">
        <input id="swal-email" class="swal2-input" placeholder="Email" value="${
          visitor.email || ""
        }">
        <input id="swal-phone" class="swal2-input" placeholder="Telefon" value="${
          visitor.phoneNumber || ""
        }">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Kaydet",
      cancelButtonText: "İptal",
      preConfirm: () => {
        return {
          fullName: (document.getElementById("swal-name") as HTMLInputElement)
            .value,
          email: (document.getElementById("swal-email") as HTMLInputElement)
            .value,
          phoneNumber: (
            document.getElementById("swal-phone") as HTMLInputElement
          ).value,
        };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const updatedData = { ...visitor, ...result.value };
          const token = getToken();
          const res = await fetch(`${API_BASE}/api/Visitor/${visitor.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updatedData),
          });
          if (res.ok) {
            // local update (signalR event'i de gelecektir)
            setVisitors((prev) =>
              prev.map((v) => (v.id === visitor.id ? updatedData : v))
            );
            showToast("Ziyaretçi güncellendi", "success");
          } else {
            showToast("Güncelleme başarısız", "error");
          }
        } catch (err) {
          console.error("Güncelleme hatası:", err);
          showToast("Güncelleme sırasında hata oluştu", "error");
        }
      }
    });
  };

  const handleShowLogs = async (id: number) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/Logs?visitorId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const logs: LogItem[] = await res.json();

      if (!logs.length) {
        MySwal.fire({
          title: "Ziyaretçi Logları",
          html: "<p class='text-gray-500'>Log bulunamadı.</p>",
          confirmButtonText: "Kapat",
          width: 600,
        });
        return;
      }

      let currentPage = 1;
      const pageSize = 5;
      const totalPages = Math.ceil(logs.length / pageSize);

      const renderTable = () => {
        const start = (currentPage - 1) * pageSize;
        const paginated = logs.slice(start, start + pageSize);

        return `
          <table class="min-w-full border border-gray-300 text-left">
            <thead class="bg-gray-100">
              <tr>
                <th class="p-2 border">Giriş</th>
                <th class="p-2 border">Çıkış</th>
              </tr>
            </thead>
            <tbody>
              ${paginated
                .map(
                  (log) => `
                  <tr>
                    <td class="p-2 border">${new Date(
                      log.entryTime
                    ).toLocaleString()}</td>
                    <td class="p-2 border">${
                      log.exitTime
                        ? new Date(log.exitTime).toLocaleString()
                        : "-"
                    }</td>
                  </tr>`
                )
                .join("")}
            </tbody>
          </table>
          <div class="flex justify-between items-center mt-4">
            <button id="prevPage" class="px-3 py-1 bg-gray-200 rounded ${
              currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
            }">Önceki</button>
            <span>Sayfa ${currentPage} / ${totalPages}</span>
            <button id="nextPage" class="px-3 py-1 bg-gray-200 rounded ${
              currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
            }">Sonraki</button>
          </div>
        `;
      };

      const showModal = () => {
        MySwal.fire({
          title: "Ziyaretçi Logları",
          html: renderTable(),
          showConfirmButton: true,
          confirmButtonText: "Kapat",
          width: 600,
          didRender: () => {
            const prevBtn = document.getElementById("prevPage");
            const nextBtn = document.getElementById("nextPage");

            if (prevBtn && currentPage > 1) {
              prevBtn.addEventListener("click", () => {
                currentPage--;
                showModal();
              });
            }

            if (nextBtn && currentPage < totalPages) {
              nextBtn.addEventListener("click", () => {
                currentPage++;
                showModal();
              });
            }
          },
        });
      };

      showModal();
    } catch (err) {
      console.error(err);
      showToast("Loglar yüklenirken hata oluştu", "error");
    }
  };

  if (loading)
    return <p className="text-center mt-6 text-lg text-white">Yükleniyor...</p>;

return (
  <div className="max-w-5xl mx-auto p-6 bg-gray-900 text-white min-h-screen">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-700 p-2 rounded-lg text-white">
        Ziyaretçiler
      </h1>
      <button
        className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition duration-300 shadow-md"
        onClick={handleExportCsv}
      >
        CSV İndir
      </button>
    </div>

    <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl shadow-lg divide-y divide-gray-700">
      {visitors.map((v) => (
        <div
          key={v.id}
          className="grid grid-cols-4 gap-4 items-center py-4 hover:bg-gray-700/40 transition duration-300"
        >
          {/* İsim */}
          <div>
            <p className="text-sm text-gray-400">İsim</p>
            <p className="text-lg font-semibold">{v.fullName || "-"}</p>
          </div>

          {/* Email */}
          <div>
            <p className="text-sm text-gray-400">Email</p>
            <p>{v.email || "-"}</p>
          </div>

          {/* Telefon */}
          <div>
            <p className="text-sm text-gray-400">Telefon</p>
            <p>{v.phoneNumber || "-"}</p>
          </div>

          {/* İşlemler */}
          <div className="flex gap-2 justify-end">
            <button
              className="bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition duration-300"
              onClick={() => handleEdit(v)}
            >
              Düzenle
            </button>
            <button
              className="bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition duration-300"
              onClick={() => handleShowLogs(v.id)}
            >
              Loglar
            </button>
            <button
              className="bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition duration-300"
              onClick={() => handleDelete(v.id)}
            >
              Sil
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

};

export default Visitors;
