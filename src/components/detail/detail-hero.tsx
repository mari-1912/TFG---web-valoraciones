import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ListPlus, Plus, Star, X } from "lucide-react";
import type { ContentStatus } from "@/services/content-status";
import {
  addContentToList,
  createUserList,
  getMyLists,
  removeContentFromList,
} from "@/services/lists-service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DetailHeroProps = {
  contentListKey?: string;
  contentId?: string | number;
  listContentType?: string;
  typeLabel: string;
  title: string;
  description: string;
  image: string;
  canShowVideo: boolean;
  videoUrl: string;
  isYouTube: boolean;
  apiRatingText: string;
  ourRatingLabel: string;
  hasOurRating: boolean;
  ourRating: number | null;
  meta: Array<{ label: string; value: string }>;
  statusOptions: Array<{
    value: ContentStatus;
    label: string;
    activeLabel?: string;
  }>;
  currentStatus?: ContentStatus | null;
  statusUpdating?: boolean;
  onSetStatus?: (value: ContentStatus | null) => void;
  statusMessage?: string | null;
  userRating?: number | null;
  ratingUpdating?: boolean;
  onSetRating?: (value: number) => void;
  onClearRating?: () => void;
  ratingMessage?: string | null;
};

type UserList = {
  id: string;
  name: string;
};

function normalizeStorageUser() {
  if (typeof window === "undefined") return "anon";
  const raw = localStorage.getItem("currentUser") ?? "";
  const normalized = raw.trim().toLowerCase();
  return normalized || "anon";
}

function normalizeContentListKey(contentListKey: string | undefined, title: string) {
  const source = (contentListKey ?? title).trim().toLowerCase();
  return source.replace(/\s+/g, "-");
}

function resolveListContentType(value?: string) {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "pelicula") return "pelicula";
  if (normalized === "serie") return "serie";
  if (normalized === "libro") return "libro";
  if (normalized === "videojuego" || normalized === "juego-mesa") {
    return "videojuego";
  }
  return "pelicula";
}

