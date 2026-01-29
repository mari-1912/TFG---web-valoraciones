import type { ServiceList, ServiceCategory } from "./services-list";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeSerie(serie: any): ServiceList {
  return {
    id: serie.id ?? serie._id,
    category: "series" as ServiceCategory,
    title: serie.titulo ?? serie.title ?? serie.nombre,
    genre: Array.isArray(serie.generos)
      ? serie.generos.join(", ")
      : serie.generos ?? "",
    year: serie.anio_lanzamiento ?? serie.anioLanzamiento ?? serie.year ?? 0,
    image: serie.portada ?? serie.poster ?? serie.image ?? "",
    description: serie.descripcion ?? serie.description ?? "",
    creator: serie.creador ?? serie.director ?? undefined,
    duration: serie.duracion_min ?? serie.duracion ?? undefined,
    rating: serie.avgRating ?? undefined,
  };
}


