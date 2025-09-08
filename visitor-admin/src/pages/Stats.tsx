import React, { useEffect, useState } from "react";
import { getToken } from "../utils/auth";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import Swal from "sweetalert2";

interface StatsData {
  TotalVisitors: number;
  DailyEntries: number;
  DailyExits: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

const Stats: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const token = getToken();
        const res = await fetch("https://localhost:7023/api/Stats/overview", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("İstatistikler alınamadı");
        const data = await res.json();
        setStats({
          TotalVisitors: data.totalVisitors,
          DailyEntries: data.dailyEntries,
          DailyExits: data.dailyExits,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleExportCsv = async () => {
    try {
      const token = getToken();
      const res = await fetch("https://localhost:7023/api/Stats/export-csv", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        Swal.fire("Hata", "CSV indirme başarısız", "error");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Stats_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      Swal.fire("Başarılı", "CSV indirildi", "success");
    } catch (err) {
      console.error("CSV indirme hatası:", err);
      Swal.fire("Hata", "CSV indirilirken hata oluştu", "error");
    }
  };

  if (loading) return <p style={styles.loading}>Yükleniyor...</p>;
  if (!stats) return <p style={styles.error}>Veri bulunamadı.</p>;

  const pieData = [
    { name: "Toplam Ziyaretçi", value: stats.TotalVisitors },
    { name: "Bugünkü Giriş", value: stats.DailyEntries },
    { name: "Bugünkü Çıkış", value: stats.DailyExits },
  ];

  const barData = [
    { name: "Toplam Ziyaretçi", value: stats.TotalVisitors },
    { name: "Bugünkü Giriş", value: stats.DailyEntries },
    { name: "Bugünkü Çıkış", value: stats.DailyExits },
  ];

  const lineData = [
    { name: "Toplam Ziyaretçi", value: stats.TotalVisitors },
    { name: "Bugünkü Giriş", value: stats.DailyEntries },
    { name: "Bugünkü Çıkış", value: stats.DailyExits },
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>İstatistikler</h1>
      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <button
          onClick={handleExportCsv}
          style={{
            backgroundColor: "#f59e0b",
            color: "#fff",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          CSV İndir
        </button>
      </div>

      <div style={styles.chartContainer}>
        {/* Pie Chart */}
        <div style={styles.chartWrapper}>
          <h3 style={styles.chartTitle}>Ziyaretçi Dağılımı</h3>
          <PieChart width={400} height={300}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={styles.tooltip} />
            <Legend wrapperStyle={styles.legend} />
          </PieChart>
        </div>

        {/* Bar Chart */}
        <div style={styles.chartWrapper}>
          <h3 style={styles.chartTitle}>Ziyaretçi Sayıları</h3>
          <BarChart
            width={400}
            height={300}
            data={barData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
            <XAxis dataKey="name" stroke="#e5e7eb" />
            <YAxis stroke="#e5e7eb" />
            <Tooltip contentStyle={styles.tooltip} />
            <Legend wrapperStyle={styles.legend} />
            <Bar dataKey="value" fill={COLORS[0]} />
          </BarChart>
        </div>

        {/* Line Chart */}
        <div style={styles.chartWrapper}>
          <h3 style={styles.chartTitle}>Ziyaretçi Trendleri</h3>
          <LineChart
            width={400}
            height={300}
            data={lineData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
            <XAxis dataKey="name" stroke="#e5e7eb" />
            <YAxis stroke="#e5e7eb" />
            <Tooltip contentStyle={styles.tooltip} />
            <Legend wrapperStyle={styles.legend} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={COLORS[1]}
              strokeWidth={2}
            />
          </LineChart>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "2rem auto",
    padding: "1rem",
    backgroundColor: "#000000",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#f9fafb",
    textAlign: "center",
    marginBottom: "2rem",
  },
  chartContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "2rem",
    justifyContent: "center",
  },
  chartWrapper: {
    backgroundColor: "#3a3a3aff",
    padding: "1rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  chartTitle: {
    fontSize: "1.2rem",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: "1rem",
  },
  tooltip: {
    backgroundColor: "#1f2937",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    padding: "0.5rem",
  },
  legend: {
    color: "#1f2937",
    fontSize: "0.9rem",
  },
  loading: {
    textAlign: "center",
    fontSize: "1.2rem",
    color: "#1f2937",
    marginTop: "2rem",
  },
  error: {
    textAlign: "center",
    fontSize: "1.2rem",
    color: "#ef4444",
    marginTop: "2rem",
  },
};

export default Stats;
