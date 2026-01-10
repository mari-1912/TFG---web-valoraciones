type MostViewedItem = {
    id: number;
    titulo: string;
    portada: string;
    sinopsis: string;
    tipo: string;
  };
  
  export type MostViewedWeekResponse = {
    pelicula: MostViewedItem | null;
    serie: MostViewedItem | null;
    libro: MostViewedItem | null;
    videojuego: MostViewedItem | null;
  };
  
  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
  
  export async function fetchMostViewedWeek(): Promise<MostViewedWeekResponse> {
    const res = await fetch(`${API_URL}/home/most-viewed-week`, {
      headers: { "Content-Type": "application/json" },
      // credentials: "include", // solo si usas cookies/sesión
    });
  
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Error ${res.status} al cargar "lo más visto". ${text}`);
    }
  
    return res.json();
  }
  