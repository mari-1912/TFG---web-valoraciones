import { memo } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

type CommentReactionBarProps = {
  likeCount?: number | null;
  dislikeCount?: number | null;
  isLiked?: boolean;
  isDisliked?: boolean;
  onLike?: () => void;
  onDislike?: () => void;
  disabled?: boolean;
  showLike?: boolean;
  showDislike?: boolean;
  variant?: "icon" | "pill";
  className?: string;
};

export const CommentReactionBar = memo(function CommentReactionBar({
  likeCount,
  dislikeCount,
  isLiked = false,
  isDisliked = false,
  onLike,
  onDislike,
  disabled = false,
  showLike = true,
  showDislike = true,
  variant = "icon",
  className = "",
}: CommentReactionBarProps) {
  const safeLikeCount = Math.max(0, Number(likeCount ?? 0));
  const safeDislikeCount = Math.max(0, Number(dislikeCount ?? 0));

  const baseButtonClassName =
    "transition disabled:cursor-not-allowed disabled:opacity-60";

  if (variant === "pill") {
    return (
      <div className={className}>
        {showDislike ? (
          <button
            type="button"
            onClick={onDislike}
            disabled={disabled || !onDislike}
            className={`inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-xs font-semibold ${baseButtonClassName} ${
              isDisliked
                ? "border-rose-200 bg-rose-100 text-rose-700"
                : "border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            aria-label="Dar dislike al comentario"
          >
            {safeDislikeCount > 0 ? <span>{safeDislikeCount}</span> : null}
            <ThumbsDown className={`h-3.5 w-3.5 ${disabled ? "animate-pulse" : ""}`} />
          </button>
        ) : null}
        {showLike ? (
          <button
            type="button"
            onClick={onLike}
            disabled={disabled || !onLike}
            className={`inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-xs font-semibold ${baseButtonClassName} ${
              isLiked
                ? "border-indigo-200 bg-indigo-100 text-indigo-700"
                : "border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            aria-label="Dar like al comentario"
          >
            {safeLikeCount > 0 ? <span>{safeLikeCount}</span> : null}
            <ThumbsUp className={`h-3.5 w-3.5 ${disabled ? "animate-pulse" : ""}`} />
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={className}>
      {showDislike ? (
        <>
          {safeDislikeCount > 0 ? (
            <span className="text-xs font-semibold text-gray-600">{safeDislikeCount}</span>
          ) : null}
          <button
            type="button"
            onClick={onDislike}
            disabled={disabled || !onDislike}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${baseButtonClassName} ${
              isDisliked
                ? "border-rose-200 bg-rose-100 text-rose-700"
                : "border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            aria-label="Dar dislike al comentario"
          >
            <ThumbsDown className={`h-3.5 w-3.5 ${disabled ? "animate-pulse" : ""}`} />
          </button>
        </>
      ) : null}
      {showLike ? (
        <>
          {safeLikeCount > 0 ? (
            <span className="text-xs font-semibold text-gray-600">{safeLikeCount}</span>
          ) : null}
          <button
            type="button"
            onClick={onLike}
            disabled={disabled || !onLike}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${baseButtonClassName} ${
              isLiked
                ? "border-indigo-200 bg-indigo-100 text-indigo-700"
                : "border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            aria-label="Dar like al comentario"
          >
            <ThumbsUp className={`h-3.5 w-3.5 ${disabled ? "animate-pulse" : ""}`} />
          </button>
        </>
      ) : null}
    </div>
  );
});
