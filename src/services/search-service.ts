import { fetchBooks } from "./fetchBooks";
import { fetchMovies } from "./fetchMovies";
import { fetchSeries } from "./fetchSeries";
import { fetchVideoGames } from "./fetchVideogames";
import { handleUnauthorizedResponse } from "./auth-service";

export type ContentSearchItem = {
  id: number | string;
  portada: string | null;
  puntuacion: number | null;
  puntuacionApi: number | null;
  tipo: string;
  titulo: string;
};

export type ContentSearchResponse = {
  items: ContentSearchItem[];
  pagination?: {
    page: number;
    pageSize: number;
    pages: number;
    total: number;
  };
};

export type UserSearchItem = {
  userId: number;
  username: string;
  avatarPath?: string | null;
  avatarUrl?: string | null;
};

export type UserSearchResponse = {
  results: UserSearchItem[];
};

const API_URL =
  import.meta.env.VITE_API_URL ??
  "https://tfg-web-valoraciones-back-i9b5.onrender.com";

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const pickNumber = (...values: unknown[]) => {
  for (const value of values) {
    const parsed = toNumber(value);
    if (parsed != null) return parsed;
  }
  return null;
};

const extractItems = (data: unknown): any[] => {
  const source =
    Array.isArray(data) ? data : (data as any)?.items ?? (data as any)?.data;
  const items =
    Array.isArray(source)
      ? source
      : (source as any)?.results ??
        (source as any)?.peliculas ??
        (source as any)?.series ??
        (source as any)?.libros ??
        (source as any)?.videojuegos ??
        (source as any)?.data?.items ??
        (source as any)?.data?.results ??
        (source as any)?.data?.peliculas ??
        (source as any)?.data?.series ??
        (source as any)?.data?.libros ??
        (source as any)?.data?.videojuegos;

  return Array.isArray(items) ? items : [];
};

const normalizeSearchItems = (
  data: unknown,
  tipo: string
): ContentSearchItem[] => {
  const items = extractItems(data);
  return items
    .map((item: any) => {
      const id = item?.id ?? item?._id;
      if (id == null) return null;

      const titulo =
        item?.titulo ??
        item?.title ??
        item?.nombre ??
        item?.name ??
        item?.original_title ??
        "";
      const portada =
        item?.portada ??
        item?.poster ??
        item?.image ??
        item?.imagen ??
        item?.cover ??
        item?.imgSrc ??
        null;

      const puntuacionApi = pickNumber(
        item?.puntuacionApi,
        item?.puntuacion_api,
        item?.ratingApi,
        item?.rating_api,
        item?.tmdbRating,
        item?.imdbRating,
        item?.apiRating
      );
      const puntuacion = pickNumber(
        item?.puntuacion,
        item?.valoracion,
        item?.rating,
        item?.avgRating,
        puntuacionApi
      );

      return {
        id,
        portada: typeof portada === "string" ? portada : null,
        puntuacion,
        puntuacionApi,
        tipo,
        titulo: String(titulo || "Sin título"),
      };
    })
    .filter((item): item is ContentSearchItem => item != null);
};

const matchesQuery = (item: ContentSearchItem, query: string) => {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return true;

  const normalizedTitle = normalizeText(item.titulo ?? "");
  if (!normalizedTitle) return false;
  if (normalizedTitle.includes(normalizedQuery)) return true;

  const tokens = normalizedQuery.split(" ").filter(Boolean);
  if (tokens.length === 0) return true;
  return tokens.every((token) => normalizedTitle.includes(token));
};

export async function searchContents(
  query: string,
  signal?: AbortSignal,
  options: { page?: number; pageSize?: number } = {}
): Promise<ContentSearchResponse> {
  const params = new URLSearchParams();
  params.set("q", query);
  if (options.page) params.set("page", String(options.page));
  if (options.pageSize) params.set("pageSize", String(options.pageSize));

  const res = await fetch(
    `${API_URL}/contenidos/search?${params.toString()}`,
    {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal,
    }
  );
  handleUnauthorizedResponse(res.status, `/contenidos/search?${params.toString()}`);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error ${res.status} al buscar contenidos. ${text}`);
  }

  return res.json();
}

export async function searchContentsAll(
  query: string,
  signal?: AbortSignal,
  options: { pageSize?: number } = {}
): Promise<ContentSearchResponse> {
  const pageSize = options.pageSize ?? 100;
  const first = await searchContents(query, signal, { page: 1, pageSize });
  const pagination = first.pagination;

  if (!pagination || !pagination.pages || pagination.pages <= 1) {
    return first;
  }

  const items = [...(first.items ?? [])];
  for (let page = 2; page <= pagination.pages; page += 1) {
    if (signal?.aborted) break;
    const next = await searchContents(query, signal, { page, pageSize });
    if (Array.isArray(next.items)) {
      items.push(...next.items);
    }
  }

  return { ...first, items };
}

export async function searchContentsAcrossCategories(
  query: string,
  signal?: AbortSignal,
  options: { pageSize?: number } = {}
): Promise<ContentSearchResponse> {
  const pageSize = options.pageSize ?? 100;
  const results = await Promise.allSettled([
    fetchMovies(query, pageSize, signal),
    fetchSeries(query, pageSize, signal),
    fetchBooks(query, pageSize, signal),
    fetchVideoGames(query, pageSize, signal),
  ]);

  let anySuccess = false;
  const items: ContentSearchItem[] = [];

  results.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    anySuccess = true;
    const tipo =
      index === 0
        ? "pelicula"
        : index === 1
          ? "serie"
          : index === 2
            ? "libro"
            : "videojuego";
    const normalizedItems = normalizeSearchItems(result.value, tipo);
    items.push(...normalizedItems.filter((item) => matchesQuery(item, query)));
  });

  if (!anySuccess) {
    throw new Error("No se pudo buscar contenidos.");
  }

  return { items };
}

export async function searchUsers(
  query: string,
  signal?: AbortSignal
): Promise<UserSearchResponse> {
  const res = await fetch(
    `${API_URL}/usuarios/search?q=${encodeURIComponent(query)}`,
    {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal,
    }
  );
  handleUnauthorizedResponse(
    res.status,
    `/usuarios/search?q=${encodeURIComponent(query)}`
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error ${res.status} al buscar usuarios. ${text}`);
  }

  return res.json();
}
