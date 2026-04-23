import { useCallback, useEffect, useRef, useState } from "react";
import type { DetailComment } from "@/components/detail/detail-comments";
import {
  createContentComment,
  deleteContentComment,
  listContentComments,
  reactToContentComment,
  updateContentComment,
} from "@/services/content-comments";
import {
  formatRatingOutOfTen,
  IMAGE_ONLY_COMMENT_PLACEHOLDER,
  mapApiComment,
  parseRating,
  resolveAssetUrl,
  toFiveStars,
} from "@/pages/detail-page.helpers";
import { fetchUserProfile } from "@/services/profile-service";
import { searchUsers } from "@/services/search-service";

type UseDetailCommentsArgs = {
  normalizedId: string;
  isLoggedIn: boolean;
  canDeleteAnyComment?: boolean;
  sessionUsername: string;
  currentUserId: number | null;
  currentUserAvatarUrl: string | null;
  apiUrl: string;
};

export function useDetailComments({
  normalizedId,
  isLoggedIn,
  canDeleteAnyComment = false,
  sessionUsername,
  currentUserId,
  currentUserAvatarUrl,
  apiUrl,
}: UseDetailCommentsArgs) {
  const avatarCacheRef = useRef<Map<number, string>>(new Map());
  const ratingByUserIdRef = useRef<Map<number, number>>(new Map());
  const avatarByUsernameRef = useRef<Map<string, string>>(new Map());
  const userIdByUsernameRef = useRef<Map<string, number>>(new Map());
  const [localCommentImages, setLocalCommentImages] = useState<
    Record<string, string>
  >({});
  const [comments, setComments] = useState<DetailComment[]>([]);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [reactingCommentId, setReactingCommentId] = useState<string | null>(null);
  const [commentMessage, setCommentMessage] = useState<string | null>(null);

  const hydrateCommentAvatars = useCallback(
    async (items: DetailComment[], signal?: AbortSignal): Promise<DetailComment[]> => {
      const parseDate = (value: unknown) => {
        if (typeof value !== "string" || !value.trim()) return 0;
        const parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : 0;
      };
      const contentId = normalizedId.trim();
      const extractRatingFromRecord = (record: any): number | null => {
        if (!record || typeof record !== "object") return null;
        const recordType = String(
          record?.tipo ?? record?.type ?? record?.accion ?? ""
        )
          .trim()
          .toLowerCase();
        if (
          recordType &&
          ![
            "valoracion",
            "rating",
            "rated",
            "rate",
            "puntuacion",
            "valorar",
          ].includes(recordType)
        ) {
          return null;
        }

        const recordContentId =
          record?.contenidoId ??
          record?.contentId ??
          record?.idContenido ??
          record?.itemId ??
          record?.metadata?.contenidoId ??
          record?.metadata?.contentId ??
          record?.valoracion?.contenidoId ??
          record?.rating?.contenidoId;

        if (recordContentId != null && String(recordContentId) !== contentId) {
          return null;
        }

        return parseRating(
          record?.puntuacion ??
            record?.rating ??
            record?.valoracion ??
            record?.score ??
            record?.ratingValue ??
            record?.valoracion?.puntuacion ??
            record?.rating?.value ??
            record?.metadata?.puntuacion ??
            record?.metadata?.rating ??
            record?.metadata?.valoracion
        );
      };
      const extractProfileRatingForContent = (payload: any): number | null => {
        if (!payload || typeof payload !== "object" || !contentId) return null;
        const root = payload;
        const perfil = root?.perfil ?? {};

        const directCandidates = [
          root?.valoracion,
          root?.rating,
          root?.valoracionUsuario,
          root?.valoracion_personal,
          perfil?.valoracion,
          perfil?.rating,
          perfil?.valoracionUsuario,
          perfil?.valoracion_personal,
        ];
        for (const candidate of directCandidates) {
          const parsed = extractRatingFromRecord(candidate);
          if (parsed != null) return parsed;
        }

        const activityArrays = [
          root?.actividad,
          root?.actividadReciente,
          root?.timeline,
          perfil?.actividad,
          perfil?.actividadReciente,
          perfil?.timeline,
          root?.valoraciones,
          root?.ratings,
          perfil?.valoraciones,
          perfil?.ratings,
        ];

        let best: { value: number; ts: number } | null = null;
        for (const arrayCandidate of activityArrays) {
          if (!Array.isArray(arrayCandidate)) continue;
          for (const row of arrayCandidate) {
            const parsed = extractRatingFromRecord(row);
            if (parsed == null) continue;
            const ts = Math.max(
              parseDate(row?.updateDate),
              parseDate(row?.createDate),
              parseDate(row?.date),
              parseDate(row?.fecha)
            );
            if (!best || ts >= best.ts) {
              best = { value: parsed, ts };
            }
          }
        }

        return best?.value ?? null;
      };

      const userIdsToLoad = Array.from(
        new Set(
          items
            .filter(
              (comment) =>
                comment.userId != null &&
                !avatarCacheRef.current.has(comment.userId)
            )
            .map((comment) => comment.userId as number)
        )
      ).slice(0, 20);

      if (userIdsToLoad.length) {
        await Promise.all(
          userIdsToLoad.map(async (userId) => {
            try {
              const payload = await fetchUserProfile(userId, signal);
              const perfil = payload?.perfil ?? {};
              const avatarCandidates = [
                (perfil as { avatarUrl?: string }).avatarUrl,
                (perfil as { avatarPath?: string }).avatarPath,
                (perfil as { avatar_path?: string }).avatar_path,
                (perfil as { foto?: string }).foto,
                (perfil as { avatar?: string }).avatar,
                (perfil as { imagenPerfil?: string }).imagenPerfil,
              ];
              const rawAvatar = avatarCandidates.find(
                (value) => typeof value === "string" && value.trim()
              ) as string | undefined;
              const resolvedAvatar = resolveAssetUrl(rawAvatar, apiUrl);
              if (resolvedAvatar) avatarCacheRef.current.set(userId, resolvedAvatar);

              const inferredRating = extractProfileRatingForContent(payload);
              if (inferredRating != null) {
                ratingByUserIdRef.current.set(userId, inferredRating);
              }
            } catch {
              // Si falla la hidratación de un usuario, seguimos con los demás.
            }
          })
        );
      }

      const usernamesToLoad = Array.from(
        new Set(
          items
            .filter(
              (comment) =>
                comment.userId == null &&
                !comment.avatarUrl &&
                typeof comment.user === "string" &&
                comment.user.trim() &&
                comment.user.trim().toLowerCase() !== "usuario" &&
                !avatarByUsernameRef.current.has(comment.user.trim().toLowerCase())
            )
            .map((comment) => comment.user.trim().toLowerCase())
        )
      ).slice(0, 10);

      if (usernamesToLoad.length) {
        await Promise.all(
          usernamesToLoad.map(async (normalizedUsername) => {
            try {
              const payload = await searchUsers(normalizedUsername, signal);
              const results = Array.isArray(payload?.results) ? payload.results : [];
              if (!results.length) return;
              const match =
                results.find(
                  (entry) =>
                    typeof entry?.username === "string" &&
                    entry.username.trim().toLowerCase() === normalizedUsername
                ) ?? results[0];
              if (!match) return;

              const avatar = resolveAssetUrl(
                match.avatarUrl ?? match.avatarPath ?? null,
                apiUrl
              );
              if (avatar) avatarByUsernameRef.current.set(normalizedUsername, avatar);

              const resolvedUserId = Number(match.userId ?? 0);
              if (Number.isFinite(resolvedUserId) && resolvedUserId > 0) {
                userIdByUsernameRef.current.set(normalizedUsername, resolvedUserId);
              }
            } catch {
              // Si falla la búsqueda por username, mantenemos el fallback actual.
            }
          })
        );
      }

      return items.map((comment) => {
        const normalizedUsername =
          typeof comment.user === "string" ? comment.user.trim().toLowerCase() : "";
        const byUserId =
          comment.userId != null ? avatarCacheRef.current.get(comment.userId) : null;
        const byUsername = normalizedUsername
          ? avatarByUsernameRef.current.get(normalizedUsername)
          : null;
        const hydratedAvatar = byUserId ?? byUsername ?? null;
        const hydratedUserId =
          comment.userId ??
          (normalizedUsername
            ? (userIdByUsernameRef.current.get(normalizedUsername) ?? null)
            : null);
        const inferredRating =
          comment.rating == null && hydratedUserId != null
            ? (ratingByUserIdRef.current.get(hydratedUserId) ?? null)
            : null;
        const inferredStars = inferredRating != null ? toFiveStars(inferredRating) : null;
        const inferredLabel =
          inferredRating != null ? formatRatingOutOfTen(inferredRating) : null;

        if (
          hydratedAvatar === comment.avatarUrl &&
          (hydratedUserId == null || hydratedUserId === comment.userId) &&
          inferredStars == null &&
          inferredLabel == null
        ) {
          return comment;
        }

        if (
          !hydratedAvatar &&
          (hydratedUserId == null || hydratedUserId === comment.userId) &&
          inferredStars == null &&
          inferredLabel == null
        ) {
          return comment;
        }

        return {
          ...comment,
          userId: hydratedUserId,
          avatarUrl: hydratedAvatar ?? comment.avatarUrl,
          rating: comment.rating ?? inferredStars ?? null,
          ratingLabel: comment.ratingLabel ?? inferredLabel ?? null,
        };
      });
    },
    [apiUrl, normalizedId]
  );

  const mapAndHydrateComments = useCallback(
    async (
      payloadComments: any[],
      localImages: Record<string, string>,
      signal?: AbortSignal
    ) => {
      const flatComments: any[] = [];
      payloadComments.forEach((comment) => {
        flatComments.push(comment);
        const parentId =
          comment?.commentId ?? comment?.id ?? comment?.comentarioId ?? null;
        const replies = Array.isArray(comment?.respuestas) ? comment.respuestas : [];
        replies.forEach((reply: any, replyIndex: number) => {
          if (typeof reply === "string" && reply.trim()) {
            flatComments.push({
              commentId: `${parentId ?? "comment"}-reply-${replyIndex}`,
              parentId,
              mensaje: reply.trim(),
              createDate: comment?.updateDate ?? comment?.createDate,
            });
            return;
          }
          if (!reply || typeof reply !== "object") return;
          flatComments.push({
            ...reply,
            parentId: (reply as { parentId?: unknown }).parentId ?? parentId,
          });
        });
      });

      const mapped = flatComments.map((comment, index) =>
        mapApiComment(
          comment,
          index,
          {
            currentUserId,
            currentUsername: sessionUsername,
            currentUserAvatarUrl,
            localCommentImages: localImages,
          },
          apiUrl
        )
      );
      const hydrated = await hydrateCommentAvatars(mapped, signal);
      const inferredRepliesByParent = new Map<string, number>();
      hydrated.forEach((comment) => {
        const parentId = comment.parentId?.trim();
        if (!parentId) return;
        inferredRepliesByParent.set(
          parentId,
          (inferredRepliesByParent.get(parentId) ?? 0) + 1
        );
      });
      return hydrated.map((comment) => ({
        ...comment,
        repliesCount: Math.max(
          comment.repliesCount ?? 0,
          inferredRepliesByParent.get(comment.id) ?? 0
        ),
      }));
    },
    [
      currentUserId,
      sessionUsername,
      currentUserAvatarUrl,
      apiUrl,
      hydrateCommentAvatars,
    ]
  );

  useEffect(() => {
    setComments([]);
    setCommentsError(null);
    setCommentMessage(null);
    setDeletingCommentId(null);
    setEditingCommentId(null);
    setReactingCommentId(null);
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
        const hydrated = await mapAndHydrateComments(
          payload,
          localCommentImages,
          controller.signal
        );
        if (controller.signal.aborted) return;
        setComments(hydrated);
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
    localCommentImages,
    mapAndHydrateComments,
  ]);

  const handleCreateComment = useCallback(
    async (input: {
      message: string;
      imageFile?: File | null;
      parentId?: number | null;
    }): Promise<{ commentId: string | null; parentId: number | null }> => {
      const message = input.message;
      const normalizedMessage = message.trim();
      const imageFile = input.imageFile ?? null;
      const parentId = Number(input.parentId ?? 0) || null;
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
        const data = await createContentComment(
          normalizedId,
          messageForApi,
          Number.isFinite(parentId) ? parentId : undefined
        );
        let createdCommentId: string | null = null;
        const createdComment =
          data?.comentario != null
            ? {
                ...data.comentario,
                parentId: data.comentario.parentId ?? parentId ?? undefined,
              }
            : null;
        let mergedLocalImages = localCommentImages;
        if (createdComment) {
          const createdId = String(createdComment.commentId ?? "").trim();
          if (createdId) createdCommentId = createdId;
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
          const hydrated = await mapAndHydrateComments(
            payloadComments,
            mergedLocalImages
          );
          if (!createdCommentId) {
            const minimumTimestamp = Date.now() - 20_000;
            const normalizedComparable = messageForApi
              .trim()
              .replace(/\s+/g, " ")
              .toLowerCase();
            const candidates = hydrated.filter((comment) => {
              const isRecent = (comment.createdAtMs ?? 0) >= minimumTimestamp;
              if (!isRecent) return false;
              const sameScope = parentId
                ? comment.parentId?.trim() === String(parentId)
                : !comment.parentId?.trim();
              if (!sameScope) return false;
              const normalizedComment = (comment.comment ?? "")
                .trim()
                .replace(/\s+/g, " ")
                .toLowerCase();
              return normalizedComparable
                ? normalizedComment === normalizedComparable
                : comment.isOwn;
            });
            if (candidates.length > 0) {
              createdCommentId =
                [...candidates].sort(
                  (a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0)
                )[0]?.id ?? null;
            }
          }
          setComments(hydrated);
          setCommentsError(null);
        } catch {
          // Si falla el refresco de la lista, mantenemos al menos el comentario insertado.
        }
        setCommentMessage("Comentario publicado.");
        return {
          commentId: createdCommentId,
          parentId,
        };
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
      mapAndHydrateComments,
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
      if (!comment.isOwn && !canDeleteAnyComment) {
        throw new Error("Solo puedes borrar tus comentarios.");
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
    [isLoggedIn, normalizedId, canDeleteAnyComment]
  );

  const handleEditComment = useCallback(
    async (comment: DetailComment, message: string) => {
      if (!isLoggedIn) {
        throw new Error("Inicia sesión para editar comentarios.");
      }
      if (!normalizedId) {
        throw new Error("No se pudo identificar el contenido.");
      }
      if (!comment?.id) {
        throw new Error("No se pudo identificar el comentario.");
      }
      if (!comment.isOwn) {
        throw new Error("Solo puedes editar tus comentarios.");
      }

      const normalizedMessage = message.trim();
      if (!normalizedMessage) {
        throw new Error("El comentario no puede estar vacío.");
      }

      setEditingCommentId(comment.id);
      setCommentMessage(null);
      try {
        await updateContentComment(normalizedId, comment.id, normalizedMessage);
        setComments((prev) =>
          prev.map((item) =>
            item.id === comment.id ? { ...item, comment: normalizedMessage } : item
          )
        );

        try {
          const latest = await listContentComments(normalizedId);
          const payloadComments = Array.isArray(latest?.comentarios)
            ? latest.comentarios
            : [];
          const hydrated = await mapAndHydrateComments(
            payloadComments,
            localCommentImages
          );
          setComments(hydrated);
          setCommentsError(null);
        } catch {
          // Si falla el refresco, mantenemos al menos el mensaje editado localmente.
        }

        setCommentMessage("Comentario actualizado.");
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : "No se pudo editar el comentario."
        );
      } finally {
        setEditingCommentId(null);
      }
    },
    [
      isLoggedIn,
      normalizedId,
      currentUserId,
      sessionUsername,
      currentUserAvatarUrl,
      localCommentImages,
      apiUrl,
      mapAndHydrateComments,
    ]
  );

  const handleLikeComment = useCallback(
    async (comment: DetailComment) => {
      if (!isLoggedIn) {
        throw new Error("Inicia sesión para reaccionar a comentarios.");
      }
      if (!normalizedId) {
        throw new Error("No se pudo identificar el contenido.");
      }
      if (!comment?.id) {
        throw new Error("No se pudo identificar el comentario.");
      }

      setReactingCommentId(comment.id);
      setCommentMessage(null);
      try {
        await reactToContentComment(normalizedId, comment.id, "like");
        setComments((prev) =>
          prev.map((item) => {
            if (item.id !== comment.id) return item;
            const alreadyLiked = Boolean(item.isLikedByCurrentUser);
            return {
              ...item,
              isLikedByCurrentUser: true,
              likeCount: (item.likeCount ?? 0) + (alreadyLiked ? 0 : 1),
            };
          })
        );

        try {
          const latest = await listContentComments(normalizedId);
          const payloadComments = Array.isArray(latest?.comentarios)
            ? latest.comentarios
            : [];
          const hydrated = await mapAndHydrateComments(
            payloadComments,
            localCommentImages
          );
          setComments(hydrated);
          setCommentsError(null);
        } catch {
          // Si falla el refresco, mantenemos el like optimista local.
        }
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : "No se pudo registrar el like."
        );
      } finally {
        setReactingCommentId(null);
      }
    },
    [
      isLoggedIn,
      normalizedId,
      currentUserId,
      sessionUsername,
      currentUserAvatarUrl,
      localCommentImages,
      apiUrl,
      mapAndHydrateComments,
    ]
  );

  return {
    comments,
    commentsError,
    commentSubmitting,
    deletingCommentId,
    editingCommentId,
    reactingCommentId,
    commentMessage,
    handleCreateComment,
    handleEditComment,
    handleLikeComment,
    handleDeleteComment,
  };
}
