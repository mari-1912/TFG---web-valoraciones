// src/services/lists-service.ts
import { handleUnauthorizedResponse } from "@/services/auth-service";

export type BackendLista = {
  listaId: number;
  userId: number;
  tipo?: string;
  tipoContenidos: "pelicula" | "serie" | "libro" | "videojuego" | string;
  nombre: string;
  descripcion?: string | null;
  visibilidad?: "publica" | "privada" | "solo_seguidores" | string;
  imagen?: string | null;
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
  handleUnauthorizedResponse(res.status, path);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // Lanzamos con status al principio para que el caller lo pueda detectar fácil.
    throw new Error(`${res.status} ${res.statusText} ${text}`.trim());
  }

  return (await res.json()) as T;
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const contentType = (res.headers.get("content-type") ?? "").toLowerCase();
  if (contentType.includes("application/json")) {
    const payload = await res.json().catch(() => ({} as Record<string, unknown>));
    const message =
      (typeof payload?.message === "string" && payload.message.trim()) ||
      (typeof payload?.error === "string" && payload.error.trim()) ||
      (typeof payload?.detail === "string" && payload.detail.trim()) ||
      (typeof payload?.descripcion === "string" && payload.descripcion.trim()) ||
      "";
    if (message) return message;
  }

  const text = await res.text().catch(() => "");
  return text.trim() || fallback;
}

async function apiPost<TBody, TResponse>(path: string, body: TBody): Promise<TResponse> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  handleUnauthorizedResponse(res.status, path);

  if (!res.ok) {
    const message = await parseErrorMessage(
      res,
      `Error ${res.status}. No se ha podido completar la acción.`
    );
    throw new Error(message);
  }

  return (await res.json().catch(() => ({}))) as TResponse;
}

async function apiDelete<TBody, TResponse>(
  path: string,
  body?: TBody
): Promise<TResponse> {
  const hasBody = body !== undefined;
  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    credentials: "include",
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(body) : undefined,
  });
  handleUnauthorizedResponse(res.status, path);

  if (!res.ok) {
    const message = await parseErrorMessage(
      res,
      `Error ${res.status}. No se ha podido completar la acción.`
    );
    throw new Error(message);
  }

  return (await res.json().catch(() => ({}))) as TResponse;
}

export type CreateUserListInput = {
  nombre: string;
  tipoContenidos: BackendLista["tipoContenidos"];
  descripcion?: string;
  visibilidad?: NonNullable<BackendLista["visibilidad"]>;
  imagen?: string;
  tipo?: string;
  userId?: number;
};

type CreateUserListResponse = {
  lista?: BackendLista;
} & Partial<BackendLista>;

type AddContentToListResponse = {
  listaContenido?: {
    listaId: number;
    contenidoId: number;
  };
} & Record<string, unknown>;

type RemoveContentFromListResponse = Record<string, unknown>;

/**
 * POST /listas/
 * -> { lista: BackendLista } | BackendLista
 */
export async function createUserList(input: CreateUserListInput): Promise<BackendLista> {
  const listaPayload = {
    listaId: 0,
    userId: input.userId ?? 0,
    tipo: input.tipo ?? "user",
    tipoContenidos: input.tipoContenidos,
    nombre: input.nombre,
    descripcion: input.descripcion ?? "",
    visibilidad: input.visibilidad ?? "publica",
    imagen: input.imagen ?? "",
  };

  // Compatibilidad: algunos backends validan campos en raíz y otros en `lista`.
  const payload = {
    ...listaPayload,
    lista: listaPayload,
  };

  const data = await apiPost<typeof payload, CreateUserListResponse>("/listas/", payload);
  const created = data?.lista ?? (data as BackendLista);
  if (!created || typeof created.listaId !== "number") {
    throw new Error("No se ha podido crear la lista.");
  }
  return created;
}

/**
 * POST /listas/{listaId}/contenidos
 * body: { listaContenido: { listaId, contenidoId } }
 */
export async function addContentToList(
  listaId: number,
  contenidoId: number
): Promise<void> {
  const listaContenido = { listaId, contenidoId };
  // Compatibilidad: soporte para validadores en raíz y anidados.
  const payload = {
    ...listaContenido,
    listaContenido,
  };

  await apiPost<typeof payload, AddContentToListResponse>(
    `/listas/${listaId}/contenidos`,
    payload
  );
}

