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
