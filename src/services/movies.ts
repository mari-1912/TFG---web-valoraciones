import type { ServiceList } from "./services-list";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeMovie(movie: any): ServiceList {
  return {
    id: movie.id ?? movie._id,
    category: "peliculas",
    title: movie.titulo ?? movie.title ?? movie.nombre,
    genre: movie.generos ?? movie.genero ?? "",
    year:
      movie.anio_lanzamiento ??
      movie.anioLanzamiento ??
      movie.year ??
      0,
    image:
      movie.portada ??
      movie.poster ??
      movie.image ??
      "",
    description:
      movie.descripcion ??
      movie.description ??
      movie.sinopsis ??
      "",
    creator: movie.director,
    duration: movie.duracion_min ?? movie.duration,
    rating: movie.avgRating,
  };
}


