// src/services/fetchSeries.ts
const API_BASE = "https://tfg-web-valoraciones-back-i9b5.onrender.com";

export async function fetchSeries(path: string = "") {
  const url = `${API_BASE}/series/${path}`.replace(/\/+$/, "/"); // asegura trailing "/"

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  // Si backend rompe, aquí verás el texto real del error
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`fetchSeries failed: ${res.status} ${res.statusText} - ${text}`);
  }

  const json = await res.json();

  // Soporta ambas formas:
  // 1) API -> [...]
  // 2) API -> { data: [...] }
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.data)) return json.data;

  return [];
}
