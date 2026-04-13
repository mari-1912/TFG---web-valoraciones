import { useCallback, useEffect, useState } from "react";
import type { DetailComment } from "@/components/detail/detail-comments";
import {
  createContentComment,
  deleteContentComment,
  listContentComments,
} from "@/services/content-comments";
import { appendProfileActivity } from "@/services/profile-activity";
import {
  IMAGE_ONLY_COMMENT_PLACEHOLDER,
  mapApiComment,
  truncateText,
} from "@/pages/detail-page.helpers";

type UseDetailCommentsArgs = {
  normalizedId: string;
  isLoggedIn: boolean;
  sessionUsername: string;
  title: string;
  currentUserId: number | null;
  currentUserAvatarUrl: string | null;
  apiUrl: string;
};

export function useDetailComments({
  normalizedId,
  isLoggedIn,
  sessionUsername,
  title,
  currentUserId,
  currentUserAvatarUrl,
  apiUrl,
}: UseDetailCommentsArgs) {
  const [localCommentImages, setLocalCommentImages] = useState<
    Record<string, string>
  >({});
  const [comments, setComments] = useState<DetailComment[]>([]);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [commentMessage, setCommentMessage] = useState<string | null>(null);

  useEffect(() => {
    setComments([]);
    setCommentsError(null);
    setCommentMessage(null);
    setDeletingCommentId(null);
    setCommentSubmitting(false);
    setLocalCommentImages((prev) => {
      Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
      return {};
    });
  }, [normalizedId]);

  useEffect(() => {
    return () => {
      setLocalCommentImages((prev) => {
        Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
        return prev;
      });
    };
  }, []);

  useEffect(() => {
    if (!normalizedId) return;

    const controller = new AbortController();
    const loadComments = async () => {
      setCommentsError(null);
      try {
        const data = await listContentComments(normalizedId, {
          signal: controller.signal,
        });
        const payload = Array.isArray(data?.comentarios) ? data.comentarios : [];
        setComments(
          payload.map((comment, index) =>
            mapApiComment(
              comment,
              index,
              {
                currentUserId,
                currentUsername: sessionUsername,
                currentUserAvatarUrl,
                localCommentImages,
              },
              apiUrl
            )
          )
        );
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        setComments([]);
        setCommentsError(
          err instanceof Error ? err.message : "No se pudieron cargar los comentarios."
        );
      }
    };

    void loadComments();
    return () => controller.abort();
  }, [
    normalizedId,
    sessionUsername,
    currentUserId,
    currentUserAvatarUrl,
    localCommentImages,
    apiUrl,
  ]);

  const handleCreateComment = useCallback(
    async (input: { message: string; imageFile?: File | null }) => {
      const message = input.message;
      const normalizedMessage = message.trim();
      const imageFile = input.imageFile ?? null;
      if (!isLoggedIn) {
        const errorMessage = "Inicia sesión para comentar.";
        setCommentMessage(null);
        throw new Error(errorMessage);
      }
      if (!normalizedId) {
        const errorMessage = "No se pudo identificar el contenido.";
        setCommentMessage(null);
        throw new Error(errorMessage);
      }
      if (!normalizedMessage && !imageFile) {
        const errorMessage = "Escribe un comentario o añade una imagen.";
        setCommentMessage(null);
        throw new Error(errorMessage);
      }

      setCommentSubmitting(true);
      setCommentMessage(null);

      try {
        const messageForApi =
          normalizedMessage || (imageFile ? IMAGE_ONLY_COMMENT_PLACEHOLDER : "");
        const data = await createContentComment(normalizedId, messageForApi);
        const createdComment = data?.comentario ?? null;
        let mergedLocalImages = localCommentImages;
        if (createdComment) {
          const createdId = String(createdComment.commentId ?? "").trim();
          if (createdId && imageFile) {
            const localUrl = URL.createObjectURL(imageFile);
            mergedLocalImages = { ...localCommentImages, [createdId]: localUrl };
            setLocalCommentImages(mergedLocalImages);
          }
          setComments((prev) => [
            mapApiComment(
              createdComment,
              0,
              {
                currentUserId,
                currentUsername: sessionUsername,
                currentUserAvatarUrl,
                localCommentImages: mergedLocalImages,
              },
              apiUrl
            ),
            ...prev,
          ]);
        }
        try {
          const latest = await listContentComments(normalizedId);
          const payloadComments = Array.isArray(latest?.comentarios)
            ? latest.comentarios
            : [];
          setComments(
            payloadComments.map((comment, index) =>
              mapApiComment(
                comment,
                index,
                {
                  currentUserId,
                  currentUsername: sessionUsername,
                  currentUserAvatarUrl,
                  localCommentImages: mergedLocalImages,
                },
                apiUrl
              )
            )
          );
          setCommentsError(null);
        } catch {
          // Si falla el refresco de la lista, mantenemos al menos el comentario insertado.
        }
        setCommentMessage("Comentario publicado.");
        appendProfileActivity(sessionUsername, {
          type: "comment",
          title: `Comentaste en ${title}`,
          detail: normalizedMessage
            ? `“${truncateText(normalizedMessage)}”`
            : "Comentario con imagen",
          date: new Date().toISOString(),
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "No se pudo publicar el comentario.";
        setCommentMessage(null);
        throw new Error(errorMessage);
      } finally {
        setCommentSubmitting(false);
      }
    },
    [
      isLoggedIn,
      normalizedId,
      localCommentImages,
      currentUserId,
      sessionUsername,
      currentUserAvatarUrl,
      apiUrl,
      title,
    ]
  );

  const handleDeleteComment = useCallback(
    async (comment: DetailComment) => {
      if (!isLoggedIn) {
        throw new Error("Inicia sesión para borrar comentarios.");
      }
      if (!normalizedId) {
        throw new Error("No se pudo identificar el contenido.");
      }
      if (!comment?.id) {
        throw new Error("No se pudo identificar el comentario.");
      }

      setDeletingCommentId(comment.id);
      setCommentMessage(null);
      try {
        await deleteContentComment(normalizedId, comment.id);
        setComments((prev) => prev.filter((item) => item.id !== comment.id));
        setLocalCommentImages((prev) => {
          const next = { ...prev };
          const imageUrl = next[comment.id];
          if (imageUrl) URL.revokeObjectURL(imageUrl);
          delete next[comment.id];
          return next;
        });
        setCommentMessage("Comentario borrado.");
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : "No se pudo borrar el comentario."
        );
      } finally {
        setDeletingCommentId(null);
      }
    },
    [isLoggedIn, normalizedId]
  );

  return {
    comments,
    commentsError,
    commentSubmitting,
    deletingCommentId,
    commentMessage,
    handleCreateComment,
    handleDeleteComment,
  };
}
