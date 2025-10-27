import { useState } from "react";
import Card from "../Card";
import music from "../../data/music.json";

export default function SectionMusic() {
  const itemsPerPage = 4;
  const [startIndex, setStartIndex] = useState(0);

  const totalItems = Array.isArray(music) ? music.length : 0;

  const visibleItems =
    Array.isArray(music) && totalItems > 0
      ? music.slice(startIndex, startIndex + itemsPerPage)
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
      <h3 className="text-2xl font-semibold mb-6">Discos</h3>

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
            <Card
              key={m.id}
              imgSrc={m.imgSrc}
              title={m.title}
              description={m.description}
              rating={m.rating}
            />
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
