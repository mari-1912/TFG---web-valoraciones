import { handleUnauthorizedResponse } from "@/services/auth-service";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "https://tfg-web-valoraciones-back-i9b5.onrender.com";

const PROFILE_IMAGE_ENDPOINT =
  import.meta.env.VITE_PROFILE_IMAGE_ENDPOINT ?? "/usuarios/avatar";
const PROFILE_IMAGE_FIELD =
  import.meta.env.VITE_PROFILE_IMAGE_FIELD ?? "foto";
const PROFILE_IMAGE_ALT_FIELD =
  import.meta.env.VITE_PROFILE_IMAGE_ALT_FIELD ?? "foto";
const PROFILE_IMAGE_METHOD = (
  import.meta.env.VITE_PROFILE_IMAGE_METHOD ?? "POST"
).toUpperCase();
const PROFILE_COVER_ENDPOINT =
  import.meta.env.VITE_PROFILE_COVER_ENDPOINT ?? "/usuarios/banner";
const PROFILE_COVER_FIELD =
  import.meta.env.VITE_PROFILE_COVER_FIELD ?? "banner";
const PROFILE_COVER_ALT_FIELD =
  import.meta.env.VITE_PROFILE_COVER_ALT_FIELD ?? "banner";
const PROFILE_COVER_METHOD = (
  import.meta.env.VITE_PROFILE_COVER_METHOD ?? "POST"
).toUpperCase();
const PROFILE_ME_ENDPOINT =
  import.meta.env.VITE_PROFILE_ME_ENDPOINT ?? "/usuarios/me";
const PROFILE_SELF_ENDPOINT =
  import.meta.env.VITE_PROFILE_SELF_ENDPOINT ?? "/usuarios/perfil";
const PROFILE_UPDATE_METHOD = (
  import.meta.env.VITE_PROFILE_UPDATE_METHOD ?? "PATCH"
).toUpperCase();

async function profileApi(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
  });
  handleUnauthorizedResponse(res.status, path);

  const data = await res.json().catch(() => ({}));
  return { res, data };
}

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function parseFollowingTargetsFromPayload(payload: unknown): {
  userIds: number[];
  usernames: string[];
} {
  const userIds = new Set<number>();
  const usernames = new Set<string>();

  const pushUser = (entry: unknown) => {
    if (entry == null) return;
    if (typeof entry === "number" && Number.isFinite(entry) && entry > 0) {
      userIds.add(entry);
      return;
    }
    if (typeof entry === "string") {
      const numeric = Number(entry);
      if (Number.isFinite(numeric) && numeric > 0) {
        userIds.add(numeric);
        return;
      }
      const normalized = normalizeKey(entry);
      if (normalized) usernames.add(normalized);
      return;
    }
    if (typeof entry !== "object") return;

    const row = entry as Record<string, unknown>;
    const id = Number(
      row.userId ??
        row.id ??
        row.usuarioId ??
        row.usuario_id ??
        row.seguidoId ??
        row.seguido_id ??
        row.followedId ??
        row.followed_id ??
        row.followingUserId ??
        row.following_user_id ??
        row.following_id ??
        (row.usuario as { userId?: unknown } | undefined)?.userId ??
        (row.user as { userId?: unknown } | undefined)?.userId
    );
    if (Number.isFinite(id) && id > 0) {
      userIds.add(id);
    }

    const username = (
      (typeof row.username === "string" && row.username) ||
      (typeof row.user === "string" && row.user) ||
      (typeof row.nombre === "string" && row.nombre) ||
      ((row.usuario as { username?: unknown } | undefined)?.username as
        | string
        | undefined) ||
      ((row.user as { username?: unknown } | undefined)?.username as
        | string
        | undefined) ||
      ""
    ).trim();
    if (username) {
      usernames.add(normalizeKey(username));
    }
  };

  const root = (payload ?? {}) as Record<string, any>;
  const perfil = (root?.perfil ?? {}) as Record<string, any>;
  const seguimiento = (root?.seguimiento ??
    perfil?.seguimiento ??
    {}) as Record<string, any>;

  const arrays = [
    root?.siguiendo,
    root?.seguidos,
    root?.following,
    root?.followingUsers,
    root?.siguiendoUsuarios,
    root?.seguidosUsuarios,
    root?.usuariosSeguidos,
    root?.follows,
    seguimiento?.siguiendo,
    seguimiento?.seguidos,
    seguimiento?.following,
    seguimiento?.followingUsers,
    seguimiento?.siguiendoUsuarios,
    seguimiento?.seguidosUsuarios,
    seguimiento?.usuariosSeguidos,
    seguimiento?.follows,
    perfil?.siguiendo,
    perfil?.seguidos,
    perfil?.following,
    perfil?.followingUsers,
    perfil?.siguiendoUsuarios,
    perfil?.seguidosUsuarios,
    perfil?.usuariosSeguidos,
    perfil?.follows,
  ];

  for (const candidate of arrays) {
    if (!Array.isArray(candidate)) continue;
    for (const row of candidate) {
      pushUser(row);
    }
  }

  return {
    userIds: [...userIds],
    usernames: [...usernames],
  };
}

