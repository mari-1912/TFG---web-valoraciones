import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/sections/header";
import Footer from "@/components/sections/footer";
import { ProfileHero, type QuickStat } from "@/components/profile/profile-hero";
import { ProfileStatsSection } from "@/components/profile/profile-stats-section";

import {
  DEFAULT_TIMELINE,
  ProfileTimeline,
  type TimelineItem,
} from "@/components/profile/profile-timeline";
import {
  removeProfileImage,
  removeProfileCover,
  uploadProfileImage,
  uploadProfileCover,
} from "@/services/profile-service";

const CROP_SIZE = 240;
const OUTPUT_SIZE = 320;
const MAX_IMAGE_MB = 5;
const COVER_CROP_WIDTH = 480;
const COVER_CROP_HEIGHT = 220;
const COVER_OUTPUT_WIDTH = 1280;
const COVER_OUTPUT_HEIGHT = 720;


export default function ProfilePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username] = useState("");
  const [role, setRole] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [ratingsCount, setRatingsCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [seriesCount, setSeriesCount] = useState(0);
  const [moviesCount, setMoviesCount] = useState(0);
  const [booksCount, setBooksCount] = useState(0);
  const [gamesCount, setGamesCount] = useState(0);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [baseScale, setBaseScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [isCoverCropOpen, setIsCoverCropOpen] = useState(false);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [coverZoom, setCoverZoom] = useState(1);
  const [coverBaseScale, setCoverBaseScale] = useState(1);
  const [coverOffset, setCoverOffset] = useState({ x: 0, y: 0 });
  const [isCoverDragging, setIsCoverDragging] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const coverImageRef = useRef<HTMLImageElement | null>(null);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const coverDragStateRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
    setRole(localStorage.getItem("userRole") ?? "");
    setProfileImage(localStorage.getItem("profileImage"));
    setCoverImage(localStorage.getItem("profileCoverImage"));
    setBio(localStorage.getItem("profileBio") ?? "");
    const storedRatingsCount = Number(
      localStorage.getItem("profileRatingsCount") ?? "0"
    );
    const storedAverageRating = Number(
      localStorage.getItem("profileAverageRating") ?? "0"
    );
    const storedReviewsCount = Number(
      localStorage.getItem("profileReviewsCount") ?? "0"
    );
    setRatingsCount(Number.isFinite(storedRatingsCount) ? storedRatingsCount : 0);
    setAverageRating(
      Number.isFinite(storedAverageRating) ? storedAverageRating : 0
    );
    setReviewsCount(Number.isFinite(storedReviewsCount) ? storedReviewsCount : 0);
    const storedSeriesCount = Number(
      localStorage.getItem("profileSeriesCount") ?? "0"
    );
    const storedMoviesCount = Number(
      localStorage.getItem("profileMoviesCount") ?? "0"
    );
    const storedBooksCount = Number(
      localStorage.getItem("profileBooksCount") ?? "0"
    );
    const storedGamesCount = Number(
      localStorage.getItem("profileGamesCount") ?? "0"
    );
    setSeriesCount(Number.isFinite(storedSeriesCount) ? storedSeriesCount : 0);
    setMoviesCount(Number.isFinite(storedMoviesCount) ? storedMoviesCount : 0);
    setBooksCount(Number.isFinite(storedBooksCount) ? storedBooksCount : 0);
    setGamesCount(Number.isFinite(storedGamesCount) ? storedGamesCount : 0);

    const storedTimeline = localStorage.getItem("profileTimeline");
    if (storedTimeline) {
      try {
        const parsed = JSON.parse(storedTimeline) as TimelineItem[];
        setTimelineItems(Array.isArray(parsed) ? parsed : []);
      } catch {
        setTimelineItems([]);
      }
    } else {
      setTimelineItems(DEFAULT_TIMELINE);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsEditing(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [previewUrl, coverPreviewUrl]);

  const displayName = useMemo(() => username || "Usuario", [username]);
  const displayRole = useMemo(() => role || "base", [role]);

  const quickStats: QuickStat[] = [
    { label: "Siguiendo", value: 0 },
    { label: "Seguidores", value: 0 },
    { label: "Comentarios", value: 0 },
  ];

  const activityCards = [
    { title: "Series", value: seriesCount, unit: "totales" },
    { title: "Películas", value: moviesCount, unit: "totales" },
    { title: "Libros", value: booksCount, unit: "totales" },
    { title: "Videojuegos", value: gamesCount, unit: "totales" },
  ];

  const handleAvatarClick = () => {
    if (!isLoggedIn || !isEditing) return;
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
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setBaseScale(1);
    event.target.value = "";
  };

  const applyProfileImage = (src: string | null) => {
    try {
      if (src) {
        localStorage.setItem("profileImage", src);
      } else {
        localStorage.removeItem("profileImage");
      }
      setProfileImage(src);
      window.dispatchEvent(new Event("profile-image-updated"));
    } catch {
      setAvatarError("No se pudo guardar la imagen localmente.");
    }
  };

  const applyProfileBio = (value: string) => {
    setBio(value);
    try {
      localStorage.setItem("profileBio", value);
    } catch {
      setAvatarError("No se pudo guardar la descripción.");
    }
  };

  const clampOffset = (
    nextOffset: { x: number; y: number },
    nextZoom = zoom
  ) => {
    const img = imageRef.current;
    if (!img) return nextOffset;
    const scale = baseScale * nextZoom;
    const maxOffsetX = Math.max(
      0,
      (img.naturalWidth * scale - CROP_SIZE) / 2
    );
    const maxOffsetY = Math.max(
      0,
      (img.naturalHeight * scale - CROP_SIZE) / 2
    );
    return {
      x: Math.min(maxOffsetX, Math.max(-maxOffsetX, nextOffset.x)),
      y: Math.min(maxOffsetY, Math.max(-maxOffsetY, nextOffset.y)),
    };
  };

  const handleCropImageLoad = () => {
    const img = imageRef.current;
    if (!img) return;
    const nextBaseScale = Math.max(
      CROP_SIZE / img.naturalWidth,
      CROP_SIZE / img.naturalHeight
    );
    setBaseScale(nextBaseScale);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleZoomChange = (value: number) => {
    const nextZoom = Number.isFinite(value) ? value : 1;
    setZoom(nextZoom);
    setOffset((prev) => clampOffset(prev, nextZoom));
  };

  const handleCropPointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!isLoggedIn) return;
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    setIsDragging(true);
  };

  const handleCropPointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!isDragging || !dragStateRef.current) return;
    const { startX, startY, originX, originY } = dragStateRef.current;
    const nextOffset = {
      x: originX + (event.clientX - startX),
      y: originY + (event.clientY - startY),
    };
    setOffset(clampOffset(nextOffset));
  };

  const handleCropPointerUp = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!isDragging) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragStateRef.current = null;
    setIsDragging(false);
  };

  const handleCropCancel = () => {
    setIsCropOpen(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setAvatarError(null);
  };

  const handleCropSave = async () => {
    const img = imageRef.current;
    if (!img) return;

    const scale = baseScale * zoom;
    const displayW = img.naturalWidth * scale;
    const displayH = img.naturalHeight * scale;
    const imgX = (CROP_SIZE - displayW) / 2 + offset.x;
    const imgY = (CROP_SIZE - displayH) / 2 + offset.y;
    const sx = (0 - imgX) / scale;
    const sy = (0 - imgY) / scale;
    const sSize = CROP_SIZE / scale;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    applyProfileImage(dataUrl);
    setIsCropOpen(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);

    setAvatarUploading(true);
    setAvatarError(null);

    try {
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((result) => resolve(result), "image/jpeg", 0.9)
      );

      if (blob) {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(
          () => controller.abort(),
          10000
        );

        try {
          const result = await uploadProfileImage(
            blob,
            dataUrl,
            controller.signal
          );
          if (result.success && result.url) {
            applyProfileImage(result.url);
          } else if (!result.success) {
            setAvatarError(result.message ?? "No se pudo subir la imagen.");
          }
        } finally {
          window.clearTimeout(timeoutId);
        }
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
    if (!isLoggedIn) return;
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
    if (!isLoggedIn || !isEditing) return;
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
    setCoverZoom(1);
    setCoverOffset({ x: 0, y: 0 });
    setCoverBaseScale(1);
    event.target.value = "";
  };

  const applyCoverImage = (src: string | null) => {
    try {
      if (src) {
        localStorage.setItem("profileCoverImage", src);
      } else {
        localStorage.removeItem("profileCoverImage");
      }
      setCoverImage(src);
    } catch {
      setCoverError("No se pudo guardar la portada localmente.");
    }
  };

  const clampCoverOffset = (
    nextOffset: { x: number; y: number },
    nextZoom = coverZoom
  ) => {
    const img = coverImageRef.current;
    if (!img) return nextOffset;
    const scale = coverBaseScale * nextZoom;
    const maxOffsetX = Math.max(
      0,
      (img.naturalWidth * scale - COVER_CROP_WIDTH) / 2
    );
    const maxOffsetY = Math.max(
      0,
      (img.naturalHeight * scale - COVER_CROP_HEIGHT) / 2
    );
    return {
      x: Math.min(maxOffsetX, Math.max(-maxOffsetX, nextOffset.x)),
      y: Math.min(maxOffsetY, Math.max(-maxOffsetY, nextOffset.y)),
    };
  };

  const handleCoverImageLoad = () => {
    const img = coverImageRef.current;
    if (!img) return;
    const nextBaseScale = Math.max(
      COVER_CROP_WIDTH / img.naturalWidth,
      COVER_CROP_HEIGHT / img.naturalHeight
    );
    setCoverBaseScale(nextBaseScale);
    setCoverZoom(1);
    setCoverOffset({ x: 0, y: 0 });
  };

  const handleCoverZoomChange = (value: number) => {
    const nextZoom = Number.isFinite(value) ? value : 1;
    setCoverZoom(nextZoom);
    setCoverOffset((prev) => clampCoverOffset(prev, nextZoom));
  };

  const handleCoverPointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!isLoggedIn) return;
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    coverDragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: coverOffset.x,
      originY: coverOffset.y,
    };
    setIsCoverDragging(true);
  };

  const handleCoverPointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!isCoverDragging || !coverDragStateRef.current) return;
    const { startX, startY, originX, originY } = coverDragStateRef.current;
    const nextOffset = {
      x: originX + (event.clientX - startX),
      y: originY + (event.clientY - startY),
    };
    setCoverOffset(clampCoverOffset(nextOffset));
  };

  const handleCoverPointerUp = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!isCoverDragging) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    coverDragStateRef.current = null;
    setIsCoverDragging(false);
  };

  const handleCoverCancel = () => {
    setIsCoverCropOpen(false);
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setCoverPreviewUrl(null);
    setCoverError(null);
  };

  const handleCoverSave = async () => {
    const img = coverImageRef.current;
    if (!img) return;

    const scale = coverBaseScale * coverZoom;
    const displayW = img.naturalWidth * scale;
    const displayH = img.naturalHeight * scale;
    const imgX = (COVER_CROP_WIDTH - displayW) / 2 + coverOffset.x;
    const imgY = (COVER_CROP_HEIGHT - displayH) / 2 + coverOffset.y;
    const sx = (0 - imgX) / scale;
    const sy = (0 - imgY) / scale;
    const sWidth = COVER_CROP_WIDTH / scale;
    const sHeight = COVER_CROP_HEIGHT / scale;

    const canvas = document.createElement("canvas");
    canvas.width = COVER_OUTPUT_WIDTH;
    canvas.height = COVER_OUTPUT_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      img,
      sx,
      sy,
      sWidth,
      sHeight,
      0,
      0,
      COVER_OUTPUT_WIDTH,
      COVER_OUTPUT_HEIGHT
    );

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    applyCoverImage(dataUrl);
    setIsCoverCropOpen(false);
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setCoverPreviewUrl(null);

    setCoverUploading(true);
    setCoverError(null);

    try {
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((result) => resolve(result), "image/jpeg", 0.9)
      );

      if (blob) {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(
          () => controller.abort(),
          10000
        );

        try {
          const result = await uploadProfileCover(
            blob,
            dataUrl,
            controller.signal
          );
          if (result.success && result.url) {
            applyCoverImage(result.url);
          } else if (!result.success) {
            setCoverError(result.message ?? "No se pudo subir la portada.");
          }
        } finally {
          window.clearTimeout(timeoutId);
        }
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
    if (!isLoggedIn) return;
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

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <div className="h-24 md:h-28" />
      <ProfileHero
        coverImage={coverImage}
        profileImage={profileImage}
        displayName={displayName}
        displayRole={displayRole}
        bio={bio}
        isLoggedIn={isLoggedIn}
        isEditing={isEditing}
        ratingsCount={ratingsCount}
        averageRating={averageRating}
        reviewsCount={reviewsCount}
        quickStats={quickStats}
        avatarError={avatarError}
        coverError={coverError}
        avatarUploading={avatarUploading}
        coverUploading={coverUploading}
        onAvatarClick={handleAvatarClick}
        onCoverClick={handleCoverClick}
        onRemoveAvatar={handleRemoveAvatar}
        onRemoveCover={handleRemoveCover}
        onToggleEdit={() => setIsEditing((prev) => !prev)}
        onBioChange={applyProfileBio}
        avatarInputRef={fileInputRef}
        coverInputRef={coverFileInputRef}
        onAvatarChange={handleAvatarChange}
        onCoverChange={handleCoverChange}
      />

      <section className="mx-auto max-w-6xl px-4 py-10">
        {!isLoggedIn ? (
          <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-6">
            <p className="text-sm text-gray-700">
              Necesitas iniciar sesión para ver tu información completa y tus
              listas.
            </p>
            <div className="mt-4">
              <Link
                to="/login"
                className="inline-flex items-center rounded-md bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800"
              >
                Ir a login
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ProfileStatsSection cards={activityCards} />

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

            <div className="mt-10">
              <ProfileTimeline items={timelineItems} />
            </div>
          </>
        )}
      </section>

      {isCropOpen && previewUrl && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#15101d] p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Recortar foto</h3>
                <p className="mt-1 text-xs text-white/60">
                  Arrastra para encuadrar y ajusta el zoom.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCropCancel}
                className="rounded-full border border-white/20 px-3 py-1 text-sm text-white/70 transition hover:bg-white hover:text-indigo-700"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 flex flex-col items-center gap-5">
              <div
                className={`relative overflow-hidden rounded-2xl border border-white/15 bg-black/40 ${
                  isDragging ? "cursor-grabbing" : "cursor-grab"
                }`}
                style={{ width: CROP_SIZE, height: CROP_SIZE }}
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerUp}
                onPointerCancel={handleCropPointerUp}
                onPointerLeave={handleCropPointerUp}
              >
                <img
                  ref={imageRef}
                  src={previewUrl}
                  alt="Previsualizacion"
                  onLoad={handleCropImageLoad}
                  draggable={false}
                  className="absolute left-1/2 top-1/2 select-none"
                  style={{
                    transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${baseScale * zoom})`,
                    transformOrigin: "center",
                  }}
                />
              </div>

              <div className="w-full">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span>Zoom</span>
                  <span>{zoom.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(event) =>
                    handleZoomChange(Number(event.target.value))
                  }
                  className="mt-2 w-full accent-violet-400"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCropCancel}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/70 transition hover:bg-white hover:text-indigo-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCropSave}
                disabled={avatarUploading}
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {avatarUploading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCoverCropOpen && coverPreviewUrl && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#15101d] p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Recortar portada</h3>
                <p className="mt-1 text-xs text-white/60">
                  Arrastra para encuadrar y ajusta el zoom.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCoverCancel}
                className="rounded-full border border-white/20 px-3 py-1 text-sm text-white/70 transition hover:bg-white hover:text-indigo-700"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 flex flex-col items-center gap-5">
              <div
                className={`relative overflow-hidden rounded-2xl border border-white/15 bg-black/40 ${
                  isCoverDragging ? "cursor-grabbing" : "cursor-grab"
                }`}
                style={{
                  width: COVER_CROP_WIDTH,
                  height: COVER_CROP_HEIGHT,
                }}
                onPointerDown={handleCoverPointerDown}
                onPointerMove={handleCoverPointerMove}
                onPointerUp={handleCoverPointerUp}
                onPointerCancel={handleCoverPointerUp}
                onPointerLeave={handleCoverPointerUp}
              >
                <img
                  ref={coverImageRef}
                  src={coverPreviewUrl}
                  alt="Previsualizacion portada"
                  onLoad={handleCoverImageLoad}
                  draggable={false}
                  className="absolute left-1/2 top-1/2 select-none"
                  style={{
                    transform: `translate(-50%, -50%) translate(${coverOffset.x}px, ${coverOffset.y}px) scale(${coverBaseScale * coverZoom})`,
                    transformOrigin: "center",
                  }}
                />
              </div>

              <div className="w-full">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span>Zoom</span>
                  <span>{coverZoom.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={coverZoom}
                  onChange={(event) =>
                    handleCoverZoomChange(Number(event.target.value))
                  }
                  className="mt-2 w-full accent-violet-400"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCoverCancel}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/70 transition hover:bg-white hover:text-indigo-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCoverSave}
                disabled={coverUploading}
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {coverUploading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
