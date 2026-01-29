import type { ServiceList, ServiceCategory } from "./services-list";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeGame(game: any): ServiceList {
  return {
    id: game.id ?? game._id,
    category: "videojuegos" as ServiceCategory,
    title: game.titulo ?? game.name ?? game.nombre,
    genre: Array.isArray(game.generos)
      ? game.generos.join(", ")
      : game.generos ?? "",
    year: game.anio_lanzamiento ?? game.anioLanzamiento ?? game.year ?? 0,
    image: game.portada ?? game.cover ?? game.image ?? "",
    description: game.descripcion ?? game.description ?? "",
    creator: game.desarrollador ?? game.studio ?? undefined,
    duration: game.duracion ?? undefined,
    rating: game.avgRating ?? undefined,
  };
}


