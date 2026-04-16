import { useEffect, useRef, useState } from "react";
import Card from "../Card";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Popcorn } from "lucide-react";
import { fetchMovies } from "../../services/fetchMovies";
import { Button } from "../ui/button";

type SectionMoviesProps = {
  compact?: boolean;
  hideHeading?: boolean;
};

export default function SectionMovies({
  compact = false,
  hideHeading = false,
}: SectionMoviesProps) {
  const itemsPerPage = 4;
  const [startIndex, setStartIndex] = useState(0);
  const navigate = useNavigate();
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const compactScrollerRef = useRef<HTMLDivElement | null>(null);
  const sectionClass = compact ? "my-0 max-w-none" : "my-8 max-w-5xl mx-auto";

  useEffect(() => {
    const loadMovies = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMovies("", 20);
        console.log("PELÍCULAS BACKEND:", data);
        const items = Array.isArray(data)
          ? data
          : data?.items ??
            data?.data ??
            data?.results ??
            data?.peliculas ??
            data?.data?.items ??
            data?.data?.results ??
            data?.data?.peliculas;
        const normalized = Array.isArray(items)
          ? items
              .map((movie: any) => ({
                id: movie?.id ?? movie?._id,
                titulo: movie?.titulo ?? movie?.title ?? movie?.nombre,
                generos:
                  movie?.generos ??
                  movie?.genero ??
                  movie?.genres ??
                  movie?.categoria ??
                  "",
                anio_lanzamiento:
                  movie?.anio_lanzamiento ??
                  movie?.anioLanzamiento ??
                  movie?.year ??
                  movie?.anio ??
                  0,
                portada:
                  movie?.portada ??
                  movie?.poster ??
                  movie?.image ??
                  movie?.imagen ??
                  movie?.cover ??
                  "",
                director: movie?.director ?? movie?.director_name,
                duracion_min:
                  movie?.duracion_min ?? movie?.duracionMin ?? movie?.duration,
                estudio: movie?.estudio ?? movie?.studio,
                plataforma: movie?.plataforma ?? movie?.platform,
                description:
                  movie?.descripcion ??
                  movie?.description ??
                  movie?.sinopsis ??
                  "",
              }))
              .filter((movie) => movie.id != null)
          : [];
        setMovies(normalized);
        setStartIndex(0);
      } catch (error) {
        console.error("Error loading movies", error);
        setMovies([]);
        setError(
          error instanceof Error ? error.message : "Error cargando peliculas."
        );
      } finally {
        setLoading(false);
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

  const handleCompactScroll = (direction: "prev" | "next") => {
    const scroller = compactScrollerRef.current;
    if (!scroller) return;
    const amount = Math.max(180, Math.floor(scroller.clientWidth * 0.8));
    scroller.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  };

  return (
    <section className={sectionClass}>
      {!hideHeading ? (
        <h3 className="text-3xl font-extrabold mb-6 bg-linear-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
          <Popcorn className="text-purple-500" size={28} />
          Películas
        </h3>
      ) : null}

      {loading ? (
        <p className="text-sm text-gray-500">Cargando peliculas...</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!loading && !error && totalItems === 0 ? (
        <p className="text-sm text-gray-500">
          No se han recibido peliculas del backend.
        </p>
      ) : null}

      {compact ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => handleCompactScroll("prev")}
            aria-label="Anterior"
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--color-primary))]/60 text-white shadow ring-1 ring-white/40 transition hover:bg-[hsl(var(--color-primary))]/70 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Anterior</span>
          </button>
          <div
            ref={compactScrollerRef}
            className="-mx-1 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex w-max gap-4 px-1">
              {movies.map((m) => (
                <div
                  key={m.id}
                  onClick={() => navigate(`/detail/pelicula/${m.id}`)}
                  className="w-[170px] shrink-0 cursor-pointer transition hover:scale-[1.02] sm:w-[210px]"
                >
                  <Card
                    id={m.id}
                    titulo={m.titulo}
                    generos={m.generos}
                    anio_lanzamiento={m.anio_lanzamiento ?? 0}
                    portada={m.portada}
                    director={m.director}
                    duracion_min={m.duracion_min}
                    estudio={m.estudio}
                    plataforma={m.plataforma}
                    description={m.description}
                  />
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCompactScroll("next")}
            aria-label="Siguiente"
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--color-primary))]/60 text-white shadow ring-1 ring-white/40 transition hover:bg-[hsl(var(--color-primary))]/70 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Siguiente</span>
          </button>
        </div>
      ) : (
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
                onClick={() => navigate(`/detail/pelicula/${m.id}`)}
                className="cursor-pointer hover:scale-105 transform transition"
              >
                <Card
                  id={m.id}
                  titulo={m.titulo}
                  generos={m.generos} // <- back manda string, Card lo soporta
                  anio_lanzamiento={m.anio_lanzamiento ?? 0}
                  portada={m.portada}
                  director={m.director}
                  duracion_min={m.duracion_min}
                  estudio={m.estudio}
                  plataforma={m.plataforma}
                  description={m.description}
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
      )}
    </section>
  );
}
