import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ListCard, type Lista } from "@/components/lists/list-card";
import Footer from "@/components/sections/footer";
import {
  ProfileHero,
  type CommentPreviewItem,
  type CommentsPreviewDropdown,
  type QuickStat,
  type SocialConnectionsDropdown,
  type SocialConnectionsPanel,
} from "@/components/profile/profile-hero";
import { ProfileStatsSection } from "@/components/profile/profile-stats-section";
import { ProfileTimeline } from "@/components/profile/profile-timeline";
import { StatusCardsSection, type StatusCardGroup } from "@/components/status/status-cards-section";
import { ImageCropModal } from "@/components/ui/image-crop-modal";
import { PageLoader } from "@/components/ui/page-loader";
import { Skeleton } from "@/components/ui/skeleton";
import { createCroppedImage, type CropAreaPixels } from "@/lib/image-crop";
import {
  STATUS_ORDER,
  normalizeCategory,
  parseManagedStatus,
  type CategoryKey,
  type StatusKey,
} from "@/lib/status-lists";
import {
  fetchAllUserFollowerIds,
  fetchMyProfile,
  fetchUserFollowersPage,
  fetchUserFollowingPage,
  fetchUserProfile,
  removeProfileImage,
  removeProfileCover,
  updateProfile,
  uploadProfileImage,
  uploadProfileCover,
} from "@/services/profile-service";
import { getMe, isSessionValid } from "@/services/auth-service";
import { getCommunityFeed, type CommunityActivity } from "@/services/apiCommunity";
import { listContentComments, type ListCommentsPayload } from "@/services/content-comments";
import { getListContents, type BackendLista } from "@/services/lists-service";
import { resolveBaseLists } from "@/services/listas/my-lists";
import {
  buildTimelineFromPayload,
  mergeTimelineRecords,
  type TimelineRecord,
} from "@/hooks/profile/profile-timeline-utils";
import { useProfileTimelineView } from "@/hooks/profile/use-profile-timeline-view";
import { useProfileFollow } from "@/hooks/profile/use-profile-follow";

const AVATAR_OUTPUT_SIZE = 320;
const MAX_IMAGE_MB = 5;
const COVER_OUTPUT_WIDTH = 1280;
const COVER_OUTPUT_HEIGHT = 720;

const PROFILE_CONTENT_TABS = [
  { id: "stats", label: "Estadísticas" },
  { id: "lists", label: "Listas" },
  { id: "activity", label: "Actividad reciente" },
] as const;

type ProfileContentTabId = (typeof PROFILE_CONTENT_TABS)[number]["id"];

