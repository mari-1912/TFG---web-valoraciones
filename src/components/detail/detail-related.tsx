import { useEffect, useMemo, useState } from "react";
import ContentCard from "@/components/content-card";
import { fetchBooks } from "@/services/fetchBooks";
import { fetchMovies } from "@/services/fetchMovies";
import { fetchSeries } from "@/services/fetchSeries";
import { fetchVideoGames } from "@/services/fetchVideogames";
import { buildDetailPath } from "@/lib/detail-route";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type DetailRelatedProps = {
  type?: string;
  currentId?: string | number;
  genres?: string;
  year?: number | null;
};

type RelatedItem = {
  id: string | number;
  title: string;
  image?: string | null;
  score?: number | null;
  type: "pelicula" | "serie" | "libro" | "videojuego";
  raw: unknown;
};

function resolveTitle(type?: string) {
  if (type === "libro") return "La gente también ha leído";
  if (type === "videojuego" || type === "juego-mesa") {
    return "La gente también ha jugado";
  }
  return "La gente también ha visto";
}

function toRelatedType(type?: string): RelatedItem["type"] | null {
  if (type === "pelicula") return "pelicula";
  if (type === "serie") return "serie";
  if (type === "libro") return "libro";
  if (type === "videojuego") return "videojuego";
  return null;
}

function extractRows(payload: any): any[] {
  const source = payload?.items ?? payload?.data ?? payload;
  const rows =
    Array.isArray(source)
      ? source
      : source?.items ??
        source?.results ??
        source?.peliculas ??
        source?.series ??
        source?.libros ??
        source?.videojuegos ??
        source?.data?.items ??
        source?.data?.results;

  return Array.isArray(rows) ? rows : [];
}

function pickNumber(...values: unknown[]) {
  for (const value of values) {
    if (value == null) continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeItem(row: any, type: RelatedItem["type"]): RelatedItem | null {
  const id = row?.id ?? row?._id ?? row?.contenidoId ?? row?.contenido_id;
  if (id == null) return null;

  const title = row?.titulo ?? row?.title ?? row?.nombre ?? row?.name ?? "";
  const image =
    row?.portada ??
    row?.poster ??
    row?.image ??
    row?.imagen ??
    row?.cover ??
    row?.imgSrc ??
    null;
  const score = pickNumber(
    row?.puntuacion,
    row?.valoracionMedia,
    row?.avgRating,
    row?.rating,
    row?.puntuacionApi,
    row?.puntuacion_api
  );

  return {
    id,
    title: String(title || "Sin título"),
    image: typeof image === "string" ? image : null,
    score,
    type,
    raw: row,
  };
}

function buildRecommendationParams(genres?: string, year?: number | null) {
  const params: Record<string, unknown> = {
    page: 1,
    pageSize: 12,
    recommend: true,
    order: "rating",
    desc: true,
  };

  if (genres?.trim()) {
    params.generos = genres
      .split(",")
      .map((genre) => genre.trim())
      .filter(Boolean)
      .slice(0, 3);
  }

  if (year != null && Number.isFinite(year)) {
    params.anioFrom = Math.max(0, year - 5);
    params.anioTo = year + 5;
  }

  return params;
}

export function DetailRelated({
  type,
  currentId,
  genres,
  year,
}: DetailRelatedProps) {
  const relatedTitle = resolveTitle(type);
  const relatedType = toRelatedType(type);
  const [items, setItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(
    () => buildRecommendationParams(genres, year),
    [genres, year]
  );

  useEffect(() => {
    if (!relatedType) {
      setItems([]);
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const payload =
          relatedType === "pelicula"
            ? await fetchMovies({ ...params, signal: controller.signal } as any)
            : relatedType === "serie"
              ? await fetchSeries({ ...params, signal: controller.signal } as any)
              : relatedType === "libro"
                ? await fetchBooks({ ...params, signal: controller.signal } as any)
                : await fetchVideoGames({
                    ...params,
                    signal: controller.signal,
                  } as any);

        if (controller.signal.aborted) return;

        const normalized = extractRows(payload)
          .map((row) => normalizeItem(row, relatedType))
          .filter((item): item is RelatedItem => item != null)
          .filter((item) => String(item.id) !== String(currentId))
          .slice(0, 10);

        setItems(normalized);
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        console.error("Error cargando recomendaciones:", err);
        setError("No se pudieron cargar recomendaciones.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [currentId, params, relatedType]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">{relatedTitle}</h2>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-gray-500">Cargando recomendaciones...</p>
        ) : error ? (
          <p className="text-sm text-gray-500">{error}</p>
        ) : items.length > 0 ? (
          <Carousel className="relative">
            <CarouselContent className="py-1">
            {items.map((item) => (
              <CarouselItem
                key={`${item.type}:${item.id}`}
                className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
              >
                <ContentCard
                  title={item.title}
                  image={item.image}
                  type={item.type}
                  score={item.score}
                  to={buildDetailPath(item.type, item.id, item.title)}
                  state={{ item: { ...(item.raw as object), tipo: item.type } }}
                />
              </CarouselItem>
            ))}
            </CarouselContent>
            <CarouselPrevious className="border-violet-300 bg-violet-600 text-white shadow-[0_8px_18px_rgba(88,28,135,0.28)] hover:bg-violet-800 hover:text-white sm:flex" />
            <CarouselNext className="border-violet-300 bg-violet-600 text-white shadow-[0_8px_18px_rgba(88,28,135,0.28)] hover:bg-violet-800 hover:text-white sm:flex" />
          </Carousel>
        ) : (
          <p className="text-sm text-gray-500">
            No hay recomendaciones por ahora.
          </p>
        )}
      </div>
    </section>
  );
}
