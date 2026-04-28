import { useCallback, useEffect, useState } from "react";

export type ExternalContentType = "pelicula" | "serie" | "libro" | "videojuego";

export type ExternalSearchItem = {
  externalId?: string | number;
  id?: string | number;
  tmdbId?: string | number;
  rawgId?: string | number;
  googleId?: string | number;
  titulo?: string;
  title?: string;
  tipo?: string;
  aliases?: string[];
  portada?: string;
  poster?: string;
  image?: string;
};

export type ExternalContentSuggestion = {
  id: string;
  title: string;
  image?: string | null;
  provider: string;
  externalId: string | number;
  type: ExternalContentType;
};

const API_URL = (
  import.meta.env.VITE_API_URL ??
  "https://tfg-web-valoraciones-back-i9b5.onrender.com"
).replace(/\/+$/, "");

const EXTERNAL_SEARCH_ENDPOINTS: Record<ExternalContentType, string> = {
  pelicula: "peliculas/tmdb/search",
  serie: "series/tmdb/search",
  libro: "libros/google/search",
  videojuego: "videojuegos/rawg/search",
};

const EXTERNAL_IMPORT_ENDPOINTS: Record<ExternalContentType, string> = {
  pelicula: "peliculas/import/tmdb",
  serie: "series/import/tmdb",
  libro: "libros/import/google",
  videojuego: "videojuegos/import/rawg",
};

const EXTERNAL_PROVIDER_LABEL: Record<ExternalContentType, string> = {
  pelicula: "TMDB",
  serie: "TMDB",
  libro: "Google Books",
  videojuego: "RAWG",
};

const buildApiUrl = (path: string) => `${API_URL}/${path.replace(/^\/+/, "")}`;

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const pickExternalTitle = (item: ExternalSearchItem) =>
  (typeof item.titulo === "string" && item.titulo.trim()) ||
  (typeof item.title === "string" && item.title.trim())
    ? (item.titulo ?? item.title ?? "").trim()
    : "";

const getAliases = (item: ExternalSearchItem) =>
  Array.isArray(item.aliases) ? item.aliases.filter(Boolean) : [];

const scoreExternalMatch = (item: ExternalSearchItem, q: string) => {
  const normalizedQuery = normalizeText(q).trim();
  if (!normalizedQuery) return 0;

  const title = pickExternalTitle(item);
  if (!title) return 0;
  const normalizedTitle = normalizeText(title);

  if (normalizedTitle === normalizedQuery) return 1_000;
  if (normalizedTitle.startsWith(normalizedQuery)) return 700;
  if (normalizedTitle.includes(normalizedQuery)) return 500;

  const aliases = getAliases(item).map((alias) => normalizeText(alias));
  if (aliases.some((alias) => alias === normalizedQuery)) return 450;
  if (aliases.some((alias) => alias.startsWith(normalizedQuery))) return 300;
  if (aliases.some((alias) => alias.includes(normalizedQuery))) return 200;

  return 0;
};

const extractExternalRows = (payload: unknown): ExternalSearchItem[] => {
  if (Array.isArray(payload)) return payload as ExternalSearchItem[];
  const maybeObject = payload as {
    items?: unknown;
    results?: unknown;
    data?: { items?: unknown; results?: unknown };
  };
  if (Array.isArray(maybeObject?.items)) return maybeObject.items as ExternalSearchItem[];
  if (Array.isArray(maybeObject?.results)) return maybeObject.results as ExternalSearchItem[];
  if (Array.isArray(maybeObject?.data?.items)) return maybeObject.data.items as ExternalSearchItem[];
  if (Array.isArray(maybeObject?.data?.results)) return maybeObject.data.results as ExternalSearchItem[];
  return [];
};

export async function searchExternalContent(
  type: ExternalContentType,
  query: string,
  signal?: AbortSignal,
  pageSize = 12
) {
  const endpoint = EXTERNAL_SEARCH_ENDPOINTS[type];
  const url = new URL(buildApiUrl(endpoint));
  url.searchParams.set("q", query);
  url.searchParams.set("pageSize", String(pageSize));

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${text}`.trim());
  }

  const payload = await res.json();
  return extractExternalRows(payload);
}

export async function importExternalContent(
  type: ExternalContentType,
  externalId: string | number
) {
  const endpoint = EXTERNAL_IMPORT_ENDPOINTS[type];
  const url = buildApiUrl(`${endpoint}/${encodeURIComponent(String(externalId))}`);
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${text}`.trim());
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

type UseExternalContentSearchOptions = {
  type: ExternalContentType | null;
  minLength?: number;
  debounceMs?: number;
  pageSize?: number;
  limit?: number;
};

export function useExternalContentSearch({
  type,
  minLength = 2,
  debounceMs = 300,
  pageSize = 12,
  limit = 8,
}: UseExternalContentSearchOptions) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ExternalContentSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (type == null || q.length < minLength) {
      setSuggestions([]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await searchExternalContent(type, q, controller.signal, pageSize);
        if (controller.signal.aborted) return;

        const scoredSuggestions: Array<ExternalContentSuggestion & { __score: number }> = [];
        rows.forEach((item, index) => {
          const title = pickExternalTitle(item);
          const externalId =
            item.externalId ?? item.id ?? item.tmdbId ?? item.rawgId ?? item.googleId;
          if (!title || externalId == null) return;

          const image =
            typeof item.portada === "string"
              ? item.portada
              : typeof item.poster === "string"
                ? item.poster
                : typeof item.image === "string"
                  ? item.image
                  : null;

          scoredSuggestions.push({
            id: `${type}-${String(externalId)}-${index}`,
            title,
            image,
            provider: EXTERNAL_PROVIDER_LABEL[type],
            externalId,
            type,
            __score: scoreExternalMatch(item, q),
          });
        });

        setSuggestions(
          scoredSuggestions
            .filter((item) => item.__score > 0)
            .sort((a, b) => b.__score - a.__score)
            .slice(0, limit)
            .map(({ __score, ...item }) => item)
        );
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        console.error("Error buscando en API externa:", err);
        setSuggestions([]);
        setError("No se pudo buscar en API externa.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, debounceMs);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [debounceMs, limit, minLength, pageSize, query, type]);

  const clear = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    setError(null);
    setLoading(false);
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    loading,
    error,
    clear,
  };
}
