import { useEffect, useState } from "react";
import api from "../utils/api";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

interface Invitation {
  id: number;
  name: string;
  eventDate: string;
  description?: string;
  slug: string;
  isActive: boolean;
}

const Invitations: React.FC = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Invitations");
      setInvitations(res.data);
    } catch (err: any) {
      toast.error("Davetler yüklenemedi!");
    } finally {
      setLoading(false);
    }
  };

  const deleteInvitation = async (id: number) => {
    if (!window.confirm("Bu daveti silmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/Invitations/${id}`);
      toast.success("Davet silindi");
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    } catch (err: any) {
      toast.error("Silme işlemi başarısız!");
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ marginBottom: "1.5rem", fontSize: "1.5rem", fontWeight: 600 }}>
        Davetler
      </h1>

      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <div className="card" style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {invitations.map((inv) => (
            <div
              key={inv.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "1rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                background: "white",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                  {inv.name}
                </h2>
                <p style={{ margin: "0.25rem 0", color: "#6b7280" }}>
                  📅 {new Date(inv.eventDate).toLocaleDateString()}
                </p>
                <p style={{ margin: "0.25rem 0", color: "#6b7280" }}>🔗 {inv.slug}</p>
                <p style={{ margin: "0.25rem 0", fontWeight: 500 }}>
                  {inv.isActive ? "✅ Aktif" : "❌ Pasif"}
                </p>
              </div>

              <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                <Link
                  to={`/invitations/${inv.slug}`}
                  style={{
                    flex: 1,
                    background: "#2563eb",
                    color: "white",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    textAlign: "center",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  Detay
                </Link>
                <button
                  onClick={() => deleteInvitation(inv.id)}
                  style={{
                    flex: 1,
                    background: "#ef4444",
                    color: "white",
                    padding: "8px 12px",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
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

export default Invitations;
