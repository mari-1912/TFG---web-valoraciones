import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/sections/header";
import Footer from "../components/sections/footer";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CommunityCommentSection,
  type CommunityAction,
  type CommunityPost,
} from "@/components/comments/community-comment-section";
import {
  getCommunityFeed,
  resolveAssetUrl,
  type CommunityActivity,
} from "../services/apiCommunity";
import { getMe } from "../services/auth-service";
import {
  fetchUserFollowingPage,
  fetchUserProfile,
} from "../services/profile-service";
import {
  createContentComment,
  deleteContentComment,
  listContentComments,
  reactToContentComment,
  updateContentComment,
} from "../services/content-comments";
import { buildDetailPath } from "@/lib/detail-route";

// Catálogos para sacar posters reales
import moviesData from "../data/movies.json";
import seriesData from "../data/series.json";
import videoGamesData from "../data/video-games.json";
import booksData from "../data/books.json";

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeAction(value?: string): CommunityAction {
  const key = normalizeKey(value);

  if (
    key === "valoracion" ||
    key === "rating" ||
    key === "rate" ||
    key === "rated"
  ) {
    return "rating";
  }
  if (
    key === "comentario" ||
    key === "comment" ||
    key === "comentar" ||
    key === "left_comment"
  ) {
    return "comment";
  }
  if (
    key === "favorito" ||
    key === "favoritos" ||
    key === "favorite" ||
    key === "favourite"
  ) {
    return "favorite";
  }
  if (
    key === "pendiente" ||
    key === "watchlist" ||
    key === "pending" ||
    key === "por_ver"
  ) {
    return "pending";
  }
  if (
    key === "lista_agregada" ||
    key === "lista" ||
    key === "list_add" ||
    key === "list"
  ) {
    return "list_add";
  }

  // Fallback: tipo desconocido → list_add para que quede excluido del feed
  return "list_add";
}

function normalizeRating(value?: number) {
  if (!Number.isFinite(value)) return undefined;
  const numeric = Number(value);
  return Math.max(0, Math.min(10, numeric));
}

function parseCount(value: unknown) {
  if (value == null) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed < 0 ? null : parsed;
}

