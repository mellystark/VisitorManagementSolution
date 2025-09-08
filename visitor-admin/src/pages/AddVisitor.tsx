import React, { useState } from "react";
import { toast } from "react-toastify";
import api from "../utils/api";

interface CreateVisitorDto {
  fullName: string;
  email?: string;
  phoneNumber?: string;
}

const AddVisitor: React.FC = () => {
  const [form, setForm] = useState<CreateVisitorDto>({
    fullName: "",
    email: "",
    phoneNumber: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast.error("Ad Soyad zorunludur!");
      return;
    }
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      toast.error("Geçerli bir email giriniz!");
      return;
    }

    setLoading(true);
    try {
      await api.post("/Visitor", form);
      toast.success("Ziyaretçi başarıyla eklendi 🎉");
      setForm({
        fullName: "",
        email: "",
        phoneNumber: "",
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", textAlign: "center" }}>
      <h1 style={{ marginBottom: "1rem" }}>Yeni Ziyaretçi Ekle</h1>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        Lütfen ziyaretçi bilgilerini doldurun
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="fullName"
          placeholder="Ad Soyad*"
          value={form.fullName}
          onChange={handleChange}
          style={inputStyle}
          disabled={loading}
        />
        <input
          type="email"
          name="email"
          placeholder="E-posta"
          value={form.email}
          onChange={handleChange}
          style={inputStyle}
          disabled={loading}
        />
        <input
          type="tel"
          name="phoneNumber"
          placeholder="Telefon"
          value={form.phoneNumber}
          onChange={handleChange}
          style={inputStyle}
          disabled={loading}
        />

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Ekleniyor..." : "Ziyaretçi Ekle"}
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

export default AddVisitor;
