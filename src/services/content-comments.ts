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

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error ${res.status}. ${text}`.trim());
  }

  return (await res.json().catch(() => ({}))) as CreateCommentPayload;
}

export async function listContentComments(
  contenidoId: string | number,
  options?: { signal?: AbortSignal }
) {
  const res = await fetch(`${API_URL}/contenidos/${contenidoId}/comentarios`, {
    method: "GET",
    credentials: "include",
    signal: options?.signal,
  });

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

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error ${res.status}. ${text}`.trim());
  }

  return res.json().catch(() => ({}));
}
