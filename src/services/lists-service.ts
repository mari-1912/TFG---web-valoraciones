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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function pickPositiveNumber(...values: Array<unknown>) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function pickString(...values: Array<unknown>) {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

function pickNullableString(...values: Array<unknown>) {
  for (const value of values) {
    if (value == null) return null;
    if (typeof value === "string") {
      return value;
    }
  }
  return null;
}

function pickOptionalNumber(...values: Array<unknown>) {
  for (const value of values) {
    if (value == null) return null;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeBackendList(raw: unknown): BackendLista | null {
  if (!isRecord(raw)) return null;
  const nested =
    (isRecord(raw.lista) && raw.lista) ||
    (isRecord(raw.list) && raw.list) ||
    (isRecord(raw.listaDetalle) && raw.listaDetalle) ||
    (isRecord(raw.listDetail) && raw.listDetail) ||
    null;
  const row = nested ? { ...raw, ...nested } : raw;

  const listaId = pickPositiveNumber(
    row.listaId,
    row.lista_id,
    row.id,
    row.listaID,
    row.listId,
    row.list_id
  );
  if (listaId == null) return null;

  const userId = pickPositiveNumber(
    row.userId,
    row.user_id,
    row.usuarioId,
    row.usuario_id,
    row.ownerId,
    row.owner_id
  );
  const tipoContenidos =
    pickString(
      row.tipoContenidos,
      row.tipo_contenidos,
      row.tipoContenido,
      row.tipo_contenido,
      row.contentType,
      row.category,
      row.categoria
    ) || "desconocido";
  const nombre =
    pickString(
      row.nombre,
      row.nombreLista,
      row.nombre_lista,
      row.listName,
      row.list_name,
      row.name,
      row.titulo,
      row.title
    ) || `Lista ${listaId}`;

  return {
    listaId,
    userId: userId ?? 0,
    tipo:
      pickString(row.tipo, row.type, row.listType, row.list_type) || undefined,
    tipoContenidos,
    nombre,
    descripcion: pickNullableString(
      row.descripcion,
      row.description,
      row.descripcionLista,
      row.listDescription
    ),
    visibilidad:
      pickString(row.visibilidad, row.visibility, row.privacy, row.privacidad) ||
      undefined,
    imagen: pickNullableString(
      row.imagen,
      row.image,
      row.imagenUrl,
      row.imageUrl,
      row.portada
    ),
  };
}

function extractRawLists(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  const row = payload as Record<string, unknown>;

  const candidates: unknown[] = [
    row.listas,
    row.lista,
    row.items,
    row.results,
    row.data,
    row.rows,
    row.collection,
    row.resultsList,
    row.records,
    row.values,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (isRecord(candidate)) {
      const nestedArray = extractRawLists(candidate);
      if (nestedArray.length) return nestedArray;
    }
  }
  if (normalizeBackendList(payload)) return [payload];
  return [];
}

function parseListsPayload(payload: unknown): BackendLista[] {
  const rows = extractRawLists(payload);
  const parsed = rows
    .map((item) => normalizeBackendList(item))
    .filter((item): item is BackendLista => item != null);
  const deduped = new Map<number, BackendLista>();
  for (const list of parsed) {
    if (!deduped.has(list.listaId)) deduped.set(list.listaId, list);
  }
  return [...deduped.values()];
}

function normalizeBackendContent(
  raw: unknown,
  fallbackType?: string
): BackendContenidoListado | null {
  if (!isRecord(raw)) return null;
  const nested =
    (isRecord(raw.contenido) && raw.contenido) ||
    (isRecord(raw.item) && raw.item) ||
    (isRecord(raw.content) && raw.content) ||
    null;
  const row = nested ? { ...raw, ...nested } : raw;

  const id = pickPositiveNumber(
    row.id,
    row.contenidoId,
    row.contenido_id,
    row.itemId,
    row.item_id,
    row.contentId,
    row.content_id
  );
  if (id == null) return null;

  const titulo = pickString(row.titulo, row.title, row.nombre, row.name) || `Contenido ${id}`;
  const portada = pickNullableString(
    row.portada,
    row.imagen,
    row.image,
    row.cover,
    row.poster
  );
  const puntuacion = pickOptionalNumber(
    row.puntuacion,
    row.score,
    row.rating,
    row.valoracion
  );
  const puntuacionApi = pickOptionalNumber(
    row.puntuacionApi,
    row.puntuacion_api,
    row.apiScore,
    row.api_score,
    row.ratingApi
  );
  const tipo =
    pickString(
      row.tipo,
      row.tipoContenido,
      row.tipo_contenido,
      row.tipoContenidos,
      row.tipo_contenidos,
      row.category,
      row.categoria
    ) ||
    (typeof fallbackType === "string" ? fallbackType : "");

  return {
    id,
    titulo,
    portada,
    puntuacion,
    puntuacionApi,
    tipo: tipo || null,
  };
}

function extractRawContents(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  const row = payload as Record<string, unknown>;
  const candidates: unknown[] = [
    row.contenidos,
    row.contenido,
    row.items,
    row.results,
    row.data,
    row.rows,
    row.collection,
    row.entries,
    row.elementos,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (isRecord(candidate)) {
      const nested = extractRawContents(candidate);
      if (nested.length) return nested;
    }
  }
  const single = normalizeBackendContent(payload);
  return single ? [payload] : [];
}

function parseListContentsPayload(
  payload: unknown,
  fallbackListId?: number
): BackendListaContenidosResponse {
  const fallbackListIdSafe =
    Number.isFinite(Number(fallbackListId)) && Number(fallbackListId) > 0
      ? Number(fallbackListId)
      : 0;

  const normalizedList =
    normalizeBackendList(payload) ||
    (isRecord(payload) ? normalizeBackendList(payload.lista) : null) ||
    (isRecord(payload) ? normalizeBackendList(payload.list) : null) ||
    null;

  const lista: BackendLista =
    normalizedList ??
    ({
      listaId: fallbackListIdSafe,
      userId: 0,
      tipo: "user",
      tipoContenidos: "desconocido",
      nombre: fallbackListIdSafe ? `Lista ${fallbackListIdSafe}` : "Lista",
      descripcion: null,
      visibilidad: "publica",
      imagen: null,
    } satisfies BackendLista);

  const rows = extractRawContents(payload);
  const parsed = rows
    .map((item) => normalizeBackendContent(item, lista.tipoContenidos))
    .filter((item): item is BackendContenidoListado => item != null);
  const deduped = new Map<number, BackendContenidoListado>();
  for (const item of parsed) {
    if (!deduped.has(item.id)) deduped.set(item.id, item);
  }

  return {
    lista,
    contenidos: [...deduped.values()],
  };
}

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
  const createdCandidate = data?.lista ?? data;
  const created = normalizeBackendList(createdCandidate);
  if (!created) {
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
export async function getMyLists(usePagination?: boolean): Promise<BackendLista[]> {
  const url = !usePagination ? `/listas/usuario?usePagination=${usePagination}` : "/listas/usuario";
  const data = await apiGet<unknown>(url);
  return parseListsPayload(data);
}

function isAuthError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.trim();
  return message.startsWith("401") || message.startsWith("403");
}

/**
 * Intenta obtener listas del usuario autenticado.
 * Primario: /listas/usuario/{userId}
 * Fallback: /listas/usuario
 */
export async function getMyListsWithFallback(): Promise<BackendLista[]> {
  // const me = await getMe().catch(() => ({ success: false } as const));
  // const userId = resolveAuthenticatedUserId(me);

  // let byUserIdLists: BackendLista[] = [];
  // if (userId > 0) {
  //   try {
  //     byUserIdLists = await getListsByUser(userId);
  //     if (byUserIdLists.length > 0) {
  //       return byUserIdLists;
  //     }
  //   } catch (error) {
  //     if (isAuthError(error)) throw error;
  //   }
  // }

  let myLists: BackendLista[] = [];
  try {
    myLists = await getMyLists(false);
  } catch (error) {
    if (isAuthError(error)) throw error;
  }

  const merged = new Map<number, BackendLista>();
  // for (const list of [...myLists, ...byUserIdLists]) {
  //   const id = Number(list?.listaId);
  //   if (!Number.isFinite(id) || id <= 0) continue;
  //   if (!merged.has(id)) {
  //     merged.set(id, list);
  //   }
  // }

  for (const list of [...myLists]) {
    const id = Number(list?.listaId);
    if (!Number.isFinite(id) || id <= 0) continue;
    if (!merged.has(id)) {
      merged.set(id, list);
    }
  }

  return [...merged.values()];
}

/**
 * GET /listas/usuario/{userId}
 * -> { listas: BackendLista[] }
 */
export async function getListsByUser(userId: number): Promise<BackendLista[]> {
  const data = await apiGet<unknown>(`/listas/usuario/${userId}`);
  return parseListsPayload(data);
}

/**
 * GET /listas/{listaId}/contenidos
 * -> { lista, contenidos }
 */
export async function getListContents(
  listaId: number
): Promise<BackendListaContenidosResponse> {
  const data = await apiGet<unknown>(`/listas/${listaId}/contenidos`);
  return parseListContentsPayload(data, listaId);
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
