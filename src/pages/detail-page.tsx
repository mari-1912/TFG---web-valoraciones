import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import Footer from "../components/sections/footer";
import { DetailComments } from "../components/detail/detail-comments";
import { DetailHero } from "../components/detail/detail-hero";
import { DetailRelated } from "../components/detail/detail-related";
import { isSessionValid } from "@/services/auth-service";
import {
  addToWatchlist,
  addToWatchedList,
  getCurrentUser,
  isInWatchlist,
  isInWatchedList,
} from "../services/watchlist";
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

const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/";

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

function parseCount(value: unknown) {
  if (value == null) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed < 0 ? null : parsed;
}

function pickString(...values: Array<unknown>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function extractYear(value?: string) {
  if (!value) return null;
  const match = value.match(/\d{4}/);
  if (!match) return null;
  const year = Number(match[0]);
  return Number.isFinite(year) ? year : null;
}

function toYouTubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace("www.", "");
    let videoId = "";

    if (host === "youtu.be") {
      videoId = parsed.pathname.slice(1);
    } else if (host.endsWith("youtube.com")) {
      if (parsed.pathname.startsWith("/watch")) {
        videoId = parsed.searchParams.get("v") ?? "";
      } else if (parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.split("/")[2] ?? "";
      } else if (parsed.pathname.startsWith("/shorts/")) {
        videoId = parsed.pathname.split("/")[2] ?? "";
      }
    }

    if (!videoId) return url;
    const start =
      parsed.searchParams.get("start") ?? parsed.searchParams.get("t");
    const startParam =
      start && /^\d+$/.test(start) ? `?start=${start}` : "";
    return `https://www.youtube.com/embed/${videoId}${startParam}`;
  } catch {
    return url;
  }
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
  const [watchlistMessage, setWatchlistMessage] = useState<string | null>(null);
  const [watchedMessage, setWatchedMessage] = useState<string | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inWatchedList, setInWatchedList] = useState(false);

  useEffect(() => {
    if (!type || !id) return;

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
  const resolvedId = item?.id ?? id;
  const normalizedId = resolvedId != null ? String(resolvedId) : "";
  const currentUser = getCurrentUser();
  const isLoggedIn = isSessionValid();

  useEffect(() => {
    if (!type || !normalizedId) {
      setInWatchlist(false);
      return;
    }
    setInWatchlist(isInWatchlist(normalizedId, type, currentUser));
  }, [type, normalizedId, currentUser]);

  useEffect(() => {
    if (!type || !normalizedId) {
      setInWatchedList(false);
      return;
    }
    setInWatchedList(isInWatchedList(normalizedId, type, currentUser));
  }, [type, normalizedId, currentUser]);
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

  const tmdbContent = item?.metadataApi?.tmdb?.content;
  const rawgContent = item?.metadataApi?.rawg?.content;
  const googleBooksContent = item?.metadataApi?.googleBooks?.content;
  const tmdbPoster = tmdbContent?.poster_path
    ? `${TMDB_IMG_BASE}w500${tmdbContent.poster_path}`
    : "";
  const tmdbBackdrop = tmdbContent?.backdrop_path
    ? `${TMDB_IMG_BASE}w780${tmdbContent.backdrop_path}`
    : "";

  const title = pickString(item?.title, item?.titulo) || "Sin título";
  const description = pickString(
    item?.description,
    item?.sinopsis,
    tmdbContent?.sinopsis,
    rawgContent?.sinopsis,
    googleBooksContent?.sinopsis
  );
  const image = pickString(
    item?.imgSrc,
    item?.portada,
    item?.image,
    tmdbPoster,
    tmdbBackdrop
  );
  const tmdbTrailerKey = tmdbContent?.trailer?.key;
  const tmdbTrailerProvider = tmdbContent?.trailer?.provider;
  const trailerUrlCandidate = pickString(tmdbContent?.trailer?.url);
  const trailerUrlIsHttp = /^https?:\/\//i.test(trailerUrlCandidate);
  const tmdbTrailerUrl =
    tmdbTrailerProvider === "youtube"
      ? tmdbTrailerKey
        ? `https://www.youtube.com/watch?v=${tmdbTrailerKey}`
        : trailerUrlIsHttp
          ? trailerUrlCandidate
          : ""
      : trailerUrlIsHttp
        ? trailerUrlCandidate
        : "";
  const videoUrl = pickString(
    item?.video,
    item?.video_url,
    item?.videoUrl,
    item?.trailer,
    item?.trailer_url,
    item?.trailerUrl,
    tmdbTrailerUrl
  );
  const isYouTube = /youtu\.be|youtube\.com/i.test(videoUrl);
  const normalizedVideoUrl = isYouTube
    ? toYouTubeEmbedUrl(videoUrl)
    : videoUrl;
  const canShowVideo =
    (type === "pelicula" || type === "serie") && Boolean(videoUrl);

  const tmdbRating = parseRating(tmdbContent?.rating?.vote_average);
  const rawgRating = parseRating(rawgContent?.rating?.rawg);
  const googleBooksRating = parseRating(googleBooksContent?.rating?.average);
  const apiRatingFromItem = parseRating(
    item?.valoracion_api ??
      item?.valoracionApi ??
      item?.rating_api ??
      item?.ratingApi ??
      item?.puntuacion_api ??
      item?.puntuacionApi ??
      item?.imdbRating ??
      item?.tmdbRating ??
      item?.apiRating
  );
  const apiRating = parseRating(
    apiRatingFromItem ??
      tmdbRating ??
      rawgRating ??
      googleBooksRating
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

  const tmdbVotes = parseCount(tmdbContent?.rating?.vote_count);
  const rawgVotes = parseCount(rawgContent?.rating?.count);
  const googleBooksVotes = parseCount(googleBooksContent?.rating?.count);
  const apiVotesFromItem = parseCount(
    item?.votos ??
      item?.votos_api ??
      item?.voteCount ??
      item?.vote_count ??
      item?.ratingsCount ??
      item?.ratingCount
  );

  const apiCandidates = {
    TMDB: { label: "TMDB", rating: tmdbRating, votes: tmdbVotes },
    RAWG: { label: "RAWG", rating: rawgRating, votes: rawgVotes },
    "Google Books": {
      label: "Google Books",
      rating: googleBooksRating,
      votes: googleBooksVotes,
    },
    API: { label: "API", rating: apiRatingFromItem, votes: apiVotesFromItem },
  } as const;

  const apiOrder = (() => {
    if (type === "libro") return ["Google Books", "API", "TMDB", "RAWG"];
    if (type === "videojuego") return ["RAWG", "API", "TMDB", "Google Books"];
    if (type === "pelicula" || type === "serie")
      return ["TMDB", "API", "RAWG", "Google Books"];
    return ["API", "TMDB", "RAWG", "Google Books"];
  })();

  const selectedApi =
    apiOrder
      .map((key) => apiCandidates[key as keyof typeof apiCandidates])
      .find((candidate) => candidate?.rating != null) ??
    apiCandidates.API;

  const apiRatingValue = selectedApi?.rating ?? apiRating;
  const apiVotesValue =
    selectedApi?.votes ??
    (selectedApi?.label === "API" ? apiVotesFromItem : null);

  const formatVotes = (value: number | null) => {
    if (value == null) return "";
    return new Intl.NumberFormat("es-ES").format(value);
  };

  const apiRatingLabel = apiRatingValue != null ? apiRatingValue.toFixed(1) : "—";
  const apiVotesLabel = apiVotesValue != null ? formatVotes(apiVotesValue) : "";
  const apiRatingText = `${selectedApi.label} ${apiRatingLabel}${
    apiVotesLabel ? ` · ${apiVotesLabel} votos` : ""
  }`;

  const year =
    item?.anio_lanzamiento ??
    item?.anioLanzamiento ??
    item?.anio ??
    extractYear(tmdbContent?.release_date) ??
    extractYear(rawgContent?.release_date) ??
    extractYear(googleBooksContent?.published_date) ??
    null;
  const genresText = formatList(
    item?.generos ??
      item?.genero ??
      tmdbContent?.genres ??
      rawgContent?.genres ??
      googleBooksContent?.categories
  );
  const plataformasText = formatList(item?.plataformas ?? item?.plataforma);
  const consolasText = formatList(
    item?.consolas ?? rawgContent?.platforms
  );
  const duracionMin =
    item?.duracion_min ?? item?.duracionMin ?? tmdbContent?.runtime_min;

  const cast = Array.isArray(tmdbContent?.cast) ? tmdbContent?.cast
    : [];
  const watchProviders =
    item?.watchProviders ?? item?.metadataApi?.tmdb?.watch_providers ?? null;

  const rawgDevelopersLabel = Array.isArray(rawgContent?.developers)
    ? rawgContent?.developers.join(", ")
    : "";
  const googleBooksAuthorsLabel = Array.isArray(googleBooksContent?.authors)
    ? googleBooksContent?.authors.join(", ")
    : "";

  const authorLabel = pickString(
    item?.autor,
    item?.author,
    item?.creator,
    googleBooksAuthorsLabel
  );
  const editorialLabel = pickString(
    item?.editorial,
    item?.publisher,
    googleBooksContent?.publisher
  );
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

  const ourRatingLabel = ourRating != null ? ourRating.toFixed(1) : "—";
  const yearLabel = year != null ? String(year) : "";
  const durationLabel =
    duracionMin != null
      ? `${duracionMin} min`
      : item?.duracion != null
        ? `${item.duracion} h`
        : "";
  const pagesLabel =
    item?.paginas != null
      ? String(item.paginas)
      : item?.pages != null
        ? String(item.pages)
        : googleBooksContent?.page_count != null
          ? String(googleBooksContent.page_count)
          : "";
  const authorValue = authorLabel || "";
  const editorialValue = editorialLabel || "";
  const isbnValue = isbnLabel || "";
  const formatValue = formatLabel || "";
  const languageValue = languageLabel || "";
  const sagaValue = sagaLabel || "";

  const meta: Array<{ label: string; value: string }> = [];
  const addMeta = (label: string, value?: string | number | null) => {
    if (value == null) return;
    const text = String(value).trim();
    if (!text || text === "null") return;
    meta.push({ label, value: text });
  };

  addMeta("Año de salida", yearLabel);
  if (type === "libro") {
    addMeta("Páginas", pagesLabel);
    addMeta("Autor", authorValue);
    addMeta("Editorial", editorialValue);
    addMeta("ISBN", isbnValue);
    addMeta("Formato", formatValue);
    addMeta("Idioma", languageValue);
    addMeta("Saga/Colección", sagaValue);
  } else {
    addMeta("Duración", durationLabel);
  }
  addMeta("Géneros", genresText);
  addMeta("Director", item?.director);
  addMeta("Estudio", item?.estudio);
  if (type !== "libro") {
    addMeta("Autor", item?.autor);
    addMeta("Editorial", item?.editorial);
    addMeta("Páginas", item?.paginas != null ? String(item.paginas) : "");
  }
  if (item?.precio != null) {
    addMeta("Precio", `${Number(item.precio).toFixed(2)} €`);
  }
  const developerLabel = pickString(item?.desarrollador, rawgDevelopersLabel);
  addMeta("Desarrollador", developerLabel);
  addMeta("Consolas", consolasText);

  const typeLabel = type ? TYPE_LABELS[type] ?? "Detalle" : "Detalle";
  const addLabel = inWatchlist
    ? "En tu lista por ver"
    : "+ Añadir a la lista por ver";
  const markLabel = inWatchedList ? "Marcada como vista" : "Marcar como vista";

  const handleAddToWatchlist = () => {
    if (!isLoggedIn) {
      setWatchlistMessage("Inicia sesión para guardar en tu lista.");
      return;
    }
    if (!type || !normalizedId || !item) return;
    if (type !== "pelicula") {
      setWatchlistMessage("Solo disponible para películas por ahora.");
      return;
    }
    const result = addToWatchlist(
      {
        id: normalizedId,
        type,
        title,
        image: image || undefined,
      },
      currentUser
    );
    setInWatchlist(true);
    setWatchlistMessage(
      result.added ? "Añadido a tu lista por ver." : "Ya estaba en tu lista."
    );
  };

  const handleMarkAsWatched = () => {
    if (!isLoggedIn) {
      setWatchedMessage("Inicia sesión para guardar en tu lista.");
      return;
    }
    if (!type || !normalizedId || !item) return;
    if (type !== "pelicula") {
      setWatchedMessage("Solo disponible para películas por ahora.");
      return;
    }
    const result = addToWatchedList(
      {
        id: normalizedId,
        type,
        title,
        image: image || undefined,
      },
      currentUser
    );
    setInWatchedList(true);
    setWatchedMessage(
      result.added ? "Añadida a películas vistas." : "Ya estaba en vistas."
    );
  };

  return (
    <>
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
                typeLabel={typeLabel}
                title={title}
                description={description}
                image={image}
                canShowVideo={canShowVideo}
                videoUrl={normalizedVideoUrl}
                isYouTube={isYouTube}
                apiRatingText={apiRatingText}
                ourRatingLabel={ourRatingLabel}
                hasOurRating={hasOurRating}
                ourRating={ourRating}
                meta={meta}
                addLabel={addLabel}
                addDisabled={!item || !type || inWatchlist}
                onAddToWatchlist={handleAddToWatchlist}
                addMessage={watchlistMessage}
                markLabel={markLabel}
                markDisabled={!item || !type || inWatchedList}
                onMarkWatched={handleMarkAsWatched}
                markMessage={watchedMessage}
              />

              {(watchProviders?.flatrate?.length ||
                watchProviders?.rent?.length ||
                watchProviders?.buy?.length ||
                watchProviders?.ads?.length ||
                watchProviders?.free?.length ||
                plataformasText) && (
                <section className="rounded-2xl border border-gray-200 bg-white p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-700">
                    Dónde ver
                  </h2>
                  <div className="mt-4 grid gap-6 md:grid-cols-3">
                    {[
                      { key: "flatrate", label: "Suscripción" },
                      { key: "rent", label: "Alquiler" },
                      { key: "buy", label: "Compra" },
                      { key: "free", label: "Gratis" },
                      { key: "ads", label: "Con anuncios" },
                    ].map((group) => {
                      const items = watchProviders?.[group.key] ?? [];
                      if (!items.length) return null;
                      return (
                        <div key={group.key} className="space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {group.label}
                          </p>
                          <div className="flex flex-wrap gap-3">
                            {items.map((provider: any) => {
                              const logo = provider?.logo_path
                                ? `${TMDB_IMG_BASE}w45${provider.logo_path}`
                                : "";
                              return (
                                <div
                                  key={`${group.key}-${provider?.id ?? provider?.name}`}
                                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1"
                                >
                                  {logo ? (
                                    <img
                                      src={logo}
                                      alt={provider?.name ?? "Proveedor"}
                                      className="h-5 w-5 rounded-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : null}
                                  <span className="text-xs text-gray-700">
                                    {provider?.name ?? "Proveedor"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {!watchProviders?.flatrate?.length &&
                    !watchProviders?.rent?.length &&
                    !watchProviders?.buy?.length &&
                    !watchProviders?.ads?.length &&
                    !watchProviders?.free?.length &&
                    plataformasText && (
                      <p className="mt-4 text-sm text-gray-600">
                        {plataformasText}
                      </p>
                    )}
                  {watchProviders?.link ? (
                    <a
                      href={watchProviders.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex text-sm font-medium text-indigo-600 hover:underline"
                    >
                      Ver en TMDB
                    </a>
                  ) : null}
                </section>
              )}

              {cast.length > 0 && (
                <section className="rounded-2xl border border-gray-200 bg-white p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-700">
                    Reparto principal
                  </h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {cast.slice(0, 12).map((member: any) => {
                      const avatar = member?.profile_path
                        ? `${TMDB_IMG_BASE}w185${member.profile_path}`
                        : "";
                      return (
                        <div
                          key={member?.id ?? member?.name}
                          className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2"
                        >
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={member?.name ?? "Actor"}
                              className="h-12 w-12 rounded-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                              {(member?.name ?? "A").slice(0, 1)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {member?.name ?? "Actor"}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {member?.character ?? "—"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

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
