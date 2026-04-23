import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ListCard, type Lista } from "@/components/lists/list-card";
import Footer from "@/components/sections/footer";
import {
  ProfileHero,
  type QuickStat,
  type SocialConnectionsDropdown,
  type SocialConnectionsPanel,
} from "@/components/profile/profile-hero";
import { ProfileStatsSection } from "@/components/profile/profile-stats-section";
import { ProfileTimeline } from "@/components/profile/profile-timeline";
import { StatusCardsSection, type StatusCardGroup } from "@/components/status/status-cards-section";
import { ImageCropModal } from "@/components/ui/image-crop-modal";
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
import { getMe } from "@/services/auth-service";
import { getListContents } from "@/services/lists-service";
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

function parseUserId(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function parseFollowerIdsFromPayload(payload: any): number[] {
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

  const root = payload ?? {};
  const perfil = root?.perfil ?? {};
  const seguimiento = root?.seguimiento ?? perfil?.seguimiento ?? {};
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
    perfil?.seguimiento?.seguidores,
    perfil?.seguimiento?.followers,
    perfil?.seguimiento?.usuariosSeguidores,
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
  targetUserId: number | null,
  canManageLists: boolean
): Promise<CompletedCounts> {
  const baseLists = await resolveBaseLists({ targetUserId, canManageLists });
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
        await Promise.all(
          uniqueListIds.map(async (listId) => {
            try {
              const data = await getListContents(listId);
              const contenidos = Array.isArray(data?.contenidos)
                ? data.contenidos
                : [];
              for (const contenido of contenidos) {
                const contentId = Number(contenido?.id);
                if (Number.isFinite(contentId) && contentId > 0) {
                  contentIds.add(contentId);
                }
              }
            } catch {
              // Ignoramos listas que fallen para no romper el perfil.
            }
          })
        );

        completedCounts[category] = contentIds.size;
      }
    )
  );

  return completedCounts;
}

