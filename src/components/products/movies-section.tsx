import { useState } from "react";
import Card from "../Card";
import movies from "../../data/movies.json";
import { useNavigate } from "react-router-dom";
import { Popcorn } from "lucide-react";

export default function SectionMovies() {
  const itemsPerPage = 4;
  const [startIndex, setStartIndex] = useState(0);
  const navigate = useNavigate();

  const totalItems = Array.isArray(movies) ? movies.length : 0;

  // Slice para items visibles en el carrusel
  const visibleItems =
    Array.isArray(movies) && totalItems > 0
      ? movies.slice(startIndex, startIndex + itemsPerPage)
      : [];

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(prev - itemsPerPage, 0));
  };

  const handleNext = () => {
    setStartIndex((prev) =>
      Math.min(prev + itemsPerPage, totalItems - itemsPerPage)
    );
  };

  return (
    <section className="my-8 max-w-5xl mx-auto">
      <h3 className="text-3xl font-extrabold mb-6 bg-linear-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
        <Popcorn className="text-purple-500" size={28} />
        Películas
      </h3>

      <div className="relative">
        {/* Botón anterior */}
        <button
          onClick={handlePrev}
          disabled={startIndex === 0}
          aria-label="Anterior"
          className={`absolute left-0 top-1/2 -translate-y-1/2 bg-indigo-600 text-white rounded-full p-2 shadow transition ${
            startIndex === 0
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-indigo-700"
          }`}
        >
          &#8592;
        </button>

        {/* Carrusel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 overflow-hidden mx-12">
          {visibleItems.map((m) => (
            <div
              key={m.id}
              onClick={() => navigate(`/detail/pelicula/${m.id}`)}
              className="cursor-pointer hover:scale-105 transform transition"
            >
              <Card
                imgSrc={m.imgSrc}
                title={m.title}
                description={m.description}
                rating={m.rating}
              />
            </div>
          ))}
        </div>

        {/* Botón siguiente */}
        <button
          onClick={handleNext}
          disabled={startIndex + itemsPerPage >= totalItems}
          aria-label="Siguiente"
          className={`absolute right-0 top-1/2 -translate-y-1/2 bg-indigo-600 text-white rounded-full p-2 shadow transition ${
            startIndex + itemsPerPage >= totalItems
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-indigo-700"
          }`}
        >
          &#8594;
        </button>
      </div>
    </section>
  );
}
