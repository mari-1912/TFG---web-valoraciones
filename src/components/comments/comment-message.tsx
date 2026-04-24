import { memo } from "react";

type CommentMessageProps = {
  message?: string | null;
  onClick?: () => void;
  quoted?: boolean;
  emptyLabel?: string;
  paragraphClassName?: string;
  emptyClassName?: string;
  buttonClassName?: string;
};

export const CommentMessage = memo(function CommentMessage({
  message,
  onClick,
  quoted = false,
  emptyLabel,
  paragraphClassName = "mt-3 text-sm text-gray-600",
  emptyClassName = "mt-3 text-sm text-gray-600",
  buttonClassName = "mt-2 w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-left text-sm text-gray-700 transition hover:border-gray-300 hover:bg-gray-200/80",
}: CommentMessageProps) {
  const normalizedMessage = message?.trim() ?? "";
  const hasMessage = normalizedMessage.length > 0;

  if (!hasMessage) {
    if (!emptyLabel) return null;
    return <p className={emptyClassName}>{emptyLabel}</p>;
  }

  const content = quoted ? `“${normalizedMessage}”` : normalizedMessage;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={buttonClassName}>
        {content}
      </button>
    );
  }

  return <p className={paragraphClassName}>{content}</p>;
});
