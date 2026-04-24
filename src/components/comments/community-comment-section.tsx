import { Star } from "lucide-react";
import { CommentAuthor } from "@/components/comments/comment-author";
import { CommentMessage } from "@/components/comments/comment-message";
import { CommentReactionBar } from "@/components/comments/comment-reaction-bar";
import { CommentSecondaryActions } from "@/components/comments/comment-secondary-actions";

export type CommunityAction =
  | "comment"
  | "left_comment"
  | "favorite"
  | "pending"
  | "list_add"
  | "rating";

export interface CommunityPost {
  id: string;
  userId?: number | null;
  user: string;
  avatar?: string;
  timestampLabel?: string;
  activityDate?: string;
  action?: CommunityAction;
  listName?: string;
  contentType?: "película" | "serie" | "videojuego" | "libro";
  detailType?: "pelicula" | "serie" | "videojuego" | "libro" | null;
  contentId?: number | null;
  commentId?: number | null;
  likeCount?: number;
  dislikeCount?: number;
  isLikedByCurrentUser?: boolean;
  isDislikedByCurrentUser?: boolean;
  title?: string;
  poster?: string;
  rating?: number;
  comment?: string;
}

type CommunityCommentSectionProps = {
  rows: CommunityPost[];
  currentUserIsAdmin: boolean;
  isOwnCommentPost: (post: CommunityPost) => boolean;
  processingPostId: string | null;
  replyingPostId: string | null;
  replyDraft: string;
  setReplyingPostId: (value: string | null) => void;
  setReplyDraft: (value: string) => void;
  editingPostId: string | null;
  editingDraft: string;
  setEditingPostId: (value: string | null) => void;
  setEditingDraft: (value: string) => void;
  clearActionError: () => void;
  onOpenPostDetail: (post: CommunityPost) => void | Promise<void>;
  onOpenUserProfile: (post: CommunityPost) => void;
  onLikeComment: (post: CommunityPost) => void | Promise<void>;
  onDislikeComment: (post: CommunityPost) => void | Promise<void>;
  onReplyComment: (post: CommunityPost) => void | Promise<void>;
  onEditComment: (post: CommunityPost) => void | Promise<void>;
  onDeleteComment: (post: CommunityPost) => void | Promise<void>;
  getPosterSrc: (post: CommunityPost) => string | undefined;
  currentPage: number;
  totalPages: number;
  loadingMore: boolean;
  onLoadMore: () => void | Promise<void>;
};

function formatRatingLabel(value?: number) {
  if (!Number.isFinite(value)) return null;
  const normalized = Math.max(0, Math.min(10, Number(value)));
  const asText = Number.isInteger(normalized)
    ? String(normalized)
    : normalized.toFixed(1).replace(".", ",");
  return `${asText}/10`;
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

export function CommunityCommentSection({
  rows,
  currentUserIsAdmin,
  isOwnCommentPost,
  processingPostId,
  replyingPostId,
  replyDraft,
  setReplyingPostId,
  setReplyDraft,
  editingPostId,
  editingDraft,
  setEditingPostId,
  setEditingDraft,
  clearActionError,
  onOpenPostDetail,
  onOpenUserProfile,
  onLikeComment,
  onDislikeComment,
  onReplyComment,
  onEditComment,
  onDeleteComment,
  getPosterSrc,
  currentPage,
  totalPages,
  loadingMore,
  onLoadMore,
}: CommunityCommentSectionProps) {
  return (
    <>
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
            post.contentId != null && Number.isFinite(post.contentId);
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
            isCommentPost && post.contentId != null && isOwnCommentPost(post);
          const canReplyThisPost = isCommentPost && post.contentId != null;
          const canLikeThisPost = isCommentPost && post.contentId != null;
          const canDislikeThisPost = isCommentPost && post.contentId != null;
          const isReplying = replyingPostId === post.id;
          const isEditing = editingPostId === post.id;
          const isProcessing = processingPostId === post.id;
          const showRating = action === "rating";
          const showQuotedComment =
            action === "rating" && (post.comment?.trim()?.length ?? 0) > 0;
          const posterSrc = getPosterSrc(post);

          return (
            <article
              key={post.id}
              className="rounded-[26px] border border-violet-200/80 bg-white/95 p-4 shadow-[0_12px_30px_rgba(124,58,237,0.16)] transition hover:shadow-[0_18px_36px_rgba(124,58,237,0.2)]"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <CommentAuthor
                  user={post.user}
                  avatarUrl={post.avatar}
                  onAvatarClick={
                    canNavigateToUserProfile
                      ? (event) => {
                          event.stopPropagation();
                          onOpenUserProfile(post);
                        }
                      : undefined
                  }
                  avatarButtonAriaLabel={`Ir al perfil de ${post.user}`}
                  containerClassName="flex items-center gap-3 md:w-52 md:shrink-0"
                  avatarSizeClassName="h-12 w-12"
                  avatarFallbackClassName="bg-gray-200 text-gray-700 text-base"
                  textClassName="min-w-0"
                  nameClassName="max-w-[160px] truncate text-sm font-semibold text-gray-900"
                />

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
                    <CommentMessage
                      message={post.comment}
                      quoted
                      onClick={() => void onOpenPostDetail(post)}
                    />
                  ) : null}

                  {isCommentPost && post.comment?.trim() ? (
                    <CommentMessage
                      message={post.comment}
                      onClick={() => void onOpenPostDetail(post)}
                    />
                  ) : null}

                  {(canLikeThisPost ||
                    canDislikeThisPost ||
                    canReplyThisPost ||
                    canEditThisPost ||
                    canModerateThisPost) && (
                    <div
                      className="mt-3 flex flex-wrap items-center gap-2"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {(canLikeThisPost || canDislikeThisPost) ? (
                        <CommentReactionBar
                          variant="pill"
                          className="flex items-center gap-2"
                          likeCount={post.likeCount}
                          dislikeCount={post.dislikeCount}
                          isLiked={post.isLikedByCurrentUser}
                          isDisliked={post.isDislikedByCurrentUser}
                          showLike={canLikeThisPost}
                          showDislike={canDislikeThisPost}
                          disabled={isProcessing}
                          onLike={() => void onLikeComment(post)}
                          onDislike={() => void onDislikeComment(post)}
                        />
                      ) : null}
                      <CommentSecondaryActions
                        mode="inline"
                        className="flex items-center gap-2"
                        canReply={canReplyThisPost}
                        canEdit={canEditThisPost}
                        canDelete={canModerateThisPost}
                        onReply={() => {
                          setReplyingPostId(post.id);
                          setEditingPostId(null);
                          setReplyDraft(`@${post.user} `);
                          clearActionError();
                        }}
                        onEdit={() => {
                          setEditingPostId(post.id);
                          setReplyingPostId(null);
                          setEditingDraft(post.comment ?? "");
                          clearActionError();
                        }}
                        onDelete={() => void onDeleteComment(post)}
                        deleteDisabled={isProcessing}
                        deleting={isProcessing}
                      />
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
                          onClick={() => void onReplyComment(post)}
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
                          onClick={() => void onEditComment(post)}
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
                        void onOpenPostDetail(post);
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

      {currentPage < totalPages && rows.length > 0 ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => void onLoadMore()}
            disabled={loadingMore}
            className="rounded-full border border-violet-300 bg-white px-6 py-2 text-sm font-semibold text-violet-700 shadow-sm transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMore ? "Cargando..." : "Cargar más"}
          </button>
        </div>
      ) : null}
    </>
  );
}