async function loadProfileListsSummary(
  targetUserId: number | null,
  canManageLists: boolean,
  isOwnProfile: boolean
): Promise<ProfileListsSummary> {
  const baseLists = await resolveBaseLists({ targetUserId, canManageLists });
  const listIdsByStatus: Record<StatusKey, number[]> = {
    watchlist: [],
    in_progress: [],
    completed: [],
    dropped: [],
  };
  const visibleCustomLists: Lista[] = [];

  for (const list of baseLists) {
    const status = parseManagedStatus(String(list.nombre ?? ""), list.descripcion);
    const category = normalizeCategory(list.tipoContenidos);
    const listId = Number(list.listaId);
    const visibility = String(list.visibilidad ?? "").trim().toLowerCase();
    const isPublic = visibility === "publica";

    if (status && category && Number.isFinite(listId) && listId > 0) {
      const shouldIncludeManaged = isOwnProfile || isPublic;
      if (shouldIncludeManaged) {
        listIdsByStatus[status].push(listId);
      }
      continue;
    }

    const shouldShow = isOwnProfile || isPublic;
    if (shouldShow) {
      visibleCustomLists.push(list as unknown as Lista);
    }
  }

  const listContentCache = new Map<number, Promise<number[]>>();
  const readContentIdsFromList = (listId: number) => {
    const cached = listContentCache.get(listId);
    if (cached) return cached;

    const request = (async () => {
      try {
        const data = await getListContents(listId);
        const contenidos = Array.isArray(data?.contenidos) ? data.contenidos : [];
        const ids: number[] = [];
        for (const contenido of contenidos) {
          const contentId = Number(contenido?.id);
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

  return {
    statusCounts,
    visibleCustomLists,
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

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  const [profileFollowerIds, setProfileFollowerIds] = useState<number[]>([]);
  const [initialIsFollowing, setInitialIsFollowing] = useState<boolean | null>(
    null
  );
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [ratingsCount, setRatingsCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [seriesCount, setSeriesCount] = useState(0);
  const [moviesCount, setMoviesCount] = useState(0);
  const [booksCount, setBooksCount] = useState(0);
  const [gamesCount, setGamesCount] = useState(0);
  const [statusProgressCounts, setStatusProgressCounts] =
    useState<StatusCounts>(EMPTY_STATUS_COUNTS);
  const [visibleProfileLists, setVisibleProfileLists] = useState<Lista[]>([]);
  const [timelineRecords, setTimelineRecords] = useState<TimelineRecord[]>([]);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [isCoverCropOpen, setIsCoverCropOpen] = useState(false);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [openSocialTarget, setOpenSocialTarget] =
    useState<SocialListTarget | null>(null);
  const [followersList, setFollowersList] =
    useState<SocialListState>(EMPTY_SOCIAL_LIST_STATE);
  const [followingList, setFollowingList] =
    useState<SocialListState>(EMPTY_SOCIAL_LIST_STATE);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const profileUserIdRef = useRef<number | null>(null);

  useEffect(() => {
    profileUserIdRef.current = profileUserId;
  }, [profileUserId]);

  useEffect(() => {
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
  }, []);

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

        const perfil = data.perfil ?? {};
        const stats = data.estadisticas ?? {};

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

        setUsername(perfil.username ?? "");
        setRole((perfil.tipo ?? "Base").toString());
        setBio(perfil.descripcion ?? "");
        setProfileImage(perfil.avatarUrl ?? null);
        setCoverImage(perfil.bannerUrl ?? null);
        setRatingsCount(stats.valoraciones ?? 0);
        setAverageRating(stats.media ?? 0);
        setReviewsCount(stats.comentarios ?? 0);
        setFollowingCount(stats.siguiendo ?? 0);
        setFollowersCount(
          Number.isFinite(resolvedFollowersCount) && resolvedFollowersCount >= 0
            ? resolvedFollowersCount
            : followerIds.length
        );

        const canManageListsForTarget =
          requestedUserId === null ||
          (currentUserId != null &&
            resolvedProfileUserId != null &&
            currentUserId === resolvedProfileUserId);
        const completedCounts = await loadCompletedCountsForProfile(
          resolvedProfileUserId,
          canManageListsForTarget
        ).catch(() => EMPTY_COMPLETED_COUNTS);
        if (controller.signal.aborted) return;
        setSeriesCount(completedCounts.serie);
        setMoviesCount(completedCounts.pelicula);
        setBooksCount(completedCounts.libro);
        setGamesCount(completedCounts.videojuego);

        const listsSummary = await loadProfileListsSummary(
          resolvedProfileUserId,
          canManageListsForTarget,
          requestedUserId === null ||
            (currentUserId != null &&
              resolvedProfileUserId != null &&
              currentUserId === resolvedProfileUserId)
        ).catch(() => EMPTY_PROFILE_LISTS_SUMMARY);
        if (controller.signal.aborted) return;
        setStatusProgressCounts(listsSummary.statusCounts);
        setVisibleProfileLists(listsSummary.visibleCustomLists);

        const backendTimelineRecords = buildTimelineFromPayload(data);
        setTimelineRecords(mergeTimelineRecords(backendTimelineRecords));
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
        setTimelineRecords([]);
      } finally {
        if (!controller.signal.aborted) {
          setProfileLoading(false);
        }
      }
    }

    loadProfile();

    return () => controller.abort();
  }, [requestedUserId, isLoggedIn, currentUserId]);

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
    setFollowersList(EMPTY_SOCIAL_LIST_STATE);
    setFollowingList(EMPTY_SOCIAL_LIST_STATE);
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

  const handleToggleEdit = async () => {
    if (!canEdit) return;
    if (isEditing) {
      setSaveError(null);
      const result = await updateProfile({ descripcion: bio });
      if (!result.success) {
        setSaveError(result.message ?? "No se pudo actualizar el perfil.");
        return;
      }
    }
    setIsEditing((prev) => !prev);
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
        setAvatarError(
          "La subida ha tardado demasiado. Se guardó localmente."
        );
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
          setCoverError(result.message ?? "No se pudo subir la portada.");
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setCoverError(
          "La subida ha tardado demasiado. Se guardó localmente."
        );
      } else {
        setCoverError("No se pudo guardar la portada.");
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
        setCoverError(result.message ?? "No se pudo eliminar la portada.");
      }
    } catch {
      setCoverError("No se pudo eliminar la portada.");
    } finally {
      applyCoverImage(null);
      setCoverUploading(false);
    }
  };

  if (profileLoading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="h-32 md:h-36" />
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-3">
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
      <div className="h-32 md:h-36" />
      {profileError && (
        <div className="mx-auto max-w-6xl px-4 pb-4 pt-3 text-sm text-rose-600">
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
        onToggleEdit={handleToggleEdit}
        onBioChange={applyProfileBio}
        showFollowAction={!canEdit && profileUserId != null}
        isFollowing={isFollowingProfile}
        followDisabled={!isLoggedIn || currentUserId == null || followUpdating}
        onToggleFollow={handleToggleFollow}
        followMessage={followMessage}
        socialConnections={socialConnectionsDropdown}
        avatarInputRef={fileInputRef}
        coverInputRef={coverFileInputRef}
        onAvatarChange={handleAvatarChange}
        onCoverChange={handleCoverChange}
      />

      <section className="mx-auto max-w-6xl px-4 py-10">
        <>
          <ProfileStatsSection
            cards={activityCards}
            showViewAll={false}
          />

          <div className="mt-10 space-y-10">
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Listas</h2>
              <StatusCardsSection
                groups={statusGroups}
                buildStatusHref={(status) => {
                  if (isOwnProfile) return `/listas/mis-listas/estado/${status}`;
                  if (profileUserId == null) return null;
                  return `/listas/mis-listas/estado/${status}?userId=${profileUserId}`;
                }}
              />
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {isOwnProfile ? "Listas creadas" : "Listas públicas"}
                </h3>
                <span className="text-xs text-gray-500">
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
                        basePath={isOwnProfile ? "/listas/mis-listas" : "/listas/nuestras-listas"}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="mt-10">
            <ProfileTimeline
              items={timelineItems}
              actionLabel={timelineActionLabel}
              showAction={canToggleTimelineHistory}
              onAction={handleToggleTimelineHistory}
            />
          </div>
        </>
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
        title="Recortar portada"
        description="Ajusta el encuadre horizontal de la portada."
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
