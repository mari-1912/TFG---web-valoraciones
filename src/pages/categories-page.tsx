import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";


import Footer from "../components/sections/footer";
import { fetchBookById, fetchBooks } from "@/services/fetchBooks";
import { fetchMovieById, fetchMovies } from "@/services/fetchMovies";
import { fetchSeries } from "@/services/fetchSeries";
import { fetchVideoGameById, fetchVideoGames } from "@/services/fetchVideogames";
import type { ServiceList } from "@/services/services-list";
import { buildDetailPath } from "@/lib/detail-route";
import ServiceSection from "../components/sections/services-section";
import { Popcorn, Tv, BookOpen, Gamepad2, Star } from "lucide-react";
import {
  ServicesFilters,
  type ServiceCategory,
  type SortKey,
  type DurationKey,
  type SeasonKey,
  type BookSeriesKey,
  type PlatformKey,
} from "../components/service-filters";
import { CategoryApiSearchBar } from "@/components/categories/category-api-search-bar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  importExternalContent,
  useExternalContentSearch,
  type ExternalContentType,
} from "@/hooks/search/use-external-content-search";

type ServiceListItem = ServiceList & {
  imgSrc?: string;
  apiRatings?: {
    tmdb?: number;
    rawg?: number;
    googleBooks?: number;
  };
  collection?: string;
  collectionKind?: "saga" | "serie";
  collectionSize?: number;
  seasonsCount?: number;
  platforms?: string[];
  updateDate?: number;
  createDate?: number;
  viewsTotal?: number;
  viewsWeek?: number;
};

const normalizeGenres = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeGenres(item));
  }
  if (value && typeof value === "object") {
    const obj = value as {
      nombre?: unknown;
      name?: unknown;
      title?: unknown;
      genre?: unknown;
      genero?: unknown;
    };
    const candidate =
      obj.nombre ?? obj.name ?? obj.title ?? obj.genre ?? obj.genero;
    return candidate ? normalizeGenres(candidate) : [];
  }
  if (typeof value !== "string") return [];
  return value
    .split(/[,/;|&]/)
    .map((g) => g.trim())
    .filter(Boolean);
};

const normalizePlatforms = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizePlatforms(item));
  }
  if (value && typeof value === "object") {
    const obj = value as {
      nombre?: unknown;
      name?: unknown;
      title?: unknown;
      plataforma?: unknown;
      platform?: unknown;
      consolas?: unknown;
      consola?: unknown;
      console?: unknown;
    };
    const candidate =
      obj.nombre ??
      obj.name ??
      obj.title ??
      obj.plataforma ??
      obj.platform ??
      obj.consolas ??
      obj.consola ??
      obj.console;
    return candidate ? normalizePlatforms(candidate) : [];
  }
  if (typeof value !== "string") return [];
  return value
    .split(/[,/;|&]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeSearchText = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const resolveExternalType = (category: ServiceCategory): ExternalContentType =>
  category === "peliculas"
    ? "pelicula"
    : category === "series"
      ? "serie"
      : category === "libros"
        ? "libro"
        : "videojuego";

const toTimestamp = (value: unknown) => {
  if (value == null) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
    const asNumber = Number(value);
    return Number.isFinite(asNumber) ? asNumber : undefined;
  }
  return undefined;
};

const getItemDates = (item: any) => ({
  updateDate: toTimestamp(
    item?.updateDate ??
      item?.updatedAt ??
      item?.updated_at ??
      item?.fechaActualizacion ??
      item?.fecha_actualizacion,
  ),
  createDate: toTimestamp(
    item?.createDate ??
      item?.createdAt ??
      item?.created_at ??
      item?.fechaCreacion ??
      item?.fecha_creacion,
  ),
});

const getRawPlatforms = (item: any) =>
  item?.consolas ??
  item?.consola ??
  item?.platforms ??
  item?.platform ??
  item?.plataformas ??
  item?.plataforma ??
  item?.metadataApi?.rawg?.content?.platforms ??
  item?.metadataApi?.rawg?.raw?.platforms ??
  "";

