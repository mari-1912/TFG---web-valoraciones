export type ServiceCategory =
  | "peliculas"
  | "series"
  | "libros"
  | "videojuegos";


export interface ServiceList {
  id: string;
  category: ServiceCategory;
  title: string;
  genre: string;
  year: number;
  image: string;
  description: string;
  creator?: string;
  duration?: number;
  rating?: number;
}


