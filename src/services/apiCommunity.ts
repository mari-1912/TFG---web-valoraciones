import { handleUnauthorizedResponse } from "@/services/auth-service";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "https://tfg-web-valoraciones-back-i9b5.onrender.com";

export type CommunityActivity = {
  actividadId?: number;
  userId?: number;
  tipo?: string;
  contenidoId?: number;
  listaId?: number;
  tituloContenido?: string;
  portadaContenido?: string;
  nombreLista?: string;
  puntuacion?: number;
  textoComentario?: string;
  metadata?: Record<string, unknown> | null;
  createDate?: string;
  usuario?: {
    userId?: number;
    username?: string;
    tipo?: string;
    reputacion?: number;
    avatarPath?: string;
    avatarUrl?: string;
    avatar_path?: string;
    foto?: string;
    avatar?: string;
  } | null;
};

export type CommunityFeedPayload = {
  actividades?: CommunityActivity[];
  pagination?: {
    page?: number;
    pageSize?: number;
    total?: number;
    pages?: number;
  };
};

type GetCommunityFeedOptions = {
  page?: number;
  pageSize?: number;
  userIds?: number[];
  signal?: AbortSignal;
};

export function resolveAssetUrl(path?: string | null) {
  if (typeof path !== "string" || !path.trim()) return undefined;

  const trimmed = path.trim();
  if (
    trimmed.toLowerCase() === "null" ||
    trimmed.toLowerCase() === "undefined" ||
    trimmed.toLowerCase() === "n/a"
  ) {
    return undefined;
  }

  if (trimmed.startsWith("data:image/")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const normalized = trimmed.replace(/\\/g, "/").replace(/^\.?\//, "");
  if (normalized.startsWith("/")) return `${API_URL}${normalized}`;
  return `${API_URL}/${normalized}`;
}

export async function getCommunityFeed(
  options: GetCommunityFeedOptions = {}
): Promise<CommunityFeedPayload> {
  const page = Number.isFinite(options.page) ? Number(options.page) : 1;
  const pageSize = Number.isFinite(options.pageSize)
    ? Number(options.pageSize)
    : 20;

  const params = new URLSearchParams();
  params.set("page", String(Math.max(1, page)));
  params.set("pageSize", String(Math.max(1, pageSize)));

  if (options.userIds && options.userIds.length > 0) {
    params.set("userIds", options.userIds.join(","));
  }

  const path = `/actividad?${params.toString()}`;
  const res = await fetch(`${API_URL}${path}`, {
    method: "GET",
    credentials: "include",
    signal: options.signal,
  });
  handleUnauthorizedResponse(res.status, "/actividad");

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error ${res.status}. ${text}`.trim());
  }

  return (await res.json().catch(() => ({}))) as CommunityFeedPayload;
}
