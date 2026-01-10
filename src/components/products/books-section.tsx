import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../Card";
import { fetchBooks } from "../../services/fetchBooks";
import { BookOpen } from "lucide-react";
import { Button } from "../ui/button";

type Book = {
  id: number | string;
  titulo: string;
  generos: string | string[];
  anio_lanzamiento: number;
  portada?: string;
  paginas?: number;
  autor?: string;
  editorial?: string;
  precio?: number;
};

export default function SectionBooks() {
  const itemsPerPage = 4;
  const [startIndex, setStartIndex] = useState(0);
  const navigate = useNavigate();

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const loadBooks = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchBooks();
        if (!alive) return;

        setBooks(Array.isArray(data) ? data : []);
        setStartIndex(0);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Error loading books");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    loadBooks();
    return () => {
      alive = false;
    };
  }, []);

  const totalItems = books.length;

  const visibleItems =
    totalItems > 0 ? books.slice(startIndex, startIndex + itemsPerPage) : [];

  const handlePrev = () => setStartIndex((prev) => Math.max(prev - itemsPerPage, 0));

  const handleNext = () =>
    setStartIndex((prev) =>
      Math.min(prev + itemsPerPage, Math.max(totalItems - itemsPerPage, 0))
    );

  return (
    <section className="my-8 max-w-5xl mx-auto">
      <h3 className="text-3xl font-extrabold mb-6 bg-linear-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
        <BookOpen className="text-purple-500" size={28} />
        Libros
      </h3>

      {loading && <div className="mx-12 text-white/70">Cargando…</div>}
      {error && <div className="mx-12 text-red-400">Error: {error}</div>}
      {!loading && !error && totalItems === 0 && (
        <div className="mx-12 text-white/70">No hay libros para mostrar.</div>
      )}

      {!loading && !error && totalItems > 0 && (
        <div className="relative">
          {/* Botón anterior */}
          <Button
            onClick={handlePrev}
            disabled={startIndex === 0}
            aria-label="Anterior"
            className={`absolute left-0 top-1/2 -translate-y-1/2 bg-[hsl(var(--color-primary))] text-white rounded-full p-2 shadow transition ${
              startIndex === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-700"
            }`}
          >
            &#8592;
          </Button>

          {/* Carrusel */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 overflow-hidden mx-12">
            {visibleItems.map((book) => (
              <div
                key={book.id}
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => navigate(`/detail/libro/${book.id}`)}
              >
                <Card
                  id={book.id}
                  titulo={book.titulo}
                  generos={book.generos}
                  anio_lanzamiento={book.anio_lanzamiento}
                  portada={book.portada}
                  autor={book.autor}
                  editorial={book.editorial}
                  paginas={book.paginas}
                  precio={book.precio}
                />
              </div>
            ))}
          </div>

          {/* Botón siguiente */}
          <Button
            onClick={handleNext}
            disabled={startIndex + itemsPerPage >= totalItems}
            aria-label="Siguiente"
            className={`absolute right-0 top-1/2 -translate-y-1/2 bg-[hsl(var(--color-primary))] text-white rounded-full p-2 shadow transition ${
              startIndex + itemsPerPage >= totalItems
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-indigo-700"
            }`}
          >
            &#8594;
          </Button>
        </div>
      )}
    </section>
  );
}
