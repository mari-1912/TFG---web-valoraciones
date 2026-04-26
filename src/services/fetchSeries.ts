// src/services/fetchSeries.ts
const API_URL =
  import.meta.env.VITE_API_URL ??
  "https://tfg-web-valoraciones-back-i9b5.onrender.com";

type FetchListOptions = {
  q?: string;
  query?: string;
  page?: number;
  pageSize?: number;
  generos?: string | string[];
  anioFrom?: number;
  anioTo?: number;
  duracionMin?: number;
  duracionMax?: number;
  order?: string;
  desc?: boolean;
  recommend?: boolean;
  signal?: AbortSignal;
};

const buildParams = (options: FetchListOptions) => {
  const params = new URLSearchParams();
  const searchTerm = options.q ?? options.query;
  if (searchTerm) {
    // Compatibilidad backend: algunos endpoints esperan `q` y otros `query`.
    params.set("q", searchTerm);
    params.set("query", searchTerm);
  }
  if (options.page) params.set("page", String(options.page));
  if (options.pageSize) params.set("pageSize", String(options.pageSize));
  if (options.generos) {
    params.set(
      "generos",
      Array.isArray(options.generos) ? options.generos.join(",") : options.generos
    );
  }
  if (options.anioFrom) params.set("anioFrom", String(options.anioFrom));
  if (options.anioTo) params.set("anioTo", String(options.anioTo));
  if (options.duracionMin != null) params.set("duracionMin", String(options.duracionMin));
  if (options.duracionMax != null) params.set("duracionMax", String(options.duracionMax));
  if (options.order) params.set("order", options.order);
  if (options.desc != null) params.set("desc", String(options.desc));
  if (options.recommend != null) params.set("recommend", String(options.recommend));
  return params;
};

export async function fetchSeries(
  qOrOptions?: string | FetchListOptions,
  pageSize?: number,
  signal?: AbortSignal
) {
  const options: FetchListOptions =
    typeof qOrOptions === "object"
      ? qOrOptions ?? {}
      : { q: qOrOptions, pageSize, signal };

  const params = buildParams(options);
  const query = params.toString();
  const base = `${API_URL}/series/`.replace(/\/+$/, "/");
  const url = `${base}${query ? `?${query}` : ""}`;

  const res = await fetch(url, { signal: options.signal ?? signal, credentials: "include" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("fetchSeries ERROR:", res.status, text);
    throw new Error(`fetchSeries failed: ${res.status}`);
  }

  return res.json();
}

export async function fetchSeriesById(
  serieId: string | number,
  signal?: AbortSignal
) {
  const base = `${API_URL}/series/`.replace(/\/+$/, "/");
  const url = `${base}${serieId}`;
  const res = await fetch(url, { signal });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("fetchSeriesById ERROR:", res.status, text);
    throw new Error(`fetchSeriesById failed: ${res.status}`);
  }

  return res.json();
}
