import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import Footer from "../components/sections/footer";
import { DetailComments } from "../components/detail/detail-comments";
import { DetailHero } from "../components/detail/detail-hero";
import { DetailRelated } from "../components/detail/detail-related";
import { Skeleton } from "@/components/ui/skeleton";
import { isSessionValid } from "@/services/auth-service";
import { type ContentStatus } from "../services/content-status";
import {
  extractYear,
  formatList,
  getSessionUsername,
  parseCount,
  parseRating,
  pickString,
  toYouTubeEmbedUrl,
} from "./detail-page.helpers";
import { useDetailStatus } from "@/hooks/detail/use-detail-status";
import { useDetailRating } from "@/hooks/detail/use-detail-rating";
import { useDetailComments } from "@/hooks/detail/use-detail-comments";
import { useDetailContent } from "@/hooks/detail/use-detail-content";
import { useDetailCurrentUser } from "@/hooks/detail/use-detail-current-user";
import {
  isNumericDetailSegment,
  slugifyDetailTitle,
} from "@/lib/detail-route";
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

const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/";

export function DetailPage() {
  const { id: detailSegment, type } = useParams();
  const location = useLocation();
  const locationState = location.state as
    | {
        item?: any;
        focusCommentId?: string | number | null;
        focusCommentText?: string | null;
        focusCommentUser?: string | null;
      }
    | null;
  const stateItem = locationState?.item ?? null;
  const focusCommentIdFromState = locationState?.focusCommentId ?? null;
  const focusCommentTextFromState = locationState?.focusCommentText ?? null;
  const focusCommentUserFromState = locationState?.focusCommentUser ?? null;
  const focusCommentIdFromQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("commentId");
  }, [location.search]);
  const focusCommentTextFromQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("commentText");
  }, [location.search]);
  const focusCommentId = focusCommentIdFromQuery ?? focusCommentIdFromState;
  const focusCommentText = focusCommentTextFromQuery ?? focusCommentTextFromState;

  const normalizedDetailSegment = useMemo(
    () => decodeURIComponent(detailSegment ?? "").trim(),
    [detailSegment]
  );
  const localItem = useMemo(() => {
    if (!type || !normalizedDetailSegment) return null;
    const dataset = LOCAL_DATASETS[type];
    if (!Array.isArray(dataset)) return null;
    const isNumeric = isNumericDetailSegment(normalizedDetailSegment);
    if (isNumeric) {
      return (
        dataset.find((i) => String(i.id) === String(normalizedDetailSegment)) ??
        null
      );
    }
    return (
      dataset.find((i) => {
        const candidateTitle = pickString(i?.title, i?.titulo, i?.nombre);
        return slugifyDetailTitle(candidateTitle) === normalizedDetailSegment;
      }) ?? null
    );
  }, [type, normalizedDetailSegment]);

  const resolvedDetailId = useMemo(() => {
    const fromState =
      stateItem?.id ??
      stateItem?._id ??
      stateItem?.contenidoId ??
      stateItem?.contenido_id;
    if (fromState != null && String(fromState).trim()) return String(fromState);
    const fromLocal =
      localItem?.id ??
      localItem?._id ??
      localItem?.contenidoId ??
      localItem?.contenido_id;
    if (fromLocal != null && String(fromLocal).trim()) {
      return String(fromLocal);
    }
    if (isNumericDetailSegment(normalizedDetailSegment)) {
      return normalizedDetailSegment;
    }
    return "";
  }, [stateItem, localItem, normalizedDetailSegment]);

  const { item, normalizedId, normalizedType } =
    useDetailContent({
      id: resolvedDetailId || undefined,
      type,
      stateItem,
      localItem,
      apiUrl: API_URL,
      typeEndpoints: TYPE_ENDPOINTS,
    });
  const sessionUsername = getSessionUsername();
  const isLoggedIn = isSessionValid();
  const { currentUserId, currentUserAvatarUrl, currentUserIsAdmin } =
    useDetailCurrentUser({
    isLoggedIn,
    refreshKey: normalizedId,
  });

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
  const tmdbTrailerKey = tmdbContent?.trailer?.key ?? item?.trailer?.key;
  const tmdbTrailerProvider =
    tmdbContent?.trailer?.provider ?? item?.trailer?.provider;
  const trailerUrlCandidate = pickString(
    tmdbContent?.trailer?.url,
    item?.trailer?.url
  );
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
    typeof item?.trailer === "string" ? item.trailer : null,
    item?.trailer_url,
    item?.trailerUrl,
    item?.trailer?.url,
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
    item?.puntuacion ??
      item?.valoracionMedia ??
      item?.rating_media ??
      item?.avgRating ??
      item?.rating ??
      (typeof item?.valoracion === "number" ? item.valoracion : null)
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

  const cast = Array.isArray(item?.cast)
    ? item.cast
    : Array.isArray(tmdbContent?.cast)
      ? tmdbContent.cast
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
  const statusLabelsByType: Record<string, Record<ContentStatus, string>> = {
    pelicula: {
      watchlist: "Pendientes",
      in_progress: "Viendo",
      completed: "Visto",
      dropped: "Abandonado",
    },
    serie: {
      watchlist: "Pendientes",
      in_progress: "Viendo",
      completed: "Visto",
      dropped: "Abandonado",
    },
    libro: {
      watchlist: "Pendientes",
      in_progress: "Leyendo",
      completed: "Leído",
      dropped: "Abandonado",
    },
    videojuego: {
      watchlist: "Pendientes",
      in_progress: "Jugando",
      completed: "Jugado",
      dropped: "Abandonado",
    },
    "juego-mesa": {
      watchlist: "Pendientes",
      in_progress: "Jugando",
      completed: "Jugado",
      dropped: "Abandonado",
    },
  };

  const statusActiveLabelsByType: Record<
    string,
    Record<ContentStatus, string>
  > = {
    pelicula: {
      watchlist: "Marcado en Pendientes",
      in_progress: "Marcado como viendo",
      completed: "Marcado como visto",
      dropped: "Marcado como abandonado",
    },
    serie: {
      watchlist: "Marcado en Pendientes",
      in_progress: "Marcado como viendo",
      completed: "Marcado como visto",
      dropped: "Marcado como abandonado",
    },
    libro: {
      watchlist: "Marcado en Pendientes",
      in_progress: "Marcado como leyendo",
      completed: "Marcado como leído",
      dropped: "Marcado como abandonado",
    },
    videojuego: {
      watchlist: "Marcado en Pendientes",
      in_progress: "Marcado como jugando",
      completed: "Marcado como jugado",
      dropped: "Marcado como abandonado",
    },
    "juego-mesa": {
      watchlist: "Marcado en Pendientes",
      in_progress: "Marcado como jugando",
      completed: "Marcado como jugado",
      dropped: "Marcado como abandonado",
    },
  };

  const statusLabels =
    statusLabelsByType[normalizedType] ?? statusLabelsByType.pelicula;
  const statusActiveLabels =
    statusActiveLabelsByType[normalizedType] ??
    statusActiveLabelsByType.pelicula;

  const statusOptions: Array<{
    value: ContentStatus;
    label: string;
    activeLabel: string;
  }> = [
    {
      value: "watchlist",
      label: statusLabels.watchlist,
      activeLabel: statusActiveLabels.watchlist,
    },
    {
      value: "in_progress",
      label: statusLabels.in_progress,
      activeLabel: statusActiveLabels.in_progress,
    },
    {
      value: "completed",
      label: statusLabels.completed,
      activeLabel: statusActiveLabels.completed,
    },
    {
      value: "dropped",
      label: statusLabels.dropped,
      activeLabel: statusActiveLabels.dropped,
    },
  ];
  const {
    currentStatus,
    statusUpdating,
    statusMessage,
    handleSetStatus,
  } = useDetailStatus({
    item,
    isLoggedIn,
    normalizedId,
    normalizedType,
  });
  const isCompletedForRating = currentStatus === "completed";
  const {
    userRating,
    ratingUpdating,
    ratingMessage,
    handleSetRating,
    handleClearRating,
  } = useDetailRating({
    item,
    isLoggedIn,
    canRate: isCompletedForRating,
    normalizedId,
  });
  const {
    comments,
    commentsError,
    commentSubmitting,
    editingCommentId,
    reactingCommentId,
    deletingCommentId,
    commentMessage,
    handleCreateComment,
    handleLikeComment,
    handleDislikeComment,
    handleEditComment,
    handleDeleteComment,
  } = useDetailComments({
    normalizedId,
    isLoggedIn,
    canDeleteAnyComment: currentUserIsAdmin,
    sessionUsername,
    currentUserId,
    currentUserAvatarUrl,
    apiUrl: API_URL,
  });

  return (
    <>
      <main className="min-h-screen bg-gray-50 pb-12">
        <div className="mx-auto w-full max-w-none">
          {!item ? (
            <div className="space-y-6 px-6">
              <section className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="grid gap-6 md:grid-cols-[220px_1fr]">
                  <Skeleton className="h-[300px] w-full rounded-2xl" />
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-2/3" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[92%]" />
                    <Skeleton className="h-10 w-44 rounded-xl" />
                  </div>
                </div>
              </section>
              <section className="rounded-2xl border border-gray-200 bg-white p-6">
                <Skeleton className="h-6 w-40" />
                <div className="mt-4 space-y-3">
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-10">
              <DetailHero
                contentListKey={`${normalizedType}:${normalizedId}`}
                contentId={normalizedId}
                listContentType={normalizedType}
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
                statusOptions={statusOptions}
                currentStatus={currentStatus}
                statusUpdating={statusUpdating}
                onSetStatus={handleSetStatus}
                statusMessage={statusMessage}
                userRating={userRating}
                ratingUpdating={ratingUpdating}
                onSetRating={handleSetRating}
                onClearRating={handleClearRating}
                ratingMessage={ratingMessage}
                ratingEnabled={isCompletedForRating}
              />

              <div className="space-y-10 px-6">
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
                  <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
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

              <DetailComments
                comments={comments}
                focusCommentId={focusCommentId}
                focusCommentText={focusCommentText}
                focusCommentUser={focusCommentUserFromState}
                onCreateComment={handleCreateComment}
                onLikeComment={handleLikeComment}
                onDislikeComment={handleDislikeComment}
                onEditComment={handleEditComment}
                onDeleteComment={handleDeleteComment}
                canDeleteAnyComment={currentUserIsAdmin}
                creatingComment={commentSubmitting}
                editingCommentId={editingCommentId}
                reactingCommentId={reactingCommentId}
                deletingCommentId={deletingCommentId}
                createCommentMessage={commentMessage}
                listErrorMessage={commentsError}
              />

              <DetailRelated
                type={type}
                currentId={normalizedId}
                genres={genresText}
                year={year}
              />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
