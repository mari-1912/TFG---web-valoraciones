import { memo } from "react";
import { MessageCircleReply, Pencil, Trash2 } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

type CommentSecondaryActionsProps = {
  mode?: "inline" | "menu";
  canReply?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  replyDisabled?: boolean;
  editDisabled?: boolean;
  deleteDisabled?: boolean;
  deleting?: boolean;
  className?: string;
  replyLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  deletingLabel?: string;
};

export const CommentSecondaryActions = memo(function CommentSecondaryActions({
  mode = "inline",
  canReply = true,
  canEdit = true,
  canDelete = true,
  onReply,
  onEdit,
  onDelete,
  replyDisabled = false,
  editDisabled = false,
  deleteDisabled = false,
  deleting = false,
  className = "",
  replyLabel = "Responder",
  editLabel = "Editar",
  deleteLabel = "Eliminar",
  deletingLabel = "Borrando...",
}: CommentSecondaryActionsProps) {
  if (mode === "menu") {
    return (
      <>
        {canReply ? (
          <DropdownMenuItem
            onSelect={onReply}
            disabled={replyDisabled || !onReply}
            className="rounded-lg px-2.5 py-2 text-sm text-gray-700"
          >
            <MessageCircleReply className="h-4 w-4 text-gray-500" />
            {replyLabel}
          </DropdownMenuItem>
        ) : null}
        {canEdit ? (
          <DropdownMenuItem
            onSelect={onEdit}
            disabled={editDisabled || !onEdit}
            className="rounded-lg px-2.5 py-2 text-sm text-gray-700"
          >
            <Pencil className="h-4 w-4 text-gray-500" />
            {editLabel}
          </DropdownMenuItem>
        ) : null}
        {canDelete ? (
          <DropdownMenuItem
            onSelect={onDelete}
            disabled={deleteDisabled || !onDelete}
            className="rounded-lg px-2.5 py-2 text-sm text-rose-600"
          >
            <Trash2 className="h-4 w-4 text-rose-500" />
            {deleting ? deletingLabel : deleteLabel}
          </DropdownMenuItem>
        ) : null}
      </>
    );
  }

  return (
    <div className={className}>
      {canReply ? (
        <button
          type="button"
          onClick={onReply}
          disabled={replyDisabled || !onReply}
          className="inline-flex h-8 items-center gap-1 rounded-full border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <MessageCircleReply className="h-3.5 w-3.5" />
          {replyLabel}
        </button>
      ) : null}
      {canEdit ? (
        <button
          type="button"
          onClick={onEdit}
          disabled={editDisabled || !onEdit}
          className="inline-flex h-8 items-center gap-1 rounded-full border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Pencil className="h-3.5 w-3.5" />
          {editLabel}
        </button>
      ) : null}
      {canDelete ? (
        <button
          type="button"
          onClick={onDelete}
          disabled={deleteDisabled || !onDelete}
          className="inline-flex h-8 items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {deleting ? deletingLabel : deleteLabel}
        </button>
      ) : null}
    </div>
  );
});
