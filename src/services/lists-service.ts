// src/services/lists-service.ts

export type BackendLista = {
  listaId: number;
  userId: number;
  tipo?: string;
  tipoContenidos: "pelicula" | "serie" | "libro" | "videojuego" | string;
  nombre: string;
  descripcion?: string | null;
  visibilidad?: "publica" | "privada" | "solo_seguidores" | string;
};

export type BackendContenidoListado = {
  id: number;
  titulo: string;
  portada?: string | null;
  puntuacion?: number | null;
  puntuacionApi?: number | null;
  tipo?: string | null;
};

export type BackendListaContenidosResponse = {
  lista: BackendLista;
  contenidos: BackendContenidoListado[];
};

const API_URL =
  import.meta.env.VITE_API_URL ??
  "https://tfg-web-valoraciones-back-i9b5.onrender.com";

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "GET",
    credentials: "include", // cookie HttpOnly
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // Lanzamos con status al principio para que el caller lo pueda detectar fácil.
    throw new Error(`${res.status} ${res.statusText} ${text}`.trim());
  }

  return (await res.json()) as T;
}

/**
 * GET /listas/usuario
 * -> { listas: BackendLista[] }
 */
export async function getMyLists(): Promise<BackendLista[]> {
  const data = await apiGet<{ listas?: BackendLista[] }>("/listas/usuario");
  return data?.listas ?? [];
}

/**
 * GET /listas/usuario/{userId}
 * -> { listas: BackendLista[] }
 */
export async function getListsByUser(userId: number): Promise<BackendLista[]> {
  const data = await apiGet<{ listas?: BackendLista[] }>(
    `/listas/usuario/${userId}`
  );
  return data?.listas ?? [];
}

/**
 * GET /listas/{listaId}/contenidos
 * -> { lista, contenidos }
 */
export async function getListContents(
  listaId: number
): Promise<BackendListaContenidosResponse> {
  return apiGet<BackendListaContenidosResponse>(`/listas/${listaId}/contenidos`);
}