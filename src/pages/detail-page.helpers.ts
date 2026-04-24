import type { ContentStatus } from "@/services/content-status";
import type { DetailComment } from "@/components/detail/detail-comments";

export const IMAGE_ONLY_COMMENT_PLACEHOLDER = "__IMAGE_ONLY__";

export function formatList(value?: string | string[]) {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (value.includes(";")) {
    return value
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", ");
  }
  return value;
}

export function parseRating(value: unknown) {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const fractionMatch = trimmed.match(
      /^(-?\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)$/
    );
    if (fractionMatch) {
      const numerator = Number(fractionMatch[1].replace(",", "."));
      const denominator = Number(fractionMatch[2].replace(",", "."));
      if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator > 0) {
        return (numerator / denominator) * 10;
      }
    }

    const cleaned = trimmed.replace(",", ".");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function parseStoredStatus(value: unknown): ContentStatus | null {
  if (
    value === "watchlist" ||
    value === "in_progress" ||
    value === "completed" ||
    value === "dropped"
  ) {
    return value;
  }
  return null;
}

export function getSessionUsername() {
  if (typeof window === "undefined") return "anon";
  const raw = localStorage.getItem("currentUser") ?? "";
  return raw.trim() || "anon";
}

export function parseCount(value: unknown) {
  if (value == null) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed < 0 ? null : parsed;
}

export function toFiveStars(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return null;
  const normalized = value > 5 ? value / 2 : value;
  return Math.max(1, Math.min(5, Math.round(normalized)));
}

export function formatRatingOutOfTen(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return null;
  const normalized = value > 5 ? value : value * 2;
  const clamped = Math.max(0, Math.min(10, normalized));
  const rounded = Math.round(clamped * 10) / 10;
  const asText = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1).replace(".", ",");
  return `${asText}/10`;
}

export function formatCommentDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "hace poco";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;
  const diffMs = Date.now() - parsed;
  if (diffMs < 60 * 1000) return "ahora";
  if (diffMs < 60 * 60 * 1000) return "hace unos minutos";
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays < 7) return `hace ${diffDays} días`;
  return new Date(parsed).toLocaleDateString("es-ES");
}

