import { useEffect, useMemo, useRef, useState } from "react";
import { Ellipsis, ImagePlus, MessageCircleReply, Pencil, Star, Trash2, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type DetailComment = {
  id: string;
  user: string;
  userId?: number | null;
  avatarUrl?: string | null;
  isOwn?: boolean;
  date: string;
  createdAtMs?: number | null;
  rating: number | null;
  ratingLabel?: string | null;
  imageUrl?: string | null;
  comment: string;
};

type DetailCommentsProps = {
  comments: DetailComment[];
  onCreateComment?: (payload: {
    message: string;
    imageFile?: File | null;
  }) => Promise<void>;
  onDeleteComment?: (comment: DetailComment) => Promise<void>;
  creatingComment?: boolean;
  deletingCommentId?: string | null;
  userRating?: number | null;
  createCommentMessage?: string | null;
  listErrorMessage?: string | null;
};

export function DetailComments({
  comments,
  onCreateComment,
  onDeleteComment,
  creatingComment = false,
  deletingCommentId,
  userRating,
  createCommentMessage,
  listErrorMessage,
}: DetailCommentsProps) {
  type SortMode = "recent" | "best" | "worst";
  const [draftComment, setDraftComment] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [failedAvatarIds, setFailedAvatarIds] = useState<Set<string>>(new Set());
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [failedCommentImageIds, setFailedCommentImageIds] = useState<Set<string>>(new Set());
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraftComment("");
    setDraftError(null);
    setActionError(null);
    setFailedAvatarIds(new Set());
    setFailedCommentImageIds(new Set());
  }, [comments]);

  useEffect(() => {
    return () => {
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  const sortedComments = useMemo(() => {
    const withIndex = comments.map((comment, index) => ({ comment, index }));

    if (sortMode === "recent") {
      withIndex.sort((a, b) => {
        const aTs = a.comment.createdAtMs ?? 0;
        const bTs = b.comment.createdAtMs ?? 0;
        if (aTs === bTs) return a.index - b.index;
        return bTs - aTs;
      });
    } else if (sortMode === "best") {
      withIndex.sort((a, b) => {
        const aRating = a.comment.rating ?? -1;
        const bRating = b.comment.rating ?? -1;
        if (aRating === bRating) return a.index - b.index;
        return bRating - aRating;
      });
    } else {
      withIndex.sort((a, b) => {
        const aRating = a.comment.rating ?? Number.POSITIVE_INFINITY;
        const bRating = b.comment.rating ?? Number.POSITIVE_INFINITY;
        if (aRating === bRating) return a.index - b.index;
        return aRating - bRating;
      });
    }

    return withIndex.map((entry) => entry.comment);
  }, [comments, sortMode]);

  const publishComment = async () => {
    const normalized = draftComment.trim();
    if (!normalized && !selectedImageFile) {
      setDraftError("Escribe un comentario o añade una imagen antes de publicar.");
      return;
    }

    if (!onCreateComment) return;

    try {
      await onCreateComment({
        message: normalized,
        imageFile: selectedImageFile,
      });
      setDraftComment("");
      setDraftError(null);
      setActionError(null);
      setSelectedImageFile(null);
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
      }
      setSelectedImagePreview(null);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    } catch (err) {
      setDraftError(
        err instanceof Error
          ? err.message
          : "No se pudo publicar el comentario."
      );
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Comentarios de usuarios
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-xs font-semibold uppercase tracking-[0.2em]">
            Ordenar por
          </span>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700"
          >
            <option value="recent">Más recientes</option>
            <option value="best">Mejor valoración</option>
            <option value="worst">Peor valoración</option>
          </select>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <label
          htmlFor="new-comment"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-600"
        >
          Tu comentario
        </label>
        <div className="mx-auto mt-3 w-full max-w-4xl">
          <textarea
            id="new-comment"
            value={draftComment}
            onChange={(event) => {
              setDraftComment(event.target.value);
              if (draftError) setDraftError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                void publishComment();
              }
            }}
            placeholder="Escribe qué te ha parecido este título..."
            className="min-h-[130px] w-full resize-y rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm leading-relaxed text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedImageFile(file);

              if (selectedImagePreview) {
                URL.revokeObjectURL(selectedImagePreview);
              }

              if (file) {
                setSelectedImagePreview(URL.createObjectURL(file));
              } else {
                setSelectedImagePreview(null);
              }
            }}
          />
        </div>
        {selectedImagePreview ? (
          <div className="mx-auto mt-3 w-full max-w-4xl">
            <div className="relative inline-block">
            <img
              src={selectedImagePreview}
              alt="Previsualización"
              className="h-24 w-24 rounded-lg border border-gray-200 object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setSelectedImageFile(null);
                if (selectedImagePreview) {
                  URL.revokeObjectURL(selectedImagePreview);
                }
                setSelectedImagePreview(null);
                if (imageInputRef.current) {
                  imageInputRef.current.value = "";
                }
              }}
              className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-100"
              aria-label="Quitar imagen"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            </div>
          </div>
        ) : null}
        <div className="mx-auto mt-4 flex w-full max-w-4xl flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            <ImagePlus className="h-4 w-4" />
            Añadir imagen
          </button>
          <button
            type="button"
            onClick={() => void publishComment()}
            disabled={creatingComment}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creatingComment ? "Publicando..." : "Publicar"}
          </button>
        </div>
        {draftError ? (
          <p className="mt-2 text-xs text-rose-600">{draftError}</p>
        ) : null}
        {createCommentMessage ? (
          <p className="mt-2 text-xs text-emerald-700">{createCommentMessage}</p>
        ) : null}
        {actionError ? (
          <p className="mt-2 text-xs text-rose-600">{actionError}</p>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listErrorMessage ? (
          <p className="text-sm text-rose-600 sm:col-span-2 lg:col-span-3">
            {listErrorMessage}
          </p>
        ) : null}
        {!listErrorMessage && sortedComments.length === 0 ? (
          <p className="text-sm text-gray-500 sm:col-span-2 lg:col-span-3">
            Aún no hay comentarios para este título.
          </p>
        ) : null}
        {sortedComments.map((comment) => {
          const ownRatingValue =
            comment.isOwn &&
            userRating != null &&
            Number.isFinite(userRating)
              ? userRating
              : null;
          const effectiveRatingLabel =
            ownRatingValue != null ? `${ownRatingValue}/10` : comment.ratingLabel;
          const effectiveStars =
            ownRatingValue != null
              ? Math.max(0, Math.min(5, Math.round(ownRatingValue / 2)))
              : comment.rating != null
                ? Math.max(0, Math.min(5, Math.round(comment.rating)))
                : null;

          return (
            <article
              key={comment.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
                  {comment.avatarUrl && !failedAvatarIds.has(comment.id) ? (
                    <img
                      src={comment.avatarUrl}
                      alt={comment.user}
                      className="h-10 w-10 rounded-full object-cover"
                      onError={() => {
                        setFailedAvatarIds((prev) => {
                          const next = new Set(prev);
                          next.add(comment.id);
                          return next;
                        });
                      }}
                    />
                  ) : (
                    (comment.user?.[0] ?? "U").toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {comment.user}
                  </p>
                  <p className="text-xs text-gray-500">{comment.date}</p>
                </div>
                <div className="ml-auto text-xs font-semibold text-yellow-500">
                  {effectiveRatingLabel || effectiveStars != null ? (
                    <span className="inline-flex items-center gap-1">
                      <span>
                        {effectiveRatingLabel
                          ? effectiveRatingLabel
                          : "⭐".repeat(effectiveStars ?? 0)}
                      </span>
                      <Star className="h-3.5 w-3.5 fill-current" />
                    </span>
                  ) : (
                    "Sin rating"
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                      aria-label="Opciones del comentario"
                    >
                      <Ellipsis className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-44 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg"
                  >
                    <DropdownMenuItem
                      onSelect={() => {
                        setDraftComment(`@${comment.user} `);
                        setActionError(null);
                      }}
                      className="rounded-lg px-2.5 py-2 text-sm text-gray-700"
                    >
                      <MessageCircleReply className="h-4 w-4 text-gray-500" />
                      Responder
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!comment.isOwn}
                      onSelect={() => {
                        setActionError("Editar comentario estará disponible pronto.");
                      }}
                      className="rounded-lg px-2.5 py-2 text-sm text-gray-700"
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!comment.isOwn || deletingCommentId === comment.id}
                      onSelect={() => {
                        if (!onDeleteComment) return;
                        void (async () => {
                          try {
                            await onDeleteComment(comment);
                            setActionError(null);
                          } catch (err) {
                            setActionError(
                              err instanceof Error
                                ? err.message
                                : "No se pudo borrar el comentario."
                            );
                          }
                        })();
                      }}
                      className="rounded-lg px-2.5 py-2 text-sm text-rose-600"
                    >
                      <Trash2 className="h-4 w-4 text-rose-500" />
                      {deletingCommentId === comment.id ? "Borrando..." : "Eliminar"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {comment.comment ? (
                <p className="mt-3 text-sm text-gray-600 line-clamp-4">
                  {comment.comment}
                </p>
              ) : !comment.imageUrl ? (
                <p className="mt-3 text-sm text-gray-600">Sin comentario.</p>
              ) : null}
              {comment.imageUrl && !failedCommentImageIds.has(comment.id) ? (
                <div className="mt-3">
                  <img
                    src={comment.imageUrl}
                    alt="Imagen del comentario"
                    className="h-36 w-full rounded-lg border border-gray-200 object-cover"
                    onError={() => {
                      setFailedCommentImageIds((prev) => {
                        const next = new Set(prev);
                        next.add(comment.id);
                        return next;
                      });
                    }}
                  />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
