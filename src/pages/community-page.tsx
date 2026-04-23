import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircleReply, Pencil, Star, ThumbsUp, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/sections/header";
import Footer from "../components/sections/footer";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCommunityFeed,
  resolveAssetUrl,
  type CommunityActivity,
} from "../services/apiCommunity";
import { getMe } from "../services/auth-service";
import {
  fetchMyFollowingTargets,
  fetchMyProfile,
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

type CommunityAction =
  | "comment"
  | "left_comment"
  | "favorite"
  | "pending"
  | "list_add"
  | "rating";

interface CommunityPost {
  id: string;
  userId?: number | null;
  user: string;
  avatar?: string;
  timestampLabel?: string;
  activityDate?: string;

  action?: CommunityAction;
  listName?: string;

  // Para posters reales:
  contentType?: "película" | "serie" | "videojuego" | "libro";
  detailType?: "pelicula" | "serie" | "videojuego" | "libro" | null;
  contentId?: number | null;
  commentId?: number | null;
  likeCount?: number;
  isLikedByCurrentUser?: boolean;
  title?: string;

  // Opcional: fuerza un poster desde community.json
  poster?: string;

  rating?: number; // 0..10
  comment?: string;
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

type FollowTargets = {
  userIds: Set<number>;
  usernames: Set<string>;
};

function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function parseFollowingTargetsFromProfilePayload(payload: any): FollowTargets {
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
      const normalized = normalizeUsername(entry);
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
        row.followedId ??
        row.followingUserId ??
        row.following_id ??
        row.followed_id ??
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
      usernames.add(normalizeUsername(username));
    }
  };

  const root = payload ?? {};
  const perfil = root?.perfil ?? {};
  const seguimiento = root?.seguimiento ?? perfil?.seguimiento ?? {};
  const arrays = [
    root?.siguiendo,
    root?.seguidos,
    root?.following,
    root?.followingUsers,
    root?.siguiendoUsuarios,
    root?.usuariosSeguidos,
    root?.follows,
    root?.seguidosUsuarios,
    seguimiento?.siguiendo,
    seguimiento?.seguidos,
    seguimiento?.following,
    seguimiento?.followingUsers,
    seguimiento?.siguiendoUsuarios,
    seguimiento?.usuariosSeguidos,
    seguimiento?.follows,
    perfil?.siguiendo,
    perfil?.seguidos,
    perfil?.following,
    perfil?.followingUsers,
    perfil?.siguiendoUsuarios,
    perfil?.usuariosSeguidos,
    perfil?.follows,
  ];

  for (const candidate of arrays) {
    if (!Array.isArray(candidate)) continue;
    for (const row of candidate) {
      pushUser(row);
    }
  }

  return { userIds, usernames };
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
  if (key === "lista" || key === "list_add" || key === "list") {
    return "list_add";
  }

  return "comment";
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

function formatRatingLabel(value?: number) {
  if (!Number.isFinite(value)) return null;
  const normalized = normalizeRating(value);
  if (normalized == null) return null;
  const asText = Number.isInteger(normalized)
    ? String(normalized)
    : normalized.toFixed(1).replace(".", ",");
  return `${asText}/10`;
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
  const metadataRecord = metadata as Record<string, any>;
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
        metadataRecord.comment?.commentId ??
        metadataRecord.comentario?.commentId ??
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
    isLikedByCurrentUser:
      String(
        reactions?.userReaction ??
          metadataRecord.userReaction ??
          metadataRecord.reaccionUsuario
      )
        .trim()
        .toLowerCase() === "like",
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
const COMMUNITY_MAX_PAGES_TO_SCAN = 8;
const COMMUNITY_TARGET_POSTS = 20;

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

function RatingBadge({ rating }: { rating?: number }) {
  const label = formatRatingLabel(rating);
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-500">
      <span>{label}</span>
      <Star className="h-3.5 w-3.5 fill-current" />
    </span>
  );
}

function buildMessage(post: CommunityPost) {
  const user = post.user || "Customer";
  const action = post.action ?? (post.rating ? "rating" : "comment");

  switch (action) {
    case "comment":
      return `${user} ha comentado`;
    case "left_comment":
      return `${user} ha dejado un comentario`;
    case "favorite":
      return `${user} ha añadido a favoritos:`;
    case "pending":
      return `${user} ha añadido a pendientes:`;
    case "list_add":
      return `${user} ha añadido a la lista de ${post.listName ?? "terror"}:`;
    case "rating":
    default:
      return `${user} ha añadido una nueva valoración:`;
  }
}

function Avatar({ user, src }: { user: string; src?: string }) {
  const [ok, setOk] = useState(true);
  const letter = (user?.trim()?.[0] ?? "C").toUpperCase();

  useEffect(() => {
    setOk(true);
  }, [src]);

  if (src && ok) {
    return (
      <img
        src={src}
        alt={user}
        className="h-12 w-12 rounded-full object-cover bg-gray-200"
        loading="lazy"
        onError={() => setOk(false)}
      />
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 font-semibold text-gray-700">
      {letter}
    </div>
  );
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
  const [followTargets, setFollowTargets] = useState<FollowTargets>({
    userIds: new Set<number>(),
    usernames: new Set<string>(),
  });

  const isOwnPost = useCallback(
    (post: CommunityPost, userId: number | null, username: string) => {
      if (userId != null && post.userId != null) {
        return userId === post.userId;
      }

      const ownName = username.trim().toLowerCase();
      if (!ownName) return false;
      return post.user.trim().toLowerCase() === ownName;
    },
    []
  );

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

    const pushComment = (node: any) => {
      if (!node || typeof node !== "object") return;
      const id = Number(node?.commentId ?? node?.id ?? node?.comentarioId ?? 0);
      const username = normalizeUsername(
        pickString(
          node?.usuario?.username,
          node?.user?.username,
          node?.username,
          node?.user,
          node?.usuario,
          node?.author
        )
      );
      const message = normalizeCommentText(
        pickString(
          node?.mensaje,
          node?.comment,
          node?.texto,
          node?.body
        )
      );
      const createdAtMs = parseDateMs(
        pickString(
          node?.createDate,
          node?.createdAt,
          node?.date,
          node?.fecha
        )
      );

      if (Number.isFinite(id) && id > 0) {
        flattened.push({ id, username, message, createdAtMs });
      }

      const replies = Array.isArray(node?.respuestas) ? node.respuestas : [];
      replies.forEach((reply: any) => {
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
      userId,
      username,
      followedTargets,
      silent = false,
    }: {
      signal?: AbortSignal;
      userId: number | null;
      username: string;
      followedTargets: FollowTargets;
      silent?: boolean;
    }) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const hasFollowTargets =
          followedTargets.userIds.size > 0 || followedTargets.usernames.size > 0;
        if (!hasFollowTargets) {
          setFeed([]);
          setError(null);
          return;
        }

        const followedPosts: CommunityPost[] = [];
        for (let page = 1; page <= COMMUNITY_MAX_PAGES_TO_SCAN; page += 1) {
          if (signal?.aborted) return;
          const payload = await getCommunityFeed({
            page,
            pageSize: COMMUNITY_PAGE_SIZE,
            signal,
          });
          const activities = Array.isArray(payload?.actividades)
            ? payload.actividades
            : [];
          if (!activities.length) break;

          const mapped = activities.map(mapActivityToPost);
          for (const post of mapped) {
            if (isOwnPost(post, userId, username)) continue;
            if (post.userId != null && followedTargets.userIds.has(post.userId)) {
              followedPosts.push(post);
              continue;
            }
            const normalizedPostUsername = normalizeUsername(post.user);
            if (
              normalizedPostUsername !== "" &&
              followedTargets.usernames.has(normalizedPostUsername)
            ) {
              followedPosts.push(post);
            }
          }

          if (followedPosts.length >= COMMUNITY_TARGET_POSTS) break;
          const totalPages = Number(payload?.pagination?.pages ?? 0);
          if (Number.isFinite(totalPages) && totalPages > 0 && page >= totalPages) {
            break;
          }
        }

        const dedupedById = new Map<string, CommunityPost>();
        for (const post of followedPosts) {
          if (!dedupedById.has(post.id)) {
            dedupedById.set(post.id, post);
          }
        }

        const hydrated = await hydrateAvatars(
          [...dedupedById.values()].slice(0, COMMUNITY_TARGET_POSTS),
          signal
        );
        if (signal?.aborted) return;

        setFeed(hydrated);
        setError(null);
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        if (!silent) {
          setFeed([]);
        }
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar el feed de comunidad."
        );
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [isOwnPost]
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const initialize = async () => {
      let userId: number | null = null;
      let username = "";

      try {
        const me = await getMe();
        if (controller.signal.aborted) return;

        if (me.success && me.user) {
          userId = Number(me.user.user_id) || null;
          username = (me.user.username ?? "").trim();
          setCurrentUserIsAdmin((me.user.role ?? "").toLowerCase() === "admin");
        } else {
          setCurrentUserIsAdmin(false);
        }
        setCurrentUserId(userId);
        setCurrentUsername(username);

        let serverFollowTargets: FollowTargets = {
          userIds: new Set<number>(),
          usernames: new Set<string>(),
        };
        if (userId != null) {
          try {
            const profilePayload = await fetchMyProfile(controller.signal);
            if (!controller.signal.aborted) {
              serverFollowTargets =
                parseFollowingTargetsFromProfilePayload(profilePayload);
            }
          } catch {
            // Si falla esta lectura adicional, seguimos con objetivos vacíos.
          }

          if (
            !controller.signal.aborted &&
            serverFollowTargets.userIds.size === 0 &&
            serverFollowTargets.usernames.size === 0
          ) {
            try {
              const rawTargets = await fetchMyFollowingTargets(controller.signal);
              if (!controller.signal.aborted) {
                serverFollowTargets = {
                  userIds: new Set(rawTargets.userIds),
                  usernames: new Set(rawTargets.usernames),
                };
              }
            } catch {
              // Si también falla, mantenemos objetivos vacíos.
            }
          }
        }

        setFollowTargets(serverFollowTargets);

        await loadFeed({
          signal: controller.signal,
          userId,
          username,
          followedTargets: serverFollowTargets,
          silent: false,
        });
      } catch (err) {
        if (!controller.signal.aborted) {
          setFeed([]);
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar el feed de comunidad."
          );
          setLoading(false);
        }
      }
    };

    void initialize();
    return () => controller.abort();
  }, [loadFeed]);

  useEffect(() => {
    if (loading) return;

    const refresh = () => {
      void loadFeed({
        userId: currentUserId,
        username: currentUsername,
        followedTargets: followTargets,
        silent: true,
      });
    };

    const intervalId = window.setInterval(refresh, 30000);

    const handleFocus = () => refresh();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [
    currentUserId,
    currentUsername,
    followTargets,
    loadFeed,
    loading,
  ]);

  const refreshFeedSilently = useCallback(async () => {
    await loadFeed({
      userId: currentUserId,
      username: currentUsername,
      followedTargets: followTargets,
      silent: true,
    });
  }, [
    currentUserId,
    currentUsername,
    followTargets,
    loadFeed,
  ]);

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

          <section className="space-y-4">
            {!rows.length ? (
              <div className="rounded-[26px] border border-violet-200/80 bg-white/90 px-5 py-6 text-sm text-gray-600 shadow-[0_12px_28px_rgba(124,58,237,0.16)]">
                Aún no hay actividad reciente de usuarios que sigues.
              </div>
            ) : null}
            {rows.map((post) => {
              const msg = buildMessage(post);
              const action = post.action ?? (post.rating ? "rating" : "comment");
              const canNavigateToDetail =
                post.contentId != null &&
                Number.isFinite(post.contentId);
              const canNavigateToUserProfile =
                typeof post.userId === "number" &&
                Number.isFinite(post.userId) &&
                post.userId > 0;
              const isCommentPost = action === "comment" || action === "left_comment";
              const canModerateThisPost =
                isCommentPost &&
                post.contentId != null &&
                (isOwnCommentPost(post) || currentUserIsAdmin);
              const canEditThisPost =
                isCommentPost &&
                post.contentId != null &&
                isOwnCommentPost(post);
              const canReplyThisPost =
                isCommentPost &&
                post.contentId != null;
              const canLikeThisPost =
                isCommentPost &&
                post.contentId != null;
              const isReplying = replyingPostId === post.id;
              const isEditing = editingPostId === post.id;
              const isProcessing = processingPostId === post.id;

              const showRating = action === "rating";
              const showQuotedComment =
                action === "rating" && (post.comment?.trim()?.length ?? 0) > 0;

              const posterSrc =
                post.poster ??
                findPosterByType(post.contentType, post.title) ??
                findPosterAnywhere(post.title);

              return (
                <article
                  key={post.id}
                  className="rounded-[26px] border border-violet-200/80 bg-white/95 p-4 shadow-[0_12px_30px_rgba(124,58,237,0.16)] transition hover:shadow-[0_18px_36px_rgba(124,58,237,0.2)]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-3 md:w-52 md:shrink-0">
                      {canNavigateToUserProfile ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenUserProfile(post);
                          }}
                          className="rounded-full outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-violet-400"
                          aria-label={`Ir al perfil de ${post.user}`}
                        >
                          <Avatar user={post.user} src={post.avatar} />
                        </button>
                      ) : (
                        <Avatar user={post.user} src={post.avatar} />
                      )}
                      <span className="max-w-[160px] truncate text-sm font-semibold text-gray-900">
                        {post.user}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-gray-800">{msg}</p>
                        <span className="shrink-0 text-xs text-gray-500">
                          {post.timestampLabel ?? "hace poco"}
                        </span>
                      </div>

                      {showRating ? (
                        <div className="mt-2">
                          <RatingBadge rating={post.rating} />
                        </div>
                      ) : null}

                      {showQuotedComment ? (
                        <button
                          type="button"
                          onClick={() => void openPostDetail(post)}
                          className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-left text-sm text-gray-700 transition hover:border-gray-300 hover:bg-gray-200/80"
                        >
                          “{post.comment}”
                        </button>
                      ) : null}

                      {isCommentPost && post.comment?.trim() ? (
                        <button
                          type="button"
                          onClick={() => void openPostDetail(post)}
                          className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-left text-sm text-gray-700 transition hover:border-gray-300 hover:bg-gray-200/80"
                        >
                          {post.comment}
                        </button>
                      ) : null}

                      {(canLikeThisPost ||
                        canReplyThisPost ||
                        canEditThisPost ||
                        canModerateThisPost) && (
                        <div
                          className="mt-3 flex flex-wrap items-center gap-2"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {canLikeThisPost ? (
                            <button
                              type="button"
                              onClick={() => void handleLikeCommentFromFeed(post)}
                              disabled={isProcessing}
                              className={`inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                post.isLikedByCurrentUser
                                  ? "border-indigo-200 bg-indigo-100 text-indigo-700"
                                  : "border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {typeof post.likeCount === "number" && post.likeCount > 0 ? (
                                <span>{post.likeCount}</span>
                              ) : null}
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                          {canReplyThisPost ? (
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingPostId(post.id);
                                setEditingPostId(null);
                                setReplyDraft(`@${post.user} `);
                                setActionError(null);
                              }}
                              className="inline-flex h-8 items-center gap-1 rounded-full border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                            >
                              <MessageCircleReply className="h-3.5 w-3.5" />
                              Responder
                            </button>
                          ) : null}
                          {canEditThisPost ? (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPostId(post.id);
                                setReplyingPostId(null);
                                setEditingDraft(post.comment ?? "");
                                setActionError(null);
                              }}
                              className="inline-flex h-8 items-center gap-1 rounded-full border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Editar
                            </button>
                          ) : null}
                          {canModerateThisPost ? (
                            <button
                              type="button"
                              onClick={() => void handleDeleteFromFeed(post)}
                              disabled={isProcessing}
                              className="inline-flex h-8 items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {isProcessing ? "Borrando..." : "Eliminar"}
                            </button>
                          ) : null}
                        </div>
                      )}

                      {isReplying && canReplyThisPost ? (
                        <div
                          className="mt-3 space-y-2"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <textarea
                            value={replyDraft}
                            onChange={(event) => setReplyDraft(event.target.value)}
                            className="min-h-[90px] w-full resize-y rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                            placeholder="Escribe tu respuesta..."
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingPostId(null);
                                setReplyDraft("");
                              }}
                              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleReplyFromFeed(post)}
                              disabled={isProcessing}
                              className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isProcessing ? "Enviando..." : "Responder"}
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {isEditing && canEditThisPost ? (
                        <div
                          className="mt-3 space-y-2"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <textarea
                            value={editingDraft}
                            onChange={(event) => setEditingDraft(event.target.value)}
                            className="min-h-[90px] w-full resize-y rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                            placeholder="Edita tu comentario..."
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPostId(null);
                                setEditingDraft("");
                              }}
                              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleEditFromFeed(post)}
                              disabled={isProcessing}
                              className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isProcessing ? "Guardando..." : "Guardar"}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between gap-3 md:w-[220px] md:justify-end">
                      <span
                        className={`text-sm ${post.title ? "font-semibold text-gray-900" : "text-gray-400"}`}
                      >
                        {post.title ?? "Título"}
                      </span>
                      {canNavigateToDetail ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void openPostDetail(post);
                          }}
                          className="group rounded-lg outline-none transition focus-visible:ring-2 focus-visible:ring-violet-400"
                          aria-label={`Ir al detalle de ${post.title ?? "este título"}`}
                        >
                          {posterSrc ? (
                            <img
                              src={posterSrc}
                              alt={`Poster ${post.title ?? ""}`}
                              className="h-16 w-12 rounded-lg border border-violet-100 object-cover bg-gray-200 shadow-sm transition group-hover:border-violet-300 group-hover:shadow-md"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-16 w-12 rounded-lg border border-violet-100 bg-gray-200 transition group-hover:border-violet-300 group-hover:shadow-md" />
                          )}
                        </button>
                      ) : posterSrc ? (
                        <img
                          src={posterSrc}
                          alt={`Poster ${post.title ?? ""}`}
                          className="h-16 w-12 rounded-lg border border-violet-100 object-cover bg-gray-200 shadow-sm"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-16 w-12 rounded-lg border border-violet-100 bg-gray-200" />
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