let followingEndpointProbeDone = false;
let cachedFollowingEndpoint: string | null = null;
let followStateProbeDone = false;
let cachedFollowStateEndpointTemplate: string | null = null;

function parseBooleanLike(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number" && (value === 0 || value === 1)) return value === 1;
  if (typeof value === "string") {
    const normalized = normalizeKey(value);
    if (
      [
        "true",
        "1",
        "yes",
        "si",
        "siguiendo",
        "following",
        "followed",
      ].includes(normalized)
    ) {
      return true;
    }
    if (
      [
        "false",
        "0",
        "no",
        "not_following",
        "no_siguiendo",
        "unfollowed",
      ].includes(normalized)
    ) {
      return false;
    }
  }
  if (value && typeof value === "object") {
    const row = value as Record<string, unknown>;
    const nestedCandidates = [
      row.isFollowing,
      row.following,
      row.followedByCurrentUser,
      row.siguiendo,
      row.sigue,
      row.yaSigue,
      row.value,
      row.estado,
      row.status,
      (row.seguimiento as Record<string, unknown> | undefined)?.isFollowing,
      (row.seguimiento as Record<string, unknown> | undefined)?.following,
      (row.seguimiento as Record<string, unknown> | undefined)?.siguiendo,
      (row.perfil as Record<string, unknown> | undefined)?.isFollowing,
      (row.perfil as Record<string, unknown> | undefined)?.following,
      (row.perfil as Record<string, unknown> | undefined)?.siguiendo,
    ];
    for (const nested of nestedCandidates) {
      const parsed = parseBooleanLike(nested);
      if (parsed != null) return parsed;
    }
  }
  return null;
}

export async function fetchMyFollowingTargets(signal?: AbortSignal): Promise<{
  userIds: number[];
  usernames: string[];
}> {
  // 1) Intento principal: perfil actual (si ya expone listas de seguimiento).
  try {
    const myProfile = await fetchMyProfile(signal);
    const parsed = parseFollowingTargetsFromPayload(myProfile);
    if (parsed.userIds.length > 0 || parsed.usernames.length > 0) {
      return parsed;
    }
  } catch {
    // Seguimos con endpoints alternativos.
  }

  // 2) Si ya sabemos que no hay endpoint alternativo disponible, evitamos reintentos.
  if (followingEndpointProbeDone && !cachedFollowingEndpoint) {
    return { userIds: [], usernames: [] };
  }

  // 3) Endpoints alternativos según implementación de backend.
  const candidatePaths = [
    "/usuarios/seguidos",
    "/usuarios/siguiendo",
    "/usuarios/following",
    "/usuarios/me/seguidos",
    "/usuarios/me/siguiendo",
    "/usuarios/perfil/seguidos",
    "/usuarios/perfil/siguiendo",
  ];

  const pathsToTry = cachedFollowingEndpoint
    ? [cachedFollowingEndpoint]
    : candidatePaths;

  for (const path of pathsToTry) {
    try {
      const { res, data } = await profileApi(path, {
        method: "GET",
        signal,
      });
      if (!res.ok) {
        if (res.status === 404) {
          cachedFollowingEndpoint = null;
          followingEndpointProbeDone = true;
          break;
        }
        continue;
      }
      const parsed = parseFollowingTargetsFromPayload(data);
      cachedFollowingEndpoint = path;
      followingEndpointProbeDone = true;
      if (parsed.userIds.length > 0 || parsed.usernames.length > 0) {
        return parsed;
      }
    } catch {
      // Probamos siguiente ruta.
    }
  }

  // Si llegamos aquí, no hay endpoint alternativo útil.
  followingEndpointProbeDone = true;
  cachedFollowingEndpoint = null;
  return { userIds: [], usernames: [] };
}