const getBookPages = (item: any) => {
  const value =
    item?.paginas ??
    item?.pages ??
    item?.pageCount ??
    item?.page_count ??
    item?.numPaginas ??
    item?.numeroPaginas ??
    item?.metadataApi?.googleBooks?.content?.page_count ??
    item?.metadataApi?.googleBooks?.content?.pageCount ??
    item?.metadataApi?.googleBooks?.raw?.volumeInfo?.pageCount;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const GENRE_ALIASES: Record<string, string> = {
  "sci fi": "ciencia ficcion",
  "science fiction": "ciencia ficcion",
  scifi: "ciencia ficcion",
  fantasy: "fantasia",
  mystery: "misterio",
  platformer: "plataformas",
  action: "accion",
  adventure: "aventura",
  strategy: "estrategia",
  comedy: "comedia",
};

const normalizeServiceItems = (
  data: unknown,
  category: ServiceCategory,
): ServiceListItem[] => {
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

  if (!Array.isArray(items)) return [];

  const toNumber = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  return items
    .map((item: any) => {
      const id = item?.id ?? item?._id;
      if (id == null) return null;

      const title = item?.titulo ?? item?.title ?? item?.nombre ?? "";
      const rawGenre =
        item?.generos ??
        item?.genero ??
        item?.genres ??
        item?.categoria ??
        item?.genre ??
        item?.metadataApi?.tmdb?.content?.genres ??
        item?.metadataApi?.rawg?.content?.genres ??
        item?.metadataApi?.googleBooks?.content?.categories ??
        item?.metadataApi?.rawg?.raw?.i18n?.es?.generos ??
        item?.metadataApi?.rawg?.raw?.i18n?.en?.generos ??
        item?.metadataApi?.rawg?.raw?.genres ??
        "";
      const genre = normalizeGenres(rawGenre).join(", ");
      const year =
        toNumber(
          item?.anio_lanzamiento ??
            item?.anioLanzamiento ??
            item?.year ??
            item?.anio,
        ) ?? 0;
      const image =
        item?.portada ??
        item?.poster ??
        item?.image ??
        item?.imagen ??
        item?.cover ??
        item?.imgSrc ??
        "";
      const description =
        item?.descripcion ?? item?.description ?? item?.sinopsis ?? "";
      const creator =
        item?.creator ??
        item?.director ??
        item?.autor ??
        item?.author ??
        item?.desarrollador ??
        item?.developer ??
        item?.estudio ??
        item?.studio;
      const rawDuration = toNumber(
        category === "series"
          ? item?.runtime_min ??
              item?.runtimeMin ??
              item?.runtime ??
              item?.duracion_min ??
              item?.duracionMin ??
              item?.duracion ??
              item?.episode_run_time ??
              item?.episodeRunTime ??
              item?.metadataApi?.tmdb?.content?.runtime_min ??
              item?.metadataApi?.tmdb?.content?.runtime ??
              item?.metadataApi?.tmdb?.content?.episode_run_time?.[0] ??
              item?.metadataApi?.tmdb?.raw?.episode_run_time?.[0]
          : category === "videojuegos"
            ? item?.duracion
          : category === "libros"
            ? getBookPages(item)
          : (item?.duracionMin ?? item?.duracion_min),
      );
      const duration =
        category === "videojuegos"
          ? rawDuration
          : rawDuration != null && rawDuration > 0
            ? rawDuration
            : undefined;
      const rating = toNumber(
        item?.puntuacion ??
          item?.valoracionMedia ??
          item?.rating_media ??
          item?.avgRating ??
          item?.mediaPuntuacion ??
          item?.media_puntuacion,
      );
      const tmdbRating = toNumber(
        item?.metadataApi?.tmdb?.content?.rating?.vote_average,
      );
      const rawgRating = toNumber(
        item?.metadataApi?.rawg?.content?.rating?.rawg,
      );
      const googleBooksRating = toNumber(
        item?.metadataApi?.googleBooks?.content?.rating?.average,
      );
      const sagaLabel =
        typeof item?.saga === "string" ? item.saga.trim() : undefined;
      const seriesLabel = [
        item?.serie,
        item?.seriesName,
        item?.coleccion,
        item?.collection,
      ]
        .map((value: unknown) => (typeof value === "string" ? value.trim() : ""))
        .find(Boolean);
      const collection = sagaLabel ?? seriesLabel;
      const collectionKind = sagaLabel ? "saga" : seriesLabel ? "serie" : undefined;
      const collectionSize = toNumber(
        item?.numeroLibros ??
          item?.numLibros ??
          item?.volumenes ??
          item?.volumes ??
          item?.booksCount ??
          item?.partes ??
          item?.parts ??
          item?.totalVolumes ??
          item?.totalBooks,
      );
      let seasonsCount =
        toNumber(
          item?.temporadas ??
            item?.seasons ??
            item?.seasonCount ??
            item?.numeroTemporadas ??
            item?.number_of_seasons,
        ) ?? undefined;
      if (seasonsCount == null) {
        const tmdbCount = toNumber(
          item?.metadataApi?.tmdb?.content?.number_of_seasons,
        );
        if (tmdbCount != null) {
          seasonsCount = tmdbCount;
        } else if (Array.isArray(item?.metadataApi?.tmdb?.content?.seasons)) {
          seasonsCount = item.metadataApi.tmdb.content.seasons.length;
        }
      }
      const rawPlatforms = getRawPlatforms(item);
      const platforms = normalizePlatforms(rawPlatforms);
      const viewsTotal = toNumber(
        item?.vistasTotales ?? item?.viewsTotal ?? item?.views_total,
      );
      const viewsWeek = toNumber(
        item?.vistasSemana ?? item?.viewsWeek ?? item?.views_week,
      );
      const { updateDate, createDate } = getItemDates(item);

      const normalized: ServiceListItem = {
        id: String(id),
        category,
        title: String(title),
        genre,
        year,
        image: typeof image === "string" ? image : "",
        description: String(description ?? ""),
        creator,
        duration,
        rating,
        imgSrc: typeof image === "string" ? image : undefined,
        apiRatings: {
          tmdb: tmdbRating,
          rawg: rawgRating,
          googleBooks: googleBooksRating,
        },
        collection,
        collectionKind,
        collectionSize,
        seasonsCount,
        platforms,
        updateDate,
        createDate,
        viewsTotal,
        viewsWeek,
      };

      return normalized;
    })
    .filter((item): item is ServiceListItem => item != null);
};

const normalizeGenreKey = (value: string) => {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return GENRE_ALIASES[normalized] ?? normalized;
};

const matchesGenre = (itemGenre: unknown, selected: string) => {
  if (!selected) return true;
  const selectedKey = normalizeGenreKey(selected);
  const tokens = normalizeGenres(itemGenre).map(normalizeGenreKey);
  return tokens.includes(selectedKey);
};

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const mapPlatformBucket = (value: string): PlatformKey => {
  const text = normalizeText(value);
  if (
    text.includes("playstation") ||
    text.includes("play station") ||
    text.includes("ps4") ||
    text.includes("ps5") ||
    text.includes("ps vita")
  ) {
    return "playstation";
  }
  if (text.includes("xbox") || text.includes("series x") || text.includes("series s")) {
    return "xbox";
  }
  if (
    text.includes("switch") ||
    text.includes("nintendo") ||
    text.includes("wii") ||
    text.includes("gamecube")
  ) {
    return "nintendo";
  }
  if (
    text.includes("android") ||
    text.includes("ios") ||
    text.includes("iphone") ||
    text.includes("ipad") ||
    text.includes("mobile")
  ) {
    return "mobile";
  }
  if (
    text.includes("pc") ||
    text.includes("windows") ||
    text.includes("steam") ||
    text.includes("linux") ||
    text.includes("mac")
  ) {
    return "pc";
  }
  return "other";
};

const getPlatformBuckets = (platforms?: string[]) => {
  if (!platforms || platforms.length === 0) return [];
  const buckets = new Set<PlatformKey>();
  platforms.forEach((platform) => {
    buckets.add(mapPlatformBucket(platform));
  });
  return Array.from(buckets);
};

const hasAnyPlatform = (platforms: string[] | undefined, targets: string[]) => {
  if (!platforms || platforms.length === 0) return false;
  const normalizedTargets = targets.map(normalizeText);
  return platforms.some((platform) => {
    const normalizedPlatform = normalizeText(platform);
    return normalizedTargets.some(
      (target) =>
        normalizedPlatform === target ||
        normalizedPlatform.includes(target) ||
        target.includes(normalizedPlatform)
    );
  });
};

/*
 * TODO: Reactivar cuando el backend exponga un endpoint específico para
 * títulos familiares/Disney Plus.
 *
 * const hasDisneyPlusPlatform = (item: ServiceListItem) =>
 *   item.platforms?.some((platform) => {
 *     const compact = normalizeText(platform).replace(/[^a-z0-9]+/g, "");
 *     return compact.includes("disneyplus") || compact.includes("disney");
 *   }) ?? false;
 */

const getBookSeriesType = (item: ServiceListItem): BookSeriesKey => {
  const size = item.collectionSize;
  if (size === 2) return "bilogia";
  if (size === 3) return "trilogia";

  const text = normalizeText(`${item.title ?? ""} ${item.collection ?? ""}`);
  if (text.includes("bilog")) return "bilogia";
  if (text.includes("trilog") || text.includes("trilogy")) return "trilogia";
  if (item.collectionKind === "saga" || text.includes("saga")) return "saga";
  if (item.collectionKind === "serie" || text.includes("serie") || text.includes("series")) {
    return "serie";
  }
  if (item.collection) return "serie";
  return "autoconclusivo";
};

const normalizeRatingScore = (value?: number) => {
  if (value == null || !Number.isFinite(value)) return null;
  return value <= 5 ? value * 2 : value;
};

const getBestApiScore = (item: ServiceListItem) => {
  const api = item.apiRatings;
  return (
    api?.tmdb ??
    api?.rawg ??
    api?.googleBooks ??
    null
  );
};

const getBackendSortParams = (sort: SortKey) => {
  if (sort === "az") return { order: "title", desc: false };
  if (sort === "za") return { order: "title", desc: true };
  if (sort === "rating_high") return { order: "rating", desc: true };
  if (sort === "rating_low") return { order: "rating", desc: false };
  if (sort === "newest") return { order: "year", desc: true };
  if (sort === "oldest") return { order: "year", desc: false };
  return null;
};

const extractPagination = (data: any) =>
  data?.pagination ?? data?.data?.pagination ?? null;

const enrichVideoGamePlatforms = async (
  items: ServiceListItem[],
  signal?: AbortSignal
) => {
  const missing = items.filter((item) => (item.platforms?.length ?? 0) === 0);
  if (missing.length === 0) return items;

  const results = await Promise.allSettled(
    missing.map((item) => fetchVideoGameById(item.id, signal))
  );

  const enrichMap = new Map<
    string,
    { platforms?: string[]; updateDate?: number; createDate?: number }
  >();
  results.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    const rawPlatforms = getRawPlatforms(result.value);
    const platforms = normalizePlatforms(rawPlatforms);
    const { updateDate, createDate } = getItemDates(result.value);
    if (
      platforms.length === 0 &&
      updateDate == null &&
      createDate == null
    ) {
      return;
    }
    enrichMap.set(String(missing[index].id), {
      platforms: platforms.length > 0 ? platforms : undefined,
      updateDate,
      createDate,
    });
  });

  if (enrichMap.size === 0) return items;

  return items.map((item) => {
    const extra = enrichMap.get(String(item.id));
    return extra ? { ...item, ...extra } : item;
  });
};

