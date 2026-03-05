import { useEffect, useRef, useState } from "react";

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
  addLabel: string;
  addDisabled?: boolean;
  onAddToWatchlist?: () => void;
  addMessage?: string | null;
  markLabel: string;
  markDisabled?: boolean;
  onMarkWatched?: () => void;
  markMessage?: string | null;
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
  addLabel,
  addDisabled,
  onAddToWatchlist,
  addMessage,
  markLabel,
  markDisabled,
  onMarkWatched,
  markMessage,
}: DetailHeroProps) {
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showVideo) return;
    videoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showVideo]);

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

        <div className="space-y-3">
          <button
            type="button"
            onClick={onAddToWatchlist}
            disabled={addDisabled}
            className={[
              "w-full rounded-xl border border-yellow-400/70 px-4 py-3 text-sm font-semibold text-yellow-300",
              addDisabled ? "cursor-not-allowed opacity-60" : "hover:bg-yellow-400/10",
            ].join(" ")}
          >
            {addLabel}
          </button>
          {addMessage ? (
            <p className="text-xs text-yellow-200">{addMessage}</p>
          ) : null}

          <button
            type="button"
            onClick={onMarkWatched}
            disabled={markDisabled}
            className={[
              "w-full rounded-xl border border-emerald-400/70 px-4 py-3 text-sm font-semibold text-emerald-200",
              markDisabled
                ? "cursor-not-allowed opacity-60"
                : "hover:bg-emerald-400/10",
            ].join(" ")}
          >
            {markLabel}
          </button>
          {markMessage ? (
            <p className="text-xs text-emerald-200">{markMessage}</p>
          ) : null}
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
    </section>
  );
}
