import React, { useState, useEffect } from "react";
import { getToken } from "../utils/auth";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);
const showToast = (message: string, icon: "success" | "error" | "warning" | "info") => {
  MySwal.fire({
    toast: true,
    position: "top-end",
    icon,
    title: message,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });
};

interface LogItem {
  id: number;
  visitorName?: string;
  entryTime: string;
  exitTime?: string;
}
interface Visitor {
  id: number;
  fullName: string;
}

const VisitorLogsReport: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [selectedVisitorId, setSelectedVisitorId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loadingVisitors, setLoadingVisitors] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 5;

  const fetchLogs = async () => {
    setError("");
    setLoadingLogs(true);
    try {
      const token = getToken();
      let url = `https://localhost:7023/api/reports/visitor-logs`;
      const params = new URLSearchParams();
      if (selectedVisitorId) params.append("visitorId", String(selectedVisitorId));
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        if (res.status === 404) {
          setLogs([]);
          setError("Kriterlere uygun log bulunamadı.");
          showToast("Log bulunamadı", "info");
          return;
        }
        throw new Error("Loglar alınamadı.");
      }

      const data: LogItem[] = await res.json();
      setLogs(data);

      if (data?.length > 0) showToast(`${data.length} log yüklendi`, "success");
      else showToast("Log bulunamadı", "info");
    } catch (err: any) {
      setError(err.message || "Beklenmeyen hata");
      showToast("Loglar alınamadı", "error");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    const fetchVisitors = async () => {
      setLoadingVisitors(true);
      try {
        const token = getToken();
        const res = await fetch("https://localhost:7023/api/Visitor", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Ziyaretçi listesi alınamadı");
        const data = await res.json();
        setVisitors(data);
        if (data?.length > 0) showToast("Ziyaretçi listesi yüklendi", "success");
        else showToast("Ziyaretçi bulunamadı", "info");

        await fetchLogs();
      } catch (err: any) {
        setError(err.message || "Ziyaretçi yüklenemedi");
        showToast("Ziyaretçi listesi alınamadı", "error");
      } finally {
        setLoadingVisitors(false);
      }
    };

    fetchVisitors();
  }, []);

  // Pagination logic
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(logs.length / logsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-6">Ziyaretçi Log Raporu</h1>

      {error && <p className="text-red-400 text-center mb-4">{error}</p>}

      {loadingVisitors ? (
        <p className="text-center">Yükleniyor...</p>
      ) : (
        <div className="mb-6">
          <label className="block text-lg mb-2">Ziyaretçi (Opsiyonel):</label>
          <select
            value={selectedVisitorId ?? ""}
            onChange={(e) => setSelectedVisitorId(e.target.value ? Number(e.target.value) : null)}
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tümü</option>
            {visitors.map((v) => (
              <option key={v.id} value={v.id} className="bg-gray-800">
                {v.fullName}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-lg mb-2">Başlangıç Tarihi:</label>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            dateFormat="dd.MM.yyyy"
            isClearable
            placeholderText="Başlangıç"
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-lg mb-2">Bitiş Tarihi:</label>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            dateFormat="dd.MM.yyyy"
            isClearable
            placeholderText="Bitiş"
            minDate={startDate ?? undefined}
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        onClick={fetchLogs}
        disabled={loadingLogs}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-500 transition duration-200 mb-6"
      >
        {loadingLogs ? "Yükleniyor..." : "Raporu Getir"}
      </button>

      {logs.length > 0 && (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-2">Ziyaretçi</th>
                <th className="py-2">Giriş Saati</th>
                <th className="py-2">Çıkış Saati</th>
              </tr>
            </thead>
            <tbody>
              {currentLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-700">
                  <td className="py-2">{log.visitorName ?? "-"}</td>
                  <td className="py-2">{new Date(log.entryTime).toLocaleString()}</td>
                  <td className="py-2">{log.exitTime ? new Date(log.exitTime).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-center mt-4">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-700 text-white rounded-l hover:bg-gray-600 disabled:bg-gray-500 transition duration-200 mr-2"
            >
              Önceki
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => paginate(i + 1)}
                className={`px-4 py-2 ${currentPage === i + 1 ? "bg-blue-600" : "bg-gray-700 text-white"} hover:bg-gray-600 transition duration-200`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-700 text-white rounded-r hover:bg-gray-600 disabled:bg-gray-500 transition duration-200 ml-2"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}

      {logs.length === 0 && !loadingLogs && <p className="text-center">Rapor bulunamadı.</p>}
    </div>
  );
};

export default VisitorLogsReport;