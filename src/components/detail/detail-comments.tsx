import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Ellipsis,
  ImagePlus,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommentAuthor } from "@/components/comments/comment-author";
import { CommentMessage } from "@/components/comments/comment-message";
import { ImageCropModal } from "@/components/ui/image-crop-modal";
import { CommentReactionBar } from "@/components/comments/comment-reaction-bar";
import { CommentSecondaryActions } from "@/components/comments/comment-secondary-actions";
import { createCroppedImage, type CropAreaPixels } from "@/lib/image-crop";

const MAX_COMMENT_IMAGE_MB = 5;
const COMMENT_IMAGE_OUTPUT_SIZE = 1080;

export type DetailComment = {
  id: string;
  numericId?: number | null;
  parentId?: string | null;
  repliesCount?: number;
  user: string;
  userId?: number | null;
  avatarUrl?: string | null;
  isOwn?: boolean;
  date: string;
  createdAtMs?: number | null;
  rating: number | null;
  ratingLabel?: string | null;
  likeCount?: number;
  dislikeCount?: number;
  isLikedByCurrentUser?: boolean;
  isDislikedByCurrentUser?: boolean;
  imageUrl?: string | null;
  comment: string;
};

type DetailCommentsProps = {
  comments: DetailComment[];
  focusCommentId?: string | number | null;
  focusCommentText?: string | null;
  focusCommentUser?: string | null;
  onCreateComment?: (payload: {
    message: string;
    imageFile?: File | null;
    parentId?: number | null;
  }) => Promise<
    | void
    | {
        commentId?: string | number | null;
        parentId?: number | null;
      }
  >;
  onLikeComment?: (comment: DetailComment) => Promise<void>;
  onDislikeComment?: (comment: DetailComment) => Promise<void>;
  onEditComment?: (comment: DetailComment, message: string) => Promise<void>;
  onDeleteComment?: (comment: DetailComment) => Promise<void>;
  canDeleteAnyComment?: boolean;
  creatingComment?: boolean;
  editingCommentId?: string | null;
  reactingCommentId?: string | null;
  deletingCommentId?: string | null;
  createCommentMessage?: string | null;
  listErrorMessage?: string | null;
};

