import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../Card";
import books from "../../data/books.json";

export default function SectionBooks() {
  const itemsPerPage = 4;
  const [startIndex, setStartIndex] = useState(0);
  const navigate = useNavigate();

  const totalItems = Array.isArray(books) ? books.length : 0;

  // Slice para mostrar solo items visibles según índice actual
  const visibleItems =
    Array.isArray(books) && totalItems > 0
      ? books.slice(startIndex, startIndex + itemsPerPage)
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
      <h3 className="text-2xl font-semibold mb-6">Libros</h3>

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
          {visibleItems.map((book) => (
            <div
              key={book.id}
              className="cursor-pointer hover:scale-105 transition-transform"
              onClick={() => navigate(`/detail/libro/${book.id}`)}
            >
              <Card
                imgSrc={book.imgSrc}
                title={book.title}
                description={book.description}
                rating={book.rating}
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
