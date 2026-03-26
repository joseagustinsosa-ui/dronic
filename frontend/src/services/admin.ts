import { apiFetch } from "./api";

export function verifyAdminKey(key: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>("/admin/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Admin-Key": key },
  });
}
