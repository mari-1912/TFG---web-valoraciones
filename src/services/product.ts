
export interface Review {
  user: string;
  rating: number;
  comment: string;
  likes: number;
}

export interface Product {
  id: string;
  type: "pelicula" | "libro" | "serie" | "juego" | "musica" | string;
  title: string;
  year: number;
  imgSrc: string;
  description: string;
  creator: string;
  avgRating: number;
  reviews: Review[];
}