/**
 * DELETE /listas/{listaId}/contenidos
 * body: { contenidoId }
 */
export async function removeContentFromList(
  listaId: number,
  contenidoId: number
): Promise<void> {
  const path = `/listas/${listaId}/contenidos`;
  const variants: Array<{ path: string; body?: Record<string, unknown> }> = [
    { path, body: { contenidoId } },
    { path, body: { listaId, contenidoId } },
    { path, body: { listaContenido: { listaId, contenidoId } } },
    {
      path,
      body: { contenidoId, listaId, listaContenido: { listaId, contenidoId } },
    },
    { path: `${path}?contenidoId=${contenidoId}` },
    { path: `${path}?contenidoId=${contenidoId}`, body: { contenidoId } },
  ];

  let lastError: unknown = null;
  for (const variant of variants) {
    try {
      await apiDelete<Record<string, unknown>, RemoveContentFromListResponse>(
        variant.path,
        variant.body
      );
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("No se pudo quitar el contenido de la lista.");
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

// ─────────────────────────────────────────────────────────────────────────────
// Funciones añadidas: gestión completa de listas
// ─────────────────────────────────────────────────────────────────────────────

async function apiPatch<TBody, TResponse>(path: string, body: TBody): Promise<TResponse> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  handleUnauthorizedResponse(res.status, path);
  if (!res.ok) {
    const message = await parseErrorMessage(res, `Error ${res.status}. No se ha podido completar la acción.`);
    throw new Error(message);
  }
  return (await res.json().catch(() => ({}))) as TResponse;
}

/** PATCH /listas/{listaId} */
export async function updateUserList(
  listaId: number,
  payload: Partial<Pick<BackendLista, "nombre" | "descripcion" | "visibilidad">>
): Promise<BackendLista> {
  const data = await apiPatch<typeof payload, { lista?: BackendLista }>(`/listas/${listaId}`, payload);
  return data?.lista ?? (data as BackendLista);
}

/** DELETE /listas/{listaId} */
export async function deleteUserList(listaId: number): Promise<void> {
  const res = await fetch(`${API_URL}/listas/${listaId}`, {
    method: "DELETE",
    credentials: "include",
  });
  handleUnauthorizedResponse(res.status, `/listas/${listaId}`);
  if (!res.ok && res.status !== 204) {
    const message = await parseErrorMessage(res, "No se pudo eliminar la lista.");
    throw new Error(message);
  }
}

/** POST /listas/{listaId}/imagen  (multipart/form-data, campo "imagen") */
export async function uploadListImage(listaId: number, file: File): Promise<BackendLista> {
  const formData = new FormData();
  formData.append("imagen", file);
  const res = await fetch(`${API_URL}/listas/${listaId}/imagen`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  handleUnauthorizedResponse(res.status, `/listas/${listaId}/imagen`);
  if (!res.ok) {
    const message = await parseErrorMessage(res, "No se pudo subir la imagen.");
    throw new Error(message);
  }
  const data = await res.json().catch(() => ({})) as { lista?: BackendLista };
  return data?.lista ?? (data as BackendLista);
}

/** DELETE /listas/{listaId}/imagen */
export async function clearListImage(listaId: number): Promise<BackendLista> {
  const data = await apiDelete<undefined, { lista?: BackendLista }>(`/listas/${listaId}/imagen`);
  return data?.lista ?? (data as BackendLista);
}

export type ListaMiembro = {
  userId: number;
  username: string;
  rol?: string;
  foto?: string | null;
  avatarUrl?: string | null;
};

/** GET /listas/{listaId}/miembros */
export async function getListMembers(listaId: number): Promise<ListaMiembro[]> {
  const data = await apiGet<{ miembros?: ListaMiembro[] }>(`/listas/${listaId}/miembros`);
  return data?.miembros ?? [];
}

/** POST /listas/{listaId}/miembros */
export async function addMembersToList(
  listaId: number,
  userIds: number[],
  rol = "colaborador"
): Promise<void> {
  await apiPost(`/listas/${listaId}/miembros`, { userIds, rol });
}

/** DELETE /listas/{listaId}/miembros */
export async function removeMembersFromList(
  listaId: number,
  userIds: number[]
): Promise<void> {
  await apiDelete(`/listas/${listaId}/miembros`, { userIds });
}
