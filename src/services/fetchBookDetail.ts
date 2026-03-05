const API_URL =
  import.meta.env.VITE_API_URL ??
  "https://tfg-web-valoraciones-back-i9b5.onrender.com";

export async function fetchBookDetail(
  libroId: string | number,
  signal?: AbortSignal
) {
  const base = `${API_URL}/libros/`.replace(/\/+$|\/+$/g, "/");
  const url = `${base}${encodeURIComponent(String(libroId))}`;

  const res = await fetch(url, { signal });

  if (!res.ok) {
    const text = await res.text();
    console.error("fetchBookDetail ERROR:", res.status, text);
    throw new Error(`fetchBookDetail failed: ${res.status}`);
  }

  return res.json();
}
