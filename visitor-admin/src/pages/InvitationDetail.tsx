import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/api";
import { toast } from "react-toastify";

interface Invitation {
  id: number;
  name: string;
  eventDate: string;
  description?: string;
  slug: string;
  isActive: boolean;
}

type InviteStatus = "Pending" | "Approved" | "Rejected";

interface InviteRequest {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  status: InviteStatus;
  reason?: string;
}

interface Visitor {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
  qrCodeData?: string;
}

const InvitationDetail: React.FC = () => {
  const { slug } = useParams();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [requests, setRequests] = useState<InviteRequest[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [slug]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/Invitations/${slug}`);
      setInvitation(res.data);

      const reqs = await api.get(`/Invitations/${res.data.id}/requests`);
      setRequests(reqs.data);

      const vis = await api.get(`/Invitations/${res.data.id}/visitors`);
      setVisitors(vis.data);
    } catch {
      toast.error("Detaylar yüklenemedi!");
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (requestId: number) => {
    try {
      await api.post(`/Invitations/requests/${requestId}/approve`);
      toast.success("Başvuru onaylandı");
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data || "Onaylama başarısız!");
    }
  };

  const rejectRequest = async (requestId: number, reason?: string) => {
    const body = { reason: reason?.trim() || "Uygun bulunmadı" };
    try {
      await api.post(`/Invitations/requests/${requestId}/reject`, body);
      toast.info("Başvuru reddedildi");
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Reddetme başarısız!");
    }
  };

  const removeVisitor = async (visitorId: number) => {
    try {
      await api.delete(`/Invitations/${invitation?.id}/visitors/${visitorId}`);
      toast.info("Katılımcı çıkarıldı");
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data || "Silme başarısız!");
    }
  };

  const sendQrEmail = async (id: number) => {
    try {
      await api.post(`/Visitor/${id}/send-qrcode-email`);
      toast.success("QR kod e-posta ile gönderildi!");
    } catch (err: any) {
      toast.error(err?.response?.data || "Mail gönderilemedi!");
    }
  };

  if (loading) return <p style={{ textAlign: "center" }}>Yükleniyor...</p>;
  if (!invitation) return <p>Bu davet bulunamadı.</p>;

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "1rem" }}>
      {/* Davet Bilgileri */}
      <div className="card"
        style={{
          background: "#fff",
          padding: "1.5rem",
          borderRadius: "12px",
          marginBottom: "2rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.6rem" }}>{invitation.name}</h1>
        <p style={{ color: "#555", marginTop: "0.5rem" }}>
          📅 <strong>{new Date(invitation.eventDate).toLocaleDateString()}</strong>
        </p>
        <p>
          Durum:{" "}
          <span
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              fontWeight: 600,
              background: invitation.isActive ? "#dcfce7" : "#fee2e2",
              color: invitation.isActive ? "#15803d" : "#b91c1c",
            }}
          >
            {invitation.isActive ? "Aktif" : "Pasif"}
          </span>
        </p>
        {invitation.description && (
          <p style={{ marginTop: "0.5rem", color: "#444" }}>
            {invitation.description}
          </p>
        )}
      </div>

      {/* Başvurular */}
      <h2 style={{ marginBottom: "1rem" }}>⏳ Başvurular</h2>
      {requests.length === 0 ? (
        <p>Başvuru yok.</p>
      ) : (
        <div className="card" style={{ display: "grid", gap: "1rem" }}>
          {requests.map((r) => (
            <div
              key={r.id}
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "1rem",
                boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
              }}
            >
              <p style={{ margin: 0, fontWeight: 600 }}>{r.fullName}</p>
              <p style={{ margin: "0.2rem 0", color: "#666" }}>
                {r.email} – {r.phoneNumber}
              </p>
              <p>
                Durum:{" "}
                <span
                  style={{
                    padding: "2px 6px",
                    borderRadius: "6px",
                    fontWeight: 600,
                    background:
                      r.status === "Pending"
                        ? "#fef9c3"
                        : r.status === "Rejected"
                        ? "#fee2e2"
                        : "#dcfce7",
                    color:
                      r.status === "Pending"
                        ? "#92400e"
                        : r.status === "Rejected"
                        ? "#b91c1c"
                        : "#15803d",
                  }}
                >
                  {r.status === "Pending" && "Beklemede"}
                  {r.status === "Rejected" && "Reddedildi"}
                  {r.status === "Approved" && "Onaylandı"}
                </span>
              </p>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                {r.status !== "Approved" && (
                  <button style={btnPrimary} onClick={() => approveRequest(r.id)}>
                    Onayla
                  </button>
                )}
                <input
                  type="text"
                  placeholder="Reddetme sebebi"
                  value={r.reason || ""}
                  onChange={(e) =>
                    setRequests((prev) =>
                      prev.map((req) =>
                        req.id === r.id ? { ...req, reason: e.target.value } : req
                      )
                    )
                  }
                  style={{
                    flex: 1,
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    padding: "6px",
                  }}
                />
                <button
                  style={btnDanger}
                  onClick={() => rejectRequest(r.id, r.reason)}
                >
                  Reddet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Onaylanan Katılımcılar */}
      <h2 style={{ margin: "2rem 0 1rem" }}>✅ Onaylanan Katılımcılar</h2>
      {visitors.length === 0 ? (
        <p>Henüz onaylanmış katılımcı yok.</p>
      ) : (
        <div className="card" style={{ display: "grid", gap: "1rem" }}>
          {visitors.map((v) => (
            <div
              key={v.id}
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "1rem",
                boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
              }}
            >
              <p style={{ margin: 0, fontWeight: 600 }}>{v.fullName}</p>
              <p style={{ margin: "0.2rem 0", color: "#666" }}>
                {v.email} – {v.phoneNumber}
              </p>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  style={btnPrimary}
                  onClick={async () => {
                    try {
                      const res = await api.get(`/Visitor/${v.id}`);
                      const data = res.data.qrCodeData;
                      if (data) {
                        const qrWindow = window.open(
                          "",
                          "_blank",
                          "width=300,height=300"
                        );
                        if (qrWindow) {
                          qrWindow.document.write("<h3>Davet QR Kodu</h3>");
                          qrWindow.document.write(
                            `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${data}" />`
                          );
                        }
                      }
                    } catch {
                      toast.error("QR kod alınamadı!");
                    }
                  }}
                >
                  QR Göster
                </button>

                <button style={btnSecondary} onClick={() => sendQrEmail(v.id)}>
                  Mail Gönder
                </button>

                <button style={btnDanger} onClick={() => removeVisitor(v.id)}>
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* Basit buton stilleri */
const btnPrimary: React.CSSProperties = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 500,
};

const btnSecondary: React.CSSProperties = {
  background: "#6b7280",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 500,
};

const btnDanger: React.CSSProperties = {
  background: "#ef4444",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 500,
};

export default InvitationDetail;
