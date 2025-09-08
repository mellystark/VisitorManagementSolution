import React, { useState } from "react";
import { toast } from "react-toastify";
import api from "../utils/api";

interface CreateInvitationDto {
  name: string;
  eventDate: string;
  description?: string;
  slug: string;
  isActive: boolean;
}

const AddInvitation: React.FC = () => {
  const [form, setForm] = useState<CreateInvitationDto>({
    name: "",
    eventDate: "",
    description: "",
    slug: "",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked; // ✅ cast ile çözüm
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.eventDate || !form.slug) {
      toast.error("Zorunlu alanları doldurun!");
      return;
    }

    setLoading(true);
    try {
      await api.post("/Invitations", form);
      toast.success("Davet başarıyla oluşturuldu 🎉");
      setForm({
        name: "",
        eventDate: "",
        description: "",
        slug: "",
        isActive: true,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", textAlign: "center" }}>
      <h1 style={{ marginBottom: "1rem" }}>Yeni Davet Oluştur</h1>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        Lütfen davet bilgilerini doldurun
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Davet Adı"
          value={form.name}
          onChange={handleChange}
          style={inputStyle}
          disabled={loading}
        />
        <input
          type="date"
          name="eventDate"
          value={form.eventDate}
          onChange={handleChange}
          style={inputStyle}
          disabled={loading}
        />
        <textarea
          name="description"
          placeholder="Açıklama"
          value={form.description}
          onChange={handleChange}
          style={{ ...inputStyle, height: 80, resize: "none" }}
          disabled={loading}
        />
        <input
          type="text"
          name="slug"
          placeholder="Slug (ör. etkinlik-2025)"
          value={form.slug}
          onChange={handleChange}
          style={inputStyle}
          disabled={loading}
        />
        <div style={{ textAlign: "left", margin: "0.5rem 0 1rem" }}>
          <label style={{ fontSize: 14 }}>
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              disabled={loading}
              style={{ marginRight: 8 }}
            />
            Aktif mi?
          </label>
        </div>

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Oluşturuluyor..." : "Davet Oluştur"}
        </button>
      </form>
    </div>
  );
};

// Modern input stili
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

export default AddInvitation;
