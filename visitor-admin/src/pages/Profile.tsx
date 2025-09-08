import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { User, Pencil, KeyRound, LogOut } from "lucide-react";
import styles from "../myStyles/Profile.module.css";

interface ProfileDto {
  userName: string;
  fullName: string;
  email: string;
  role?: string;
  createdAt?: string;
}

type TabKey = "info" | "password" | null;

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<TabKey>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("https://localhost:7023/api/Admin/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Profil alınamadı.");
      const data: ProfileDto = await res.json();
      setProfile(data);
      setFullName(data.fullName || "");
      setEmail(data.email || "");
    } catch (err: any) {
      toast.error(err?.message || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const createdText = useMemo(() => {
    if (!profile?.createdAt) return "";
    const d = new Date(profile.createdAt);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString();
  }, [profile]);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://localhost:7023/api/Admin/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName, email }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Profil güncellendi.");
      await fetchProfile();
    } catch (err: any) {
      toast.error(err?.message || "Güncelleme başarısız.");
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPass(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://localhost:7023/api/Admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Şifre değiştirildi.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Şifre değiştirilemedi.");
    } finally {
      setSavingPass(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const toggle = (key: TabKey) => setActive(prev => (prev === key ? null : key));

  if (loading) {
    return <div className={styles.container}>Yükleniyor...</div>;
  }

  if (!profile) {
    return <div className={styles.container}>Profil yüklenemedi.</div>;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <User size={24} />
            <h1>Profile • {profile.userName}</h1>
          </div>
          {createdText && <span className={styles.created}>Oluşturulma: {createdText}</span>}
        </div>
      </div>

      {/* Kişisel Bilgiler */}
      <div className={styles.accordion}>
        <button onClick={() => toggle("info")} className={styles.accordionBtn}>
          <span><Pencil size={20} /> Kişisel Bilgileri Güncelle</span>
          <span>{active === "info" ? "Gizle" : "Göster"}</span>
        </button>
        {active === "info" && (
          <div className={styles.form}>
            <form onSubmit={handleSaveInfo}>
              <div>
                <label className={styles.label}>Ad Soyad</label>
                <input className={styles.input} value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div>
                <label className={styles.label}>E-posta</label>
                <input className={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div style={{ display: "flex", justifyContent: "end", marginTop: "1rem" }}>
                <button type="submit" disabled={savingInfo} className={styles.button}>
                  {savingInfo ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Şifre */}
      <div className={styles.accordion}>
        <button onClick={() => toggle("password")} className={styles.accordionBtn}>
          <span><KeyRound size={20} /> Şifre Değiştir</span>
          <span>{active === "password" ? "Gizle" : "Göster"}</span>
        </button>
        {active === "password" && (
          <div className={styles.form}>
            <form onSubmit={handleSavePassword}>
              <div>
                <label className={styles.label}>Mevcut Şifre</label>
                <input className={styles.input} type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
              </div>
              <div>
                <label className={styles.label}>Yeni Şifre</label>
                <input className={styles.input} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div style={{ display: "flex", justifyContent: "end", marginTop: "1rem" }}>
                <button type="submit" disabled={savingPass} className={styles.button}>
                  {savingPass ? "Kaydediliyor..." : "Şifreyi Değiştir"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Çıkış */}
      <div className={styles.accordion}>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <span><LogOut size={20} /> Çıkış Yap</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};

export default Profile;
