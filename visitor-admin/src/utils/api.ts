import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:7023/api", // senin backend adresin
  headers: {
    "Content-Type": "application/json",
  },
});

// İsteğe göre her request'e token ekleyelim
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
