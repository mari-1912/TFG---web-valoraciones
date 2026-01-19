// src/services/fetchSeries.ts
const API_URL =
  import.meta.env.VITE_API_URL ??
  "https://tfg-web-valoraciones-back-i9b5.onrender.com";

export async function fetchSeries(q?: string, pageSize?: number) {
  const params = new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (pageSize) {
    params.set("pageSize", String(pageSize));
  }

  const query = params.toString();
  const base = `${API_URL}/series/`.replace(/\/+$/, "/");
  const url = `${base}${query ? `?${query}` : ""}`;

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("fetchSeries ERROR:", res.status, text);
    throw new Error(`fetchSeries failed: ${res.status}`);
  }

  const data = await res.json();
  console.log("fetchSeries OK ->", data);

  const items = Array.isArray(data)
    ? data
    : data?.items ??
      data?.data ??
      data?.results ??
      data?.series ??
      data?.data?.items ??
      data?.data?.results ??
      data?.data?.series;

  const normalized = Array.isArray(items)
    ? items
        .map((serie: any) => ({
          id: serie?.id ?? serie?._id,
          titulo: serie?.titulo ?? serie?.title ?? serie?.nombre,
          generos:
            serie?.generos ??
            serie?.genero ??
            serie?.genres ??
            serie?.categoria ??
            "",
          anio_lanzamiento:
            serie?.anio_lanzamiento ??
            serie?.anioLanzamiento ??
            serie?.year ??
            serie?.anio ??
            0,
          portada:
            serie?.portada ??
            serie?.poster ??
            serie?.image ??
            serie?.imagen ??
            serie?.cover ??
            "",
          plataformas:
            serie?.plataformas ??
            serie?.plataforma ??
            serie?.platforms ??
            serie?.platform ??
            "",
        }))
        .filter((serie) => serie.id != null)
    : [];

  return normalized;
}
