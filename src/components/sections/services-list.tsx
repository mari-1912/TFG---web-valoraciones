import SectionBooks from "../products/books-section";
import SectionVideoGames from "../products/video-games-section";
import SectionMovies from "../products/movies-section";
import SectionSeries from "../products/series-section";
import SectionBoardGames from "../products/board-games-section";
import SectionMusic from "../products/music-section";
import { CircleStar, Search, Users } from "lucide-react";

export function ServicesList() {
  return (
    <section className="flex flex-col justify-center">
      <div className="flex flex-col md:flex-row items-center justify-center text-center gap-8 mt-12">
        <div className="flex flex-col items-center max-w-xs">
          <CircleStar className="text-indigo-500 mb-3" size={32} />
          <h3 className="text-xl font-semibold text-gray-800">
            Lleva un registro de lo que te gusta
          </h3>
          <p className="text-gray-600 mt-2 text-sm">
            Crea tu propia lista personalizada de películas, libros y juegos
            favoritos.
          </p>
        </div>

        <div className="flex flex-col items-center max-w-xs">
          <Search className="text-purple-500 mb-3" size={32} />
          <h3 className="text-xl font-semibold text-gray-800">
            Guarda y reseña tus experiencias
          </h3>
          <p className="text-gray-600 mt-2 text-sm">
            Añade reseñas y valoraciones para recordar lo que más disfrutaste.
          </p>
        </div>

        <div className="flex flex-col items-center max-w-xs">
          <Users className="text-pink-500 mb-3" size={32} />
          <h3 className="text-xl font-semibold text-gray-800">
            ¡Dile a tus amigos cuáles valen la pena!
          </h3>
          <p className="text-gray-600 mt-2 text-sm">
            Comparte tus opiniones y descubre nuevas recomendaciones de la
            comunidad.
          </p>
        </div>
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