function parseUserId(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function normalizeVisibility(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isPublicVisibility(value: unknown) {
  const normalized = normalizeVisibility(value);
  return normalized === "publica" || normalized === "public";
}

function formatRelativeDate(value?: string) {
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

function pickNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function extractRowUserId(row: unknown): number | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  return parseUserId(
    r?.userId ??
      r?.user_id ??
      r?.usuarioId ??
      r?.usuario_id ??
      (r?.usuario as Record<string, unknown> | undefined)?.userId ??
      (r?.usuario as Record<string, unknown> | undefined)?.user_id ??
      (r?.usuario as Record<string, unknown> | undefined)?.id ??
      (r?.metadata as Record<string, unknown> | undefined)?.userId ??
      (r?.metadata as Record<string, unknown> | undefined)?.usuarioId ??
      ((r?.metadata as Record<string, unknown> | undefined)?.usuario as Record<string, unknown> | undefined)?.userId
  );
}

function extractRowUsername(row: unknown): string {
  if (!row || typeof row !== "object") return "";
  const r = row as Record<string, unknown>;
  return pickString(
    r?.username,
    (r?.user as Record<string, unknown> | undefined)?.username,
    (r?.usuario as Record<string, unknown> | undefined)?.username,
    (r?.author as Record<string, unknown> | undefined)?.username,
    (r?.autor as Record<string, unknown> | undefined)?.username,
    (r?.metadata as Record<string, unknown> | undefined)?.username,
    ((r?.metadata as Record<string, unknown> | undefined)?.user as Record<string, unknown> | undefined)?.username,
    ((r?.metadata as Record<string, unknown> | undefined)?.usuario as Record<string, unknown> | undefined)?.username,
    ((r?.metadata as Record<string, unknown> | undefined)?.author as Record<string, unknown> | undefined)?.username,
    ((r?.metadata as Record<string, unknown> | undefined)?.autor as Record<string, unknown> | undefined)?.username
  );
}

function extractRowContentId(row: unknown): number | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const meta = (r?.metadata as Record<string, unknown> | undefined) ?? {};
  return pickNumber(
    r?.contenidoId,
    r?.contentId,
    r?.idContenido,
    (r?.contenido as Record<string, unknown> | undefined)?.id,
    (r?.content as Record<string, unknown> | undefined)?.id,
    meta?.contenidoId,
    meta?.contentId,
    meta?.idContenido,
    (meta?.contenido as Record<string, unknown> | undefined)?.id,
    (meta?.content as Record<string, unknown> | undefined)?.id,
    (meta?.comment as Record<string, unknown> | undefined)?.contenidoId,
    (meta?.comment as Record<string, unknown> | undefined)?.contentId,
    (meta?.comentario as Record<string, unknown> | undefined)?.contenidoId,
    (meta?.comentario as Record<string, unknown> | undefined)?.contentId,
    (meta?.reply as Record<string, unknown> | undefined)?.contenidoId,
    (meta?.reply as Record<string, unknown> | undefined)?.contentId
  );
}

function collectRowsFromProfilePayload(payload: unknown): unknown[] {
  const root = (payload as Record<string, unknown>) ?? {};
  const perfil = (root?.perfil as Record<string, unknown>) ?? {};
  const candidates = [
    root?.actividad,
    root?.actividadReciente,
    root?.timeline,
    root?.estados,
    root?.statuses,
    root?.contenidosEstado,
    perfil?.actividad,
    perfil?.actividadReciente,
    perfil?.timeline,
    perfil?.estados,
    perfil?.statuses,
    perfil?.contenidosEstado,
  ];
  return candidates.flatMap((candidate) => (Array.isArray(candidate) ? candidate : []));
}

function collectProfilePayloadContentIds(
  payload: unknown,
  targetUserId: number | null,
  targetUsernameNormalized: string
): number[] {
  const ids = new Set<number>();
  const rows = collectRowsFromProfilePayload(payload);
  for (const row of rows) {
    const rowUserId = extractRowUserId(row);
    const rowUsernameNormalized = normalizeIdentity(extractRowUsername(row));
    const matchesTarget =
      (targetUserId != null && rowUserId != null && rowUserId === targetUserId) ||
      (targetUsernameNormalized.length > 0 &&
        rowUsernameNormalized === targetUsernameNormalized) ||
      (targetUserId != null && rowUserId == null && targetUsernameNormalized.length === 0);
    if (!matchesTarget) {
      continue;
    }
    const contentId = extractRowContentId(row);
    if (contentId != null) ids.add(contentId);
  }
  return [...ids];
}

function normalizeIdentity(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeCommentPreviewFromActivity(
  row: CommunityActivity,
  index: number
): CommentPreviewItem | null {
  const metadata = (row.metadata ?? {}) as Record<string, unknown>;
  const message = pickString(
    row.textoComentario,
    metadata?.textoComentario,
    (metadata?.comment as Record<string, unknown> | undefined)?.mensaje,
    (metadata?.comentario as Record<string, unknown> | undefined)?.mensaje,
    metadata?.mensaje,
    metadata?.texto
  );
  const titleSuffix = pickString(
    row.tituloContenido,
    metadata?.tituloContenido,
    (metadata?.content as Record<string, unknown> | undefined)?.title,
    (metadata?.content as Record<string, unknown> | undefined)?.titulo
  );
  const rawType = pickString(row.tipo, String(metadata?.tipo ?? "")).toLowerCase();
  const isReply =
    rawType.includes("reply") ||
    rawType.includes("respuest") ||
    metadata?.parentId != null ||
    metadata?.parent_id != null;
  const isCommentType =
    rawType.includes("comment") ||
    rawType.includes("coment") ||
    isReply ||
    Boolean(message);
  if (!isCommentType) return null;

  const title = isReply
    ? `Respondiste${titleSuffix ? ` en ${titleSuffix}` : ""}`
    : `Comentaste${titleSuffix ? ` en ${titleSuffix}` : ""}`;

  return {
    id: String(row.actividadId ?? `activity-comment-${index}`),
    title,
    detail: message || undefined,
    date: formatRelativeDate(row.createDate),
  };
}

type TimedCommentPreviewItem = CommentPreviewItem & { __time: number };

function extractUserCommentsFromContentPayload(
  payload: ListCommentsPayload,
  targetUserId: number,
  contentId: number,
  contentTitleById: Map<number, string>,
  targetUsernameNormalized: string
): TimedCommentPreviewItem[] {
  const rows = Array.isArray(payload?.comentarios)
    ? payload.comentarios
    : Array.isArray((payload as { comments?: unknown[] })?.comments)
      ? (((payload as { comments?: unknown[] }).comments ?? []) as Array<
          Record<string, unknown>
        >)
      : [];
  const items: TimedCommentPreviewItem[] = [];
  const contentTitle = contentTitleById.get(contentId) ?? `contenido ${contentId}`;

  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const row = node as Record<string, unknown>;
    const userId = Number(
      row?.userId ??
        (row?.usuario as Record<string, unknown> | undefined)?.userId ??
        (row?.usuario as Record<string, unknown> | undefined)?.id ??
        (row?.user as Record<string, unknown> | undefined)?.userId ??
        (row?.user as Record<string, unknown> | undefined)?.id ??
        (row?.author as Record<string, unknown> | undefined)?.userId ??
        (row?.author as Record<string, unknown> | undefined)?.id ??
        (row?.autor as Record<string, unknown> | undefined)?.userId ??
        (row?.autor as Record<string, unknown> | undefined)?.id ??
        row?.usuarioId ??
        row?.usuario_id ??
        row?.idUsuario ??
        row?.id_usuario ??
        0
    );
    const rowUsernameNormalized = normalizeIdentity(
      String(
        row?.username ??
          (row?.usuario as Record<string, unknown> | undefined)?.username ??
          (row?.user as Record<string, unknown> | undefined)?.username ??
          (row?.author as Record<string, unknown> | undefined)?.username ??
          (row?.autor as Record<string, unknown> | undefined)?.username ??
          row?.nombreUsuario ??
          row?.nombre_usuario ??
          ""
      )
    );
    const matchesUser =
      (Number.isFinite(userId) && userId === targetUserId) ||
      (targetUsernameNormalized.length > 0 &&
        rowUsernameNormalized === targetUsernameNormalized);
    const commentId = Number(row?.commentId ?? row?.id ?? row?.comentarioId ?? 0);
    const createdAt = pickString(
      row?.createDate,
      row?.createdAt,
      row?.fecha,
      row?.updateDate
    );
    const message = pickString(
      row?.mensaje,
      row?.textoComentario,
      row?.comment,
      row?.texto
    );
    const parentId = Number(row?.parentId ?? row?.parent_id ?? 0);
    const isReply = Number.isFinite(parentId) && parentId > 0;

    if (matchesUser) {
      items.push({
        id:
          Number.isFinite(commentId) && commentId > 0
            ? `comment-${commentId}`
            : `content-${contentId}-${items.length}`,
        title: isReply
          ? `Respondiste en ${contentTitle}`
          : `Comentaste en ${contentTitle}`,
        detail: message || undefined,
        date: formatRelativeDate(createdAt || undefined),
        __time: parseDateMs(createdAt || undefined),
      });
    }

    const replies = Array.isArray(row?.respuestas)
      ? row.respuestas
      : Array.isArray(row?.replies)
        ? row.replies
        : Array.isArray(row?.children)
          ? row.children
          : [];
    for (const reply of replies) walk(reply);
  };

  for (const row of rows) walk(row);
  return items;
}

async function fetchAllCommentPagesForContent(
  contentId: number
): Promise<ListCommentsPayload[]> {
  const pages: ListCommentsPayload[] = [];

  const firstPage = await listContentComments(contentId, { paginate: false });
  pages.push(firstPage);

  const totalPages = Number(firstPage?.pagination?.pages ?? 1);
  const pageSize = Number(firstPage?.pagination?.pageSize ?? 10);
  if (!Number.isFinite(totalPages) || totalPages <= 1) return pages;

  const maxPages = Math.min(totalPages, 20);
  for (let page = 2; page <= maxPages; page += 1) {
    try {
      const payload = await listContentComments(contentId, {
        page,
        pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10,
      });
      pages.push(payload);
    } catch {
      break;
    }
  }

  return pages;
}

function parseFollowerIdsFromPayload(payload: unknown): number[] {
  const ids = new Set<number>();

  const pushFollower = (entry: unknown) => {
    if (entry == null) return;
    if (typeof entry === "number" && Number.isFinite(entry) && entry > 0) {
      ids.add(entry);
      return;
    }
    if (typeof entry === "string") {
      const numeric = Number(entry);
      if (Number.isFinite(numeric) && numeric > 0) {
        ids.add(numeric);
      }
      return;
    }
    if (typeof entry !== "object") return;
    const row = entry as Record<string, unknown>;
    const parsed = Number(
      row.userId ??
        row.id ??
        row.usuarioId ??
        row.usuario_id ??
        row.seguidorId ??
        row.seguidor_id ??
        row.followerId ??
        row.follower_id ??
        (row.usuario as { userId?: unknown } | undefined)?.userId ??
        (row.user as { userId?: unknown } | undefined)?.userId
    );
    if (Number.isFinite(parsed) && parsed > 0) {
      ids.add(parsed);
    }
  };

  const root = (payload as Record<string, unknown>) ?? {};
  const perfil = (root?.perfil as Record<string, unknown>) ?? {};
  const seguimiento = (root?.seguimiento as Record<string, unknown>) ?? (perfil?.seguimiento as Record<string, unknown>) ?? {};
  const arrays = [
    root?.seguidores,
    root?.followers,
    root?.usuariosSeguidores,
    root?.seguidoresUsuarios,
    seguimiento?.seguidores,
    seguimiento?.followers,
    seguimiento?.usuariosSeguidores,
    perfil?.seguidores,
    perfil?.followers,
    perfil?.usuariosSeguidores,
    perfil?.seguidoresUsuarios,
    (perfil?.seguimiento as Record<string, unknown> | undefined)?.seguidores,
    (perfil?.seguimiento as Record<string, unknown> | undefined)?.followers,
    (perfil?.seguimiento as Record<string, unknown> | undefined)?.usuariosSeguidores,
  ];

  for (const candidate of arrays) {
    if (!Array.isArray(candidate)) continue;
    for (const row of candidate) {
      pushFollower(row);
    }
  }

  return [...ids];
}

function dedupeConnectionUsers(
  users: SocialConnectionsPanel["users"]
): SocialConnectionsPanel["users"] {
  const byUserId = new Map<number, SocialConnectionsPanel["users"][number]>();
  for (const user of users) {
    byUserId.set(user.userId, user);
  }
  return [...byUserId.values()];
}

type CompletedCounts = Record<CategoryKey, number>;
type StatusCounts = Record<StatusKey, number>;

type ProfileListsSummary = {
  statusCounts: StatusCounts;
  visibleCustomLists: Lista[];
  candidateContentIds: number[];
};

type SocialListTarget = "following" | "followers";

type SocialListState = SocialConnectionsPanel & {
  page: number;
  pages: number;
  pageSize: number;
};

const EMPTY_COMPLETED_COUNTS: CompletedCounts = {
  pelicula: 0,
  serie: 0,
  libro: 0,
  videojuego: 0,
};

const EMPTY_STATUS_COUNTS: StatusCounts = {
  watchlist: 0,
  in_progress: 0,
  completed: 0,
  dropped: 0,
};

const EMPTY_PROFILE_LISTS_SUMMARY: ProfileListsSummary = {
  statusCounts: { ...EMPTY_STATUS_COUNTS },
  visibleCustomLists: [],
  candidateContentIds: [],
};

const EMPTY_SOCIAL_LIST_STATE: SocialListState = {
  users: [],
  total: 0,
  loaded: false,
  loading: false,
  loadingMore: false,
  hasMore: false,
  error: null,
  page: 0,
  pages: 1,
  pageSize: 20,
};

async function loadCompletedCountsForProfile(
  baseLists: BackendLista[],
  readContentIdsFromList: (listId: number) => Promise<number[]>
): Promise<CompletedCounts> {
  const completedListIdsByCategory: Record<CategoryKey, number[]> = {
    pelicula: [],
    serie: [],
    libro: [],
    videojuego: [],
  };

  for (const list of baseLists) {
    const status = parseManagedStatus(
      String(list.nombre ?? ""),
      list.descripcion
    );
    if (status !== "completed") continue;

    const category = normalizeCategory(list.tipoContenidos);
    if (!category) continue;

    const listId = Number(list.listaId);
    if (!Number.isFinite(listId) || listId <= 0) continue;
    completedListIdsByCategory[category].push(listId);
  }

  const completedCounts: CompletedCounts = { ...EMPTY_COMPLETED_COUNTS };

  await Promise.all(
    (Object.keys(completedListIdsByCategory) as CategoryKey[]).map(
      async (category) => {
        const uniqueListIds = [...new Set(completedListIdsByCategory[category])];
        if (!uniqueListIds.length) return;

        const contentIds = new Set<number>();
        const contentsByList = await Promise.all(
          uniqueListIds.map((listId) => readContentIdsFromList(listId))
        );
        for (const listContentIds of contentsByList) {
          for (const contentId of listContentIds) contentIds.add(contentId);
        }

        completedCounts[category] = contentIds.size;
      }
    )
  );

  return completedCounts;
}

async function loadProfileListsSummary(
  baseLists: BackendLista[],
  isOwnProfile: boolean,
  readContentIdsFromList: (listId: number) => Promise<number[]>
): Promise<ProfileListsSummary> {
  const listIdsByStatus: Record<StatusKey, number[]> = {
    watchlist: [],
    in_progress: [],
    completed: [],
    dropped: [],
  };
  const listIdsForCommentCandidates: number[] = [];
  const visibleCustomLists: Lista[] = [];

  for (const list of baseLists) {
    const status = parseManagedStatus(String(list.nombre ?? ""), list.descripcion);
    const category = normalizeCategory(list.tipoContenidos);
    const listId = Number(list.listaId);
    const isPublic = isPublicVisibility(list.visibilidad);
    const shouldShow = isOwnProfile || isPublic;

    if (Number.isFinite(listId) && listId > 0 && shouldShow) {
      listIdsForCommentCandidates.push(listId);
    }

    if (status && category && Number.isFinite(listId) && listId > 0) {
      const shouldIncludeManaged = isOwnProfile || isPublic;
      if (shouldIncludeManaged) {
        listIdsByStatus[status].push(listId);
      }
      continue;
    }

    if (shouldShow) {
      visibleCustomLists.push(list as unknown as Lista);
    }
  }

  const computeUniqueContentCount = async (ids: number[]) => {
    const uniqueListIds = [...new Set(ids)];
    if (!uniqueListIds.length) return 0;

    const results = await Promise.all(
      uniqueListIds.map((listId) => readContentIdsFromList(listId))
    );
    const uniqueContentIds = new Set<number>();
    for (const contentIds of results) {
      for (const contentId of contentIds) uniqueContentIds.add(contentId);
    }
    return uniqueContentIds.size;
  };

  const statusCounts: StatusCounts = { ...EMPTY_STATUS_COUNTS };
  await Promise.all(
    STATUS_ORDER.map(async (status) => {
      statusCounts[status] = await computeUniqueContentCount(listIdsByStatus[status]);
    })
  );

  const candidateContentIds = new Set<number>();
  const uniqueCandidateListIds = [...new Set(listIdsForCommentCandidates)];
  const candidateListsContent = await Promise.all(
    uniqueCandidateListIds.map((listId) => readContentIdsFromList(listId))
  );
  for (const contentIds of candidateListsContent) {
    for (const contentId of contentIds) candidateContentIds.add(contentId);
  }

  return {
    statusCounts,
    visibleCustomLists,
    candidateContentIds: [...candidateContentIds],
  };
}

export default function ProfilePage() {
  const [searchParams] = useSearchParams();
  const userIdParam = searchParams.get("userId");
  const requestedUserId = useMemo(() => {
    if (userIdParam === null) return null;
    const parsed = Number(userIdParam);
    return Number.isFinite(parsed) ? parsed : null;
  }, [userIdParam]);

  const [isLoggedIn, setIsLoggedIn] = useState(() => isSessionValid());
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  const [profileFollowerIds, setProfileFollowerIds] = useState<number[]>([]);
  const [initialIsFollowing, setInitialIsFollowing] = useState<boolean | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [usernameDraft, setUsernameDraft] = useState("");
  const [role, setRole] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [savedBio, setSavedBio] = useState("");
  const [ratingsCount, setRatingsCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [seriesCount, setSeriesCount] = useState(0);
  const [moviesCount, setMoviesCount] = useState(0);
  const [booksCount, setBooksCount] = useState(0);
  const [gamesCount, setGamesCount] = useState(0);
  const [statusProgressCounts, setStatusProgressCounts] =
    useState<StatusCounts>(EMPTY_STATUS_COUNTS);
  const [visibleProfileLists, setVisibleProfileLists] = useState<Lista[]>([]);
  const [commentCandidateContentIds, setCommentCandidateContentIds] = useState<number[]>([]);
  const [timelineRecords, setTimelineRecords] = useState<TimelineRecord[]>([]);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isCoverCropOpen, setIsCoverCropOpen] = useState(false);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [openSocialTarget, setOpenSocialTarget] = useState<SocialListTarget | null>(null);
  const [commentsPreviewOpen, setCommentsPreviewOpen] = useState(false);
  const [commentsActivityPreviewItems, setCommentsActivityPreviewItems] =
    useState<CommentPreviewItem[]>([]);
  const [commentsPreviewLoading, setCommentsPreviewLoading] = useState(false);
  const [commentsPreviewLoaded, setCommentsPreviewLoaded] = useState(false);
  const [commentsPreviewError, setCommentsPreviewError] = useState<string | null>(null);
  const [followersList, setFollowersList] = useState<SocialListState>(EMPTY_SOCIAL_LIST_STATE);
  const [followingList, setFollowingList] = useState<SocialListState>(EMPTY_SOCIAL_LIST_STATE);
  const [activeContentTab, setActiveContentTab] = useState<ProfileContentTabId>("stats");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const profileUserIdRef = useRef<number | null>(null);
  const commentsPreviewRequestIdRef = useRef(0);

  useEffect(() => {
    profileUserIdRef.current = profileUserId;
  }, [profileUserId]);

  useEffect(() => {
    if (requestedUserId === null) {
      setIsLoggedIn(isSessionValid());
      setCurrentUserId(null);
      return;
    }
    if (!isSessionValid()) {
      setIsLoggedIn(false);
      setCurrentUserId(null);
      return;
    }

    let cancelled = false;
    getMe()
      .then((result) => {
        if (cancelled) return;
        setIsLoggedIn(result.success);
        const user = result.user as
          | { user_id?: number; userId?: number; id?: number }
          | undefined;
        setCurrentUserId(parseUserId(user?.user_id ?? user?.userId ?? user?.id));
      })
      .catch(() => {
        if (cancelled) return;
        setIsLoggedIn(false);
        setCurrentUserId(null);
      });

    return () => {
      cancelled = true;
    };
  }, [requestedUserId]);

  useEffect(() => {
    if (requestedUserId === null && !isLoggedIn) {
      setProfileLoading(true);
      setProfileError(null);
      return;
    }

    setProfileLoading(true);
    setProfileError(null);
    setInitialIsFollowing(null);
    setProfileFollowerIds([]);

    const controller = new AbortController();

    async function loadProfile() {
      try {
        const data =
          requestedUserId === null
            ? await fetchMyProfile(controller.signal)
            : await fetchUserProfile(requestedUserId ?? 0, controller.signal);
        if (controller.signal.aborted) return;

        const perfil = (data as Record<string, Record<string, unknown>>).perfil ?? {};
        const stats = (data as Record<string, Record<string, unknown>>).estadisticas ?? {};

        if (requestedUserId === null) {
          setIsLoggedIn(true);
          setCurrentUserId((prev) => prev ?? parseUserId(perfil.userId));
        }
        const resolvedProfileUserId = parseUserId(perfil.userId ?? requestedUserId);
        setProfileUserId(resolvedProfileUserId);
        let followerIds = parseFollowerIdsFromPayload(data);
        let resolvedFollowersCount = Number(stats.seguidores ?? followerIds.length);

        if (resolvedProfileUserId != null) {
          try {
            const followersResult = await fetchAllUserFollowerIds(
              resolvedProfileUserId,
              controller.signal
            );
            if (!controller.signal.aborted) {
              followerIds = followersResult.followerIds;
              resolvedFollowersCount = followersResult.total;
            }
          } catch {
            // Si el endpoint de seguidores falla, mantenemos el fallback del perfil.
          }
        }

        setProfileFollowerIds(followerIds);

        if (requestedUserId === null) {
          setInitialIsFollowing(null);
        } else if (currentUserId != null && resolvedProfileUserId != null) {
          if (currentUserId === resolvedProfileUserId) {
            setInitialIsFollowing(null);
          } else {
            setInitialIsFollowing(followerIds.includes(currentUserId));
          }
        } else {
          setInitialIsFollowing(null);
        }

        const resolvedUsername = String(perfil.username ?? "");
        setUsername(resolvedUsername);
        setUsernameDraft(resolvedUsername);        
        setRole(String(perfil.tipo ?? "Base"));
        const resolvedBio = String(perfil.descripcion ?? "");
        setBio(resolvedBio);
        setSavedBio(resolvedBio);
        setProfileImage(String(perfil.avatarUrl ?? "") || null);
        setCoverImage(String(perfil.bannerUrl ?? "") || null);
        setRatingsCount(Number(stats.valoraciones ?? 0));
        setAverageRating(Number(stats.media ?? 0));
        setReviewsCount(Number(stats.comentarios ?? 0));
        setFollowingCount(Number(stats.siguiendo ?? 0));
        setFollowersCount(
          Number.isFinite(resolvedFollowersCount) && resolvedFollowersCount >= 0
            ? resolvedFollowersCount
            : followerIds.length
        );
        setCommentsCount(Number(stats.comentarios ?? 0));

        const canManageListsForTarget =
          requestedUserId === null;
        const isOwnProfileForLists = requestedUserId === null;
        const baseLists = await resolveBaseLists({
          targetUserId: resolvedProfileUserId,
          canManageLists: canManageListsForTarget,
        });
        const listContentCache = new Map<number, Promise<number[]>>();
        const readContentIdsFromList = (listId: number) => {
          const cached = listContentCache.get(listId);
          if (cached) return cached;

          const request = (async () => {
            try {
              const data = await getListContents(listId);
              const contenidos = Array.isArray(data?.contenidos)
                ? data.contenidos
                : [];
              const ids: number[] = [];
              for (const contenido of contenidos) {
                const contentId = Number(
                  (contenido as Record<string, unknown>)?.id
                );
                if (Number.isFinite(contentId) && contentId > 0) {
                  ids.push(contentId);
                }
              }
              return ids;
            } catch {
              return [];
            }
          })();

          listContentCache.set(listId, request);
          return request;
        };

        const completedCounts = await loadCompletedCountsForProfile(
          baseLists,
          readContentIdsFromList
        ).catch(() => EMPTY_COMPLETED_COUNTS);
        if (controller.signal.aborted) return;
        setSeriesCount(completedCounts.serie);
        setMoviesCount(completedCounts.pelicula);
        setBooksCount(completedCounts.libro);
        setGamesCount(completedCounts.videojuego);

        const listsSummary = await loadProfileListsSummary(
          baseLists,
          isOwnProfileForLists,
          readContentIdsFromList
        ).catch(() => EMPTY_PROFILE_LISTS_SUMMARY);
        if (controller.signal.aborted) return;
        setStatusProgressCounts(listsSummary.statusCounts);
        setVisibleProfileLists(listsSummary.visibleCustomLists);
        const payloadDerivedContentIds = collectProfilePayloadContentIds(
          data,
          resolvedProfileUserId,
          normalizeIdentity(String(perfil.username ?? ""))
        );
        setCommentCandidateContentIds([
          ...new Set([
            ...listsSummary.candidateContentIds,
            ...payloadDerivedContentIds,
          ]),
        ]);

        // ── Actividad real del usuario desde /actividad?userIds=<id> ──
        if (resolvedProfileUserId != null) {
          try {
            const activityPayload = await getCommunityFeed({
              page: 1,
              pageSize: 50,
              userIds: [resolvedProfileUserId],
              signal: controller.signal,
            });
            if (!controller.signal.aborted) {
              const activityRows = Array.isArray(activityPayload?.actividades)
                ? activityPayload.actividades
                : [];
              const backendTimelineRecords = buildTimelineFromPayload({
                actividades: activityRows,
              });
              setTimelineRecords(mergeTimelineRecords(backendTimelineRecords));
            }
          } catch {
            setTimelineRecords([]);
          }
        } else {
          setTimelineRecords([]);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setProfileUserId(null);
        setInitialIsFollowing(null);
        setProfileError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el perfil."
        );
        setStatusProgressCounts(EMPTY_STATUS_COUNTS);
        setVisibleProfileLists([]);
        setCommentCandidateContentIds([]);
        setTimelineRecords([]);
      } finally {
        if (!controller.signal.aborted) {
          setProfileLoading(false);
        }
      }
    }

    loadProfile();

    return () => controller.abort();
  }, [requestedUserId, isLoggedIn]);

  useEffect(() => {
    if (currentUserId == null) return;
    if (profileUserId == null) return;
    if (requestedUserId == null || !isLoggedIn) return;
    if (currentUserId === profileUserId) {
      setInitialIsFollowing(null);
      return;
    }
    setInitialIsFollowing(profileFollowerIds.includes(currentUserId));
  }, [
    requestedUserId,
    isLoggedIn,
    currentUserId,
    profileUserId,
    profileFollowerIds,
  ]);

  const isOwnProfile =
    requestedUserId === null ||
    (currentUserId !== null &&
      requestedUserId !== null &&
      Number(requestedUserId) === Number(currentUserId));
  const canEdit = isOwnProfile;

  useEffect(() => {
    if (!canEdit) {
      setIsEditing(false);
    }
  }, [canEdit]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [previewUrl, coverPreviewUrl]);

  const displayName = useMemo(() => username || "Usuario", [username]);
  const displayRole = useMemo(() => role || "base", [role]);

  useEffect(() => {
    setOpenSocialTarget(null);
    setCommentsPreviewOpen(false);
    setCommentsActivityPreviewItems([]);
    setCommentsPreviewError(null);
    setCommentsPreviewLoading(false);
    setCommentsPreviewLoaded(false);
    setCommentCandidateContentIds([]);
    setFollowersList(EMPTY_SOCIAL_LIST_STATE);
    setFollowingList(EMPTY_SOCIAL_LIST_STATE);
    commentsPreviewRequestIdRef.current += 1;
  }, [profileUserId]);

  const loadSocialConnections = async (
    target: SocialListTarget,
    options?: { page?: number; append?: boolean }
  ) => {
    const targetUserId = profileUserIdRef.current;
    if (targetUserId == null) return;

    const page = Number(options?.page ?? 1);
    const append = options?.append === true;
    const setListState =
      target === "followers" ? setFollowersList : setFollowingList;

    setListState((prev) => ({
      ...prev,
      error: null,
      loading: append ? prev.loading : true,
      loadingMore: append,
    }));

    try {
      const result =
        target === "followers"
          ? await fetchUserFollowersPage(targetUserId, { page, pageSize: 20 })
          : await fetchUserFollowingPage(targetUserId, { page, pageSize: 20 });

      if (profileUserIdRef.current !== targetUserId) return;

      setListState((prev) => {
        const users = append
          ? dedupeConnectionUsers([...prev.users, ...result.users])
          : dedupeConnectionUsers(result.users);
        return {
          ...prev,
          users,
          total: result.total,
          loaded: true,
          loading: false,
          loadingMore: false,
          hasMore: result.page < result.pages,
          page: result.page,
          pages: result.pages,
          pageSize: result.pageSize,
          error: null,
        };
      });
    } catch (error) {
      if (profileUserIdRef.current !== targetUserId) return;
      const message =
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los usuarios.";
      setListState((prev) => ({
        ...prev,
        loading: false,
        loadingMore: false,
        error: message,
      }));
    }
  };

  const handleSocialDropdownOpenChange = (
    target: SocialListTarget,
    open: boolean
  ) => {
    if (!open) {
      setOpenSocialTarget((current) => (current === target ? null : current));
      return;
    }

    setCommentsPreviewOpen(false);
    setOpenSocialTarget(target);
    const currentList = target === "followers" ? followersList : followingList;
    if (!currentList.loaded && !currentList.loading) {
      void loadSocialConnections(target, { page: 1, append: false });
    }
  };

  const handleSocialConnectionsLoadMore = (target: SocialListTarget) => {
    const currentList = target === "followers" ? followersList : followingList;
    if (currentList.loading || currentList.loadingMore || !currentList.hasMore) {
      return;
    }
    void loadSocialConnections(target, {
      page: currentList.page + 1,
      append: true,
    });
  };

  const handleSocialConnectionsRetry = (target: SocialListTarget) => {
    void loadSocialConnections(target, { page: 1, append: false });
  };

  const socialConnectionsDropdown: SocialConnectionsDropdown = {
    active: openSocialTarget,
    followers: followersList,
    following: followingList,
    onOpenChange: handleSocialDropdownOpenChange,
    onLoadMore: handleSocialConnectionsLoadMore,
    onRetry: handleSocialConnectionsRetry,
  };

  const quickStats: QuickStat[] = [
    { id: "following", label: "Seguidos", value: followingCount },
    { id: "followers", label: "Seguidores", value: followersCount },
  ];

  const timelineCommentPreviewItems = useMemo<CommentPreviewItem[]>(
    () =>
      timelineRecords
        .filter((record) => record.type === "comment")
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)
        .map((record, index) => {
          const title = record.title?.trim() || "Comentaste";
          const detail = record.detail?.trim();
          return {
            id: `${record.id}-${index}`,
            title,
            detail: detail && detail !== title ? detail : undefined,
            date: record.date,
          };
        }),
    [timelineRecords]
  );

  const commentPreviewItems = useMemo<CommentPreviewItem[]>(() => {
    const merged = new Map<string, CommentPreviewItem>();
    for (const item of timelineCommentPreviewItems) {
      if (!merged.has(item.id)) merged.set(item.id, item);
    }
    for (const item of commentsActivityPreviewItems) {
      if (!merged.has(item.id)) merged.set(item.id, item);
    }
    return [...merged.values()].slice(0, 10);
  }, [timelineCommentPreviewItems, commentsActivityPreviewItems]);

  const loadCommentsPreview = async () => {
    const targetUserId = profileUserIdRef.current;
    if (targetUserId == null || commentsCount <= 0) return;
    const targetUsernameNormalized = normalizeIdentity(username);

    const requestId = commentsPreviewRequestIdRef.current + 1;
    commentsPreviewRequestIdRef.current = requestId;
    setCommentsPreviewLoading(true);
    setCommentsPreviewError(null);

    try {
      const maxPreviewItems = 10;
      const fallbackItems: TimedCommentPreviewItem[] = [];
      const contentTitleById = new Map<number, string>();
      const endpointItems: TimedCommentPreviewItem[] = [];
      const scannedContentIds = new Set<number>();
      const candidateFromLists = [...new Set(commentCandidateContentIds)].slice(0, 30);

      for (const contentId of candidateFromLists) {
        if (commentsPreviewRequestIdRef.current !== requestId) return;
        scannedContentIds.add(contentId);
        try {
          const payloads = await fetchAllCommentPagesForContent(contentId);
          for (const payload of payloads) {
            const extracted = extractUserCommentsFromContentPayload(
              payload,
              targetUserId,
              contentId,
              contentTitleById,
              targetUsernameNormalized
            );
            if (extracted.length) endpointItems.push(...extracted);
            if (endpointItems.length >= maxPreviewItems) break;
          }
          if (endpointItems.length >= maxPreviewItems) break;
        } catch {
          // Ignoramos fallos puntuales para seguir explorando.
        }
      }

      if (endpointItems.length < maxPreviewItems) {
        const candidateFromActivity = new Set<number>();
        let page = 1;
        let guard = 0;
        const MAX_ACTIVITY_PAGES = 30;
        let reachedEnd = false;

        while (!reachedEnd && guard < MAX_ACTIVITY_PAGES) {
          if (commentsPreviewRequestIdRef.current !== requestId) return;
          const payload = await getCommunityFeed({
            page,
            pageSize: 50,
            userIds: [targetUserId],
          });
          const rows = Array.isArray(payload?.actividades) ? payload.actividades : [];
          if (rows.length === 0) break;
          for (const row of rows) {
            const metadata = (row?.metadata ?? {}) as Record<string, unknown>;
            const contentId = extractRowContentId(row);
            if (contentId != null && !scannedContentIds.has(contentId)) {
              candidateFromActivity.add(contentId);
              const title = pickString(
                row?.tituloContenido,
                metadata?.tituloContenido,
                (metadata?.content as Record<string, unknown> | undefined)?.title,
                (metadata?.content as Record<string, unknown> | undefined)?.titulo
              );
              if (title && !contentTitleById.has(contentId)) {
                contentTitleById.set(contentId, title);
              }
            }

            const normalized = normalizeCommentPreviewFromActivity(
              row,
              fallbackItems.length
            );
            if (!normalized) continue;
            fallbackItems.push({
              ...normalized,
              id: `activity-${normalized.id}`,
              __time: parseDateMs(row.createDate),
            });
          }

          const payloadPages = Number(payload?.pagination?.pages ?? 0);
          const hasValidPages = Number.isFinite(payloadPages) && payloadPages > 0;
          if (hasValidPages && page >= payloadPages) reachedEnd = true;
          if (!hasValidPages && rows.length < 50) reachedEnd = true;
          if (candidateFromActivity.size >= 30) reachedEnd = true;
          page += 1;
          guard += 1;
        }

        const candidateIds = [...candidateFromActivity].slice(0, 30);
        for (const contentId of candidateIds) {
          if (commentsPreviewRequestIdRef.current !== requestId) return;
          scannedContentIds.add(contentId);
          try {
            const payloads = await fetchAllCommentPagesForContent(contentId);
            for (const payload of payloads) {
              const extracted = extractUserCommentsFromContentPayload(
                payload,
                targetUserId,
                contentId,
                contentTitleById,
                targetUsernameNormalized
              );
              if (extracted.length) endpointItems.push(...extracted);
              if (endpointItems.length >= maxPreviewItems) break;
            }
            if (endpointItems.length >= maxPreviewItems) break;
          } catch {
            // Ignoramos fallos puntuales para seguir explorando.
          }
        }
      }

      if (commentsPreviewRequestIdRef.current !== requestId) return;

      const sourceItems = endpointItems.length > 0 ? endpointItems : fallbackItems;
      const deduped = new Map<string, TimedCommentPreviewItem>();
      for (const item of sourceItems) deduped.set(item.id, item);
      const sorted = [...deduped.values()]
        .sort((a, b) => b.__time - a.__time)
        .slice(0, maxPreviewItems)
        .map(({ __time, ...item }) => { void __time; return item; });

      setCommentsActivityPreviewItems(sorted);
      setCommentsPreviewError(null);
    } catch (error) {
      if (commentsPreviewRequestIdRef.current !== requestId) return;
      setCommentsPreviewError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los comentarios."
      );
    } finally {
      if (commentsPreviewRequestIdRef.current === requestId) {
        setCommentsPreviewLoading(false);
        setCommentsPreviewLoaded(true);
      }
    }
  };

  const commentsPreviewDropdown: CommentsPreviewDropdown = {
    open: commentsPreviewOpen,
    total: commentsCount,
    items: commentPreviewItems,
    loading: commentsPreviewLoading,
    error: commentsPreviewError,
    onRetry: () => {
      void loadCommentsPreview();
    },
    onOpenChange: (open) => {
      setCommentsPreviewOpen(open);
      if (open) {
        setOpenSocialTarget(null);
        const needsFallback =
          commentsCount > commentPreviewItems.length &&
          !commentsPreviewLoading &&
          !commentsPreviewLoaded;
        if (needsFallback) {
          void loadCommentsPreview();
        }
      }
    },
  };

  const timelineSourceRecords = useMemo(
    () =>
      isOwnProfile
        ? timelineRecords
        : timelineRecords.filter((record) => record.type !== "list"),
    [isOwnProfile, timelineRecords]
  );

  const activityCards = [
    { title: "Series vistas", value: seriesCount },
    { title: "Películas vistas", value: moviesCount },
    { title: "Libros leídos", value: booksCount },
    { title: "Videojuegos jugados", value: gamesCount },
  ];
  const statusGroups = useMemo<StatusCardGroup[]>(
    () =>
      STATUS_ORDER.map((status) => ({
        status,
        totalItems: statusProgressCounts[status] ?? 0,
      })),
    [statusProgressCounts]
  );
  const {
    timelineItems,
    canToggleTimelineHistory,
    timelineActionLabel,
    handleToggleTimelineHistory,
  } = useProfileTimelineView({
    timelineRecords: timelineSourceRecords,
    resetKey: requestedUserId,
  });
  const { isFollowingProfile, followUpdating, followMessage, handleToggleFollow } =
    useProfileFollow({
      canEdit,
      isLoggedIn,
      currentUserId,
      profileUserId,
      initialIsFollowing,
      onFollowersDelta: (delta) =>
        setFollowersCount((prev) => Math.max(0, prev + delta)),
    });

    const handleStartEdit = () => {
      if (!canEdit) return;
      setSaveError(null);
      setUsernameDraft(username);
      setBio(savedBio);
      setIsEditing(true);
    };

    const handleCancelEdit = () => {
      if (!canEdit) return;
      setSaveError(null);
      setUsernameDraft(username);
      setBio(savedBio);
      setIsEditing(false);
    };

    const handleSaveEdit = async () => {
      if (!canEdit || !isEditing) return;
    
      const cleanUsername = usernameDraft.trim();
    
      if (cleanUsername.length < 3) {
        setSaveError("El nombre de usuario debe tener al menos 3 caracteres.");
        return;
      }
    
      setSaveError(null);
    
      const result = await updateProfile({
        username: cleanUsername,
        descripcion: bio,
      });
    
      if (!result.success) {
        setSaveError(result.message ?? "No se pudo actualizar el perfil.");
        return;
      }
    
      setUsername(cleanUsername);
      setUsernameDraft(cleanUsername);
      setSavedBio(bio);
      setIsEditing(false);
    };

  const handleAvatarClick = () => {
    if (!canEdit || !isEditing) return;
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Selecciona una imagen válida.");
      return;
    }

    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      alert(`La imagen supera los ${MAX_IMAGE_MB}MB.`);
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);
    setIsCropOpen(true);
    setAvatarError(null);
    event.target.value = "";
  };

  const applyProfileImage = (src: string | null) => {
    setProfileImage(src);
    window.dispatchEvent(
      new CustomEvent("profile-image-updated", { detail: src })
    );
  };

  const applyProfileBio = (value: string) => {
    setBio(value);
  };

  const clearAvatarCropSource = () => {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  };

  const handleCropCancel = () => {
    setIsCropOpen(false);
    clearAvatarCropSource();
    setAvatarError(null);
  };

  const handleCropSave = async (cropAreaPixels: CropAreaPixels) => {
    if (!previewUrl) return;

    setAvatarUploading(true);
    setAvatarError(null);

    try {
      const { blob, dataUrl } = await createCroppedImage({
        imageSrc: previewUrl,
        cropAreaPixels,
        outputWidth: AVATAR_OUTPUT_SIZE,
        outputHeight: AVATAR_OUTPUT_SIZE,
        type: "image/jpeg",
        quality: 0.9,
      });

      applyProfileImage(dataUrl);
      setIsCropOpen(false);
      clearAvatarCropSource();

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 10000);

      try {
        const result = await uploadProfileImage(blob, dataUrl, controller.signal);
        if (result.success && result.url) {
          applyProfileImage(result.url);
        } else if (!result.success) {
          setAvatarError(result.message ?? "No se pudo subir la imagen.");
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setAvatarError("La subida ha tardado demasiado. Se guardó localmente.");
      } else {
        setAvatarError("No se pudo guardar la imagen.");
      }
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!canEdit) return;
    setAvatarUploading(true);
    setAvatarError(null);

    try {
      const result = await removeProfileImage();
      if (!result.success) {
        setAvatarError(result.message ?? "No se pudo eliminar la imagen.");
      }
    } catch {
      setAvatarError("No se pudo eliminar la imagen.");
    } finally {
      applyProfileImage(null);
      setAvatarUploading(false);
    }
  };

  const handleCoverClick = () => {
    if (!canEdit || !isEditing) return;
    coverFileInputRef.current?.click();
  };

  const handleCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Selecciona una imagen válida.");
      return;
    }

    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      alert(`La imagen supera los ${MAX_IMAGE_MB}MB.`);
      return;
    }

    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    const nextPreviewUrl = URL.createObjectURL(file);
    setCoverPreviewUrl(nextPreviewUrl);
    setIsCoverCropOpen(true);
    setCoverError(null);
    event.target.value = "";
  };

  const applyCoverImage = (src: string | null) => {
    setCoverImage(src);
  };

  const clearCoverCropSource = () => {
    setCoverPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  };

  const handleCoverCancel = () => {
    setIsCoverCropOpen(false);
    clearCoverCropSource();
    setCoverError(null);
  };

  const handleCoverSave = async (cropAreaPixels: CropAreaPixels) => {
    if (!coverPreviewUrl) return;

    setCoverUploading(true);
    setCoverError(null);

    try {
      const { blob, dataUrl } = await createCroppedImage({
        imageSrc: coverPreviewUrl,
        cropAreaPixels,
        outputWidth: COVER_OUTPUT_WIDTH,
        outputHeight: COVER_OUTPUT_HEIGHT,
        type: "image/jpeg",
        quality: 0.9,
      });

      applyCoverImage(dataUrl);
      setIsCoverCropOpen(false);
      clearCoverCropSource();

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 10000);

      try {
        const result = await uploadProfileCover(blob, dataUrl, controller.signal);
        if (result.success && result.url) {
          applyCoverImage(result.url);
        } else if (!result.success) {
          setCoverError(result.message ?? "No se pudo subir el banner.");
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setCoverError("La subida ha tardado demasiado. Se guardó localmente.");
      } else {
        setCoverError("No se pudo guardar el banner.");
      }
    } finally {
      setCoverUploading(false);
    }
  };

  const handleRemoveCover = async () => {
    if (!canEdit) return;
    setCoverUploading(true);
    setCoverError(null);

    try {
      const result = await removeProfileCover();
      if (!result.success) {
        setCoverError(result.message ?? "No se pudo eliminar el banner.");
      }
    } catch {
      setCoverError("No se pudo eliminar el banner.");
    } finally {
      applyCoverImage(null);
      setCoverUploading(false);
    }
  };

  if (profileLoading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-10">
          <PageLoader
            title="Cargando perfil"
            message="Estamos preparando la información, actividad y listas del perfil."
            className="mb-6"
          />
          <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <div className="mt-5 flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {profileError && (
        <div className="mx-auto max-w-6xl px-4 pb-4 text-sm text-rose-600">
          {profileError}
        </div>
      )}
      <ProfileHero
        coverImage={coverImage}
        profileImage={profileImage}
        displayName={displayName}
        displayRole={displayRole}
        bio={bio}
        canEdit={canEdit}
        isEditing={isEditing}
        ratingsCount={ratingsCount}
        averageRating={averageRating}
        reviewsCount={reviewsCount}
        quickStats={quickStats}
        avatarError={avatarError}
        saveError={saveError}
        coverError={coverError}
        avatarUploading={avatarUploading}
        coverUploading={coverUploading}
        onAvatarClick={handleAvatarClick}
        onCoverClick={handleCoverClick}
        onRemoveAvatar={handleRemoveAvatar}
        onRemoveCover={handleRemoveCover}
        onStartEdit={handleStartEdit}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onBioChange={applyProfileBio}
        showFollowAction={!canEdit && profileUserId != null}
        isFollowing={isFollowingProfile}
        followDisabled={!isLoggedIn || currentUserId == null || followUpdating}
        onToggleFollow={handleToggleFollow}
        followMessage={followMessage}
        socialConnections={socialConnectionsDropdown}
        commentsPreview={isOwnProfile ? commentsPreviewDropdown : undefined}
        avatarInputRef={fileInputRef}
        coverInputRef={coverFileInputRef}
        onAvatarChange={handleAvatarChange}
        onCoverChange={handleCoverChange}
