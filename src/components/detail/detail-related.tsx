import SectionBooks from "../products/books-section";
import SectionMovies from "../products/movies-section";
import SectionSeries from "../products/series-section";
import SectionVideoGames from "../products/video-games-section";

type DetailRelatedProps = {
  type?: string;
};

function resolveTitle(type?: string) {
  if (type === "libro") return "La gente también ha leído";
  if (type === "videojuego" || type === "juego-mesa") {
    return "La gente también ha jugado";
  }
  return "La gente también ha visto";
}

export function DetailRelated({ type }: DetailRelatedProps) {
  const relatedTitle = resolveTitle(type);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">{relatedTitle}</h2>

      <div className="mt-6">
        {type === "pelicula" ? <SectionMovies compact hideHeading /> : null}
        {type === "serie" ? <SectionSeries compact hideHeading /> : null}
        {type === "libro" ? <SectionBooks compact hideHeading /> : null}
        {type === "videojuego" ? (
          <SectionVideoGames compact hideHeading />
        ) : null}
        {type !== "pelicula" &&
        type !== "serie" &&
        type !== "libro" &&
        type !== "videojuego" ? (
          <p className="text-sm text-gray-500">
            No hay recomendaciones por ahora.
          </p>
        ) : null}
      </div>
    </section>
  );
}
