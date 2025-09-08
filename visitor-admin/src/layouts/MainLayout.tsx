import { Link, Outlet, useNavigate } from "react-router-dom";
import { removeToken } from "../utils/auth";

const MainLayout: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "220px",
          background: "#1f2937",
          color: "white",
          padding: "1rem",
        }}
      >
        <h2>Admin Panel</h2>
        <nav>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li><Link to="/dashboard" style={linkStyle}>Dashboard</Link></li>
            <li><Link to="/visitors" style={linkStyle}>Ziyaretçiler</Link></li>
            <li><Link to="/add-visitor" style={linkStyle}>Yeni Ziyaretçi</Link></li>
            <li><Link to="/logs" style={linkStyle}>Loglar</Link></li>
            <li><Link to="/stats" style={linkStyle}>İstatistikler</Link></li>
            <li><Link to="/reports/visitor-logs" style={linkStyle}>Ziyaretçi Log Raporu</Link></li>
            <li><Link to="/add-invitation" style={linkStyle}>Davet Oluştur</Link></li>
            <li><Link to="/invitations" style={linkStyle}>Davetlerim</Link></li>
            <li><Link to="/profile" style={linkStyle}>Profilim</Link></li>
          </ul>
        </nav>

        <button
          onClick={handleLogout}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            background: "#ef4444",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Çıkış
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "1rem" }}>
        <Outlet /> {/* Buraya child route'lar render edilecek */}
      </main>
    </div>
  );
};

const linkStyle: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  display: "block",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "0.5rem 0",
  width: "100%",
  textAlign: "left",
};

export default MainLayout;
