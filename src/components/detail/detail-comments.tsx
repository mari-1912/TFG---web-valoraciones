type DetailComment = {
  id: string;
  user: string;
  date: string;
  rating: number | null;
  comment: string;
};

type DetailCommentsProps = {
  comments: DetailComment[];
};

export function DetailComments({ comments }: DetailCommentsProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Comentarios de usuarios
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-xs font-semibold uppercase tracking-[0.2em]">
            Ordenar por
          </span>
          <select className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700">
            <option>Más útiles</option>
            <option>Más recientes</option>
            <option>Mejor valoración</option>
            <option>Peor valoración</option>
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {comments.map((comment) => {
          const ratingValue =
            comment.rating != null
              ? Math.max(0, Math.min(5, Math.round(comment.rating)))
              : null;

          return (
            <article
              key={comment.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
                  {(comment.user?.[0] ?? "U").toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {comment.user}
                  </p>
                  <p className="text-xs text-gray-500">{comment.date}</p>
                </div>
                <div className="ml-auto text-xs font-semibold text-yellow-500">
                  {ratingValue != null
                    ? "⭐".repeat(ratingValue)
                    : "Sin rating"}
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-600 line-clamp-4">
                {comment.comment || "Sin comentario."}
              </p>

              <div className="mt-4 h-28 w-full rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs text-gray-400">
                Imagen
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
