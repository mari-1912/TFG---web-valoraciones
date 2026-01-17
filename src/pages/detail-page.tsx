import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import Footer from "../components/sections/footer";
import { Header } from "../components/sections/header";
import { DetailComments } from "../components/detail/detail-comments";
import { DetailHero } from "../components/detail/detail-hero";
import { DetailRelated } from "../components/detail/detail-related";
import movies from "../data/movies.json";
import books from "../data/books.json";
import videoGames from "../data/video-games.json";
import series from "../data/series.json";
import boardGames from "../data/board-games.json";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "https://tfg-web-valoraciones-back-i9b5.onrender.com";

const LOCAL_DATASETS: Record<string, any[]> = {
  pelicula: movies,
  serie: series,
  libro: books,
  videojuego: videoGames,
  "juego-mesa": boardGames,
};

const TYPE_ENDPOINTS: Record<string, string> = {
  pelicula: "peliculas",
  serie: "series",
  libro: "libros",
  videojuego: "videojuegos",
};

const TYPE_LABELS: Record<string, string> = {
  pelicula: "Película",
  serie: "Serie",
  libro: "Libro",
  videojuego: "Videojuego",
  "juego-mesa": "Juego de mesa",
};

const SAMPLE_COMMENTS = [
  {
    id: "sample-1",
    user: "sara_92",
    date: "hace 2 días",
    rating: 4,
    comment:
      "Visualmente espectacular y con ritmo muy sólido. La volvería a ver sin problema.",
  },
  {
    id: "sample-2",
    user: "pablo_g",
    date: "hace 1 semana",
    rating: 5,
    comment:
      "Una historia que te engancha desde el minuto uno. Muy recomendable.",
  },
  {
    id: "sample-3",
    user: "lucia.book",
    date: "ayer",
    rating: 3,
    comment:
      "Me gustó la ambientación, aunque esperaba más profundidad en los personajes.",
  },
];

function formatList(value?: string | string[]) {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (value.includes(";")) {
    return value
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", ");
  }
  return value;
}

