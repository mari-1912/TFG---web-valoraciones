import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";


import { Header } from "../components/sections/header";
import Footer from "../components/sections/footer";
import { fetchBookById, fetchBooks } from "@/services/fetchBooks";
import { fetchMovieById, fetchMovies } from "@/services/fetchMovies";
import { fetchSeries } from "@/services/fetchSeries";
import { fetchVideoGameById, fetchVideoGames } from "@/services/fetchVideogames";
import type { ServiceList } from "@/services/services-list";
import ServiceSection from "../components/sections/services-section";
import { Popcorn, Tv, BookOpen, Gamepad2 } from "lucide-react";
import {
  ServicesFilters,
  type ServiceCategory,
  type SortKey,
  type DurationKey,
  type SeasonKey,
  type BookSeriesKey,
  type PlatformKey,
} from "../components/service-filters";
import { Skeleton } from "@/components/ui/skeleton";

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
      const duration = toNumber(
        item?.duracion_min ?? item?.duracionMin ?? item?.duration ?? item?.duracion,
      );
      const rating = toNumber(
        item?.rating ?? item?.avgRating ?? item?.valoracion ?? item?.puntuacion,
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

const hasAnyGenre = (itemGenre: string, wanted: string[]) => {
  if (!itemGenre) return false;
  const tokens = normalizeGenres(itemGenre).map(normalizeGenreKey);
  const wantedKeys = wanted.map(normalizeGenreKey);
  return wantedKeys.some((key) => tokens.includes(key));
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

const MARATHON_KEYWORDS = [
  "saga",
  "trilog",
  "trilogy",
  "parte",
  "vol",
  "volumen",
  "season",
  "temporada",
  "coleccion",
  "collection",
];

const FAMILY_GENRES = [
  "familia",
  "family",
  "infantil",
  "kids",
  "animacion",
  "animación",
  "aventura",
  "comedia",
  "fantasia",
  "fantasía",
];

const FAMILY_NEGATIVE = [
  "terror",
  "horror",
  "gore",
  "crimen",
  "crime",
  "thriller",
  "violencia",
  "violento",
  "adult",
  "erotico",
  "erótico",
  "sexo",
];

const isMarathonItem = (item: ServiceListItem) => {
  if (item.category === "series") return true;
  if (item.collection) return true;
  const title = normalizeText(item.title ?? "");
  if (!title) return false;
  if (MARATHON_KEYWORDS.some((key) => title.includes(key))) return true;
  if (/\b(ii|iii|iv|v|vi|vii|viii|ix|x)\b/i.test(title)) return true;
  if (/\b(2|3|4|5|6|7|8|9|10)\b/.test(title)) return true;
  return false;
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
  const PAGE_SIZE = 20;

  // -------------------------
  // Géneros por categoría (fijos)
  // -------------------------
  const genres = useMemo(() => {
    switch (category) {
      case "peliculas":
        return ["Acción", "Drama", "Comedia", "Ciencia ficción"];
      case "series":
        return ["Drama", "Thriller", "Comedia"];
      case "videojuegos":
        return ["Aventura", "RPG", "Estrategia"];
      case "libros":
        return ["Fantasía", "Romance", "Historia"];
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
      setPage(1);
    }
  }, [category]);

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
            fetchMovies({ page: 1, pageSize: PAGE_SIZE, signal: controller.signal }),
            fetchSeries({ page: 1, pageSize: PAGE_SIZE, signal: controller.signal }),
            fetchBooks({ page: 1, pageSize: PAGE_SIZE, signal: controller.signal }),
            fetchVideoGames({ page: 1, pageSize: PAGE_SIZE, signal: controller.signal }),
          ]);

          if (controller.signal.aborted) return;

          const combined = [
            ...(results[0].status === "fulfilled"
              ? normalizeServiceItems(results[0].value, "peliculas")
              : []),
            ...(results[1].status === "fulfilled"
              ? normalizeServiceItems(results[1].value, "series")
              : []),
            ...(results[2].status === "fulfilled"
              ? normalizeServiceItems(results[2].value, "libros")
              : []),
            ...(results[3].status === "fulfilled"
              ? normalizeServiceItems(results[3].value, "videojuegos")
              : []),
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
          setLoading(false);
          setHasLoadedOnce(true);
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
          signal: controller.signal,
        };

        if (genre) params.generos = genre;

        if (category === "peliculas") {
          if (duration === "short") {
            params.duracionMax = 60;
          } else if (duration === "medium") {
            params.duracionMin = 61;
            params.duracionMax = 120;
          } else if (duration === "long") {
            params.duracionMin = 121;
          }
        }

        // Ordenamos en frontend para evitar errores con "order" del backend.

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
        const enrichedItems =
          category === "videojuegos"
            ? await enrichVideoGamePlatforms(items, controller.signal)
            : category === "libros" && needsDateEnrichment
              ? await enrichBookDates(items, controller.signal)
              : category === "peliculas" && needsDateEnrichment
                ? await enrichMovieDates(items, controller.signal)
                : items;
        setServices((prev) =>
          isAppending ? [...prev, ...enrichedItems] : enrichedItems
        );
        setPagination(extractPagination(data));
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        console.error("Error cargando servicios:", err);
        setError("No se pudieron cargar las categorías");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setHasLoadedOnce(true);
      }
    };

    loadServices();
    return () => controller.abort();
  }, [category, page, genre, duration, sort]);


  // -------------------------
  // Filtrado y orden
  // -------------------------
  const filteredServices = useMemo(() => {
    const hasGenreData = services.some((s) => Boolean(s.genre));
    const hasDurationData = services.some((s) => s.duration != null);
    const hasSeasonsData = services.some((s) => s.seasonsCount != null);
    const hasPlatformsData = services.some((s) => (s.platforms?.length ?? 0) > 0);
    const base = services
      .filter((s) => (category ? s.category === category : true))
      .filter((s) =>
        genre && hasGenreData ? matchesGenre(s.genre, genre) : true,
      )
      .filter((s) => {
        if (category !== "peliculas") return true;
        if (!hasDurationData) return true;
        if (!s.duration || duration === "all") return true;
        if (duration === "short") return s.duration <= 60;
        if (duration === "medium") return s.duration > 60 && s.duration <= 120;
        if (duration === "long") return s.duration > 120;
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
  }, [services, category, genre, duration, seasons, bookSeries, platform, sort]);

  const marathonItems = useMemo(() => {
    const items = filteredServices.filter(
      (item) => item.category !== "videojuegos" && isMarathonItem(item),
    );
    return [...items].sort((a, b) => {
      const scoreA = getBestApiScore(a) ?? normalizeRatingScore(a.rating) ?? 0;
      const scoreB = getBestApiScore(b) ?? normalizeRatingScore(b.rating) ?? 0;
      return scoreB - scoreA;
    }).slice(0, 20);
  }, [filteredServices]);

  const familyItems = useMemo(() => {
    const items = filteredServices.filter((item) => {
      const positive =
        hasAnyGenre(item.genre, FAMILY_GENRES);
      if (!positive) return false;
      const negative = hasAnyGenre(item.genre, FAMILY_NEGATIVE);
      return !negative;
    });

    const sorted = [...items].sort((a, b) => {
      const scoreA = getBestApiScore(a) ?? normalizeRatingScore(a.rating) ?? 0;
      const scoreB = getBestApiScore(b) ?? normalizeRatingScore(b.rating) ?? 0;
      return scoreB - scoreA;
    });

    if (sorted.length > 0) return sorted.slice(0, 20);

    return [];
  }, [filteredServices]);

  const mustSeeItems = useMemo(() => {
    const items = filteredServices.filter((item) => {
      if (item.category === "videojuegos") return false;
      const score = getBestApiScore(item) ?? normalizeRatingScore(item.rating);
      return score != null && score >= 7.5;
    });
    const ranked = [...items]
      .sort((a, b) => {
        const scoreA = getBestApiScore(a) ?? normalizeRatingScore(a.rating) ?? 0;
        const scoreB = getBestApiScore(b) ?? normalizeRatingScore(b.rating) ?? 0;
        return scoreB - scoreA;
      })
      .slice(0, 20);
    if (ranked.length > 0) return ranked;

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
        .slice(0, 20);
    }

    return [...filteredServices]
      .filter((item) => item.category !== "videojuegos")
      .sort((a, b) => b.year - a.year)
      .slice(0, 20);
  }, [filteredServices]);

  const topTmdbItems = useMemo(() => {
    const items = filteredServices.filter(
      (item) => item.category === "peliculas" || item.category === "series",
    );
    const withTmdb = items.filter((item) => item.apiRatings?.tmdb != null);
    const base = withTmdb.length > 0 ? withTmdb : items;
    return [...base]
      .sort((a, b) => {
        const scoreA =
          a.apiRatings?.tmdb ?? normalizeRatingScore(a.rating) ?? 0;
        const scoreB =
          b.apiRatings?.tmdb ?? normalizeRatingScore(b.rating) ?? 0;
        return scoreB - scoreA;
      })
      .slice(0, 20)
      .map((item) => {
        const tmdbRating = item.apiRatings?.tmdb;
        if (tmdbRating == null) return item;
        return { ...item, rating: tmdbRating / 2 };
      });
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
      <Header />
      <main className="bg-white min-h-screen pt-38">
        <section className="flex flex-col gap-8">
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
            genres={genres}
            showFullFilters={category != null} // filtros completos solo si hay categoría
          />


          {/* Contenido según categoría */}
          <div className="mx-auto w-full max-w-7xl px-6">
            {showServicesSkeleton && (
              <div className="space-y-6">
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
                    {topTmdbItems.length > 0 && (
                      <ServiceSection
                        title="Lo mejor valorado en TMDB"
                        icon={<Gamepad2 />}
                        items={topTmdbItems}
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
                      <div className="mt-8 flex justify-center">
                        <button
                          type="button"
                          onClick={() => setPage((prev) => prev + 1)}
                          disabled={loadingMore}
                          className="rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {loadingMore ? "Cargando..." : "Cargar más"}
                        </button>
                      </div>
                    )}
                    {pagination && (
                      <p className="mt-3 text-center text-xs text-gray-500">
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
