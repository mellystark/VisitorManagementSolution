import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getToken } from "../utils/auth";

interface Visitor {
  id: number;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  notes?: string;
}

const EditVisitor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetchVisitor = async () => {
      setLoading(true);
      try {
        const token = getToken();
        const res = await fetch(`https://localhost:7023/api/Visitor/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Ziyaretçi bulunamadı.");
        const data: Visitor = await res.json();
        setVisitor(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchVisitor();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!visitor) return;
    const { name, value } = e.target;
    setVisitor({ ...visitor, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitor) return;
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(`https://localhost:7023/api/Visitor/${visitor.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: visitor.id,
          fullName: visitor.fullName,
          email: visitor.email,
          phoneNumber: visitor.phoneNumber,
          notes: visitor.notes,
        }),
      });
      if (!res.ok) throw new Error("Güncelleme başarısız.");
      alert("Ziyaretçi bilgileri güncellendi.");
      navigate("/visitors");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Yükleniyor...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!visitor) return <p>Ziyaretçi bulunamadı.</p>;

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <h1>Ziyaretçi Düzenle</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Ad Soyad:
            <input
              type="text"
              name="fullName"
              value={visitor.fullName}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: 6 }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Email:
            <input
              type="email"
              name="email"
              value={visitor.email || ""}
              onChange={handleChange}
              style={{ width: "100%", padding: 6 }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Telefon:
            <input
              type="tel"
              name="phoneNumber"
              value={visitor.phoneNumber || ""}
              onChange={handleChange}
              style={{ width: "100%", padding: 6 }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Notlar:
            <textarea
              name="notes"
              value={visitor.notes || ""}
              onChange={handleChange}
              rows={4}
              style={{ width: "100%", padding: 6 }}
            />
          </label>
        </div>
        <button type="submit" disabled={saving}>
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>
    </div>
  );
};

export default EditVisitor;
