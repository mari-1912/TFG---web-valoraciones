type DetailHeroProps = {
  type?: string;
  typeLabel: string;
  title: string;
  description: string;
  image: string;
  canShowVideo: boolean;
  videoUrl: string;
  isYouTube: boolean;
  apiRatingLabel: string;
  ourRatingLabel: string;
  yearLabel: string;
  durationLabel: string;
  pagesLabel: string;
  genresText: string;
  hasOurRating: boolean;
  ourRating: number | null;
  plataformasLabel: string;
  bookMeta: {
    author: string;
    editorial: string;
    isbn: string;
    format: string;
    language: string;
    saga: string;
  };
  meta: Array<{ label: string; value: string }>;
};

export function DetailHero({
  type,
  typeLabel,
  title,
  description,
  image,
  canShowVideo,
  videoUrl,
  isYouTube,
  apiRatingLabel,
  ourRatingLabel,
  yearLabel,
  durationLabel,
  pagesLabel,
  genresText,
  hasOurRating,
  ourRating,
  plataformasLabel,
  bookMeta,
  meta,
}: DetailHeroProps) {
  const isBook = type === "libro";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-neutral-900 text-white shadow-sm">
      {image ? (
        <img
          src={image}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-900 to-black" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent" />

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
            <a
              href="#detail-video"
              className="flex items-center justify-center gap-2 rounded-full border border-yellow-400/80 px-4 py-2 text-sm font-semibold text-yellow-300 hover:bg-yellow-400/10"
            >
              ▶ Reproducir tráiler
            </a>
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
              API {apiRatingLabel}
            </span>
            <span className="rounded-full border border-yellow-400/40 px-3 py-1">
              Opinify {ourRatingLabel}
            </span>
            <span className="rounded-full border border-white/20 px-3 py-1 text-gray-200">
              Año {yearLabel}
            </span>
            <span className="rounded-full border border-white/20 px-3 py-1 text-gray-200">
              {isBook ? `Páginas ${pagesLabel}` : `Duración ${durationLabel}`}
            </span>
          </div>

          {hasOurRating ? (
            <div className="text-yellow-300 text-lg font-semibold">
              {"⭐".repeat(
                Math.max(0, Math.min(5, Math.round(ourRating ?? 0)))
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-300">⭐ null</div>
          )}

          {genresText ? (
            <p className="text-xs uppercase tracking-widest text-gray-300">
              {genresText}
            </p>
          ) : null}

          <p className="max-w-2xl text-sm leading-relaxed text-gray-200">
            {description?.trim() ? description : "Sin descripción disponible."}
          </p>

          {isBook ? (
            <div className="space-y-1 text-sm text-gray-200">
              <p>
                <span className="font-semibold text-white">Autor:</span>{" "}
                {bookMeta.author}
              </p>
              <p>
                <span className="font-semibold text-white">Editorial:</span>{" "}
                {bookMeta.editorial}
              </p>
              <p>
                <span className="font-semibold text-white">ISBN:</span>{" "}
                {bookMeta.isbn}
              </p>
              <p>
                <span className="font-semibold text-white">Formato:</span>{" "}
                {bookMeta.format}
              </p>
              <p>
                <span className="font-semibold text-white">Idioma:</span>{" "}
                {bookMeta.language}
              </p>
              <p>
                <span className="font-semibold text-white">
                  Saga/Colección:
                </span>{" "}
                {bookMeta.saga}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-200">
              <span className="font-semibold text-white">Plataformas:</span>{" "}
              {plataformasLabel}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-xl bg-black/70 p-4 text-center">
            <p className="text-2xl font-semibold">{apiRatingLabel}</p>
            <p className="text-xs uppercase tracking-widest text-gray-300">
              Valoración API
            </p>
          </div>

          <div className="rounded-xl bg-black/70 p-4 text-center">
            <p className="text-2xl font-semibold">{ourRatingLabel}</p>
            <p className="text-xs uppercase tracking-widest text-gray-300">
              Valoración Opinify
            </p>
          </div>

          <button className="w-full rounded-xl border border-yellow-400/70 px-4 py-3 text-sm font-semibold text-yellow-300 hover:bg-yellow-400/10">
            + Añadir a la lista por ver
          </button>
          <div className="rounded-xl bg-black/70 p-3 text-xs text-gray-200">
            <p>Año de salida: {yearLabel}</p>
            <p>{isBook ? `Páginas: ${pagesLabel}` : `Duración: ${durationLabel}`}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {canShowVideo ? (
          <div
            id="detail-video"
            className="rounded-2xl border border-white/10 bg-black/60 p-5"
          >
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-300">
              Video
            </h2>
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

        <div className="rounded-2xl border border-white/10 bg-black/60 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-300">
            Ficha técnica
          </h2>
          {meta.length > 0 ? (
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm text-gray-200">
              {meta.map((entry) => (
                <div key={`${entry.label}-${entry.value}`}>
                  <dt className="font-medium text-white">{entry.label}</dt>
                  <dd className="text-gray-300">{entry.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </section>
  );
}
