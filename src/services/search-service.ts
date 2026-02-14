export type ContentSearchItem = {
  id: number;
  portada: string | null;
  puntuacion: number | null;
  puntuacionApi: number | null;
  tipo: string;
  titulo: string;
};

export type ContentSearchResponse = {
  items: ContentSearchItem[];
  pagination?: {
    page: number;
    pageSize: number;
    pages: number;
    total: number;
  };
};

export type UserSearchItem = {
  userId: number;
  username: string;
  avatarPath?: string | null;
  avatarUrl?: string | null;
};

export type UserSearchResponse = {
  results: UserSearchItem[];
};

const API_URL =
  import.meta.env.VITE_API_URL ??
  "https://tfg-web-valoraciones-back-i9b5.onrender.com";

export async function searchContents(
  query: string,
  signal?: AbortSignal
): Promise<ContentSearchResponse> {
  const res = await fetch(
    `${API_URL}/contenidos/search?q=${encodeURIComponent(query)}`,
    {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal,
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error ${res.status} al buscar contenidos. ${text}`);
  }

  return res.json();
}

export async function searchUsers(
  query: string,
  signal?: AbortSignal
): Promise<UserSearchResponse> {
  const res = await fetch(
    `${API_URL}/usuarios/search?q=${encodeURIComponent(query)}`,
    {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal,
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error ${res.status} al buscar usuarios. ${text}`);
  }

  return res.json();
}
