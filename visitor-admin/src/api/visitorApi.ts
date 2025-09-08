import type { VisitorDto } from "../types/visitor";
import { getToken } from "../utils/auth";

const API_BASE = "https://localhost:7023/api";

export async function fetchVisitors(): Promise<VisitorDto[]> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/Visitor`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Ziyaretçi listesi alınamadı.");
  }

  return res.json();
}