function normalizeReactionType(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function formatActivityDate(value?: string) {
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

function parseDateMs(value?: string) {
  if (typeof value !== "string" || !value.trim()) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCommentText(value?: string) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeContentType(value: unknown): CommunityPost["contentType"] {
  const key = normalizeKey(typeof value === "string" ? value : "");
  if (key === "pelicula" || key === "movie") return "película";
  if (key === "serie" || key === "series" || key === "tv") return "serie";
  if (key === "videojuego" || key === "game") return "videojuego";
  if (key === "libro" || key === "book") return "libro";
  return undefined;
}

function normalizeDetailType(value: unknown): CommunityPost["detailType"] {
  const key = normalizeKey(typeof value === "string" ? value : "");
  if (key === "pelicula" || key === "movie") return "pelicula";
  if (key === "serie" || key === "series" || key === "tv") return "serie";
  if (key === "videojuego" || key === "game") return "videojuego";
  if (key === "libro" || key === "book") return "libro";
  return null;
}

function mapActivityToPost(activity: CommunityActivity, index: number): CommunityPost {
  const metadata = activity.metadata ?? {};
  const metadataRecord = metadata as Record<string, unknown>;
  const reactions = (metadataRecord.reacciones ?? metadataRecord.reactions ?? {}) as
    | Record<string, unknown>
    | undefined;
  const contentId =
    Number(
      activity.contenidoId ??
        metadataRecord.contenidoId ??
        metadataRecord.contentId ??
        0
    ) || null;
  const commentId =
    Number(
      (activity as { commentId?: number; comentarioId?: number }).commentId ??
        (activity as { commentId?: number; comentarioId?: number }).comentarioId ??
      metadataRecord.commentId ??
        metadataRecord.comentarioId ??
        metadataRecord.idComentario ??
        (metadataRecord.comment as Record<string, unknown> | undefined)?.commentId ??
        (metadataRecord.comentario as Record<string, unknown> | undefined)?.commentId ??
        0
    ) || null;
  const detailType = normalizeDetailType(
    metadataRecord.tipoContenido ??
      metadataRecord.tipo
  );
  const user = (
    pickString(
      activity.usuario?.username,
      (activity as { user?: { username?: string } | null }).user?.username,
      (activity as { username?: string }).username
    ) || "Usuario"
  ).trim();
  const userId =
    Number(
      activity.userId ??
        activity.usuario?.userId ??
        (activity as { user?: { userId?: number } | null }).user?.userId ??
        0
    ) || null;

  const avatarValue = pickString(
    activity.usuario?.avatarUrl,
    activity.usuario?.avatarPath,
    activity.usuario?.avatar_path,
    activity.usuario?.foto,
    activity.usuario?.avatar,
    (activity as { usuario?: { avatar_path?: string } | null }).usuario
      ?.avatar_path,
    (activity as { avatarUrl?: string }).avatarUrl,
    (activity as { avatarPath?: string }).avatarPath,
    (activity as { avatar_path?: string }).avatar_path,
    (activity as { foto?: string }).foto
  );

  return {
    id:
      String(activity.actividadId ?? "").trim() ||
      `${activity.userId ?? "user"}-${activity.createDate ?? index}-${index}`,
    userId,
    user,
    avatar: resolveAssetUrl(avatarValue || undefined),
    timestampLabel: formatActivityDate(activity.createDate),
    activityDate: activity.createDate,
    action: normalizeAction(activity.tipo),
    listName: activity.nombreLista?.trim() || undefined,
    detailType,
    contentId,
    commentId,
    likeCount:
      parseCount(
        reactions?.like ??
          reactions?.likes ??
          metadataRecord.likes ??
          metadataRecord.likeCount
      ) ?? 0,
    dislikeCount:
      parseCount(
        reactions?.dislike ??
          reactions?.dislikes ??
          metadataRecord.dislikes ??
          metadataRecord.dislikeCount ??
          reactions?.totalDislikes
      ) ?? 0,
    isLikedByCurrentUser:
      [
        "like",
        "liked",
        "me_gusta",
      ].includes(
        normalizeReactionType(
          reactions?.userReaction ??
            metadataRecord.userReaction ??
            metadataRecord.reaccionUsuario
        )
      ),
    isDislikedByCurrentUser:
      [
        "dislike",
        "disliked",
        "no_me_gusta",
      ].includes(
        normalizeReactionType(
        reactions?.userReaction ??
          metadataRecord.userReaction ??
          metadataRecord.reaccionUsuario
        )
      ),
    contentType: normalizeContentType(
      metadataRecord.tipoContenido ??
        metadataRecord.tipo
    ),
    title: activity.tituloContenido?.trim() || undefined,
    poster: resolveAssetUrl(activity.portadaContenido),
    rating: normalizeRating(activity.puntuacion),
    comment: activity.textoComentario?.trim() || undefined,
  };
}

async function hydrateAvatars(
  posts: CommunityPost[],
  signal?: AbortSignal
): Promise<CommunityPost[]> {
  const missingUserIds = Array.from(
    new Set(
      posts
        .filter((post) => post.userId != null)
        .map((post) => post.userId as number)
    )
  ).slice(0, 20);

  if (!missingUserIds.length) return posts;

  const avatarByUserId = new Map<number, string>();
  await Promise.all(
    missingUserIds.map(async (userId) => {
      try {
        const payload = await fetchUserProfile(userId, signal);
        const perfil = payload?.perfil ?? {};
        const avatar = resolveAssetUrl(
          pickString(
            (perfil as { avatarUrl?: string }).avatarUrl,
            (perfil as { avatarPath?: string }).avatarPath,
            (perfil as { avatar_path?: string }).avatar_path,
            (perfil as { foto?: string }).foto,
            (perfil as { avatar?: string }).avatar,
            (perfil as { imagenPerfil?: string }).imagenPerfil
          ) || undefined
        );
        if (avatar) avatarByUserId.set(userId, avatar);
      } catch {
        // Si falla para un usuario, no bloqueamos el feed.
      }
    })
  );

  if (!avatarByUserId.size) return posts;

  return posts.map((post) => {
    if (post.userId == null) return post;
    const hydratedAvatar = avatarByUserId.get(post.userId);
    if (!hydratedAvatar) return post;
    return { ...post, avatar: hydratedAvatar };
  });
}

type CatalogItem = { id: string; title: string; imgSrc?: string };

const MOVIES = moviesData as CatalogItem[];
const SERIES = seriesData as CatalogItem[];
const GAMES = videoGamesData as CatalogItem[];
const BOOKS = booksData as CatalogItem[];

const CATALOGS: Record<string, CatalogItem[]> = {
  pelicula: MOVIES,
  película: MOVIES,
  serie: SERIES,
  videojuego: GAMES,
  libro: BOOKS,
};

const DETAIL_TYPE_CATALOGS: Array<{
  type: NonNullable<CommunityPost["detailType"]>;
  list: CatalogItem[];
}> = [
  { type: "pelicula", list: MOVIES },
  { type: "serie", list: SERIES },
  { type: "videojuego", list: GAMES },
  { type: "libro", list: BOOKS },
];

const COMMUNITY_PAGE_SIZE = 20;

function normalizeKey(s?: string) {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("í", "i")
    .replaceAll("á", "a")
    .replaceAll("é", "e")
    .replaceAll("ó", "o")
    .replaceAll("ú", "u");
}

function findPosterByType(contentType?: string, title?: string) {
  if (!contentType || !title) return undefined;
  const key = normalizeKey(contentType);
  const list = CATALOGS[key] ?? [];
  const t = title.trim().toLowerCase();
  return list.find((x) => x.title.trim().toLowerCase() === t)?.imgSrc;
}

function findPosterAnywhere(title?: string) {
  if (!title) return undefined;
  const t = title.trim().toLowerCase();
  const all = [...MOVIES, ...SERIES, ...GAMES, ...BOOKS];
  return all.find((x) => x.title.trim().toLowerCase() === t)?.imgSrc;
}

function inferDetailTypeFromPost(post: CommunityPost): CommunityPost["detailType"] {
  if (post.detailType) return post.detailType;

  const normalizedContentType = normalizeKey(post.contentType);
  if (normalizedContentType === "pelicula") return "pelicula";
  if (normalizedContentType === "serie") return "serie";
  if (normalizedContentType === "videojuego") return "videojuego";
  if (normalizedContentType === "libro") return "libro";

  if (post.contentId != null) {
    const contentId = String(post.contentId);
    for (const entry of DETAIL_TYPE_CATALOGS) {
      if (entry.list.some((item) => String(item.id) === contentId)) {
        return entry.type;
      }
    }
  }

  const normalizedTitle = post.title?.trim().toLowerCase();
  if (normalizedTitle) {
    for (const entry of DETAIL_TYPE_CATALOGS) {
      if (entry.list.some((item) => item.title.trim().toLowerCase() === normalizedTitle)) {
        return entry.type;
      }
    }
  }

  return "pelicula";
}

export default function CommunityPage() {
  const navigate = useNavigate();
  const resolvedCommentIdCacheRef = useRef<Map<string, number>>(new Map());
  const [feed, setFeed] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingPostId, setProcessingPostId] = useState<string | null>(null);
  const [replyingPostId, setReplyingPostId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUsername, setCurrentUsername] = useState("");
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);
  const [followedUserIds, setFollowedUserIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const isOwnCommentPost = useCallback(
    (post: CommunityPost) => {
      if (currentUserId != null && post.userId != null) {
        return currentUserId === post.userId;
      }
      const ownName = currentUsername.trim().toLowerCase();
      return ownName !== "" && normalizeUsername(post.user) === ownName;
    },
    [currentUserId, currentUsername]
  );

  const resolveCommentIdForPost = useCallback(async (post: CommunityPost) => {
    if (post.contentId == null || !Number.isFinite(post.contentId)) return null;

    const cached = resolvedCommentIdCacheRef.current.get(post.id);
    if (cached != null && Number.isFinite(cached) && cached > 0) {
      return cached;
    }

    const payload = await listContentComments(post.contentId);
    const rootComments = Array.isArray(payload?.comentarios) ? payload.comentarios : [];
    const flattened: Array<{
      id: number;
      username: string;
      message: string;
      createdAtMs: number;
    }> = [];

    const pushComment = (node: unknown) => {
      if (!node || typeof node !== "object") return;
      const n = node as Record<string, unknown>;
      const id = Number(n?.commentId ?? n?.id ?? n?.comentarioId ?? 0);
      const username = normalizeUsername(
        pickString(
          (n?.usuario as Record<string, unknown> | undefined)?.username,
          (n?.user as Record<string, unknown> | undefined)?.username,
          n?.username,
          n?.user,
          n?.usuario,
          n?.author
        )
      );
      const message = normalizeCommentText(
        pickString(n?.mensaje, n?.comment, n?.texto, n?.body)
      );
      const createdAtMs = parseDateMs(
        pickString(n?.createDate, n?.createdAt, n?.date, n?.fecha)
      );

      if (Number.isFinite(id) && id > 0) {
        flattened.push({ id, username, message, createdAtMs });
      }

      const replies = Array.isArray(n?.respuestas) ? n.respuestas : [];
      replies.forEach((reply: unknown) => {
        if (reply && typeof reply === "object") pushComment(reply);
      });
    };

    rootComments.forEach(pushComment);

    const directCommentId = Number(post.commentId ?? 0);
    if (
      Number.isFinite(directCommentId) &&
      directCommentId > 0 &&
      flattened.some((row) => row.id === directCommentId)
    ) {
      resolvedCommentIdCacheRef.current.set(post.id, directCommentId);
      return directCommentId;
    }

    const normalizedUser = normalizeUsername(post.user);
    const normalizedMessage = normalizeCommentText(post.comment);
    const postDateMs = parseDateMs(post.activityDate);
    let candidates = flattened;

    if (normalizedMessage) {
      const byMessage = candidates.filter((row) => row.message === normalizedMessage);
      if (byMessage.length) candidates = byMessage;
    }
    if (normalizedUser) {
      const byUser = candidates.filter((row) => row.username === normalizedUser);
      if (byUser.length) candidates = byUser;
    }

    if (!candidates.length && normalizedUser) {
      const byUser = flattened.filter((row) => row.username === normalizedUser);
      if (byUser.length) candidates = byUser;
    }
    if (!candidates.length && normalizedMessage) {
      const byMessage = flattened.filter((row) => row.message === normalizedMessage);
      if (byMessage.length) candidates = byMessage;
    }

    let resolved: number | null = null;
    if (candidates.length) {
      if (postDateMs > 0) {
        resolved = candidates
          .slice()
          .sort(
            (a, b) =>
              Math.abs(a.createdAtMs - postDateMs) - Math.abs(b.createdAtMs - postDateMs)
          )[0]?.id ?? null;
      } else {
        resolved = candidates[0]?.id ?? null;
      }
    }

    if (resolved == null && Number.isFinite(directCommentId) && directCommentId > 0) {
      resolved = directCommentId;
    }

    if (resolved != null) {
      resolvedCommentIdCacheRef.current.set(post.id, resolved);
    }
    return resolved;
  }, []);

  const loadFeed = useCallback(
    async ({
      signal,
      userIds,
      silent = false,
    }: {
      signal?: AbortSignal;
      userIds: number[];
      silent?: boolean;
    }) => {
      if (!silent) setLoading(true);
      try {
        if (!userIds.length) {
          setFeed([]);
          setError(null);
          return;
        }
        const payload = await getCommunityFeed({
          page: 1,
          pageSize: COMMUNITY_PAGE_SIZE,
          userIds,
          signal,
        });
        if (signal?.aborted) return;

        const activities = Array.isArray(payload?.actividades) ? payload.actividades : [];
        const mapped = activities.map(mapActivityToPost).filter(
          (p) => p.action === "comment" || p.action === "left_comment" || p.action === "rating"
        );
        const hydrated = await hydrateAvatars(mapped, signal);
        if (signal?.aborted) return;

        setFeed(hydrated);
        setCurrentPage(1);
        setTotalPages(Number(payload?.pagination?.pages ?? 1));
        setError(null);
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        if (!silent) setFeed([]);
        setError(err instanceof Error ? err.message : "No se pudo cargar el feed de comunidad.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const initialize = async () => {
      try {
        const me = await getMe();
        if (controller.signal.aborted) return;

        let userId: number | null = null;
        if (me.success && me.user) {
          userId = Number(me.user.user_id) || null;
          setCurrentUserId(userId);
          setCurrentUsername((me.user.username ?? "").trim());
          setCurrentUserIsAdmin((me.user.role ?? "").toLowerCase() === "admin");
        }

        // Obtener IDs de usuarios seguidos desde el endpoint existente
        let userIds: number[] = [];
        if (userId != null) {
          try {
            const followingPage = await fetchUserFollowingPage(userId, {
              pageSize: 200,
              signal: controller.signal,
            });
            userIds = followingPage.users.map((u) => u.userId);
          } catch {
            // Si falla, se muestra el feed vacío
          }
        }

        setFollowedUserIds(userIds);
        await loadFeed({ signal: controller.signal, userIds });
      } catch (err) {
        if (!controller.signal.aborted) {
          setFeed([]);
          setError(err instanceof Error ? err.message : "No se pudo cargar el feed de comunidad.");
          setLoading(false);
        }
      }
    };

    void initialize();
    return () => controller.abort();
  }, [loadFeed]);

  useEffect(() => {
    if (loading) return;

    const refresh = () => void loadFeed({ userIds: followedUserIds, silent: true });

    const intervalId = window.setInterval(refresh, 30_000);
    const handleFocus = () => refresh();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loading, loadFeed, followedUserIds]);

  const refreshFeedSilently = useCallback(async () => {
    await loadFeed({ userIds: followedUserIds, silent: true });
  }, [loadFeed, followedUserIds]);

  const loadMoreFeed = useCallback(async () => {
    const nextPage = currentPage + 1;
    if (nextPage > totalPages || !followedUserIds.length) return;
    setLoadingMore(true);
    try {
      const payload = await getCommunityFeed({
        page: nextPage,
        pageSize: COMMUNITY_PAGE_SIZE,
        userIds: followedUserIds,
      });
      const activities = Array.isArray(payload?.actividades) ? payload.actividades : [];
      const mapped = activities.map(mapActivityToPost).filter(
          (p) => p.action === "comment" || p.action === "left_comment" || p.action === "rating"
        );
      const hydrated = await hydrateAvatars(mapped);
      setFeed((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        return [...prev, ...hydrated.filter((p) => !existingIds.has(p.id))];
      });
      setCurrentPage(nextPage);
      setTotalPages(Number(payload?.pagination?.pages ?? totalPages));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo cargar más actividad.");
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, totalPages, followedUserIds]);

  const openPostDetail = useCallback(
    async (post: CommunityPost) => {
      if (post.contentId == null || !Number.isFinite(post.contentId)) return;
      const resolvedDetailType = inferDetailTypeFromPost(post);
      const resolvedCommentId = await resolveCommentIdForPost(post);
      if (resolvedCommentId != null && Number.isFinite(resolvedCommentId)) {
        navigate(
          `${buildDetailPath(
            resolvedDetailType,
            post.contentId,
            post.title
          )}?commentId=${resolvedCommentId}`,
          {
            state: {
              item: {
                id: post.contentId,
                titulo: post.title ?? "",
                tipo: resolvedDetailType,
              },
              focusCommentId: String(resolvedCommentId),
              focusCommentText: post.comment ?? null,
              focusCommentUser: post.user ?? null,
            },
          }
        );
        return;
      }
      navigate(
        buildDetailPath(resolvedDetailType, post.contentId, post.title),
        {
          state: {
            item: {
              id: post.contentId,
              titulo: post.title ?? "",
              tipo: resolvedDetailType,
            },
          },
        }
      );
    },
    [navigate, resolveCommentIdForPost]
  );

  const rows = useMemo(() => feed ?? [], [feed]);

  const handleLikeCommentFromFeed = useCallback(
    async (post: CommunityPost) => {
      if (post.contentId == null) return;
      setProcessingPostId(post.id);
      setActionError(null);
      setActionMessage(null);
      try {
        const resolvedCommentId = await resolveCommentIdForPost(post);
        if (resolvedCommentId == null) {
          throw new Error("No se pudo localizar el comentario para dar like.");
        }
        await reactToContentComment(post.contentId, resolvedCommentId, "like");
        await refreshFeedSilently();
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "No se pudo registrar el like."
        );
      } finally {
        setProcessingPostId(null);
      }
    },
    [refreshFeedSilently, resolveCommentIdForPost]
  );

  const handleDislikeCommentFromFeed = useCallback(
    async (post: CommunityPost) => {
      if (post.contentId == null) return;
      setProcessingPostId(post.id);
      setActionError(null);
      setActionMessage(null);
      try {
        const resolvedCommentId = await resolveCommentIdForPost(post);
        if (resolvedCommentId == null) {
          throw new Error("No se pudo localizar el comentario para dar dislike.");
        }
        await reactToContentComment(post.contentId, resolvedCommentId, "dislike");
        await refreshFeedSilently();
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "No se pudo registrar el dislike."
        );
      } finally {
        setProcessingPostId(null);
      }
    },
    [refreshFeedSilently, resolveCommentIdForPost]
  );

  const handleReplyFromFeed = useCallback(
    async (post: CommunityPost) => {
      const message = replyDraft.trim();
      if (!message) {
        setActionError("La respuesta no puede estar vacía.");
        return;
      }
      if (post.contentId == null) return;
      setProcessingPostId(post.id);
      setActionError(null);
      setActionMessage(null);
      try {
        const resolvedCommentId = await resolveCommentIdForPost(post);
        if (resolvedCommentId == null) {
          throw new Error("No se pudo localizar el comentario padre.");
        }
        await createContentComment(post.contentId, message, resolvedCommentId);
        setReplyDraft("");
        setReplyingPostId(null);
        setActionMessage("Respuesta publicada.");
        await refreshFeedSilently();
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "No se pudo responder al comentario."
        );
      } finally {
        setProcessingPostId(null);
      }
    },
    [replyDraft, refreshFeedSilently, resolveCommentIdForPost]
  );

  const handleEditFromFeed = useCallback(
    async (post: CommunityPost) => {
      const message = editingDraft.trim();
      if (!message) {
        setActionError("El comentario no puede estar vacío.");
        return;
      }
      if (post.contentId == null) return;
      setProcessingPostId(post.id);
      setActionError(null);
      setActionMessage(null);
      try {
        const resolvedCommentId = await resolveCommentIdForPost(post);
        if (resolvedCommentId == null) {
          throw new Error("No se pudo localizar el comentario para editar.");
        }
        await updateContentComment(post.contentId, resolvedCommentId, message);
        setEditingDraft("");
        setEditingPostId(null);
        setActionMessage("Comentario actualizado.");
        await refreshFeedSilently();
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "No se pudo editar el comentario."
        );
      } finally {
        setProcessingPostId(null);
      }
    },
    [editingDraft, refreshFeedSilently, resolveCommentIdForPost]
  );

  const handleDeleteFromFeed = useCallback(
    async (post: CommunityPost) => {
      if (post.contentId == null) return;
      setProcessingPostId(post.id);
      setActionError(null);
      setActionMessage(null);
      try {
        const resolvedCommentId = await resolveCommentIdForPost(post);
        if (resolvedCommentId == null) {
          throw new Error("No se pudo localizar el comentario para borrar.");
        }
        await deleteContentComment(post.contentId, resolvedCommentId);
        setActionMessage("Comentario eliminado.");
        await refreshFeedSilently();
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "No se pudo borrar el comentario."
        );
      } finally {
        setProcessingPostId(null);
      }
    },
    [refreshFeedSilently, resolveCommentIdForPost]
  );

  const handleOpenUserProfile = useCallback(
    (post: CommunityPost) => {
      if (!(typeof post.userId === "number" && Number.isFinite(post.userId) && post.userId > 0)) {
        return;
      }
      navigate(`/perfil?userId=${post.userId}`);
    },
    [navigate]
  );

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(167,139,250,0.18),_transparent_55%),linear-gradient(180deg,#faf7ff_0%,#ffffff_35%,#ffffff_100%)] pt-28 md:pt-32">
          <div className="mx-auto max-w-6xl space-y-4 px-6 pb-10">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`community-skeleton-${index}`}
                className="rounded-[26px] border border-violet-200/80 bg-white/95 p-4 shadow-[0_12px_30px_rgba(124,58,237,0.16)]"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex items-center gap-3 md:w-52 md:shrink-0">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                  </div>
                  <div className="flex items-center justify-end gap-3 md:w-[220px]">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-16 w-12 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(167,139,250,0.18),_transparent_55%),linear-gradient(180deg,#faf7ff_0%,#ffffff_35%,#ffffff_100%)] pt-28 md:pt-32">
        <div className="mx-auto max-w-6xl px-6 pb-10">
          {error ? (
            <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
          {actionMessage ? (
            <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
              {actionMessage}
            </p>
          ) : null}
          {actionError ? (
            <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
              {actionError}
            </p>
          ) : null}

          <CommunityCommentSection
            rows={rows}
            currentUserIsAdmin={currentUserIsAdmin}
            isOwnCommentPost={isOwnCommentPost}
            processingPostId={processingPostId}
            replyingPostId={replyingPostId}
            replyDraft={replyDraft}
            setReplyingPostId={setReplyingPostId}
            setReplyDraft={setReplyDraft}
            editingPostId={editingPostId}
            editingDraft={editingDraft}
            setEditingPostId={setEditingPostId}
            setEditingDraft={setEditingDraft}
            clearActionError={() => setActionError(null)}
            onOpenPostDetail={openPostDetail}
            onOpenUserProfile={handleOpenUserProfile}
            onLikeComment={handleLikeCommentFromFeed}
            onDislikeComment={handleDislikeCommentFromFeed}
            onReplyComment={handleReplyFromFeed}
            onEditComment={handleEditFromFeed}
            onDeleteComment={handleDeleteFromFeed}
            getPosterSrc={(post) =>
              post.poster ??
              findPosterByType(post.contentType, post.title) ??
              findPosterAnywhere(post.title)
            }
            currentPage={currentPage}
            totalPages={totalPages}
            loadingMore={loadingMore}
            onLoadMore={loadMoreFeed}
          />
        </div>
      </main>

      <Footer />
    </>
  );
}
