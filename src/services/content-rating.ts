const API_URL =
  import.meta.env.VITE_API_URL ??
  "https://tfg-web-valoraciones-back-i9b5.onrender.com";

async function requestSetRating(
  contenidoId: string | number,
  puntuacion: number
) {
  const res = await fetch(`${API_URL}/contenidos/${contenidoId}/valoracion`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ puntuacion }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error ${res.status}. ${text}`.trim());
  }

  return res.json().catch(() => ({}));
}

export async function setContentRating(
  contenidoId: string | number,
  puntuacion: number
) {
  return requestSetRating(contenidoId, puntuacion);
}

export async function deleteContentRating(contenidoId: string | number) {
  const res = await fetch(`${API_URL}/contenidos/${contenidoId}/valoracion`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error ${res.status}. ${text}`.trim());
  }

  return res.json().catch(() => ({}));
}
