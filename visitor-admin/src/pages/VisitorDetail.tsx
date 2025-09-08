import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { VisitorDto } from "../types/visitor";
import { getToken } from "../utils/auth";
import { QRCodeSVG } from "qrcode.react";  // Burada değişiklik

const VisitorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [visitor, setVisitor] = useState<VisitorDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);

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

        const data: VisitorDto = await res.json();
        setVisitor(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVisitor();
  }, [id]);

  const downloadQRCode = () => {
    const svg = document.getElementById("qrCodeSvg");
    if (!svg) return;

    // SVG'yı PNG'ye çevirmek için canvas kullanacağız
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");

      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${visitor?.fullName}_QRCode.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };

    img.src = url;
  };

  if (loading) return <p>Yükleniyor...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!visitor) return <p>Ziyaretçi bulunamadı.</p>;

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <h1>{visitor.fullName} - Detaylar</h1>
      <p>Email: {visitor.email || "-"}</p>
      <p>Telefon: {visitor.phoneNumber || "-"}</p>
      <p>Kayıt Tarihi: {new Date(visitor.createdAt).toLocaleString()}</p>

      <button onClick={() => setShowQrModal(true)} style={{ marginTop: 20 }}>
        QR Kodunu Göster
      </button>

      {showQrModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowQrModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: 20,
              borderRadius: 8,
              textAlign: "center",
            }}
          >
            <QRCodeSVG
              id="qrCodeSvg"
              value={visitor.qrCodeData}
              size={256}
              level="Q"
              includeMargin={true}
            />
            <div style={{ marginTop: 12 }}>
              <button onClick={downloadQRCode}>İndir</button>{" "}
              <button onClick={() => setShowQrModal(false)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorDetail;
