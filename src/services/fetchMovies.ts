// src/services/fetchMovies.ts
const API_URL =
  import.meta.env.VITE_API_URL ??
  "https://tfg-web-valoraciones-back-i9b5.onrender.com";

export async function fetchMovies(q?: string, pageSize?: number) {
  const params = new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (pageSize) {
    params.set("pageSize", String(pageSize));
  }

  const query = params.toString();
  const base = `${API_URL}/peliculas/`.replace(/\/+$/, "/");
  const url = `${base}${query ? `?${query}` : ""}`;

  const res = await fetch(url);

  // Si el backend devuelve error, lo vemos claro en consola:
  if (!res.ok) {
    const text = await res.text();
    console.error("fetchMovies ERROR:", res.status, text);
    throw new Error(`fetchMovies failed: ${res.status}`);
  }

  const data = await res.json();
  console.log("fetchMovies OK ->", data); // <-- para verificar
  return data; // <-- IMPORTANTE (si no, te llega undefined)
}
