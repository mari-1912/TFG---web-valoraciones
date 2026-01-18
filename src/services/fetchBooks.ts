const API_URL =
  import.meta.env.VITE_API_URL ??
  "https://tfg-web-valoraciones-back-i9b5.onrender.com";

export async function fetchBooks(q?: string, pageSize?: number) {
  const params = new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (pageSize) {
    params.set("pageSize", String(pageSize));
  }

  const query = params.toString();
  const base = `${API_URL}/libros/`.replace(/\/+$/, "/");
  const url = `${base}${query ? `?${query}` : ""}`;

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    console.error("fetchBooks ERROR:", res.status, text);
    throw new Error(`fetchBooks failed: ${res.status}`);
  }

  return res.json();
}
