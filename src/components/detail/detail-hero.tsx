import { useEffect, useRef, useState } from "react";
import { Star, X } from "lucide-react";

type DetailHeroProps = {
  typeLabel: string;
  title: string;
  description: string;
  image: string;
  canShowVideo: boolean;
  videoUrl: string;
  isYouTube: boolean;
  apiRatingText: string;
  ourRatingLabel: string;
  hasOurRating: boolean;
  ourRating: number | null;
  meta: Array<{ label: string; value: string }>;
  statusOptions: Array<{ value: string; label: string; activeLabel?: string }>;
  currentStatus?: string | null;
  statusUpdating?: boolean;
  onSetStatus?: (value: string) => void;
  statusMessage?: string | null;
  userRating?: number | null;
  ratingUpdating?: boolean;
  onSetRating?: (value: number) => void;
  onClearRating?: () => void;
  ratingMessage?: string | null;
};

export function DetailHero({
  typeLabel,
  title,
  description,
  image,
  canShowVideo,
  videoUrl,
  isYouTube,
  apiRatingText,
  ourRatingLabel,
  meta,
  statusOptions,
  currentStatus,
  statusUpdating,
  onSetStatus,
  statusMessage,
  userRating,
  ratingUpdating,
  onSetRating,
  onClearRating,
  ratingMessage,
}: DetailHeroProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [pendingRating, setPendingRating] = useState(0);
  const videoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showVideo) return;
    videoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showVideo]);

  const openRatingModal = () => {
    setPendingRating(userRating ?? 0);
    setShowRatingModal(true);
  };

  const handleSubmitRating = () => {
    if (!pendingRating) return;
    onSetRating?.(pendingRating);
    setShowRatingModal(false);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-neutral-900 text-white shadow-sm">
      {image ? (
        <img
          src={image}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover opacity-40 pointer-events-none"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-900 to-black pointer-events-none" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent pointer-events-none" />

      <div className="relative z-10 grid gap-8 p-6 sm:p-8 lg:grid-cols-[220px_minmax(0,1fr)_240px]">
        <div className="space-y-4">
          {image ? (
            <img
              src={image}
              alt={title}
              className="w-full rounded-2xl object-cover aspect-[2/3] shadow-lg"
            />
          ) : (
            <div className="aspect-[2/3] w-full rounded-2xl bg-black/50 flex items-center justify-center text-sm text-gray-300">
              Sin portada
            </div>
          )}

          {canShowVideo ? (
            <button
              type="button"
              onClick={() => setShowVideo(true)}
              className="flex items-center justify-center gap-2 rounded-full border border-yellow-400/80 px-4 py-2 text-sm font-semibold text-yellow-300 hover:bg-yellow-400/10"
            >
              ▶ Reproducir tráiler
            </button>
          ) : null}
        </div>

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-400">
            {typeLabel}
          </p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
            {title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-yellow-200">
            <span className="rounded-full border border-yellow-400/40 px-3 py-1">
              ⭐ {apiRatingText}
            </span>
            <span className="rounded-full border border-yellow-400/40 px-3 py-1">
              ⭐ Opinify {ourRatingLabel}
            </span>
            {userRating != null ? (
              <span className="rounded-full border border-blue-300/40 px-3 py-1 text-blue-200">
                ⭐ Tu puntuación {userRating}/10
              </span>
            ) : null}
          </div>

          <p className="max-w-2xl text-sm leading-relaxed text-gray-200">
            {description?.trim() ? description : "Sin descripción disponible."}
          </p>

          {meta.length > 0 ? (
            <div className="pt-4 border-t border-white/10">
              <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-yellow-300">
                Ficha técnica
              </h2>
              <dl className="mt-3 grid grid-cols-1 gap-3 text-sm text-gray-200 sm:grid-cols-2">
                {meta.map((entry) => (
                  <div
                    key={`${entry.label}-${entry.value}`}
                    className="rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                  >
                    <dt className="text-[11px] uppercase tracking-wider text-gray-400">
                      {entry.label}
                    </dt>
                    <dd className="mt-1 text-sm text-white">{entry.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {statusOptions.map((option) => {
              const isActive = option.value === currentStatus;
              const tone =
                option.value === "watchlist"
                  ? "border-yellow-400/70 text-yellow-200"
                  : option.value === "in_progress"
                    ? "border-sky-400/70 text-sky-200"
                    : option.value === "completed"
                      ? "border-emerald-400/70 text-emerald-200"
                      : "border-rose-400/70 text-rose-200";
              const activeBg =
                option.value === "watchlist"
                  ? "bg-yellow-400/20"
                  : option.value === "in_progress"
                    ? "bg-sky-400/20"
                    : option.value === "completed"
                      ? "bg-emerald-400/20"
                      : "bg-rose-400/20";
              const hoverBg =
                option.value === "watchlist"
                  ? "hover:bg-yellow-400/10"
                  : option.value === "in_progress"
                    ? "hover:bg-sky-400/10"
                    : option.value === "completed"
                      ? "hover:bg-emerald-400/10"
                      : "hover:bg-rose-400/10";
              const buttonLabel =
                isActive && option.activeLabel ? option.activeLabel : option.label;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSetStatus?.(option.value)}
                  disabled={statusUpdating}
                  className={[
                    "w-full rounded-xl border px-3 py-3 text-xs font-semibold uppercase tracking-wider transition",
                    tone,
                    isActive ? activeBg : hoverBg,
                    statusUpdating ? "cursor-not-allowed opacity-60" : "",
                  ].join(" ")}
                >
                  {buttonLabel}
                </button>
              );
            })}
          </div>
          {statusMessage ? (
            <p className="text-xs text-white/80">{statusMessage}</p>
          ) : null}

          <div className="pt-2 border-t border-white/10">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-yellow-300">
              Tu valoración
            </p>
            <button
              type="button"
              onClick={openRatingModal}
              className="mt-3 w-full rounded-xl border border-yellow-400/60 px-4 py-3 text-sm font-semibold text-yellow-200 transition hover:bg-yellow-400/10"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Star className="h-5 w-5" />
                {userRating ? `Tu puntuación: ${userRating}/10` : "Puntuar"}
              </span>
            </button>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-yellow-200/80">
                {userRating ? "Gracias por tu valoración." : "Sin valorar"}
              </span>
              {userRating != null ? (
                <button
                  type="button"
                  onClick={onClearRating}
                  disabled={ratingUpdating}
                  className="text-xs font-semibold text-white/70 transition hover:text-white"
                >
                  Quitar
                </button>
              ) : null}
            </div>
            {ratingMessage ? (
              <p className="mt-2 text-xs text-white/80">{ratingMessage}</p>
            ) : null}
          </div>
        </div>
      </div>

      {canShowVideo && showVideo ? (
        <div
          ref={videoRef}
          id="detail-video"
          className="relative z-10 mt-8 w-full rounded-2xl border border-white/10 bg-black/80 p-5 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-300">
              Tráiler
            </h2>
            <button
              type="button"
              onClick={() => setShowVideo(false)}
              className="rounded-full border border-yellow-400/60 bg-yellow-400/15 px-3 py-1 text-sm font-semibold text-yellow-200 transition hover:bg-yellow-400/30"
              aria-label="Cerrar tráiler"
            >
              ✕
            </button>
          </div>
          <div className="mt-4">
            {videoUrl ? (
              <div className="aspect-video w-full overflow-hidden rounded-xl bg-black/40">
                {isYouTube ? (
                  <iframe
                    src={videoUrl}
                    title={`Video de ${title}`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={videoUrl}
                    controls
                    className="h-full w-full object-cover"
                  >
                    Tu navegador no soporta video.
                  </video>
                )}
              </div>
            ) : (
              <div className="aspect-video w-full rounded-xl bg-black/40 flex items-center justify-center text-gray-300">
                null
              </div>
            )}
          </div>
        </div>
      ) : null}

      // Modal de puntuacion tipo IMDb
      {showRatingModal ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowRatingModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6 text-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowRatingModal(false)}
              className="absolute right-4 top-4 rounded-full border border-white/20 p-1 text-white/70 transition hover:text-white"
              aria-label="Cerrar valoración"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-200">
                <Star className="h-6 w-6" fill="currentColor" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-300">
                  Puntúame
                </p>
                <h3 className="text-xl font-semibold text-white">{title}</h3>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: 10 }, (_, index) => {
                const value = index + 1;
                const isActive = pendingRating >= value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPendingRating(value)}
                    disabled={ratingUpdating}
                    className="rounded-full p-1 transition"
                    aria-label={`Puntuación ${value}`}
                  >
                    <Star
                      className={isActive ? "h-6 w-6 text-yellow-300" : "h-6 w-6 text-white/30"}
                      fill={isActive ? "currentColor" : "none"}
                    />
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleSubmitRating}
              disabled={!pendingRating || ratingUpdating}
              className={[
                "mt-6 w-full rounded-full px-4 py-2 text-sm font-semibold transition",
                !pendingRating || ratingUpdating
                  ? "cursor-not-allowed bg-white/10 text-white/50"
                  : "bg-white/10 text-white hover:bg-white/20",
              ].join(" ")}
            >
              Puntuar
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