function parseRating(value: unknown) {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const cleaned = value.replace(",", ".");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickString(...values: Array<unknown>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

export function DetailPage() {
  const { id, type } = useParams();
  const location = useLocation();
  const stateItem = (location.state as { item?: any } | null)?.item ?? null;

  const localItem = useMemo(() => {
    if (!type || !id) return null;
    const dataset = LOCAL_DATASETS[type];
    if (!Array.isArray(dataset)) return null;
    return dataset.find((i) => String(i.id) === String(id)) ?? null;
  }, [type, id]);

  const [remoteItem, setRemoteItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!type || !id) return;
    if (stateItem || localItem) return;

    const endpoint = TYPE_ENDPOINTS[type];
    if (!endpoint) return;

    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/${endpoint}/${id}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Error ${res.status}. ${text}`);
        }
        const data = await res.json();
        setRemoteItem(data?.item ?? data);
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "Error cargando el detalle."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [type, id, stateItem, localItem]);

  const item = stateItem ?? localItem ?? remoteItem;
  const comments = useMemo(() => {
    if (Array.isArray(item?.reviews) && item.reviews.length > 0) {
      return item.reviews.map((review: any, index: number) => ({
        id: review?.id ?? `review-${index}`,
        user: pickString(review?.user, review?.usuario, review?.author) || "Usuario",
        date: pickString(review?.date, review?.fecha) || "hace poco",
        rating: parseRating(review?.rating) ?? null,
        comment: pickString(review?.comment, review?.texto, review?.body),
      }));
    }
    return SAMPLE_COMMENTS;
  }, [item]);

  const title = pickString(item?.title, item?.titulo) || "Sin título";
  const description = pickString(item?.description, item?.sinopsis);
  const image = pickString(item?.imgSrc, item?.portada, item?.image);
  const videoUrl = pickString(
    item?.video,
    item?.video_url,
    item?.videoUrl,
    item?.trailer,
    item?.trailer_url,
    item?.trailerUrl
  );
  const isYouTube = /youtu\.be|youtube\.com/i.test(videoUrl);
  const canShowVideo =
    type === "pelicula" || type === "serie" || type === "videojuego";

  const apiRating = parseRating(
    item?.valoracion_api ??
      item?.valoracionApi ??
      item?.rating_api ??
      item?.ratingApi ??
      item?.puntuacion_api ??
      item?.imdbRating ??
      item?.tmdbRating ??
      item?.apiRating
  );
  const ourRating = parseRating(
    item?.valoracion ??
      item?.avgRating ??
      item?.rating ??
      item?.puntuacion ??
      item?.valoracionMedia ??
      item?.rating_media
  );
  const hasOurRating = Number.isFinite(ourRating);

  const year =
    item?.anio_lanzamiento ?? item?.anioLanzamiento ?? item?.anio ?? null;
  const genresText = formatList(item?.generos ?? item?.genero);
  const plataformasText = formatList(item?.plataformas ?? item?.plataforma);
  const consolasText = formatList(item?.consolas);
  const duracionMin = item?.duracion_min ?? item?.duracionMin;

  const authorLabel = pickString(item?.autor, item?.author, item?.creator);
  const editorialLabel = pickString(item?.editorial, item?.publisher);
  const isbnLabel = pickString(
    item?.isbn,
    item?.isbn13,
    item?.isbn_13,
    item?.isbn10,
    item?.isbn_10
  );
  const formatLabel = pickString(
    item?.formato,
    item?.format,
    item?.tipo_formato,
    item?.tipoFormato
  );
  const languageLabel = pickString(item?.idioma, item?.language);
  const sagaLabel = pickString(
    item?.saga,
    item?.coleccion,
    item?.collection,
    item?.seriesName,
    item?.serie
  );

  const apiRatingLabel = apiRating != null ? apiRating.toFixed(1) : "null";
  const ourRatingLabel = ourRating != null ? ourRating.toFixed(1) : "null";
  const yearLabel = year != null ? String(year) : "null";
  const durationLabel =
    duracionMin != null
      ? `${duracionMin} min`
      : item?.duracion != null
        ? `${item.duracion} h`
        : "null";
  const pagesLabel =
    item?.paginas != null ? String(item.paginas) : item?.pages != null ? String(item.pages) : "null";
  const plataformasLabel = plataformasText || "null";
  const authorValue = authorLabel || "null";
  const editorialValue = editorialLabel || "null";
  const isbnValue = isbnLabel || "null";
  const formatValue = formatLabel || "null";
  const languageValue = languageLabel || "null";
  const sagaValue = sagaLabel || "null";

  const meta: Array<{ label: string; value: string }> = [];
  meta.push({ label: "Año de salida", value: yearLabel });
  if (type === "libro") {
    meta.push({ label: "Páginas", value: pagesLabel });
    meta.push({ label: "Autor", value: authorValue });
    meta.push({ label: "Editorial", value: editorialValue });
    meta.push({ label: "ISBN", value: isbnValue });
    meta.push({ label: "Formato", value: formatValue });
    meta.push({ label: "Idioma", value: languageValue });
    meta.push({ label: "Saga/Colección", value: sagaValue });
  } else {
    meta.push({ label: "Duración", value: durationLabel });
    meta.push({ label: "Plataformas", value: plataformasLabel });
  }
  if (genresText) meta.push({ label: "Géneros", value: genresText });
  if (item?.director) meta.push({ label: "Director", value: item.director });
  if (item?.estudio) meta.push({ label: "Estudio", value: item.estudio });
  if (type !== "libro" && item?.autor) meta.push({ label: "Autor", value: item.autor });
  if (type !== "libro" && item?.editorial) meta.push({ label: "Editorial", value: item.editorial });
  if (type !== "libro" && item?.paginas != null) {
    meta.push({ label: "Páginas", value: String(item.paginas) });
  }
  if (item?.precio != null) {
    meta.push({ label: "Precio", value: `${Number(item.precio).toFixed(2)} €` });
  }
  if (item?.desarrollador) {
    meta.push({ label: "Desarrollador", value: item.desarrollador });
  }
  if (consolasText) meta.push({ label: "Consolas", value: consolasText });

  const typeLabel = type ? TYPE_LABELS[type] ?? "Detalle" : "Detalle";

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 px-6 pb-12 pt-32">
        <div className="mx-auto w-full max-w-none">
          {loading && !item ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
              Cargando detalle…
            </div>
          ) : !item ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">
              <p>No se encontró el elemento solicitado.</p>
              {error ? <p className="mt-2 text-sm text-gray-500">{error}</p> : null}
        </div>
      ) : (
            <div className="space-y-10">
              <DetailHero
                type={type}
                typeLabel={typeLabel}
                title={title}
                description={description}
                image={image}
                canShowVideo={canShowVideo}
                videoUrl={videoUrl}
                isYouTube={isYouTube}
                apiRatingLabel={apiRatingLabel}
                ourRatingLabel={ourRatingLabel}
                yearLabel={yearLabel}
                durationLabel={durationLabel}
                pagesLabel={pagesLabel}
                genresText={genresText}
                hasOurRating={hasOurRating}
                ourRating={ourRating}
                plataformasLabel={plataformasLabel}
                bookMeta={{
                  author: authorValue,
                  editorial: editorialValue,
                  isbn: isbnValue,
                  format: formatValue,
                  language: languageValue,
                  saga: sagaValue,
                }}
                meta={meta}
              />

              <DetailRelated type={type} />

              <DetailComments comments={comments} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
