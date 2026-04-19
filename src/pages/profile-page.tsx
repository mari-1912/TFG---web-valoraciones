import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Footer from "@/components/sections/footer";
import { ProfileHero, type QuickStat } from "@/components/profile/profile-hero";
import { ProfileStatsSection } from "@/components/profile/profile-stats-section";
import { ProfileTimeline } from "@/components/profile/profile-timeline";
import { ImageCropModal } from "@/components/ui/image-crop-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { createCroppedImage, type CropAreaPixels } from "@/lib/image-crop";
import {
  fetchMyProfile,
  fetchUserProfile,
  removeProfileImage,
  removeProfileCover,
  updateProfile,
  uploadProfileImage,
  uploadProfileCover,
} from "@/services/profile-service";
import { getMe } from "@/services/auth-service";
import {
  buildTimelineFromLocalActivity,
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

function parseFollowFlag(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number" && (value === 0 || value === 1)) {
    return value === 1;
  }
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "si", "sí"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return null;
}

function getInitialFollowStateFromPayload(data: any): boolean | null {
  const candidates = [
    data?.siguesAlUsuario,
    data?.loSigues,
    data?.followedByCurrentUser,
    data?.isFollowedByCurrentUser,
    data?.isFollowing,
    data?.following,
    data?.followingUser,
    data?.sigue,
    data?.yaSigue,
    data?.seguimiento?.isFollowing,
    data?.seguimiento?.following,
    data?.seguimiento?.siguiendo,
    data?.seguimiento?.sigue,
    data?.perfil?.siguesAlUsuario,
    data?.perfil?.loSigues,
    data?.perfil?.followedByCurrentUser,
    data?.perfil?.isFollowedByCurrentUser,
    data?.perfil?.isFollowing,
    data?.perfil?.following,
    data?.perfil?.followingUser,
    data?.perfil?.sigue,
    data?.perfil?.yaSigue,
  ];

  for (const value of candidates) {
    const parsed = parseFollowFlag(value);
    if (parsed != null) return parsed;
  }

  return null;
}

function parseUserId(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export default function ProfilePage() {
  const navigate = useNavigate();
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
  const [commentsCount, setCommentsCount] = useState(0);
  const [seriesCount, setSeriesCount] = useState(0);
  const [moviesCount, setMoviesCount] = useState(0);
  const [booksCount, setBooksCount] = useState(0);
  const [gamesCount, setGamesCount] = useState(0);
  const [timelineRecords, setTimelineRecords] = useState<TimelineRecord[]>([]);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [isCoverCropOpen, setIsCoverCropOpen] = useState(false);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);

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
        setProfileUserId(parseUserId(perfil.userId ?? requestedUserId));
        setInitialIsFollowing(getInitialFollowStateFromPayload(data));

        setUsername(perfil.username ?? "");
        setRole((perfil.tipo ?? "Base").toString());
        setBio(perfil.descripcion ?? "");
        setProfileImage(perfil.avatarUrl ?? null);
        setCoverImage(perfil.bannerUrl ?? null);
        setRatingsCount(stats.valoraciones ?? 0);
        setAverageRating(stats.media ?? 0);
        setReviewsCount(stats.comentarios ?? 0);
        setFollowingCount(stats.siguiendo ?? 0);
        setFollowersCount(stats.seguidores ?? 0);
        setCommentsCount(stats.comentarios ?? 0);
        setSeriesCount(stats.series ?? 0);
        setMoviesCount(stats.peliculas ?? 0);
        setBooksCount(stats.libros ?? 0);
        setGamesCount(stats.videojuegos ?? 0);

        const backendTimelineRecords = buildTimelineFromPayload(data);
        const localTimelineRecords =
          requestedUserId === null
            ? [
                ...buildTimelineFromLocalActivity(perfil.username ?? ""),
                ...buildTimelineFromLocalActivity(
                  (typeof window !== "undefined"
                    ? localStorage.getItem("currentUser")
                    : "") ?? ""
                ),
              ]
            : [];

        setTimelineRecords(
          mergeTimelineRecords([...backendTimelineRecords, ...localTimelineRecords])
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        setProfileUserId(null);
        setInitialIsFollowing(null);
        setProfileError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el perfil."
        );
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

  const isOwnProfile =
    requestedUserId === null ||
    (currentUserId !== null &&
      requestedUserId !== null &&
      Number(requestedUserId) === Number(currentUserId));
  const statsTargetUserId = requestedUserId ?? profileUserId;
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

  const quickStats: QuickStat[] = [
    { label: "Siguiendo", value: followingCount },
    { label: "Seguidores", value: followersCount },
    { label: "Comentarios", value: commentsCount },
  ];

  const timelineSourceRecords = useMemo(
    () =>
      isOwnProfile
        ? timelineRecords
        : timelineRecords.filter((record) => record.type !== "list"),
    [isOwnProfile, timelineRecords]
  );

  const activityCards = [
    { title: "Series", value: seriesCount, unit: "totales" },
    { title: "Películas", value: moviesCount, unit: "totales" },
    { title: "Libros", value: booksCount, unit: "totales" },
    { title: "Videojuegos", value: gamesCount, unit: "totales" },
  ];
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
        avatarInputRef={fileInputRef}
        coverInputRef={coverFileInputRef}
        onAvatarChange={handleAvatarChange}
        onCoverChange={handleCoverChange}
      />

      <section className="mx-auto max-w-6xl px-4 py-10">
        <>
          <ProfileStatsSection
            cards={activityCards}
            showViewAll
            onViewAll={() =>
              navigate(
                statsTargetUserId != null
                  ? `/perfil/estadisticas?userId=${statsTargetUserId}`
                  : "/perfil/estadisticas"
              )
            }
          />

          {isOwnProfile ? (
            <>
              <div className="mt-10 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Listas</h2>
                <button
                  type="button"
                  className="text-sm font-medium text-violet-700 hover:text-violet-800"
                >
                  Ver todo
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-dashed border-violet-200 bg-white p-6 text-sm text-gray-600">
                Aquí aparecerán tus listas guardadas y tus favoritos.
              </div>
            </>
          ) : null}

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
