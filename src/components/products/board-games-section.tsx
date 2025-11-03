import { useState } from "react";
import Card from "../Card";
import boardGames from "../../data/board-games.json";
import { useNavigate } from "react-router-dom";
import { Dices } from "lucide-react";

export default function SectionBoardGames() {
  const itemsPerPage = 4;
  const [startIndex, setStartIndex] = useState(0);
  const navigate = useNavigate();

  const totalItems = Array.isArray(boardGames) ? boardGames.length : 0;

  // Sacar los items visibles según el índice de inicio y cantidad por página
  const visibleItems =
    Array.isArray(boardGames) && totalItems > 0
      ? boardGames.slice(startIndex, startIndex + itemsPerPage)
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
        <Dices className="text-purple-500" size={28} />
        Juegos de mesa
      </h3>
      <div className="relative">
        <button
          onClick={handlePrev}
          disabled={startIndex === 0}
          aria-label="Anterior"
          className={`absolute left-0 top-1/2 -translate-y-1/2 bg-indigo-600 text-white rounded-full p-2 shadow ${
            startIndex === 0 ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          &#8592;
        </button>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 overflow-hidden mx-12">
          {visibleItems.map((m) => (
            <div
              key={m.id}
              onClick={() => navigate(`/detail/juego-mesa/${m.id}`)}
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

        <button
          onClick={handleNext}
          disabled={startIndex + itemsPerPage >= totalItems}
          aria-label="Siguiente"
          className={`absolute right-0 top-1/2 -translate-y-1/2 bg-indigo-600 text-white rounded-full p-2 shadow ${
            startIndex + itemsPerPage >= totalItems
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
        >
          &#8594;
        </button>
      </div>
    </section>
  );
}
