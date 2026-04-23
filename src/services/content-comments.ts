import { handleUnauthorizedResponse } from "@/services/auth-service";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "https://tfg-web-valoraciones-back-i9b5.onrender.com";

export type CreateCommentPayload = {
  comentario?: {
    commentId?: number;
    userId?: number;
    contenidoId?: number;
    parentId?: number | null;
    mensaje?: string;
    createDate?: string;
    updateDate?: string;
  };
};

export type UpdateCommentPayload = CreateCommentPayload;

export type ListCommentsPayload = {
  comentarios?: Array<{
    commentId?: number;
    userId?: number;
    contenidoId?: number;
    parentId?: number | null;
    mensaje?: string;
    createDate?: string;
    updateDate?: string;
    usuario?: {
      userId?: number;
      username?: string;
      tipo?: string;
      reputacion?: number;
      avatarPath?: string;
      avatarUrl?: string;
    };
    reacciones?: {
      like?: number;
      dislike?: number;
      total?: number;
      userReaction?: string;
    };
    respuestas?: unknown[];
  }>;
  pagination?: {
    page?: number;
    pageSize?: number;
    total?: number;
    pages?: number;
  };
};

export async function createContentComment(
  contenidoId: string | number,
  mensaje: string,
  parentId?: number | null
) {
  const body: Record<string, unknown> = { mensaje };
  if (typeof parentId === "number") {
    body.parentId = parentId;
  }

  const res = await fetch(`${API_URL}/contenidos/${contenidoId}/comentarios`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  handleUnauthorizedResponse(res.status, `/contenidos/${contenidoId}/comentarios`);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error ${res.status}. ${text}`.trim());
  }

  return (await res.json().catch(() => ({}))) as CreateCommentPayload;
}

export async function listContentComments(
  contenidoId: string | number,
  options?: {
    signal?: AbortSignal;
    page?: number;
    pageSize?: number;
    paginate?: boolean;
  }
) {
  const query = new URLSearchParams();
  const shouldPaginate = options?.paginate !== false;
  if (shouldPaginate) {
    if (Number.isFinite(options?.page) && Number(options?.page) > 0) {
      query.set("page", String(Number(options?.page)));
    }
    if (Number.isFinite(options?.pageSize) && Number(options?.pageSize) > 0) {
      query.set("pageSize", String(Number(options?.pageSize)));
    }
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";

  const res = await fetch(`${API_URL}/contenidos/${contenidoId}/comentarios${suffix}`, {
    method: "GET",
    credentials: "include",
    signal: options?.signal,
  });
  handleUnauthorizedResponse(res.status, `/contenidos/${contenidoId}/comentarios`);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error ${res.status}. ${text}`.trim());
  }

  return (await res.json().catch(() => ({}))) as ListCommentsPayload;
}

export async function deleteContentComment(
  contenidoId: string | number,
  commentId: string | number
) {
  const res = await fetch(
    `${API_URL}/contenidos/${contenidoId}/comentarios/${commentId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );
  handleUnauthorizedResponse(
    res.status,
    `/contenidos/${contenidoId}/comentarios/${commentId}`
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error ${res.status}. ${text}`.trim());
  }

  return res.json().catch(() => ({}));
}

export async function updateContentComment(
  contenidoId: string | number,
  commentId: string | number,
  mensaje: string
) {
  const res = await fetch(
    `${API_URL}/contenidos/${contenidoId}/comentarios/${commentId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje }),
    }
  );
  handleUnauthorizedResponse(
    res.status,
    `/contenidos/${contenidoId}/comentarios/${commentId}`
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error ${res.status}. ${text}`.trim());
  }

  return (await res.json().catch(() => ({}))) as UpdateCommentPayload;
}

export async function reactToContentComment(
  contenidoId: string | number,
  commentId: string | number,
  tipo: "like" | "dislike" = "like"
) {
  const res = await fetch(
    `${API_URL}/contenidos/${contenidoId}/comentarios/${commentId}/reacciones`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo }),
    }
  );
  handleUnauthorizedResponse(
    res.status,
    `/contenidos/${contenidoId}/comentarios/${commentId}/reacciones`
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error ${res.status}. ${text}`.trim());
  }

  return res.json().catch(() => ({}));
}
