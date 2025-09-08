import React, { useEffect, useState } from "react";
import { getToken } from "../utils/auth";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as signalR from "@microsoft/signalr";
import Swal from "sweetalert2";

interface LogItem {
  id: number;
  performedBy: string;
  visitorId: number;
  entryTime: string;
  exitTime?: string;
  visitorName?: string;
  phoneNumber?: string;
}

interface Visitor {
  id: number;
  fullName: string;
  phoneNumber: string;
}

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [phoneFilter, setPhoneFilter] = useState<string>("");
  const [visitorNameFilter, setVisitorNameFilter] = useState<string>("");
  const [onlyNotExited, setOnlyNotExited] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const logsPerPage = 10;

  // Ziyaretçileri çek
  const fetchVisitors = async () => {
    try {
      const token = getToken();
      const res = await fetch("https://localhost:7023/api/Visitor", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Ziyaretçi listesi alınamadı");
      const data = await res.json();
      setVisitors(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async (page: number = 1) => {
    setLoadingLogs(true);
    try {
      const token = getToken();
      let url = `https://localhost:7023/api/Logs/all?page=${page}&pageSize=${logsPerPage}&`;

      if (startDate)
        url += `startDate=${encodeURIComponent(startDate.toISOString())}&`;
      if (endDate)
        url += `endDate=${encodeURIComponent(endDate.toISOString())}&`;
      if (phoneFilter) url += `phoneNumber=${encodeURIComponent(phoneFilter)}&`;
      if (visitorNameFilter)
        url += `visitorName=${encodeURIComponent(visitorNameFilter)}&`;
      if (onlyNotExited) url += `onlyNotExited=true&`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Log listesi alınamadı");

      const data = await res.json();
      const sortedLogs = data.data.sort(
        (a: LogItem, b: LogItem) =>
          new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime()
      );

      setLogs(sortedLogs);
      setCurrentPage(data.page);
      setTotalPages(Math.ceil(data.totalCount / logsPerPage));
    } catch (err) {
      console.error(err);
      setLogs([]);
      setTotalPages(1);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Filtre veya sayfa değişince otomatik log çek
  useEffect(() => {
    fetchLogs(currentPage);
  }, [
    currentPage,
    startDate,
    endDate,
    phoneFilter,
    visitorNameFilter,
    onlyNotExited,
  ]);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber); // fetchLogs otomatik useEffect'ten gelecek
  };

  useEffect(() => {
    fetchVisitors();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7023/hubs/notifications", {
        accessTokenFactory: () => getToken() ?? "",
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveNotification", () => {
      fetchLogs(currentPage); // mevcut sayfayı ve filtreleri koru
    });

    connection
      .start()
      .then(() => console.log("SignalR bağlantısı kuruldu"))
      .catch((err) => console.error("SignalR bağlantı hatası:", err));

    return () => {
      connection.stop();
    };
  }, []); // sadece mount olduğunda çalışacak

  const handleFilter = () => {
    setCurrentPage(1);
    fetchLogs(1);
  };

  // const paginate = (pageNumber: number) => {
  //   setCurrentPage(pageNumber);
  //   fetchLogs(pageNumber);
  // };

  const showLogDetails = (log: LogItem) => {
    Swal.fire({
      title: log.exitTime ? "Çıkış İşlemi" : "Giriş İşlemi",
      html: `
      <p><strong>İşlem:</strong> ${log.exitTime ? "Çıkış" : "Giriş"}</p>
      <p><strong>Zaman:</strong> ${new Date(
        log.exitTime ? log.exitTime : log.entryTime
      ).toLocaleString()}</p>
      <p><strong>Kişinin Tam Adı:</strong> ${log.visitorName}</p>
      <p><strong>Telefon:</strong> ${log.phoneNumber || "-"}</p>
    `,
      confirmButtonText: "Tamam",
    });
  };

  const handleExportCsv = async () => {
    try {
      const token = getToken();
      let url = "https://localhost:7023/api/Logs/export-csv?";

      if (startDate)
        url += `startDate=${encodeURIComponent(startDate.toISOString())}&`;
      if (endDate)
        url += `endDate=${encodeURIComponent(endDate.toISOString())}&`;
      if (phoneFilter) url += `phoneNumber=${encodeURIComponent(phoneFilter)}&`;
      if (visitorNameFilter)
        url += `visitorName=${encodeURIComponent(visitorNameFilter)}&`;
      if (onlyNotExited) url += `onlyNotExited=true&`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        alert("CSV indirme başarısız");
        return;
      }

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Logs_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("CSV indirme hatası:", err);
      alert("CSV indirilirken hata oluştu");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-900 text-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-700 p-2 rounded-lg">
          Log Listesi
        </h1>
        <button
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition duration-300 shadow-md"
          onClick={handleExportCsv}
        >
          CSV İndir
        </button>
      </div>

      {/* Filtreleme Alanı */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl shadow-lg mb-6">
        <h2 className="text-xl font-semibold mb-4 text-center">Filtreleme</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            type="text"
            value={visitorNameFilter}
            onChange={(e) => setVisitorNameFilter(e.target.value)}
            placeholder="Ziyaretçi ismi"
            style={inputStyle}
            className="w-full px-4 py-3 rounded-full bg-gray-900 text-white border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="text"
            value={phoneFilter}
            onChange={(e) => setPhoneFilter(e.target.value)}
            placeholder="Telefon numarası"
            style={inputStyle}
            className="w-full px-4 py-3 rounded-full bg-gray-900 text-white border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            dateFormat="yyyy-MM-dd"
            placeholderText="Başlangıç tarihi"
            className="w-full px-4 py-3 rounded-full bg-gray-900 text-white border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            dateFormat="yyyy-MM-dd"
            placeholderText="Bitiş tarihi"
            className="w-full px-4 py-3 rounded-full bg-gray-900 text-white border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <label className="flex items-center gap-2 text-sm text-gray-300 px-2">
            <input
              type="checkbox"
              checked={onlyNotExited}
              onChange={(e) => setOnlyNotExited(e.target.checked)}
              className="w-4 h-4 accent-purple-500"
            />
            Çıkış Yapmayanlar
          </label>
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={handleFilter}
            className="w-full md:w-auto px-8 py-3 rounded-full font-bold bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 transition duration-300 shadow-md"
          >
            Filtrele
          </button>
        </div>
      </div>

      {/* Log Listesi */}
      {loadingLogs ? (
        <p className="text-center text-gray-400">Loglar yükleniyor...</p>
      ) : logs.length === 0 ? (
        <p className="text-center text-red-400">Log bilgisi bulunmamaktadır.</p>
      ) : (
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl shadow-lg divide-y divide-gray-700">
          {logs.map((log) => (
            <div
              key={log.id}
              className="grid grid-cols-4 gap-4 items-center py-4 hover:bg-gray-700/40 transition duration-300 cursor-pointer"
              onClick={() => showLogDetails(log)}
            >
              {/* İşlem */}
              <div>
                <p className="text-sm text-gray-400">İşlem</p>
                <p
                  className={`text-lg font-semibold ${
                    log.exitTime ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {log.exitTime ? "ÇIKIŞ" : "GİRİŞ"}
                </p>
              </div>

              {/* Zaman */}
              <div>
                <p className="text-sm text-gray-400">Zaman</p>
                <p>
                  {new Date(
                    log.exitTime ? log.exitTime : log.entryTime
                  ).toLocaleString()}
                </p>
              </div>

              {/* Kişi */}
              <div>
                <p className="text-sm text-gray-400">Kişi</p>
                <p>{log.visitorName || "-"}</p>
              </div>

              {/* Telefon */}
              <div>
                <p className="text-sm text-gray-400">Telefon</p>
                <p>{log.phoneNumber || "-"}</p>
              </div>
            </div>
          ))}

          {/* Sayfalama */}
          <div className="flex justify-center items-center gap-2 mt-6">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => paginate(i + 1)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  currentPage === i + 1
                    ? "bg-yellow-500 text-white font-semibold"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  marginBottom: "12px",
  borderRadius: "30px",
  border: "1px solid #ccc",
  outline: "none",
  fontSize: "14px",
  boxSizing: "border-box",
};

// Modern buton stili
const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: "30px",
  border: "none",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "bold",
  background: "linear-gradient(90deg, #7c3aed, #9333ea)", // mor degrade
  color: "white",
};

export default Logs;