const enrichBookDates = async (
  items: ServiceListItem[],
  signal?: AbortSignal
) => {
  const missing = items.filter(
    (item) => item.updateDate == null && item.createDate == null
  );
  if (missing.length === 0) return items;

  const results = await Promise.allSettled(
    missing.map((item) => fetchBookById(item.id, signal))
  );

  const dateMap = new Map<string, { updateDate?: number; createDate?: number }>();
  results.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    const { updateDate, createDate } = getItemDates(result.value);
    if (updateDate == null && createDate == null) return;
    dateMap.set(String(missing[index].id), { updateDate, createDate });
  });

  if (dateMap.size === 0) return items;

  return items.map((item) => {
    const extra = dateMap.get(String(item.id));
    return extra ? { ...item, ...extra } : item;
  });
};

const enrichBookPages = async (
  items: ServiceListItem[],
  signal?: AbortSignal
) => {
  const missing = items.filter((item) => item.duration == null);
  if (missing.length === 0) return items;

  const results = await Promise.allSettled(
    missing.map((item) => fetchBookById(item.id, signal))
  );

  const pagesMap = new Map<string, number>();
  results.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    const root = result.value ?? {};
    const rawItem = {
      ...root,
      ...(root?.item ?? {}),
      ...(root?.contenido ?? {}),
      ...(root?.libro ?? {}),
    };
    const pages = getBookPages(rawItem);
    if (pages == null) return;
    pagesMap.set(String(missing[index].id), pages);
  });

  if (pagesMap.size === 0) return items;

  return items.map((item) => {
    const pages = pagesMap.get(String(item.id));
    return pages == null ? item : { ...item, duration: pages };
  });
};

