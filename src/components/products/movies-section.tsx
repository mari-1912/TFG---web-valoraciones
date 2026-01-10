import { useEffect, useState } from "react";
import Card from "../Card";
import { useNavigate } from "react-router-dom";
import { Popcorn } from "lucide-react";
import { fetchMovies } from "../../services/fetchMovies";
import { Button } from "../ui/button";

export default function SectionMovies() {
  const itemsPerPage = 4;
  const [startIndex, setStartIndex] = useState(0);
  const navigate = useNavigate();
  const [movies, setMovies] = useState<any[]>([]);

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const data = await fetchMovies("", 20);
        console.log("PELÍCULAS BACKEND:", data);
        const items = Array.isArray(data) ? data : data?.items;
        setMovies(Array.isArray(items) ? items : []);
      } catch (error) {
        console.error("Error loading movies", error);
        setMovies([]);
      }
    };

    loadMovies();
  }, []);

  const totalItems = movies.length;

  const visibleItems =
    totalItems > 0 ? movies.slice(startIndex, startIndex + itemsPerPage) : [];

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(prev - itemsPerPage, 0));
  };

  const handleNext = () => {
    setStartIndex((prev) =>
      Math.min(prev + itemsPerPage, Math.max(totalItems - itemsPerPage, 0))
    );
  };

  return (
    <section className="my-8 max-w-5xl mx-auto">
      <h3 className="text-3xl font-extrabold mb-6 bg-linear-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
        <Popcorn className="text-purple-500" size={28} />
        Películas
      </h3>

      <div className="relative">
        <Button
          onClick={handlePrev}
          disabled={startIndex === 0}
          aria-label="Anterior"
          className={`absolute left-0 top-1/2 -translate-y-1/2 bg-[hsl(var(--color-primary))] text-white rounded-full p-2 shadow transition ${
            startIndex === 0
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-indigo-700"
          }`}
        >
          &#8592;
        </Button>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 overflow-hidden mx-12">
          {visibleItems.map((m) => (
            <div
              key={m.id}
              onClick={() => navigate(`/peliculas/${m.id}`)}
              className="cursor-pointer hover:scale-105 transform transition"
            >
              <Card
                id={m.id}
                titulo={m.titulo}
                generos={m.generos} // <- back manda string, Card lo soporta
                anio_lanzamiento={m.anioLanzamiento}
                portada={m.portada}
                director={m.director}
                duracion_min={m.duracionMin}
                estudio={m.estudio}
                plataforma={m.plataforma}
              />
            </div>
          ))}
        </div>

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
