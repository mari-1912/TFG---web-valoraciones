import { handleUnauthorizedResponse } from "@/services/auth-service";

export type ContentStatus =
  | "watchlist"
  | "in_progress"
  | "completed"
  | "dropped";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "https://tfg-web-valoraciones-back-i9b5.onrender.com";

export async function updateContentStatus(
  contenidoId: string | number,
  estado: ContentStatus
) {
  const res = await fetch(`${API_URL}/contenidos/${contenidoId}/estado`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado }),
  });
  handleUnauthorizedResponse(res.status, `/contenidos/${contenidoId}/estado`);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error ${res.status}. ${text}`.trim());
  }

  return res.json().catch(() => ({}));
}
