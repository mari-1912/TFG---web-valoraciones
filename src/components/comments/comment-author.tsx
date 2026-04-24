import { memo, useEffect, useState, type MouseEvent } from "react";

type CommentAuthorProps = {
  user: string;
  avatarUrl?: string | null;
  dateLabel?: string | null;
  onAvatarClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  avatarButtonAriaLabel?: string;
  containerClassName?: string;
  textClassName?: string;
  nameClassName?: string;
  dateClassName?: string;
  avatarSizeClassName?: string;
  avatarFallbackClassName?: string;
  avatarButtonClassName?: string;
  imageClassName?: string;
};

export const CommentAuthor = memo(function CommentAuthor({
  user,
  avatarUrl,
  dateLabel,
  onAvatarClick,
  avatarButtonAriaLabel,
  containerClassName = "flex items-center gap-3",
  textClassName = "min-w-0",
  nameClassName = "text-sm font-semibold text-gray-900",
  dateClassName = "text-xs text-gray-500",
  avatarSizeClassName = "h-10 w-10",
  avatarFallbackClassName = "bg-gray-200 text-gray-700 text-sm",
  avatarButtonClassName = "rounded-full outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-violet-400",
  imageClassName = "rounded-full object-cover bg-gray-200",
}: CommentAuthorProps) {
  const [avatarOk, setAvatarOk] = useState(true);
  const displayUser = user?.trim() || "Usuario";
  const fallbackLetter = (displayUser[0] ?? "U").toUpperCase();

  useEffect(() => {
    setAvatarOk(true);
  }, [avatarUrl]);

  const avatarNode =
    avatarUrl && avatarOk ? (
      <img
        src={avatarUrl}
        alt={displayUser}
        className={`${avatarSizeClassName} ${imageClassName}`}
        loading="lazy"
        onError={() => setAvatarOk(false)}
      />
    ) : (
      <div
        className={`flex items-center justify-center rounded-full font-semibold ${avatarSizeClassName} ${avatarFallbackClassName}`}
      >
        {fallbackLetter}
      </div>
    );

  return (
    <div className={containerClassName}>
      {onAvatarClick ? (
        <button
          type="button"
          onClick={onAvatarClick}
          className={avatarButtonClassName}
          aria-label={avatarButtonAriaLabel ?? `Ver perfil de ${displayUser}`}
        >
          {avatarNode}
        </button>
      ) : (
        avatarNode
      )}
      <div className={textClassName}>
        <p className={nameClassName}>{displayUser}</p>
        {dateLabel ? <p className={dateClassName}>{dateLabel}</p> : null}
      </div>
    </div>
  );
});