export function parseDateMs(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function truncateText(value: string, maxLength = 120) {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

export function normalizeCommentBody(value: string) {
  const trimmed = value.trim();
  if (trimmed === IMAGE_ONLY_COMMENT_PLACEHOLDER) return "";
  return value;
}

export function resolveAssetUrl(path: unknown, apiUrl: string) {
  if (typeof path !== "string" || !path.trim()) return null;
  const value = path.trim();
  if (
    value.toLowerCase() === "null" ||
    value.toLowerCase() === "undefined" ||
    value.toLowerCase() === "n/a"
  ) {
    return null;
  }
  if (value.startsWith("data:image/")) return value;
  const normalized = value.replace(/\\/g, "/").replace(/^\.?\//, "");
  if (/^https?:\/\//i.test(value)) return value;
  if (normalized.startsWith("/")) return `${apiUrl}${normalized}`;
  return `${apiUrl}/${normalized}`;
}

export function pickString(...values: Array<unknown>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

export function extractYear(value?: string) {
  if (!value) return null;
  const match = value.match(/\d{4}/);
  if (!match) return null;
  const year = Number(match[0]);
  return Number.isFinite(year) ? year : null;
}

export function normalizeDetailItem(data: any) {
  if (data?.contenido && typeof data.contenido === "object") {
    return {
      ...data.contenido,
      estado: data?.estado ?? data?.contenido?.estado,
      valoracion: data?.valoracion ?? data?.contenido?.valoracion,
    };
  }
  return data?.item ?? data?.contenido ?? data;
}

export function toYouTubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace("www.", "");
    let videoId = "";

    if (host === "youtu.be") {
      videoId = parsed.pathname.slice(1);
    } else if (host.endsWith("youtube.com")) {
      if (parsed.pathname.startsWith("/watch")) {
        videoId = parsed.searchParams.get("v") ?? "";
      } else if (parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.split("/")[2] ?? "";
      } else if (parsed.pathname.startsWith("/shorts/")) {
        videoId = parsed.pathname.split("/")[2] ?? "";
      }
    }

    if (!videoId) return url;
    const start =
      parsed.searchParams.get("start") ?? parsed.searchParams.get("t");
    const startParam =
      start && /^\d+$/.test(start) ? `?start=${start}` : "";
    return `https://www.youtube.com/embed/${videoId}${startParam}`;
  } catch {
    return url;
  }
}

export type MapApiCommentContext = {
  currentUserId: number | null;
  currentUsername: string;
  currentUserAvatarUrl: string | null;
  localCommentImages: Record<string, string>;
};

export function mapApiComment(
  comment: any,
  index: number,
  context: MapApiCommentContext,
  apiUrl: string
): DetailComment {
  const rawCommentId =
    comment?.commentId ?? comment?.id ?? comment?.comentarioId ?? null;
  const parsedCommentId = Number(rawCommentId);
  const numericId =
    Number.isFinite(parsedCommentId) && parsedCommentId > 0
      ? parsedCommentId
      : null;
  const commentId =
    numericId != null
      ? String(numericId)
      : typeof rawCommentId === "string" && rawCommentId.trim()
        ? rawCommentId.trim()
        : `review-${index}`;
  const commentUserId =
    Number(
      comment?.userId ??
        comment?.user_id ??
        comment?.usuarioId ??
        comment?.usuario_id ??
        comment?.usuario?.userId ??
        comment?.usuario?.user_id ??
        comment?.usuario?.id ??
        comment?.user?.userId ??
        comment?.user?.user_id ??
        comment?.user?.id ??
        comment?.authorId ??
        comment?.author_id ??
        comment?.author?.userId ??
        comment?.author?.user_id ??
        comment?.author?.id ??
        0
    ) || null;
  const username =
    pickString(
      comment?.usuario?.username,
      comment?.usuario?.nombre,
      comment?.user?.username,
      comment?.user?.name,
      comment?.username,
      comment?.user,
      comment?.usuario,
      comment?.author?.username,
      comment?.author?.name,
      comment?.author
    ) || (commentUserId != null ? `usuario_${commentUserId}` : "Usuario");
  const currentUsername = context.currentUsername.trim().toLowerCase();
  const isOwn =
    (context.currentUserId != null &&
      commentUserId != null &&
      context.currentUserId === commentUserId) ||
    (context.currentUserId == null &&
      currentUsername !== "" &&
      currentUsername !== "anon" &&
      username.trim().toLowerCase() === currentUsername);

  const fallbackAvatar = resolveAssetUrl(
    pickString(
      comment?.usuario?.avatarUrl,
      comment?.usuario?.avatarPath,
      comment?.usuario?.avatar_path,
      comment?.usuario?.foto,
      comment?.usuario?.avatar,
      comment?.usuario?.imagenPerfil,
      comment?.user?.avatarUrl,
      comment?.user?.avatarPath,
      comment?.user?.avatar_path,
      comment?.user?.foto,
      comment?.user?.avatar,
      comment?.user?.imagenPerfil,
      comment?.author?.avatarUrl,
      comment?.author?.avatarPath,
      comment?.author?.avatar_path,
      comment?.author?.foto,
      comment?.author?.avatar,
      comment?.author?.imagenPerfil,
      comment?.avatarUrl,
      comment?.avatarPath,
      comment?.avatar_path,
      comment?.foto,
      comment?.avatar,
      comment?.imagenPerfil
    ),
    apiUrl
  );
  const resolvedAvatar =
    isOwn && context.currentUserAvatarUrl
      ? context.currentUserAvatarUrl
      : fallbackAvatar;
  const rawParentId =
    comment?.parentId ??
    comment?.parent_id ??
    comment?.comentarioPadreId ??
    comment?.parentCommentId ??
    null;
  const parentIdNumeric = Number(rawParentId);
  const parentId =
    rawParentId == null
      ? null
      : Number.isFinite(parentIdNumeric) && parentIdNumeric > 0
        ? String(parentIdNumeric)
        : typeof rawParentId === "string" && rawParentId.trim() && rawParentId !== "0"
          ? rawParentId.trim()
          : null;

  const fallbackCommentImage = resolveAssetUrl(
    pickString(
      comment?.imagenUrl,
      comment?.imageUrl,
      comment?.imagen,
      comment?.image,
      comment?.foto
    ),
    apiUrl
  );
  const likeCount =
    parseCount(
      comment?.reacciones?.like ??
        comment?.likes ??
        comment?.likesCount ??
        comment?.reacciones?.count ??
        comment?.reacciones?.totalLikes
    ) ?? 0;
  const dislikeCount =
    parseCount(
      comment?.reacciones?.dislike ??
        comment?.dislikes ??
        comment?.dislikesCount ??
        comment?.reacciones?.totalDislikes
    ) ?? 0;
  const repliesCount =
    (Array.isArray(comment?.respuestas) ? comment.respuestas.length : null) ??
    parseCount(
      comment?.respuestasCount ??
        comment?.replyCount ??
        comment?.repliesCount ??
        comment?.totalRespuestas
    ) ??
    0;
  const userReaction = pickString(
    comment?.reacciones?.userReaction,
    comment?.reacciones?.usuario,
    comment?.reaccion?.tipo,
    comment?.reaccionUsuario?.tipo,
    comment?.userReaction
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const parsedRating = parseRating(
    comment?.rating ??
      comment?.ratingValue ??
      comment?.puntuacion ??
      comment?.valoracion ??
      comment?.rating?.value ??
      comment?.rating?.score ??
      comment?.rating?.puntuacion ??
      comment?.rating?.rating ??
      comment?.rating?.valor ??
      comment?.rating?.average ??
      comment?.valoracion?.puntuacion ??
      comment?.valoracion?.rating ??
      comment?.valoracion?.valor ??
      comment?.valoracionUsuario?.puntuacion ??
      comment?.valoracionUsuario?.rating ??
      comment?.valoracion_usuario?.puntuacion ??
      comment?.valoracion_usuario?.rating ??
      comment?.valoracion_personal?.puntuacion ??
      comment?.valoracion_personal?.rating ??
      comment?.puntuacion_usuario ??
      comment?.valoracion_usuario ??
      comment?.userRating ??
      comment?.user_rating ??
      comment?.ratingUsuario ??
      comment?.rating_usuario ??
      comment?.user?.rating ??
      comment?.user?.puntuacion ??
      comment?.metadata?.rating ??
      comment?.metadata?.rating?.value ??
      comment?.metadata?.rating?.score ??
      comment?.metadata?.puntuacion ??
      comment?.metadata?.valoracion ??
      comment?.metadata?.userRating ??
      comment?.metadata?.user_rating ??
      comment?.metadata?.valoracionUsuario?.puntuacion ??
      comment?.usuario?.puntuacion ??
      comment?.usuario?.rating ??
      comment?.usuario?.valoracion
  );
  const ratingLabel =
    pickString(
      comment?.ratingLabel,
      comment?.rating_label,
      comment?.valoracionLabel,
      comment?.puntuacionLabel,
      comment?.puntuacion_label
    ) || formatRatingOutOfTen(parsedRating);

  return {
    id: commentId,
    numericId,
    parentId,
    repliesCount,
    user: username,
    userId: commentUserId,
    avatarUrl: resolvedAvatar,
    isOwn,
    date: formatCommentDate(
      pickString(
        comment?.createDate,
        comment?.createdAt,
        comment?.date,
        comment?.fecha
      )
    ),
    createdAtMs: parseDateMs(
      pickString(
        comment?.createDate,
        comment?.createdAt,
        comment?.date,
        comment?.fecha
      )
    ),
    rating: toFiveStars(parsedRating) ?? null,
    ratingLabel,
    likeCount,
    dislikeCount,
    isLikedByCurrentUser:
      userReaction === "like" ||
      userReaction === "liked" ||
      userReaction === "me_gusta",
    isDislikedByCurrentUser:
      userReaction === "dislike" ||
      userReaction === "disliked" ||
      userReaction === "no_me_gusta",
    imageUrl: context.localCommentImages[commentId] ?? fallbackCommentImage,
    comment: normalizeCommentBody(
      pickString(
        comment?.mensaje,
        comment?.comment,
        comment?.texto,
        comment?.body
      )
    ),
  };
}
