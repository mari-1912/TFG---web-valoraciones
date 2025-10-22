import { useState } from "react";
import Card from "./Card";
import movies from "../data/movies.json";

export default function SectionMovies() {
  const [expanded, setExpanded] = useState(false);
  const initiallyVisibleCount = 4;

  // Aseguramos que movies es un array antes de usar slice
  const visibleItems = Array.isArray(movies)
    ? movies.slice(0, initiallyVisibleCount)
    : [];
  const hiddenItems = Array.isArray(movies)
    ? movies.slice(initiallyVisibleCount)
    : [];

  return (
    <section className="my-8 max-w-5xl mx-auto">
      <h3 className="text-2xl font-semibold mb-6">Películas</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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

      {hiddenItems.length > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-4 text-indigo-600 font-semibold"
          aria-label="Mostrar más películas"
        >
          Mostrar más ▼
        </button>
      )}

      {expanded && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
          {hiddenItems.map((m) => (
            <Card
              key={m.id}
              imgSrc={m.imgSrc}
              title={m.title}
              description={m.description}
              rating={m.rating}
            />
          ))}
          <button
            onClick={() => setExpanded(false)}
            className="col-span-full mt-2 text-indigo-600 font-semibold"
            aria-label="Mostrar menos películas"
          >
            Mostrar menos ▲
          </button>
        </div>
      )}
    </section>
  );
}