export async function fetchIsFollowingUser(
  userId: number,
  signal?: AbortSignal
): Promise<boolean | null> {
  if (!Number.isFinite(userId) || userId <= 0) return null;

  if (followStateProbeDone && !cachedFollowStateEndpointTemplate) {
    return null;
  }

  const candidates = [
    "/usuarios/{id}/seguir",
    "/usuarios/{id}/seguimiento",
    "/usuarios/{id}/following",
    "/usuarios/perfil/{id}/seguimiento",
    "/usuarios/perfil/{id}/following",
  ];
  const templatesToTry = cachedFollowStateEndpointTemplate
    ? [cachedFollowStateEndpointTemplate]
    : candidates;

  for (const template of templatesToTry) {
    const path = template.replace("{id}", String(userId));
    try {
      const { res, data } = await profileApi(path, {
        method: "GET",
        signal,
      });
      if (!res.ok) {
        if (
          (res.status === 404 || res.status === 405) &&
          cachedFollowStateEndpointTemplate === template
        ) {
          cachedFollowStateEndpointTemplate = null;
          followStateProbeDone = true;
        }
        continue;
      }

      const parsed =
        parseBooleanLike((data as Record<string, unknown>)?.isFollowing) ??
        parseBooleanLike((data as Record<string, unknown>)?.following) ??
        parseBooleanLike((data as Record<string, unknown>)?.siguiendo) ??
        parseBooleanLike(data);

      cachedFollowStateEndpointTemplate = template;
      followStateProbeDone = true;

      if (parsed != null) return parsed;
      return null;
    } catch {
      // Probamos siguiente ruta.
    }
  }

  followStateProbeDone = true;
  cachedFollowStateEndpointTemplate = null;
  return null;
}

export async function uploadProfileImage(
  file: Blob,
  dataUrl?: string,
  signal?: AbortSignal
): Promise<{
  success: boolean;
  url?: string;
  message?: string;
}> {
  return uploadProfileAsset({
    endpoint: PROFILE_IMAGE_ENDPOINT,
    field: PROFILE_IMAGE_FIELD,
    altField: PROFILE_IMAGE_ALT_FIELD,
    method: PROFILE_IMAGE_METHOD,
    file,
    dataUrl,
    signal,
  });
}

export async function removeProfileImage(): Promise<{
  success: boolean;
  message?: string;
}> {
  return updateProfile({ foto: null });
}

export async function uploadProfileCover(
  file: Blob,
  dataUrl?: string,
  signal?: AbortSignal
): Promise<{
  success: boolean;
  url?: string;
  message?: string;
}> {
  return uploadProfileAsset({
    endpoint: PROFILE_COVER_ENDPOINT,
    field: PROFILE_COVER_FIELD,
    altField: PROFILE_COVER_ALT_FIELD,
    method: PROFILE_COVER_METHOD,
    file,
    dataUrl,
    signal,
  });
}

export async function removeProfileCover(): Promise<{
  success: boolean;
  message?: string;
}> {
  return updateProfile({ banner: null });
}

async function uploadProfileAsset({
  endpoint,
  field,
  altField,
  method,
  file,
  dataUrl,
  signal,
}: {
  endpoint: string;
  field: string;
  altField?: string;
  method: string;
  file: Blob;
  dataUrl?: string;
  signal?: AbortSignal;
}): Promise<{ success: boolean; url?: string; message?: string }> {
  const formData = new FormData();
  formData.append(field, file, "avatar.jpg");
  if (altField && altField !== field) {
    formData.append(altField, file, "avatar.jpg");
  }

  const { res, data } = await profileApi(endpoint, {
    method,
    body: formData,
    signal,
  });

  if (res.ok) {
    return {
      success: true,
      url: data?.url ?? data?.avatar ?? data?.image ?? data?.foto ?? data?.fondo,
    };
  }

  if (dataUrl) {
    const payload: Record<string, string> = { [field]: dataUrl };
    if (altField && altField !== field) {
      payload[altField] = dataUrl;
    }
    const fallback = await profileApi(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });

    if (fallback.res.ok) {
      return {
        success: true,
        url:
          fallback.data?.url ??
          fallback.data?.avatar ??
          fallback.data?.image ??
          fallback.data?.foto ??
          fallback.data?.fondo,
      };
    }

    return {
      success: false,
      message:
        fallback.data?.message ??
        data?.message ??
        "No se pudo subir la imagen.",
    };
  }

  return {
    success: false,
    message: data?.message ?? "No se pudo subir la imagen.",
  };
}

export type ProfileResponse = {
  perfil: {
    userId: number;
    username: string;
    tipo?: string;
    reputacion?: number;
    descripcion?: string;
    avatarPath?: string | null;
    bannerPath?: string | null;
    avatarUrl?: string | null;
    bannerUrl?: string | null;
  };
  estadisticas?: {
    valoraciones?: number;
    media?: number;
    siguiendo?: number;
    seguidores?: number;
    comentarios?: number;
    series?: number;
    peliculas?: number;
    libros?: number;
    videojuegos?: number;
  };
};

