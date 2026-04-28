import { useCallback, useEffect, useState } from "react";
import {
  searchContentsAcrossCategories,
  searchUsers,
  type ContentSearchItem,
  type UserSearchItem,
} from "@/services/search-service";
import {
  searchExternalContent,
  type ExternalContentType,
  type ExternalSearchItem,
} from "@/hooks/search/use-external-content-search";

export type GlobalSearchResultItem = ContentSearchItem & {
  source?: "local" | "external";
  externalId?: string | number;
  provider?: string;
};

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

const EXTERNAL_TYPES: ExternalContentType[] = [
  "pelicula",
  "serie",
  "libro",
  "videojuego",
];

const EXTERNAL_PROVIDER_LABEL: Record<ExternalContentType, string> = {
  pelicula: "TMDB",
  serie: "TMDB",
  libro: "Google Books",
  videojuego: "RAWG",
};

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

const getExternalId = (item: ExternalSearchItem) =>
  item.externalId ?? item.id ?? item.tmdbId ?? item.rawgId ?? item.googleId;

const scoreExternalMatch = (item: ExternalSearchItem, query: string) => {
  const normalizedQuery = normalizeText(query).trim();
  const title = pickExternalTitle(item);
  const normalizedTitle = normalizeText(title);
  const aliases = getAliases(item).map((alias) => normalizeText(alias));

  if (!normalizedQuery || !normalizedTitle) return 0;
  if (normalizedTitle === normalizedQuery) return 4;
  if (normalizedTitle.includes(normalizedQuery)) return 2;

  for (const alias of aliases) {
    if (alias === normalizedQuery) return 3;
    if (alias.includes(normalizedQuery)) return 1;
  }

  return 0;
};

const searchExternalContents = async (
  query: string,
  signal?: AbortSignal
): Promise<GlobalSearchResultItem[]> => {
  const results = await Promise.all(
    EXTERNAL_TYPES.map(async (type) => {
      const items = await searchExternalContent(type, query, signal, 12);
      return items.map((item) => ({ type, item }));
    })
  );

  return results
    .flat()
    .map((candidate) => ({
      type: candidate.type,
      item: candidate.item,
      score: scoreExternalMatch(candidate.item, query),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map((entry) => {
      const title = pickExternalTitle(entry.item);
      const externalId = getExternalId(entry.item);
      return {
        id: `external-${entry.type}-${externalId ?? title}`,
        tipo: (entry.item.tipo as string) ?? entry.type,
        titulo: title || "Sin título",
        portada: entry.item.portada ?? entry.item.poster ?? entry.item.image ?? null,
        puntuacion: null,
        puntuacionApi: null,
        source: "external" as const,
        externalId,
        provider: EXTERNAL_PROVIDER_LABEL[entry.type],
      };
    })
    .filter((item) => item.externalId != null);
};

export function useGlobalSearch() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<GlobalSearchResultItem[]>([]);
  const [users, setUsers] = useState<UserSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSearchResults = useCallback(
    async (
      rawQuery: string,
      signal?: AbortSignal
    ): Promise<{
      items: GlobalSearchResultItem[];
      users: UserSearchItem[];
      error: string | null;
    }> => {
      const q = rawQuery.trim();
      const [itemsRes, usersRes] = await Promise.allSettled([
        searchContentsAcrossCategories(q, signal, { pageSize: 100 }),
        searchUsers(q, signal),
      ]);

      const localItems =
        itemsRes.status === "fulfilled"
          ? (itemsRes.value.items ?? []).map((item) => ({
              ...item,
              source: "local" as const,
            }))
          : [];
      const userResults =
        usersRes.status === "fulfilled" ? usersRes.value.results ?? [] : [];

      const searchError =
        itemsRes.status === "rejected" && usersRes.status === "rejected"
          ? "No se pudo buscar ahora mismo."
          : null;

      let externalItems: GlobalSearchResultItem[] = [];
      if (!signal?.aborted && q.length >= MIN_QUERY_LENGTH) {
        try {
          externalItems = await searchExternalContents(q, signal);
        } catch (err) {
          if ((err as { name?: string })?.name !== "AbortError") {
            console.error("Error buscando en APIs externas:", err);
          }
        }
      }

      if (localItems.length > 0 && externalItems.length > 0) {
        const seen = new Set(
          localItems.map((item) => `${item.tipo}:${normalizeText(item.titulo)}`)
        );
        externalItems = externalItems.filter(
          (item) => !seen.has(`${item.tipo}:${normalizeText(item.titulo)}`)
        );
      }

      return { items: [...localItems, ...externalItems], users: userResults, error: searchError };
    },
    []
  );

  const runSearch = useCallback(
    async (signal?: AbortSignal) => {
      const q = query.trim();
      if (q.length < MIN_QUERY_LENGTH) return;

      setLoading(true);
      setError(null);
      const result = await fetchSearchResults(q, signal);
      if (signal?.aborted) return;
      setItems(result.items);
      setUsers(result.users);
      setError(result.error);
      setLoading(false);
    },
    [fetchSearchResults, query]
  );

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      setItems([]);
      setUsers([]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void runSearch(controller.signal);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, runSearch]);

  const clear = useCallback(() => {
    setQuery("");
    setItems([]);
    setUsers([]);
    setError(null);
    setLoading(false);
  }, []);

  return {
    query,
    setQuery,
    items,
    users,
    loading,
    error,
    minLength: MIN_QUERY_LENGTH,
    runSearch,
    clear,
  };
}
