import { handleUnauthorizedResponse } from "@/services/auth-service";

const API_URL = (
  import.meta.env.VITE_API_URL ??
  "https://tfg-web-valoraciones-back-i9b5.onrender.com"
).replace(/\/+$/, "");

const TYPE_ENDPOINTS: Record<string, string> = {
  pelicula: "peliculas",
  peliculas: "peliculas",
  serie: "series",
  series: "series",
  libro: "libros",
  libros: "libros",
  videojuego: "videojuegos",
  videojuegos: "videojuegos",
};

async function parseErrorMessage(res: Response, fallback: string) {
  const contentType = (res.headers.get("content-type") ?? "").toLowerCase();
  if (contentType.includes("application/json")) {
    const payload = await res.json().catch(() => ({} as Record<string, unknown>));
    const message =
      (typeof payload.message === "string" && payload.message.trim()) ||
      (typeof payload.error === "string" && payload.error.trim()) ||
      (typeof payload.detail === "string" && payload.detail.trim()) ||
      "";
    return message || fallback;
  }

  const text = await res.text().catch(() => "");
  return text.trim() || fallback;
}

async function requestDelete(path: string) {
  return fetch(`${API_URL}${path}`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
}

export async function deleteContentFromDatabase(
  contenidoId: string | number,
  contentType?: string
) {
  const normalizedType = (contentType ?? "").trim().toLowerCase();
  const endpoint = TYPE_ENDPOINTS[normalizedType];
  const path = endpoint
    ? `/${endpoint}/${contenidoId}`
    : `/contenidos/${contenidoId}`;

  const res = await requestDelete(path);
  handleUnauthorizedResponse(res.status, path);
  if (res.ok) return res.json().catch(() => ({}));

  const message = await parseErrorMessage(res, "No se pudo eliminar el contenido.");
  throw new Error(message);
}