export function DetailHero({
  contentListKey,
  contentId,
  listContentType,
  typeLabel,
  title,
  description,
  image,
  canShowVideo,
  videoUrl,
  isYouTube,
  apiRatingText,
  ourRatingLabel,
  meta,
  statusOptions,
  currentStatus,
  statusUpdating,
  onSetStatus,
  statusMessage,
  userRating,
  ratingUpdating,
  onSetRating,
  onClearRating,
  ratingMessage,
}: DetailHeroProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [pendingRating, setPendingRating] = useState(0);
  const [userLists, setUserLists] = useState<UserList[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [isCreatingListLoading, setIsCreatingListLoading] = useState(false);
  const [assigningListId, setAssigningListId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState("");
  const [newListError, setNewListError] = useState<string | null>(null);
  const videoRef = useRef<HTMLDivElement | null>(null);
  const storageUser = normalizeStorageUser();
  const normalizedListKey = normalizeContentListKey(contentListKey, title);
  const contentListsStorageKey = `mock-content-lists:${storageUser}:${normalizedListKey}`;

  useEffect(() => {
    if (!showVideo) return;
    videoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showVideo]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const loadLists = async () => {
      try {
        const backendLists = await getMyLists();
        if (cancelled) return;

        const nextLists = backendLists
          .map((list) => {
            const numericId = Number(list.listaId);
            if (!Number.isFinite(numericId)) return null;
            const name = String(list.nombre ?? "").trim();
            if (!name) return null;
            return { id: String(numericId), name };
          })
          .filter((item): item is UserList => item != null);
        setUserLists(nextLists);

        try {
          const rawSelected = localStorage.getItem(contentListsStorageKey);
          const parsed = rawSelected ? JSON.parse(rawSelected) : [];
          const validIds = Array.isArray(parsed)
            ? parsed
                .map((value) => (typeof value === "string" ? value : ""))
                .filter(
                  (value) =>
                    value &&
                    Number.isFinite(Number(value)) &&
                    nextLists.some((list) => list.id === value)
                )
            : [];
          setSelectedListIds(validIds);
        } catch {
          setSelectedListIds([]);
        }
      } catch {
        if (cancelled) return;
        setUserLists([]);
        setSelectedListIds([]);
      }
    };

    void loadLists();

    return () => {
      cancelled = true;
    };
  }, [contentListsStorageKey]);

  const openRatingModal = () => {
    setPendingRating(userRating ?? 0);
    setShowRatingModal(true);
  };

  const handleSubmitRating = () => {
    if (!pendingRating) return;
    onSetRating?.(pendingRating);
    setShowRatingModal(false);
  };

  const currentStatusLabel = statusOptions.find(
    (option) => option.value === currentStatus
  )?.label;
  const numericContentId = Number(contentId);
  const hasValidNumericContentId = Number.isFinite(numericContentId);
  const persistSelectedListIds = (nextIds: string[]) => {
    if (typeof window === "undefined") return;
    if (!nextIds.length) {
      localStorage.removeItem(contentListsStorageKey);
      return;
    }
    localStorage.setItem(contentListsStorageKey, JSON.stringify(nextIds));
  };
  const toggleListAssignment = (listId: string) => {
    setSelectedListIds((prev) => {
      const exists = prev.includes(listId);
      const next = exists ? prev.filter((id) => id !== listId) : [...prev, listId];
      persistSelectedListIds(next);
      return next;
    });
  };
  const handleToggleListAssignment = async (listId: string) => {
    const isSelected = selectedListIds.includes(listId);
    const parsedListId = Number(listId);
    if (!Number.isFinite(parsedListId)) {
      // Lista local antigua (mock): permitimos toggle local para no bloquear la UI.
      toggleListAssignment(listId);
      if (!isSelected) {
        setNewListError(
          "Esta lista es local y no está sincronizada con el servidor."
        );
      } else {
        setNewListError(null);
      }
      return;
    }

    if (!hasValidNumericContentId) {
      setNewListError("No se pudo identificar el contenido.");
      return;
    }

    // Actualización optimista de UI.
    toggleListAssignment(listId);
    setAssigningListId(listId);
    try {
      if (isSelected) {
        await removeContentFromList(parsedListId, numericContentId);
      } else {
        await addContentToList(parsedListId, numericContentId);
      }
      setNewListError(null);
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : isSelected
            ? "No se pudo quitar el contenido de la lista."
            : "No se pudo añadir el contenido a la lista.";
      const normalizedMessage = message.toLowerCase();
      const alreadyRemoved =
        isSelected &&
        (normalizedMessage.includes("no existe") ||
          normalizedMessage.includes("no encontrado") ||
          normalizedMessage.includes("not found") ||
          normalizedMessage.includes("ya no") ||
          normalizedMessage.includes("no está en la lista") ||
          normalizedMessage.includes("no esta en la lista"));
      if (!alreadyRemoved) {
        // Revertimos optimista si el backend rechaza la operación.
        toggleListAssignment(listId);
        setNewListError(message);
      } else {
        setNewListError(null);
      }
    } finally {
      setAssigningListId(null);
    }
  };
  const handleCreateList = async () => {
    const normalizedName = newListName.trim();
    if (!normalizedName) {
      setNewListError("Escribe un nombre para la lista.");
      return;
    }
    const duplicate = userLists.some(
      (list) => list.name.toLowerCase() === normalizedName.toLowerCase()
    );
    if (duplicate) {
      setNewListError("Ya existe una lista con ese nombre.");
      return;
    }
    if (isCreatingListLoading) return;

    setIsCreatingListLoading(true);
    try {
      if (!hasValidNumericContentId) {
        throw new Error("No se pudo identificar el contenido.");
      }
      const createdFromApi = await createUserList({
        nombre: normalizedName,
        tipoContenidos: resolveListContentType(listContentType),
        descripcion: "",
        visibilidad: "publica",
        imagen: "",
      });
      await addContentToList(createdFromApi.listaId, numericContentId);
      const created: UserList = {
        id: String(createdFromApi.listaId),
        name: createdFromApi.nombre || normalizedName,
      };
      const nextLists = [created, ...userLists.filter((list) => list.id !== created.id)];
      setUserLists(nextLists);
      setSelectedListIds((prev) => {
        const next = prev.includes(created.id) ? prev : [created.id, ...prev];
        persistSelectedListIds(next);
        return next;
      });
      setNewListName("");
      setNewListError(null);
      setIsCreatingList(false);
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "No se ha podido crear la lista.";
      setNewListError(message);
    } finally {
      setIsCreatingListLoading(false);
    }
  };
  const selectedLists = userLists.filter((list) => selectedListIds.includes(list.id));
  const listTriggerLabel =
    selectedLists.length === 0
      ? "Añadir a mi lista"
      : selectedLists.length === 1
      ? selectedLists[0].name
      : `En ${selectedLists.length} listas`;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-neutral-900 text-white shadow-sm">
      {image ? (
        <img
          src={image}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover opacity-40 pointer-events-none"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-900 to-black pointer-events-none" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent pointer-events-none" />

      <div className="relative z-10 grid gap-8 p-6 sm:p-8 lg:grid-cols-[220px_minmax(0,1fr)_240px]">
        <div className="space-y-4">
          {image ? (
            <img
              src={image}
              alt={title}
              className="w-full rounded-2xl object-cover aspect-[2/3] shadow-lg"
            />
          ) : (
            <div className="aspect-[2/3] w-full rounded-2xl bg-black/50 flex items-center justify-center text-sm text-gray-300">
              Sin portada
            </div>
          )}

          {canShowVideo ? (
            <button
              type="button"
              onClick={() => setShowVideo(true)}
              className="flex items-center justify-center gap-2 rounded-full border border-yellow-400/80 px-4 py-2 text-sm font-semibold text-yellow-300 hover:bg-yellow-400/10"
            >
              ▶ Reproducir tráiler
            </button>
          ) : null}
        </div>

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-400">
            {typeLabel}
          </p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
            {title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-yellow-200">
            <span className="rounded-full border border-yellow-400/40 px-3 py-1">
              ⭐ {apiRatingText}
            </span>
            <span className="rounded-full border border-yellow-400/40 px-3 py-1">
              ⭐ Opinify {ourRatingLabel}
            </span>
            {userRating != null ? (
              <span className="rounded-full border border-blue-300/40 px-3 py-1 text-blue-200">
                ⭐ Tu puntuación {userRating}/10
              </span>
            ) : null}
          </div>

          <p className="max-w-2xl text-sm leading-relaxed text-gray-200">
            {description?.trim() ? description : "Sin descripción disponible."}
          </p>

          {meta.length > 0 ? (
            <div className="pt-4 border-t border-white/10">
              <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-yellow-300">
                Ficha técnica
              </h2>
              <dl className="mt-3 grid grid-cols-1 gap-3 text-sm text-gray-200 sm:grid-cols-2">
                {meta.map((entry) => (
                  <div
                    key={`${entry.label}-${entry.value}`}
                    className="rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                  >
                    <dt className="text-[11px] uppercase tracking-wider text-gray-400">
                      {entry.label}
                    </dt>
                    <dd className="mt-1 text-sm text-white">{entry.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>

        <div className="space-y-5">
          <div className="space-y-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={statusUpdating}
                  className={[
                    "flex w-full items-center justify-between rounded-xl border border-yellow-400/60 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-yellow-200 transition",
                    "hover:bg-yellow-400/10",
                    statusUpdating ? "cursor-not-allowed opacity-60" : "",
                  ].join(" ")}
                >
                  <span>{currentStatusLabel ?? "Marcar como"}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-[240px] space-y-2 rounded-2xl border border-white/10 bg-neutral-900/95 p-3 text-white shadow-2xl backdrop-blur"
              >
                {statusOptions.map((option) => {
                  const isActive = option.value === currentStatus;
                  const tone =
                    option.value === "watchlist"
                      ? "border-yellow-400/70 text-yellow-200"
                      : option.value === "in_progress"
                        ? "border-sky-400/70 text-sky-200"
                        : option.value === "completed"
                          ? "border-emerald-400/70 text-emerald-200"
                          : "border-rose-400/70 text-rose-200";
                  const activeBg =
                    option.value === "watchlist"
                      ? "bg-yellow-400/20"
                      : option.value === "in_progress"
                        ? "bg-sky-400/20"
                        : option.value === "completed"
                          ? "bg-emerald-400/20"
                          : "bg-rose-400/20";
                  const hoverBg =
                    option.value === "watchlist"
                      ? "hover:bg-yellow-400/10"
                      : option.value === "in_progress"
                        ? "hover:bg-sky-400/10"
                        : option.value === "completed"
                          ? "hover:bg-emerald-400/10"
                          : "hover:bg-rose-400/10";
                  return (
                    <DropdownMenuItem
                      key={option.value}
                      onSelect={() =>
                        onSetStatus?.(
                          option.value === currentStatus ? null : option.value
                        )
                      }
                      disabled={statusUpdating}
                      className={[
                        "flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition",
                        tone,
                        isActive ? activeBg : hoverBg,
                        statusUpdating ? "cursor-not-allowed opacity-60" : "",
                      ].join(" ")}
                    >
                      <span>{option.label}</span>
                      {isActive ? (
                        <Check className="h-4 w-4 text-white/80" />
                      ) : null}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border border-yellow-400/60 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-yellow-200 transition hover:bg-yellow-400/10"
                >
                  <span>{listTriggerLabel}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-[260px] space-y-2 rounded-2xl border border-white/10 bg-neutral-900/95 p-3 text-white shadow-2xl backdrop-blur"
              >
                <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-yellow-300/90">
                  Mis listas
                </p>
                {userLists.map((list) => {
                  const isSelected = selectedListIds.includes(list.id);
                  return (
                    <DropdownMenuItem
                      key={list.id}
                      onSelect={(event) => {
                        event.preventDefault();
                        void handleToggleListAssignment(list.id);
                      }}
                      disabled={assigningListId === list.id}
                      className={[
                        "flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition",
                        assigningListId === list.id ? "cursor-not-allowed opacity-60" : "",
                        isSelected
                          ? "border-yellow-400/70 bg-yellow-400/20 text-yellow-200"
                          : "border-white/15 text-white/90 hover:bg-white/10",
                      ].join(" ")}
                    >
                      <span>{list.name}</span>
                      {isSelected ? <Check className="h-4 w-4 text-white/80" /> : null}
                    </DropdownMenuItem>
                  );
                })}
                <div className="mt-2 border-t border-white/10 pt-2">
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      if (isCreatingListLoading) return;
                      setIsCreatingList((prev) => !prev);
                      setNewListError(null);
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/90 transition hover:bg-white/10"
                  >
                    <Plus className="h-4 w-4" />
                    Crear nueva lista
                  </DropdownMenuItem>
                  {isCreatingList ? (
                    <div className="mt-2 rounded-xl border border-white/15 bg-black/30 p-2.5">
                      <input
                        type="text"
                        value={newListName}
                        disabled={isCreatingListLoading}
                        onChange={(event) => {
                          setNewListName(event.target.value);
                          if (newListError) setNewListError(null);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleCreateList();
                          }
                        }}
                        placeholder="Nombre de la lista"
                        className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-yellow-300/70 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCreateList}
                        disabled={isCreatingListLoading}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-yellow-400/70 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-yellow-200 transition hover:bg-yellow-400/10"
                      >
                        <ListPlus className="h-4 w-4" />
                        {isCreatingListLoading ? "Creando..." : "Crear y añadir"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
          {newListError ? (
            <p className="text-xs text-rose-300">{newListError}</p>
          ) : null}
          {statusMessage ? (
            <p className="text-xs text-white/80">{statusMessage}</p>
          ) : null}

          <div className="pt-2 border-t border-white/10">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-yellow-300">
              Tu valoración
            </p>
            <button
              type="button"
              onClick={openRatingModal}
              className="mt-3 w-full rounded-xl border border-yellow-400/60 px-4 py-3 text-sm font-semibold text-yellow-200 transition hover:bg-yellow-400/10"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Star className="h-5 w-5" />
                {userRating ? `Tu puntuación: ${userRating}/10` : "Puntuar"}
              </span>
            </button>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-yellow-200/80">
                {userRating ? "Gracias por tu valoración." : "Sin valorar"}
              </span>
              {userRating != null ? (
                <button
                  type="button"
                  onClick={onClearRating}
                  disabled={ratingUpdating}
                  className="text-xs font-semibold text-white/70 transition hover:text-white"
                >
                  Quitar
                </button>
              ) : null}
            </div>
            {ratingMessage ? (
              <p className="mt-2 text-xs text-white/80">{ratingMessage}</p>
            ) : null}
          </div>
        </div>
      </div>

      {canShowVideo && showVideo ? (
        <div
          ref={videoRef}
          id="detail-video"
          className="relative z-10 mt-8 w-full rounded-2xl border border-white/10 bg-black/80 p-5 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-300">
              Tráiler
            </h2>
            <button
              type="button"
              onClick={() => setShowVideo(false)}
              className="rounded-full border border-yellow-400/60 bg-yellow-400/15 px-3 py-1 text-sm font-semibold text-yellow-200 transition hover:bg-yellow-400/30"
              aria-label="Cerrar tráiler"
            >
              ✕
            </button>
          </div>
          <div className="mt-4">
            {videoUrl ? (
              <div className="aspect-video w-full overflow-hidden rounded-xl bg-black/40">
                {isYouTube ? (
                  <iframe
                    src={videoUrl}
                    title={`Video de ${title}`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={videoUrl}
                    controls
                    className="h-full w-full object-cover"
                  >
                    Tu navegador no soporta video.
                  </video>
                )}
              </div>
            ) : (
              <div className="aspect-video w-full rounded-xl bg-black/40 flex items-center justify-center text-gray-300">
                null
              </div>
            )}
          </div>
        </div>
      ) : null}

      // Modal de puntuacion tipo IMDb
      {showRatingModal ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowRatingModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6 text-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowRatingModal(false)}
              className="absolute right-4 top-4 rounded-full border border-white/20 p-1 text-white/70 transition hover:text-white"
              aria-label="Cerrar valoración"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-200">
                <Star className="h-6 w-6" fill="currentColor" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-300">
                  Puntúame
                </p>
                <h3 className="text-xl font-semibold text-white">{title}</h3>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: 10 }, (_, index) => {
                const value = index + 1;
                const isActive = pendingRating >= value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPendingRating(value)}
                    disabled={ratingUpdating}
                    className="rounded-full p-1 transition"
                    aria-label={`Puntuación ${value}`}
                  >
                    <Star
                      className={isActive ? "h-6 w-6 text-yellow-300" : "h-6 w-6 text-white/30"}
                      fill={isActive ? "currentColor" : "none"}
                    />
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleSubmitRating}
              disabled={!pendingRating || ratingUpdating}
              className={[
                "mt-6 w-full rounded-full px-4 py-2 text-sm font-semibold transition",
                !pendingRating || ratingUpdating
                  ? "cursor-not-allowed bg-white/10 text-white/50"
                  : "bg-white/10 text-white hover:bg-white/20",
              ].join(" ")}
            >
              Puntuar
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
