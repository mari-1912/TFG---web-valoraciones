const API_URL =
  import.meta.env.VITE_API_URL ??
  "https://tfg-web-valoraciones-back-i9b5.onrender.com";

const PROFILE_IMAGE_ENDPOINT =
  import.meta.env.VITE_PROFILE_IMAGE_ENDPOINT ?? "/users/me/avatar";
const PROFILE_IMAGE_FIELD =
  import.meta.env.VITE_PROFILE_IMAGE_FIELD ?? "foto";
const PROFILE_IMAGE_METHOD = (
  import.meta.env.VITE_PROFILE_IMAGE_METHOD ?? "PUT"
).toUpperCase();
const PROFILE_COVER_ENDPOINT =
  import.meta.env.VITE_PROFILE_COVER_ENDPOINT ?? "/users/me/cover";
const PROFILE_COVER_FIELD =
  import.meta.env.VITE_PROFILE_COVER_FIELD ?? "fondo";
const PROFILE_COVER_METHOD = (
  import.meta.env.VITE_PROFILE_COVER_METHOD ?? "PUT"
).toUpperCase();

async function profileApi(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
  });

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
  const { res, data } = await profileApi(PROFILE_IMAGE_ENDPOINT, {
    method: "DELETE",
  });

  if (!res.ok) {
    return {
      success: false,
      message: data?.message ?? "No se pudo eliminar la imagen.",
    };
  }

  return { success: true };
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
  const { res, data } = await profileApi(PROFILE_COVER_ENDPOINT, {
    method: "DELETE",
  });

  if (!res.ok) {
    return {
      success: false,
      message: data?.message ?? "No se pudo eliminar la portada.",
    };
  }

  return { success: true };
}

async function uploadProfileAsset({
  endpoint,
  field,
  method,
  file,
  dataUrl,
  signal,
}: {
  endpoint: string;
  field: string;
  method: string;
  file: Blob;
  dataUrl?: string;
  signal?: AbortSignal;
}): Promise<{ success: boolean; url?: string; message?: string }> {
  const formData = new FormData();
  formData.append(field, file, "avatar.jpg");

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
    const fallback = await profileApi(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: dataUrl }),
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