const enrichMovieDates = async (
  items: ServiceListItem[],
  signal?: AbortSignal
) => {
  const missing = items.filter(
    (item) => item.updateDate == null && item.createDate == null
  );
  if (missing.length === 0) return items;

  const results = await Promise.allSettled(
    missing.map((item) => fetchMovieById(item.id, signal))
  );

  const dateMap = new Map<string, { updateDate?: number; createDate?: number }>();
  results.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    const { updateDate, createDate } = getItemDates(result.value);
    if (updateDate == null && createDate == null) return;
    dateMap.set(String(missing[index].id), { updateDate, createDate });
  });

  if (dateMap.size === 0) return items;

  return items.map((item) => {
    const extra = dateMap.get(String(item.id));
    return extra ? { ...item, ...extra } : item;
  });
};

export default function CategoriesPage() {
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [sort, setSort] = useState<SortKey>("none");
  const [genre, setGenre] = useState<string>("");
  const [duration, setDuration] = useState<DurationKey>("all");
  const [seasons, setSeasons] = useState<SeasonKey>("all");
  const [bookSeries, setBookSeries] = useState<BookSeriesKey>("all");
  const [platform, setPlatform] = useState<PlatformKey>("all");
  const { pathname } = useLocation();
  const { categoria } = useParams<{ categoria?: string }>();
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    page: number;
    pageSize: number;
    total: number;
    pages: number;
  } | null>(null);
  const PAGE_SIZE = 16;
  const CAROUSEL_PAGE_SIZE = 50;
  const MAIN_CAROUSEL_ITEM_LIMIT = 12;
  const externalSearchType = category == null ? null : resolveExternalType(category);
  const categorySearch = useExternalContentSearch({
    type: externalSearchType,
    pageSize: 12,
    limit: 8,
  });
  const {
    query: categorySearchQuery,
    setQuery: setCategorySearchQuery,
    suggestions: categorySearchSuggestions,
    loading: categorySearchLoading,
    error: categorySearchError,
    clear: clearCategorySearch,
  } = categorySearch;

  // -------------------------
  // Géneros por categoría (fijos)
  // -------------------------
  const genres = useMemo(() => {
    switch (category) {
      case "peliculas":
        return [
          "Acción",
          "Animación",
          "Aventura",
          "Bélica",
          "Ciencia ficción",
          "Comedia",
          "Crimen",
          "Drama",
          { label: "Familiar", value: "Familia" },
          "Fantasía",
          "Misterio",
          "Romance",
          "Suspense",
          "Terror",
        ];
      case "series":
        return [
          { label: "Acción y aventura", value: "Action & Adventure" },
          "Animación",
          "Comedia",
          "Crimen",
          "Drama",
          { label: "Ciencia ficción y Fantasía", value: "Sci-Fi & Fantasy" },
          { label: "Guerra y Política", value: "War & Politics" },
          "Misterio",
          "Thriller",
        ];
      case "videojuegos":
        return [
          "Acción",
          "Aventura",
          "Arcade",
          "Carreras",
          "Deportes",
          "Estrategia",
          "Indie",
          "Plataformas",
          "Puzzle",
          "RPG",
          "Shooter",
          "Simulación",
        ];
      case "libros":
        return [
          {
            label: "Aventura",
            value: [
              "Fiction / Science Fiction / Action & Adventure",
              "Young Adult Fiction / Action & Adventure / General",
              "Juvenile Fiction / Action & Adventure / General",
            ],
          },
          {
            label: "Ciencia ficción",
            value: [
              "Fiction / Science Fiction / Action & Adventure",
              "Fiction / Science Fiction / Hard Science Fiction",
            ],
          },
          {
            label: "Clásicos",
            value: "Fiction / Classics",
          },
          {
            label: "Distopía",
            value: "Young Adult Fiction / Dystopian",
          },
          {
            label: "Fantasía",
            value: [
              "Juvenile Fiction / Fantasy / General",
              "Young Adult Fiction / Fantasy / General",
              "Young Adult Fiction / Fantasy / Epic",
            ],
          },
          {
            label: "Misterio",
            value: "Juvenile Fiction / Paranormal, Occult & Supernatural",
          },
          {
            label: "Suspense",
            value: "Fiction / Thrillers / Suspense",
          },
          {
            label: "Romance",
            value: [
              "Young Adult Fiction / Romance / General",
              "Juvenile Fiction / Love & Romance",
            ],
          },
          {
            label: "Terror",
            value: "Juvenile Fiction / Paranormal, Occult & Supernatural",
          },
        ];
      default:
        return [];
    }
  }, [category]);

  useEffect(() => {
    if (category == null) {
      setGenre("");
      setSort("none");
      setDuration("all");
      setSeasons("all");
      setBookSeries("all");
      setPlatform("all");
      clearCategorySearch();
      setPage(1);
    }
  }, [category, clearCategorySearch]);

  const handleApiSuggestionSelect = async (id: string) => {
    const suggestion = categorySearchSuggestions.find((item) => item.id === id);
    if (!suggestion) return;

    try {
      const payload = await importExternalContent(suggestion.type, suggestion.externalId);
      const importedItem = payload?.item ?? payload;
      const importedId = importedItem?.id ?? importedItem?._id;

      if (!importedId) {
        throw new Error("No se pudo obtener el ID del contenido importado.");
      }

      const resolvedTitle =
        importedItem?.titulo ?? importedItem?.title ?? suggestion.title;

      clearCategorySearch();
      navigate(buildDetailPath(suggestion.type, importedId, resolvedTitle), {
        state: {
          item: { ...importedItem, tipo: suggestion.type },
        },
      });
    } catch (err) {
      console.error("Error importando contenido externo:", err);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const loadServices = async () => {
      if (category == null) {
        if (page !== 1) {
          setError(null);
          setLoading(true);
          setPage(1);
          return;
        }
        setLoading(true);
        setLoadingMore(false);
        setError(null);
        setPagination(null);
        try {
          const results = await Promise.allSettled([
            fetchMovies({ page: 1, pageSize: CAROUSEL_PAGE_SIZE, signal: controller.signal }),
            fetchSeries({ page: 1, pageSize: CAROUSEL_PAGE_SIZE, signal: controller.signal }),
            fetchBooks({ page: 1, pageSize: CAROUSEL_PAGE_SIZE, signal: controller.signal }),
            fetchVideoGames({ page: 1, pageSize: CAROUSEL_PAGE_SIZE, signal: controller.signal }),
          ]);

          if (controller.signal.aborted) return;

          const movieItems =
            results[0].status === "fulfilled"
              ? normalizeServiceItems(results[0].value, "peliculas")
              : [];
          const seriesItems =
            results[1].status === "fulfilled"
              ? normalizeServiceItems(results[1].value, "series")
              : [];
          const bookItems =
            results[2].status === "fulfilled"
              ? normalizeServiceItems(results[2].value, "libros")
              : [];
          const videoGameItems =
            results[3].status === "fulfilled"
              ? normalizeServiceItems(results[3].value, "videojuegos")
              : [];

          const combined = [
            ...movieItems,
            ...seriesItems,
            ...bookItems,
            ...videoGameItems,
          ];
          setServices(combined);

          const anySuccess = results.some((res) => res.status === "fulfilled");
          const allAborted =
            !anySuccess &&
            results.every(
              (res) =>
                res.status === "rejected" &&
                (res.reason as { name?: string } | undefined)?.name === "AbortError",
            );
          if (allAborted) return;
          if (!anySuccess) {
            setError("No se pudieron cargar las categorías");
          }
        } catch (err) {
          if ((err as { name?: string })?.name === "AbortError") return;
          console.error("Error cargando servicios:", err);
          setError("No se pudieron cargar las categorías");
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
            setHasLoadedOnce(true);
          }
        }
        return;
      }

      const isAppending = page > 1;
      if (isAppending) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const params: Record<string, unknown> = {
          page,
          pageSize: PAGE_SIZE,
          recommend: false,
          signal: controller.signal,
        };

        if (genre) params.generos = genre;

        const sortParams = getBackendSortParams(sort);
        if (sortParams) {
          params.order = sortParams.order;
          params.desc = sortParams.desc;
        }

        if (category === "peliculas") {
          if (duration === "short") {
            params.duracionMax = 60;
          } else if (duration === "medium") {
            params.duracionMin = 61;
            params.duracionMax = 90;
          } else if (duration === "long") {
            params.duracionMin = 91;
          }
        } else if (category === "libros") {
          if (duration === "short") {
            params.paginasMax = 250;
          } else if (duration === "medium") {
            params.paginasMin = 251;
            params.paginasMax = 500;
          } else if (duration === "long") {
            params.paginasMin = 501;
          }
        } else if (category === "videojuegos") {
          if (duration === "short") {
            params.duracionMin = 1;
            params.duracionMax = 5;
          } else if (duration === "medium") {
            params.duracionMin = 6;
            params.duracionMax = 20;
          } else if (duration === "long") {
            params.duracionMin = 21;
          } else if (duration === "unlimited") {
            params.duracionMin = 0;
            params.duracionMax = 0;
          }
        }

        const data =
          category === "peliculas"
            ? await fetchMovies(params as any)
            : category === "series"
              ? await fetchSeries(params as any)
              : category === "libros"
                ? await fetchBooks(params as any)
                : await fetchVideoGames(params as any);

        const items = normalizeServiceItems(data, category);
        const needsDateEnrichment =
          sort === "newest" || sort === "oldest";
        const needsBookPagesEnrichment =
          category === "libros" && duration !== "all";
        const needsEnrichment =
          category === "videojuegos" ||
          needsBookPagesEnrichment ||
          (category === "libros" && needsDateEnrichment) ||
          (category === "peliculas" && needsDateEnrichment);
        const shouldWaitForEnrichment = needsBookPagesEnrichment;

        if (!shouldWaitForEnrichment && !controller.signal.aborted) {
          setServices((prev) => (isAppending ? [...prev, ...items] : items));
          setPagination(extractPagination(data));
          setLoading(false);
          setLoadingMore(false);
          setHasLoadedOnce(true);
        }

        if (!needsEnrichment) {
          return;
        }

        let enrichedItems = items;
        if (category === "videojuegos") {
          enrichedItems = await enrichVideoGamePlatforms(items, controller.signal);
        } else if (category === "libros") {
          if (needsBookPagesEnrichment) {
            enrichedItems = await enrichBookPages(enrichedItems, controller.signal);
          }
          if (needsDateEnrichment) {
            enrichedItems = await enrichBookDates(enrichedItems, controller.signal);
          }
        } else if (category === "peliculas" && needsDateEnrichment) {
          enrichedItems = await enrichMovieDates(items, controller.signal);
        }

        if (controller.signal.aborted) return;

        setServices((prev) =>
          isAppending ? [...prev, ...enrichedItems] : enrichedItems
        );
        setPagination(extractPagination(data));
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        console.error("Error cargando servicios:", err);
        setError("No se pudieron cargar las categorías");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
          setHasLoadedOnce(true);
        }
      }
    };

    loadServices();
    return () => controller.abort();
  }, [category, page, genre, duration, sort]);


  // -------------------------
  // Filtrado y orden
  // -------------------------
  const filteredServices = useMemo(() => {
    const normalizedSearch = normalizeSearchText(categorySearchQuery).trim();
    const hasGenreData = services.some((s) => Boolean(s.genre));
    const hasDurationData = services.some((s) => s.duration != null);
    const hasSeasonsData = services.some((s) => s.seasonsCount != null);
    const hasPlatformsData = services.some((s) => (s.platforms?.length ?? 0) > 0);
    const base = services
      .filter((s) => (category ? s.category === category : true))
      .filter((s) => {
        if (!normalizedSearch) return true;
        const haystack = normalizeSearchText(
          [
            s.title,
            s.description,
            s.creator,
            s.genre,
            s.collection,
          ]
            .filter(Boolean)
            .join(" ")
        );
        return haystack.includes(normalizedSearch);
      })
      .filter((s) =>
        genre && hasGenreData ? matchesGenre(s.genre, genre) : true,
      )
      .filter((s) => {
        if (category === "series") return true;
        if (duration === "all") return true;
        if (category === "libros") {
          if (s.duration == null) return false;
          if (duration === "short") return s.duration <= 250;
          if (duration === "medium") return s.duration > 250 && s.duration <= 500;
          if (duration === "long") return s.duration > 500;
          return true;
        }
        if (!hasDurationData) return true;
        if (s.duration == null) return false;
        if (category === "videojuegos") {
          if (duration === "short") return s.duration > 0 && s.duration <= 5;
          if (duration === "medium") return s.duration >= 6 && s.duration <= 20;
          if (duration === "long") return s.duration > 20;
          if (duration === "unlimited") return s.duration === 0;
          return true;
        }
        if (duration === "short") return s.duration <= 60;
        if (duration === "medium") return s.duration > 60 && s.duration <= 90;
        if (duration === "long") return s.duration > 90;
        return true;
      })
      .filter((s) => {
        if (category !== "series") return true;
        if (seasons === "all") return true;
        if (!hasSeasonsData || s.seasonsCount == null) return true;
        if (seasons === "1") return s.seasonsCount === 1;
        if (seasons === "2-3") return s.seasonsCount >= 2 && s.seasonsCount <= 3;
        if (seasons === "4-6") return s.seasonsCount >= 4 && s.seasonsCount <= 6;
        if (seasons === "7+") return s.seasonsCount >= 7;
        return true;
      })
      .filter((s) => {
        if (category !== "libros") return true;
        if (bookSeries === "all") return true;
        return getBookSeriesType(s) === bookSeries;
      })
      .filter((s) => {
        if (category !== "videojuegos") return true;
        if (platform === "all") return true;
        if (!hasPlatformsData) return true;
        if (!s.platforms || s.platforms.length === 0) return false;
        return getPlatformBuckets(s.platforms).includes(platform);
      });

    if (sort === "none") return base;

    const getSortRating = (item: ServiceListItem) => {
      if (category === "peliculas") {
        return item.apiRatings?.tmdb ?? 0;
      }
      return item.rating ?? 0;
    };
    const getSortDate = (item: ServiceListItem) => {
      if (item.year) return Date.UTC(item.year, 0, 1);
      if (item.updateDate != null) return item.updateDate;
      if (item.createDate != null) return item.createDate;
      return 0;
    };

    return base.sort((a, b) => {
      if (sort === "az") return a.title.localeCompare(b.title);
      if (sort === "za") return b.title.localeCompare(a.title);
      if (sort === "rating_high") return getSortRating(b) - getSortRating(a);
      if (sort === "rating_low") return getSortRating(a) - getSortRating(b);
      if (sort === "newest") return getSortDate(b) - getSortDate(a);
      if (sort === "oldest") return getSortDate(a) - getSortDate(b);
      return 0;
    });
  }, [services, category, genre, duration, seasons, bookSeries, platform, sort, categorySearchQuery]);

  const marathonItems = useMemo(() => {
    const items = filteredServices.filter(
      (item) => item.category === "series",
    );
    return [...items].sort((a, b) => {
      const scoreA = getBestApiScore(a) ?? normalizeRatingScore(a.rating) ?? 0;
      const scoreB = getBestApiScore(b) ?? normalizeRatingScore(b.rating) ?? 0;
      return scoreB - scoreA;
    }).slice(0, MAIN_CAROUSEL_ITEM_LIMIT);
  }, [filteredServices]);

  const familyItems = useMemo(() => {
    const items = filteredServices.filter(
      (item) => item.category === "peliculas" && matchesGenre(item.genre, "Familia")
    );

    const sorted = [...items].sort((a, b) => {
      const scoreA = getBestApiScore(a) ?? normalizeRatingScore(a.rating) ?? 0;
      const scoreB = getBestApiScore(b) ?? normalizeRatingScore(b.rating) ?? 0;
      return scoreB - scoreA;
    });

    if (sorted.length > 0) return sorted.slice(0, MAIN_CAROUSEL_ITEM_LIMIT);

    return [];
  }, [filteredServices]);

  const mustSeeItems = useMemo(() => {
    const rankByScore = (items: ServiceListItem[]) =>
      [...items].sort((a, b) => {
        const scoreA = getBestApiScore(a) ?? normalizeRatingScore(a.rating) ?? 0;
        const scoreB = getBestApiScore(b) ?? normalizeRatingScore(b.rating) ?? 0;
        return scoreB - scoreA;
      });

    const books = filteredServices.filter((item) => item.category === "libros");
    const topBooks = books.filter((item) => {
      const score = getBestApiScore(item) ?? normalizeRatingScore(item.rating);
      return score != null && score >= 7.5;
    });

    const ranked = rankByScore(topBooks.length > 0 ? topBooks : books).slice(0, MAIN_CAROUSEL_ITEM_LIMIT);
    if (ranked.length > 0) return ranked;

    const items = filteredServices.filter((item) => {
      if (item.category === "videojuegos") return false;
      const score = getBestApiScore(item) ?? normalizeRatingScore(item.rating);
      return score != null && score >= 7.5;
    });
    const fallbackRanked = rankByScore(items).slice(0, MAIN_CAROUSEL_ITEM_LIMIT);
    if (fallbackRanked.length > 0) return fallbackRanked;

    const withViews = filteredServices
      .filter((item) => item.category !== "videojuegos")
      .filter((item) => item.viewsTotal != null || item.viewsWeek != null);
    if (withViews.length > 0) {
      return [...withViews]
        .sort((a, b) => {
          const viewsA = (a.viewsWeek ?? 0) * 1.5 + (a.viewsTotal ?? 0);
          const viewsB = (b.viewsWeek ?? 0) * 1.5 + (b.viewsTotal ?? 0);
          return viewsB - viewsA;
        })
        .slice(0, MAIN_CAROUSEL_ITEM_LIMIT);
    }

    return [...filteredServices]
      .filter((item) => item.category !== "videojuegos")
      .sort((a, b) => b.year - a.year)
      .slice(0, MAIN_CAROUSEL_ITEM_LIMIT);
  }, [filteredServices]);

  const standardOpinifyItems = useMemo(() => {
    const rankedByOpinify = filteredServices
      .filter((item) => normalizeRatingScore(item.rating) != null)
      .sort((a, b) => {
        const scoreA = normalizeRatingScore(a.rating) ?? 0;
        const scoreB = normalizeRatingScore(b.rating) ?? 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return a.title.localeCompare(b.title);
      })
      .slice(0, MAIN_CAROUSEL_ITEM_LIMIT);

    if (rankedByOpinify.length > 0) return rankedByOpinify;

    const grouped = {
      peliculas: filteredServices.filter((item) => item.category === "peliculas"),
      series: filteredServices.filter((item) => item.category === "series"),
      libros: filteredServices.filter((item) => item.category === "libros"),
      videojuegos: filteredServices.filter((item) => item.category === "videojuegos"),
    };
    const mixed: ServiceListItem[] = [];
    const maxLength = Math.max(
      grouped.peliculas.length,
      grouped.series.length,
      grouped.libros.length,
      grouped.videojuegos.length,
    );

    for (let index = 0; index < maxLength && mixed.length < MAIN_CAROUSEL_ITEM_LIMIT; index += 1) {
      const row = [
        grouped.peliculas[index],
        grouped.series[index],
        grouped.libros[index],
        grouped.videojuegos[index],
      ].filter((item): item is ServiceListItem => Boolean(item));
      mixed.push(...row.slice(0, MAIN_CAROUSEL_ITEM_LIMIT - mixed.length));
    }

    return mixed;
  }, [filteredServices]);

  const iconicGameItems = useMemo(() => {
    const items = filteredServices.filter(
      (item) =>
        item.category === "videojuegos" &&
        hasAnyPlatform(item.platforms, [
          "PlayStation 3",
          "PlayStation 2",
          "Nintendo DS",
        ])
    );
    return [...items]
      .sort((a, b) => {
        const scoreA = getBestApiScore(a) ?? normalizeRatingScore(a.rating) ?? 0;
        const scoreB = getBestApiScore(b) ?? normalizeRatingScore(b.rating) ?? 0;
        return scoreB - scoreA;
      })
      .slice(0, MAIN_CAROUSEL_ITEM_LIMIT);
  }, [filteredServices]);

  const showServicesSkeleton =
    loading || (!hasLoadedOnce && services.length === 0 && !error);


  // -------------------------
  // Sincronizar categoría según URL
  // -------------------------
  useEffect(() => {
    if (categoria) {
      if (categoria === "peliculas") {
        setCategory("peliculas");
        setPage(1);
      }
      if (categoria === "series") {
        setCategory("series");
        setPage(1);
      }
      if (categoria === "libros") {
        setCategory("libros");
        setPage(1);
      }
      if (categoria === "videojuegos") {
        setCategory("videojuegos");
        setPage(1);
      }
      return;
    }
    if (
      pathname === "/categorías" ||
      pathname === "/categorías/" ||
      pathname === "/categorias" ||
      pathname === "/categorias/" ||
      pathname === "/servicios" ||
      pathname === "/servicios/"
    ) {
      setCategory(null);
      setPage(1);
      return;
    }
    if (pathname === "/peliculas") {
      setCategory("peliculas");
      setPage(1);
    }
    if (pathname === "/series") {
      setCategory("series");
      setPage(1);
    }
    if (pathname === "/libros") {
      setCategory("libros");
      setPage(1);
    }
    if (pathname === "/videojuegos") {
      setCategory("videojuegos");
      setPage(1);
    }
  }, [categoria, pathname]);


  // -------------------------
  // Render
  // -------------------------
  return (
    <>
      <main className="min-h-screen w-full bg-white pt-2">
        <section className="flex flex-col gap-1">
          <ServicesFilters
            category={category}
            onCategoryChange={(next) => {
              if (next == null) {
                setPage(1);
                setCategory(null);
                navigate("/categorías");
                return;
              }
              setPage(1);
              setCategory(next);
              navigate(`/categorías/${next}`);
            }}
            showCategoryHeading
            categoryHeading="Categorías"
            sort={sort}
            onSortChange={(next) => {
              setSort(next);
              setPage(1);
            }}
            genre={genre}
            onGenreChange={(next) => {
              setGenre(next);
              setPage(1);
            }}
            duration={duration}
            onDurationChange={(next) => {
              setDuration(next);
              setPage(1);
            }}
            seasons={seasons}
            onSeasonsChange={(next) => {
              setSeasons(next);
              setPage(1);
            }}
            bookSeries={bookSeries}
            onBookSeriesChange={(next) => {
              setBookSeries(next);
              setPage(1);
            }}
            platform={platform}
            onPlatformChange={(next) => {
              setPlatform(next);
              setPage(1);
            }}
            searchBar={
              category != null ? (
                <CategoryApiSearchBar
                  query={categorySearchQuery}
                  onQueryChange={(next) => {
                    setCategorySearchQuery(next);
                    setPage(1);
                  }}
                  suggestions={categorySearchSuggestions}
                  loading={categorySearchLoading}
                  error={categorySearchError}
                  onSelectSuggestion={handleApiSuggestionSelect}
                />
              ) : null
            }
            genres={genres}
            showFullFilters={category != null} // filtros completos solo si hay categoría
          />


          {/* Contenido según categoría */}
          <div className="mx-auto w-full max-w-7xl px-0 sm:px-6">
            {showServicesSkeleton && (
              <div className="space-y-4">
                <Skeleton className="h-8 w-52" />
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={`services-skeleton-${index}`}
                      className="space-y-3 rounded-xl border border-violet-100 bg-white p-3"
                    >
                      <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!showServicesSkeleton && error && <p className="text-red-600">{error}</p>}


            {!showServicesSkeleton && !error && (
              <>
                {category == null && (
                  <>
                    {/* /categorías → carruseles transversales */}
                    {marathonItems.length > 0 && (
                      <ServiceSection
                        title="Para un maratón"
                        icon={<Tv />}
                        items={marathonItems}
                      />
                    )}
                    {familyItems.length > 0 && (
                      <ServiceSection
                        title="Para toda la familia"
                        icon={<Popcorn />}
                        items={familyItems}
                      />
                    )}
                    {mustSeeItems.length > 0 && (
                      <ServiceSection
                        title="Imperdibles"
                        icon={<BookOpen />}
                        items={mustSeeItems}
                      />
                    )}
                    {iconicGameItems.length > 0 && (
                      <ServiceSection
                        title="Juegos míticos"
                        icon={<Gamepad2 />}
                        items={iconicGameItems}
                      />
                    )}
                    {standardOpinifyItems.length > 0 && (
                      <ServiceSection
                        title="Lo mejor valorado de Opinify"
                        icon={<Star />}
                        items={standardOpinifyItems}
                      />
                    )}
                  </>
                )}


                {category != null && (
                  <>
                    {/* /categorías/peliculas (o cualquier otra) → grid grande, sin categoría arriba */}
                    <ServiceSection
                      // Opcional: puedes mostrar título solo si quieres
                      title={category[0].toUpperCase() + category.slice(1)}
                      items={filteredServices}
                      fullWidth
                    />
                    {pagination && pagination.pages > page && (
                      <div className="mt-6 flex justify-center">
                        <button
                          type="button"
                          onClick={() => setPage((prev) => prev + 1)}
                          disabled={loadingMore}
                          className="rounded-full border border-violet-300 bg-[linear-gradient(135deg,rgba(76,29,149,0.92),rgba(124,58,237,0.9),rgba(224,0,255,0.84))] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(88,28,135,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(88,28,135,0.34)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_22px_rgba(88,28,135,0.28)]"
                        >
                          {loadingMore ? "Cargando..." : "Cargar más"}
                        </button>
                      </div>
                    )}
                    {pagination && (
                      <p className="mt-2 text-center text-xs text-gray-500">
                        Página {page} de {pagination.pages} · {services.length} de{" "}
                        {pagination.total}
                      </p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