export function DetailComments({
  comments,
  focusCommentId,
  focusCommentText,
  focusCommentUser,
  onCreateComment,
  onLikeComment,
  onDislikeComment,
  onEditComment,
  onDeleteComment,
  canDeleteAnyComment = false,
  creatingComment = false,
  editingCommentId,
  reactingCommentId,
  deletingCommentId,
  createCommentMessage,
  listErrorMessage,
}: DetailCommentsProps) {
  type SortMode = "recent" | "best" | "worst";
  const [draftComment, setDraftComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [commentCropSourceUrl, setCommentCropSourceUrl] = useState<string | null>(
    null
  );
  const [failedCommentImageIds, setFailedCommentImageIds] = useState<Set<string>>(new Set());
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [replyTarget, setReplyTarget] = useState<{
    parentId: number;
    commentId: string;
    username: string;
  } | null>(null);
  const [expandedReplyParents, setExpandedReplyParents] = useState<Set<string>>(
    new Set()
  );
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(
    null
  );
  const [pendingReplyParentId, setPendingReplyParentId] = useState<string | null>(
    null
  );
  const [pendingPublishedComment, setPendingPublishedComment] = useState<{
    commentId: string | null;
    parentId: string | null;
    message: string;
    isReply: boolean;
    requestedAtMs: number;
  } | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setDraftComment("");
    setEditingId(null);
    setEditingDraft("");
    setDraftError(null);
    setActionError(null);
    setReplyTarget(null);
    setExpandedReplyParents(new Set());
    setFailedCommentImageIds(new Set());
  }, [comments]);

  useEffect(() => {
    const normalizedFocusId =
      focusCommentId != null ? String(focusCommentId).trim() : "";
    const normalizedFocusText =
      typeof focusCommentText === "string"
        ? focusCommentText.trim().replace(/\s+/g, " ").toLowerCase()
        : "";
    const normalizedFocusUser =
      typeof focusCommentUser === "string"
        ? focusCommentUser.trim().toLowerCase()
        : "";

    let target: DetailComment | undefined;
    if (normalizedFocusId) {
      target = comments.find((comment) => comment.id === normalizedFocusId);
    }
    if (!target && normalizedFocusText) {
      const byText = comments.filter(
        (comment) =>
          comment.comment?.trim().replace(/\s+/g, " ").toLowerCase() ===
          normalizedFocusText
      );
      if (byText.length && normalizedFocusUser) {
        target = byText.find(
          (comment) => comment.user?.trim().toLowerCase() === normalizedFocusUser
        );
      }
      target ??= byText[0];
    }
    if (!target) return;

    const targetParentId = target.parentId?.trim();
    if (targetParentId) {
      setExpandedReplyParents((prev) => new Set(prev).add(targetParentId));
    }

    let raf1 = 0;
    let raf2 = 0;
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        const targetId = target?.id ?? normalizedFocusId;
        const element = document.getElementById(`comment-${targetId}`);
        if (!element) return;
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedCommentId(targetId);
        window.setTimeout(() => {
          setHighlightedCommentId((current) =>
            current === targetId ? null : current
          );
        }, 1800);
      });
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [comments, focusCommentId, focusCommentText, focusCommentUser]);

  useEffect(() => {
    return () => {
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
      }
      if (commentCropSourceUrl) {
        URL.revokeObjectURL(commentCropSourceUrl);
      }
    };
  }, [selectedImagePreview, commentCropSourceUrl]);

  useEffect(() => {
    if (!replyTarget) return;
    const raf = window.requestAnimationFrame(() => {
      replyTextareaRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [replyTarget]);

  const focusAndHighlightComment = (targetId: string) => {
    let raf1 = 0;
    let raf2 = 0;
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        const element = document.getElementById(`comment-${targetId}`);
        if (!element) return;
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedCommentId(targetId);
        window.setTimeout(() => {
          setHighlightedCommentId((current) =>
            current === targetId ? null : current
          );
        }, 1800);
      });
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  };

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

  const threadedComments = useMemo(() => {
    const ids = new Set(sortedComments.map((comment) => comment.id));
    const parents: DetailComment[] = [];
    const repliesByParent = new Map<string, DetailComment[]>();

    for (const comment of sortedComments) {
      const parentId = comment.parentId?.trim() ?? "";
      if (!parentId || !ids.has(parentId)) {
        parents.push(comment);
        continue;
      }
      const bucket = repliesByParent.get(parentId) ?? [];
      bucket.push(comment);
      repliesByParent.set(parentId, bucket);
    }

    for (const [, replies] of repliesByParent) {
      replies.sort((a, b) => {
        const aTs = a.createdAtMs ?? 0;
        const bTs = b.createdAtMs ?? 0;
        if (aTs === bTs) return a.id.localeCompare(b.id);
        return aTs - bTs;
      });
    }

    return parents.map((parent) => ({
      parent,
      replies: repliesByParent.get(parent.id) ?? [],
    }));
  }, [sortedComments]);

  const clearSelectedImage = () => {
    setSelectedImageFile(null);
    setSelectedImagePreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const closeCommentCropModal = () => {
    setCommentCropSourceUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const saveCommentCrop = async (cropAreaPixels: CropAreaPixels) => {
    if (!commentCropSourceUrl) return;

    const { blob } = await createCroppedImage({
      imageSrc: commentCropSourceUrl,
      cropAreaPixels,
      outputWidth: COMMENT_IMAGE_OUTPUT_SIZE,
      outputHeight: COMMENT_IMAGE_OUTPUT_SIZE,
      type: "image/jpeg",
      quality: 0.9,
    });

    const imageFile = new File([blob], `comentario-${Date.now()}.jpg`, {
      type: blob.type || "image/jpeg",
      lastModified: Date.now(),
    });

    const imagePreviewUrl = URL.createObjectURL(blob);
    setSelectedImageFile(imageFile);
    setSelectedImagePreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return imagePreviewUrl;
    });
    setDraftError(null);
    closeCommentCropModal();
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setDraftError("Selecciona una imagen válida.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_COMMENT_IMAGE_MB * 1024 * 1024) {
      setDraftError(`La imagen supera los ${MAX_COMMENT_IMAGE_MB}MB permitidos.`);
      event.target.value = "";
      return;
    }

    setCommentCropSourceUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setDraftError(null);
  };

  const publishComment = async () => {
    const normalized = draftComment.trim();
    if (!normalized && !selectedImageFile) {
      setDraftError("Escribe un comentario o añade una imagen antes de publicar.");
      return;
    }

    if (!onCreateComment) return;

    try {
      const publishResult = await onCreateComment({
        message: normalized,
        imageFile: selectedImageFile,
        parentId: replyTarget?.parentId ?? null,
      });
      const rawCreatedId =
        publishResult &&
        typeof publishResult === "object" &&
        "commentId" in publishResult
          ? publishResult.commentId
          : null;
      const createdCommentId =
        rawCreatedId != null ? String(rawCreatedId).trim() : "";
      const targetReplyParentId =
        replyTarget?.parentId != null ? String(replyTarget.parentId) : null;
      const messageForMatching = normalized.trim();
      if (targetReplyParentId) {
        setPendingReplyParentId(targetReplyParentId);
      }
      setPendingPublishedComment({
        commentId: createdCommentId || null,
        parentId: targetReplyParentId,
        message: messageForMatching,
        isReply: Boolean(targetReplyParentId),
        requestedAtMs: Date.now(),
      });
      setDraftComment("");
      setDraftError(null);
      setActionError(null);
      setReplyTarget(null);
      clearSelectedImage();
    } catch (err) {
      setDraftError(
        err instanceof Error
          ? err.message
          : "No se pudo publicar el comentario."
      );
    }
  };

  useEffect(() => {
    if (!pendingReplyParentId) return;
    const hasAnyReply = comments.some(
      (comment) => comment.parentId?.trim() === pendingReplyParentId
    );
    if (!hasAnyReply) return;
    setExpandedReplyParents((prev) => {
      const next = new Set(prev);
      next.add(pendingReplyParentId);
      return next;
    });
    setPendingReplyParentId(null);
  }, [comments, pendingReplyParentId]);

  useEffect(() => {
    if (!pendingPublishedComment) return;
    const normalizeCommentText = (value: string) =>
      value.trim().replace(/\s+/g, " ").toLowerCase();
    const requestedAtMs = pendingPublishedComment.requestedAtMs;
    const minimumTimestamp = requestedAtMs - 20_000;
    const normalizedMessage = normalizeCommentText(pendingPublishedComment.message);

    let target =
      pendingPublishedComment.commentId != null
        ? comments.find((comment) => comment.id === pendingPublishedComment.commentId)
        : undefined;

    if (!target) {
      const scoped = comments.filter((comment) => {
        const isRecent = (comment.createdAtMs ?? 0) >= minimumTimestamp;
        if (!isRecent) return false;
        if (pendingPublishedComment.isReply) {
          return comment.parentId?.trim() === pendingPublishedComment.parentId;
        }
        return !(comment.parentId?.trim());
      });

      const byMessage =
        normalizedMessage.length > 0
          ? scoped.filter(
              (comment) => normalizeCommentText(comment.comment ?? "") === normalizedMessage
            )
          : [];
      const pool = byMessage.length > 0 ? byMessage : scoped.filter((comment) => comment.isOwn);
      if (pool.length > 0) {
        target = [...pool].sort(
          (a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0)
        )[0];
      }
    }

    if (!target) return;

    const parentId = target.parentId?.trim();
    if (parentId) {
      setExpandedReplyParents((prev) => {
        const next = new Set(prev);
        next.add(parentId);
        return next;
      });
    }
    focusAndHighlightComment(target.id);
    setPendingPublishedComment(null);
  }, [comments, pendingPublishedComment]);

  const toggleReplies = (parentId: string) => {
    setExpandedReplyParents((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) {
        next.delete(parentId);
      } else {
        next.add(parentId);
      }
      return next;
    });
  };

  const startEditingComment = (comment: DetailComment) => {
    setEditingId(comment.id);
    setEditingDraft(comment.comment ?? "");
    setActionError(null);
  };

  const cancelEditingComment = () => {
    setEditingId(null);
    setEditingDraft("");
    setActionError(null);
  };

  const saveEditedComment = async (comment: DetailComment) => {
    if (!onEditComment) return;

    const normalized = editingDraft.trim();
    if (!normalized) {
      setActionError("El comentario no puede estar vacío.");
      return;
    }

    try {
      await onEditComment(comment, normalized);
      cancelEditingComment();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "No se pudo editar el comentario."
      );
    }
  };

  const renderComposer = ({
    textareaId,
    label,
    placeholder,
    submitLabel,
    submitBusyLabel,
    textareaRef,
    onCancel,
  }: {
    textareaId: string;
    label: string;
    placeholder: string;
    submitLabel: string;
    submitBusyLabel: string;
    textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
    onCancel?: () => void;
  }) => {
    return (
      <>
        <label
          htmlFor={textareaId}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-600"
        >
          {label}
        </label>
        <div className="mx-auto mt-3 w-full max-w-4xl">
          <textarea
            ref={textareaRef}
            id={textareaId}
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
            placeholder={placeholder}
            className="min-h-[130px] w-full resize-y rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm leading-relaxed text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
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
                onClick={clearSelectedImage}
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
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-indigo-200 bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              Cancelar respuesta
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void publishComment()}
            disabled={creatingComment}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creatingComment ? submitBusyLabel : submitLabel}
          </button>
        </div>
        {draftError ? <p className="mt-2 text-xs text-rose-600">{draftError}</p> : null}
        {createCommentMessage ? (
          <p className="mt-2 text-xs text-emerald-700">{createCommentMessage}</p>
        ) : null}
        {actionError ? (
          <p className="mt-2 text-xs text-rose-600">{actionError}</p>
        ) : null}
      </>
    );
  };

  const renderCommentCard = (comment: DetailComment, isReply = false) => {
    const isEditingCurrent = editingId === comment.id;
    const isSavingCurrent = editingCommentId === comment.id;
    const isReactingCurrent = reactingCommentId === comment.id;
    const articleClassName = isReply
      ? "rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm"
      : "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";
    const isHighlighted = highlightedCommentId === comment.id;
    const isReplyComposerTarget = replyTarget?.commentId === comment.id;

    return (
      <div key={comment.id} className="space-y-3">
        <article
          id={`comment-${comment.id}`}
          className={`${articleClassName} ${isHighlighted ? "ring-2 ring-violet-300" : ""}`}
        >
          <div className="flex items-center gap-3">
            <CommentAuthor
              user={comment.user}
              avatarUrl={comment.avatarUrl}
              dateLabel={comment.date}
              containerClassName="flex items-center gap-3"
              avatarSizeClassName="h-10 w-10"
              avatarFallbackClassName="bg-violet-100 text-violet-700 text-sm"
              nameClassName="text-sm font-semibold text-gray-900"
              dateClassName="text-xs text-gray-500"
              textClassName=""
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Opciones del comentario"
                >
                  <Ellipsis className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg"
              >
                <CommentSecondaryActions
                  mode="menu"
                  onReply={() => {
                    const parentFromComment = Number(comment.parentId ?? 0);
                    const targetParentId =
                      Number.isFinite(parentFromComment) && parentFromComment > 0
                        ? parentFromComment
                        : Number(comment.numericId ?? 0);
                    if (!Number.isFinite(targetParentId) || targetParentId <= 0) {
                      setActionError("No se pudo identificar el comentario padre.");
                      return;
                    }
                    setDraftComment(`@${comment.user} `);
                    setReplyTarget({
                      parentId: targetParentId,
                      commentId: comment.id,
                      username: comment.user,
                    });
                    setExpandedReplyParents((prev) =>
                      new Set(prev).add(String(targetParentId))
                    );
                    setActionError(null);
                  }}
                  onEdit={() => {
                    startEditingComment(comment);
                  }}
                  onDelete={() => {
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
                  editDisabled={
                    !comment.isOwn ||
                    !onEditComment ||
                    deletingCommentId === comment.id ||
                    isSavingCurrent
                  }
                  deleteDisabled={
                    (!(comment.isOwn || canDeleteAnyComment)) ||
                    deletingCommentId === comment.id
                  }
                  deleting={deletingCommentId === comment.id}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isEditingCurrent ? (
            <div className="mt-3">
              <textarea
                value={editingDraft}
                onChange={(event) => {
                  setEditingDraft(event.target.value);
                  if (actionError) setActionError(null);
                }}
                className="min-h-[90px] w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                placeholder="Edita tu comentario..."
              />
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelEditingComment}
                  disabled={isSavingCurrent}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void saveEditedComment(comment)}
                  disabled={isSavingCurrent}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingCurrent ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          ) : comment.comment ? (
            <CommentMessage
              message={comment.comment}
              paragraphClassName="mt-3 text-sm text-gray-600 line-clamp-4"
            />
          ) : !comment.imageUrl ? (
            <CommentMessage
              emptyLabel="Sin comentario."
              emptyClassName="mt-3 text-sm text-gray-600"
            />
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
          <CommentReactionBar
            variant="icon"
            className="mt-3 flex items-center justify-end gap-2"
            likeCount={comment.likeCount}
            dislikeCount={comment.dislikeCount}
            isLiked={comment.isLikedByCurrentUser}
            isDisliked={comment.isDislikedByCurrentUser}
            disabled={isReactingCurrent}
            onLike={
              onLikeComment
                ? () => {
                    void (async () => {
                      try {
                        await onLikeComment(comment);
                        setActionError(null);
                      } catch (err) {
                        setActionError(
                          err instanceof Error
                            ? err.message
                            : "No se pudo registrar el like."
                        );
                      }
                    })();
                  }
                : undefined
            }
            onDislike={
              onDislikeComment
                ? () => {
                    void (async () => {
                      try {
                        await onDislikeComment(comment);
                        setActionError(null);
                      } catch (err) {
                        setActionError(
                          err instanceof Error
                            ? err.message
                            : "No se pudo registrar el dislike."
                        );
                      }
                    })();
                  }
                : undefined
            }
          />
        </article>
        {isReplyComposerTarget ? (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            {renderComposer({
              textareaId: "reply-comment",
              label: `Responder a @${replyTarget?.username ?? comment.user}`,
              placeholder: `Escribe una respuesta para @${replyTarget?.username ?? comment.user}...`,
              submitLabel: "Responder",
              submitBusyLabel: "Publicando...",
              textareaRef: replyTextareaRef,
              onCancel: () => {
                setReplyTarget(null);
                setDraftError(null);
                clearSelectedImage();
              },
            })}
          </div>
        ) : null}
      </div>
    );
  };

  const renderMainComposer = () => {
    if (replyTarget) {
      return (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
          Estás respondiendo a <strong>@{replyTarget.username}</strong>. El editor
          aparece debajo de su comentario.
        </div>
      );
    }

    return (
      <>
        {renderComposer({
          textareaId: "new-comment",
          label: "Tu comentario",
          placeholder: "Escribe qué te ha parecido este título...",
          submitLabel: "Publicar",
          submitBusyLabel: "Publicando...",
        })}
      </>
    );
  };

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />
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
        {renderMainComposer()}
      </div>

      <div className="mt-6 space-y-4">
        {listErrorMessage ? (
          <p className="text-sm text-rose-600">{listErrorMessage}</p>
        ) : null}
        {!listErrorMessage && threadedComments.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aún no hay comentarios para este título.
          </p>
        ) : null}
        {threadedComments.map(({ parent, replies }) => {
          const isExpanded = expandedReplyParents.has(parent.id);
          const totalReplies = Math.max(replies.length, parent.repliesCount ?? 0);
          return (
            <div key={parent.id}>
              {renderCommentCard(parent)}
              {totalReplies > 0 ? (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => toggleReplies(parent.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                    {isExpanded ? "Ocultar respuestas" : "Ver respuestas"} ({totalReplies})
                  </button>
                </div>
              ) : null}
              {totalReplies > 0 && isExpanded ? (
                <div className="mt-3 space-y-3 border-l border-gray-200 pl-4 sm:pl-6">
                  {replies.length > 0 ? (
                    replies.map((reply) => renderCommentCard(reply, true))
                  ) : (
                    <p className="text-xs text-gray-500">
                      Hay respuestas, pero no se han cargado en este bloque.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
      <ImageCropModal
        open={Boolean(commentCropSourceUrl)}
        imageSrc={commentCropSourceUrl}
        title="Recortar imagen del comentario"
        description="Ajusta la imagen antes de adjuntarla al comentario."
        aspect={1}
        cropShape="rect"
        panelClassName="max-w-xl"
        cropAreaClassName="h-[320px] w-full"
        confirmLabel="Usar imagen"
        savingLabel="Procesando..."
        onClose={closeCommentCropModal}
        onSave={async (cropAreaPixels) => {
          try {
            await saveCommentCrop(cropAreaPixels);
          } catch (error) {
            setDraftError(
              error instanceof Error
                ? error.message
                : "No se pudo recortar la imagen."
            );
          }
        }}
      />
    </>
  );
}
