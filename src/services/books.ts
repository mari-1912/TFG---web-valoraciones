import type { ServiceList, ServiceCategory } from "./services-list";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeBook(book: any): ServiceList {
  return {
    id: book.id ?? book._id,
    category: "libros" as ServiceCategory,
    title: book.titulo ?? book.title ?? book.nombre,
    genre: Array.isArray(book.generos)
      ? book.generos.join(", ")
      : book.generos ?? "",
    year: book.anio_lanzamiento ?? book.anioLanzamiento ?? book.year ?? 0,
    image: book.portada ?? book.cover ?? book.image ?? "",
    description: book.descripcion ?? book.description ?? "",
    creator: book.autor ?? book.author ?? undefined,
    duration: book.paginas ?? undefined, // opcional: usar páginas como "duración"
    rating: book.avgRating ?? undefined,
  };
}


