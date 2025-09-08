import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getInvitationBySlug, createInviteRequest } from "../lib/api";
import type { Invitation } from "../types";
import confetti from "canvas-confetti";
// 🐶 hayvan animasyonları için import
import Lottie from "lottie-react";
import catAnim from "../assets/animations/Dance cat.json";
import dogAnim from "../assets/animations/Butterfly hearts.json";

export default function InvitationPage() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [inv, setInv] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!slug) return;
    setLoading(true);
    setError(null);
    getInvitationBySlug(slug)
      .then((data) => {
        if (!mounted) return;
        setInv(data);
      })
      .catch((e) => {
        setError(
          e?.response?.data?.message ?? "Davet bulunamadı veya pasif durumda."
        );
      })
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, [slug]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // basit doğrulama
    if (!fullName.trim()) return setError("Ad Soyad zorunlu.");
    if (!/^\S+@\S+\.\S+$/.test(email))
      return setError("Geçerli bir e-posta girin.");
    if (!phoneNumber.trim()) return setError("Telefon zorunlu.");

    try {
      setSubmitting(true);
      const res = await createInviteRequest(slug!, {
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        notes: notes.trim() || undefined,
      });
      setSuccessMsg(res.message ?? "Başvurunuz alındı.");
      confetti(); // burada patlat 🚀
      setFullName("");
      setEmail("");
      setPhoneNumber("");
      setNotes("");
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? "Başvuru gönderilirken hata oluştu."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Yükleniyor…</div>;
  if (error)
    return <div style={{ padding: 24, color: "crimson" }}>{error}</div>;
  if (!inv) return null;

  const eventDate = new Date(inv.eventDate).toLocaleString();

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1680,
        margin: "32px auto",
        padding: 16,
      }}
    >
      {/* 🐱 Sağ üstte kedi */}
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 50,
          width: 350,
          height: 350,
        }}
      >
        <Lottie
          animationData={catAnim}
          loop={true}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {/* 🐶 Sol altta köpek */}
      <div
        style={{
          position: "fixed",
          bottom: 50,
          left: 30,
          width: 260,
          height: 260,
        }}
      >
        <Lottie
          animationData={dogAnim}
          loop={true}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <h1>{inv.name}</h1>
      <p>
        <b>Tarih:</b> {eventDate}
      </p>
      {inv.description && (
        <p style={{ whiteSpace: "pre-wrap" }}>{inv.description}</p>
      )}
      <hr style={{ margin: "16px 0" }} />

      <h2>Katılım Formu</h2>
      <form onSubmit={onSubmit}>
        <label>Ad Soyad</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ad Soyad"
          style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
        />

        <label>E-posta</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ornek@mail.com"
          type="email"
          style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
        />

        <label>Telefon</label>
        <input
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="5xx xxx xx xx"
          style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
        />

        <label>Not (opsiyonel)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
        />

        <button
          type="submit"
          disabled={submitting}
          style={{ padding: "10px 16px" }}
        >
          {submitting ? "Gönderiliyor…" : "Başvuruyu Gönder"}
        </button>
      </form>

      {successMsg && (
        <p style={{ color: "green", marginTop: 12 }}>{successMsg}</p>
      )}
      {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}
    </div>
  );
}
