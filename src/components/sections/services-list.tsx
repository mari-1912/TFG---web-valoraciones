import SectionBooks from "../products/books-section";
import SectionVideoGames from "../products/video-games-section";
import SectionMovies from "../products/movies-section";
import SectionSeries from "../products/series-section";
import SectionBoardGames from "../products/board-games-section";
import SectionMusic from "../products/music-section";

export function ServicesList() {
  return (
    <section className="flex flex-col justify-center">
      <div className="flex flex-col items-center text-center">
        <h3 className="text-2xl font-semibold mb-6 text-gray-800">
          Lleva un registro de lo que te gusta.
        </h3>
        <h3 className="text-2xl font-semibold mb-6 text-gray-800">
          Guarda y reseña tus experiencias.
        </h3>
        <h3 className="text-2xl font-semibold mb-6 text-gray-800">
          ¡Dile a tus amigos cuáles valen la pena!
        </h3>
      </div>

      <SectionMovies />
      <SectionSeries />
      <SectionBooks />
      <SectionVideoGames />
      <SectionBoardGames />
      <SectionMusic />
    </section>
  );
}