usernameDraft={usernameDraft}
onUsernameChange={setUsernameDraft}    
        
      />

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="border-b border-gray-200">
          <div className="flex min-w-0 items-center gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PROFILE_CONTENT_TABS.map((tab) => {
              const isActive = activeContentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveContentTab(tab.id)}
                  className={[
                    "relative whitespace-nowrap pb-3 pt-1 text-lg font-semibold transition",
                    isActive
                      ? "text-gray-900"
                      : "text-gray-400 hover:text-gray-700",
                  ].join(" ")}
                  aria-pressed={isActive}
                >
                  {tab.label}
                  {isActive ? (
                    <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-sky-500" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {activeContentTab === "stats" ? (
          <div className="pt-6">
            <ProfileStatsSection
              cards={activityCards}
              showViewAll={false}
              centerTitle
              titleClassName="text-center text-3xl font-black tracking-tight text-[hsl(268_84%_62%)]"
              subtitle="Aquí aparece todo el contenido marcado como finalizado"
            />
          </div>
        ) : null}

        {activeContentTab === "lists" ? (
          <div className="space-y-10 pt-6">
            <section>
              <h2 className="mb-1 text-center text-3xl font-black tracking-tight text-[hsl(268_84%_62%)]">
                Listas
              </h2>
              <p className="mb-4 text-center text-sm text-gray-600">
                Aquí aparecen las listas de progreso y las listas creadas por el usuario
              </p>
              <StatusCardsSection
                groups={statusGroups}
                title="Tu progreso"
                helperText=""
                buildStatusHref={(status) => {
                  if (isOwnProfile) return `/listas/mis-listas/estado/${status}`;
                  if (profileUserId == null) return null;
                  return `/listas/mis-listas/estado/${status}?userId=${profileUserId}`;
                }}
              />
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h3
                  className="text-xl font-black tracking-tight"
                  style={{ color: "hsl(258 24% 16%)" }}
                >
                  Tus listas creadas
                </h3>
                <span className="text-xs" style={{ color: "hsl(258 16% 45%)" }}>
                  {visibleProfileLists.length}{" "}
                  {visibleProfileLists.length === 1 ? "lista" : "listas"}
                </span>
              </div>

              {visibleProfileLists.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-violet-200 bg-white p-6 text-sm text-gray-600">
                  {isOwnProfile
                    ? "No tienes listas personalizadas todavía."
                    : "Este perfil no tiene listas públicas todavía."}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {visibleProfileLists.map((lista, index) => (
                    <div
                      key={lista.listaId}
                      style={{ animation: `fadeUp 0.4s ease ${index * 0.05}s both` }}
                    >
                      <ListCard
                        lista={lista}
                        basePath={isOwnProfile ? "/listas/mis-listas" : "/listas/listas-opinify"}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}

        {activeContentTab === "activity" ? (
          <div className="pt-6">
            <ProfileTimeline
              items={timelineItems}
              actionLabel={timelineActionLabel}
              showAction={canToggleTimelineHistory}
              onAction={handleToggleTimelineHistory}
              centerTitle
              titleClassName="text-center text-3xl font-black tracking-tight text-[hsl(268_84%_62%)]"
            />
          </div>
        ) : null}
      </section>

      <ImageCropModal
        open={isCropOpen && Boolean(previewUrl)}
        imageSrc={previewUrl}
        title="Recortar foto de perfil"
        description="Ajusta el encuadre y el zoom antes de guardar."
        aspect={1}
        cropShape="round"
        panelClassName="max-w-lg"
        cropAreaClassName="h-[320px] w-full"
        saving={avatarUploading}
        onClose={handleCropCancel}
        onSave={handleCropSave}
      />

      <ImageCropModal
        open={isCoverCropOpen && Boolean(coverPreviewUrl)}
        imageSrc={coverPreviewUrl}
        title="Recortar banner"
        description="Ajusta el encuadre horizontal del banner."
        aspect={COVER_OUTPUT_WIDTH / COVER_OUTPUT_HEIGHT}
        cropShape="rect"
        panelClassName="max-w-2xl"
        cropAreaClassName="h-[220px] w-full md:h-[280px]"
        saving={coverUploading}
        onClose={handleCoverCancel}
        onSave={handleCoverSave}
      />

      <Footer />
    </main>
  );
}
