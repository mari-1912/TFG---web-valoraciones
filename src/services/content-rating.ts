import { handleUnauthorizedResponse } from "@/services/auth-service";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "https://tfg-web-valoraciones-back-i9b5.onrender.com";

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function fetchWithSingleRetry(
  input: RequestInfo | URL,
  init: RequestInit
) {
  const first = await fetch(input, init);
  if (first.status < 500 || first.status >= 600) {
    return first;
  }
  await sleep(450);
  return fetch(input, init);
}

async function buildApiErrorMessage(
  res: Response,
  fallbackMessage: string
): Promise<string> {
  if (res.status >= 500) {
    return fallbackMessage;
  }

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
    return fallbackMessage;
  }

  const text = await res.text().catch(() => "");
  const normalizedText = text.trim();
  const normalizedLower = normalizedText.toLowerCase();
  const looksLikeMarkup = /<\/?[a-z][\s\S]*>/i.test(normalizedText);
  const looksLikeHtml =
    normalizedLower.startsWith("<!doctype") ||
    normalizedLower.startsWith("<html") ||
    normalizedLower.includes("<title") ||
    normalizedLower.includes("<body") ||
    looksLikeMarkup ||
    normalizedLower.includes("internal server error");
  if (looksLikeHtml || !normalizedText) {
    return fallbackMessage;
  }
  return normalizedText;
}

async function requestSetRating(
  contenidoId: string | number,
  puntuacion: number
) {
  const res = await fetchWithSingleRetry(
    `${API_URL}/contenidos/${contenidoId}/valoracion`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puntuacion }),
    }
  );
  handleUnauthorizedResponse(
    res.status,
    `/contenidos/${contenidoId}/valoracion`
  );

  if (!res.ok) {
    const message = await buildApiErrorMessage(
      res,
      "No se ha podido realizar la acción, inténtalo de nuevo más tarde."
    );
    throw new Error(message);
  }

  return res.json().catch(() => ({}));
}

export async function setContentRating(
  contenidoId: string | number,
  puntuacion: number
) {
  return requestSetRating(contenidoId, puntuacion);
}

export async function deleteContentRating(contenidoId: string | number) {
  const res = await fetchWithSingleRetry(
    `${API_URL}/contenidos/${contenidoId}/valoracion`,
    {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    }
  );
  handleUnauthorizedResponse(
    res.status,
    `/contenidos/${contenidoId}/valoracion`
  );

  if (!res.ok) {
    const message = await buildApiErrorMessage(
      res,
      "No se ha podido realizar la acción, inténtalo de nuevo más tarde."
    );
    throw new Error(message);
  }

  return res.json().catch(() => ({}));
}
