export type FeaturedItem = {
    id: number;
    titulo: string;
    portada: string;
    sinopsis: string;
    tipo: "pelicula" | "serie" | "libro" | "videojuego" | string;
  };
  
  export type FeaturedRandomResponse = {
    pelicula: FeaturedItem;
    serie: FeaturedItem;
    libro: FeaturedItem;
    videojuego: FeaturedItem;
  };
  
  const API_URL = import.meta.env.VITE_API_URL ?? "https://tfg-web-valoraciones-back-i9b5.onrender.com";
  
  export async function fetchFeaturedRandom(): Promise<FeaturedRandomResponse> {
    const res = await fetch(`${API_URL}/home/featured-random`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include", // quítalo si NO usas cookies/sesión
    });
  
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Error ${res.status} al cargar destacados. ${text}`);
    }
  
    return res.json();
  }
  