export type UserFollower = {
  userId?: number;
  id?: number;
  username?: string;
  tipo?: string;
  reputacion?: number;
  avatarPath?: string | null;
  avatarUrl?: string | null;
};

export type UserConnection = {
  userId: number;
  username: string;
  tipo?: string;
  reputacion?: number;
  avatarPath?: string | null;
  avatarUrl?: string | null;
};

export type UserFollowersResponse = {
  seguidores?: UserFollower[];
  followers?: UserFollower[];
  siguiendo?: UserFollower[];
  following?: UserFollower[];
  pagination?: {
    page?: number;
    pageSize?: number;
    total?: number;
    pages?: number;
  };
};

export type UserConnectionsPage = {
  users: UserConnection[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
};

function normalizeConnectionUser(entry: unknown): UserConnection | null {
  if (!entry || typeof entry !== "object") return null;
  const row = entry as Record<string, unknown>;
  const userId = Number(
    row.userId ??
      row.id ??
      row.usuarioId ??
      row.usuario_id ??
      row.seguidorId ??
      row.seguidor_id ??
      row.seguidoId ??
      row.seguido_id ??
      row.followingUserId ??
      row.following_user_id ??
      row.following_id
  );
  if (!Number.isFinite(userId) || userId <= 0) return null;

  const username = String(
    row.username ??
      row.nombreUsuario ??
      row.nombre_usuario ??
      row.nombre ??
      row.user ??
      ""
  ).trim();

  return {
    userId,
    username,
    tipo: typeof row.tipo === "string" ? row.tipo : undefined,
    reputacion:
      typeof row.reputacion === "number" ? row.reputacion : undefined,
    avatarPath:
      typeof row.avatarPath === "string"
        ? row.avatarPath
        : typeof row.avatar_path === "string"
          ? row.avatar_path
          : null,
    avatarUrl:
      typeof row.avatarUrl === "string"
        ? row.avatarUrl
        : typeof row.avatar_url === "string"
          ? row.avatar_url
          : null,
  };
}

function normalizeConnectionsPage(
  payload: UserFollowersResponse,
  rows: UserFollower[],
  fallbackPage: number,
  fallbackPageSize: number
): UserConnectionsPage {
  const dedupedUsers = new Map<number, UserConnection>();
  for (const row of rows) {
    const user = normalizeConnectionUser(row);
    if (!user) continue;
    dedupedUsers.set(user.userId, user);
  }

  const users = [...dedupedUsers.values()];
  const pageFromPayload = Number(payload.pagination?.page ?? fallbackPage);
  const pageSizeFromPayload = Number(
    payload.pagination?.pageSize ?? fallbackPageSize
  );
  const pagesFromPayload = Number(payload.pagination?.pages ?? 1);
  const totalFromPayload = Number(payload.pagination?.total ?? users.length);

  return {
    users,
    total:
      Number.isFinite(totalFromPayload) && totalFromPayload >= 0
        ? totalFromPayload
        : users.length,
    page:
      Number.isFinite(pageFromPayload) && pageFromPayload > 0
        ? pageFromPayload
        : fallbackPage,
    pages:
      Number.isFinite(pagesFromPayload) && pagesFromPayload > 0
        ? pagesFromPayload
        : 1,
    pageSize:
      Number.isFinite(pageSizeFromPayload) && pageSizeFromPayload > 0
        ? pageSizeFromPayload
        : fallbackPageSize,
  };
}

export async function fetchMyProfile(
  signal?: AbortSignal
): Promise<ProfileResponse> {
  const { res, data } = await profileApi(PROFILE_SELF_ENDPOINT, {
    method: "GET",
    signal,
  });

  if (!res.ok) {
    const message = data?.message ?? "No se pudo cargar el perfil.";
    throw new Error(message);
  }

  return data as ProfileResponse;
}

export async function fetchUserProfile(
  userId: number,
  signal?: AbortSignal
): Promise<ProfileResponse> {
  const { res, data } = await profileApi(
    `${PROFILE_SELF_ENDPOINT}/${userId}`,
    {
      method: "GET",
      signal,
    }
  );

  if (!res.ok) {
    const message = data?.message ?? "No se pudo cargar el perfil.";
    throw new Error(message);
  }

  return data as ProfileResponse;
}

export async function fetchUserFollowers(
  userId: number,
  options?: {
    page?: number;
    pageSize?: number;
    signal?: AbortSignal;
  }
): Promise<{
  followerIds: number[];
  total: number;
  page: number;
  pages: number;
}> {
  const pageData = await fetchUserFollowersPage(userId, options);
  return {
    followerIds: pageData.users.map((user) => user.userId),
    total: pageData.total,
    page: pageData.page,
    pages: pageData.pages,
  };
}

export async function fetchUserFollowersPage(
  userId: number,
  options?: {
    page?: number;
    pageSize?: number;
    signal?: AbortSignal;
  }
): Promise<UserConnectionsPage> {
  const page = Number(options?.page ?? 1);
  const pageSize = Number(options?.pageSize ?? 100);
  const query = new URLSearchParams({
    page: String(Number.isFinite(page) && page > 0 ? page : 1),
    pageSize: String(Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 100),
  });
  const path = `/usuarios/${userId}/seguidores?${query.toString()}`;

  const { res, data } = await profileApi(path, {
    method: "GET",
    signal: options?.signal,
  });

  if (!res.ok) {
    const message = data?.message ?? "No se pudieron cargar los seguidores.";
    throw new Error(message);
  }

  const payload = (data ?? {}) as UserFollowersResponse;
  const rows = Array.isArray(payload.seguidores)
    ? payload.seguidores
    : Array.isArray(payload.followers)
      ? payload.followers
      : [];
  return normalizeConnectionsPage(payload, rows, page, pageSize);
}

export async function fetchUserFollowingPage(
  userId: number,
  options?: {
    page?: number;
    pageSize?: number;
    signal?: AbortSignal;
  }
): Promise<UserConnectionsPage> {
  const page = Number(options?.page ?? 1);
  const pageSize = Number(options?.pageSize ?? 20);
  const query = new URLSearchParams({
    page: String(Number.isFinite(page) && page > 0 ? page : 1),
    pageSize: String(Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20),
  });
  const path = `/usuarios/${userId}/siguiendo?${query.toString()}`;

  const { res, data } = await profileApi(path, {
    method: "GET",
    signal: options?.signal,
  });

  if (!res.ok) {
    const message = data?.message ?? "No se pudieron cargar los seguidos.";
    throw new Error(message);
  }

  const payload = (data ?? {}) as UserFollowersResponse;
  const rows = Array.isArray(payload.siguiendo)
    ? payload.siguiendo
    : Array.isArray(payload.following)
      ? payload.following
      : [];

  return normalizeConnectionsPage(payload, rows, page, pageSize);
}

export async function fetchAllUserFollowerIds(
  userId: number,
  signal?: AbortSignal
): Promise<{ followerIds: number[]; total: number }> {
  const dedupedIds = new Set<number>();
  let page = 1;
  let pages = 1;
  let total = 0;
  let guard = 0;

  while (page <= pages && guard < 200) {
    const result = await fetchUserFollowers(userId, {
      page,
      pageSize: 100,
      signal,
    });
    for (const followerId of result.followerIds) {
      dedupedIds.add(followerId);
    }
    total = result.total;
    pages = result.pages;
    page += 1;
    guard += 1;
  }

  return {
    followerIds: [...dedupedIds],
    total: Number.isFinite(total) && total >= 0 ? total : dedupedIds.size,
  };
}

export async function updateProfile(
  payload: Record<string, unknown>,
  signal?: AbortSignal
): Promise<{ success: boolean; message?: string }> {
  const { res, data } = await profileApi(PROFILE_ME_ENDPOINT, {
    method: PROFILE_UPDATE_METHOD,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) {
    return {
      success: false,
      message: data?.message ?? "No se pudo actualizar el perfil.",
    };
  }

  return { success: true };
}

export async function followUser(
  userId: number,
  signal?: AbortSignal
): Promise<{ success: boolean; message?: string }> {
  const { res, data } = await profileApi(`/usuarios/${userId}/seguir`, {
    method: "POST",
    signal,
  });

  if (!res.ok) {
    return {
      success: false,
      message: data?.message ?? "No se pudo seguir al usuario.",
    };
  }

  return { success: true };
}

export async function unfollowUser(
  userId: number,
  signal?: AbortSignal
): Promise<{ success: boolean; message?: string }> {
  const { res, data } = await profileApi(`/usuarios/${userId}/seguir`, {
    method: "DELETE",
    signal,
  });

  if (!res.ok) {
    return {
      success: false,
      message: data?.message ?? "No se pudo dejar de seguir al usuario.",
    };
  }

  return { success: true };
}
