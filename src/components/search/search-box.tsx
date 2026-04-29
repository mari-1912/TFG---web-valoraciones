import { Search } from "lucide-react";
import type { ReactNode } from "react";

type SearchBoxProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  minLength?: number;
  loading?: boolean;
  error?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: () => void;
  children?: ReactNode;
  className?: string;
  inputClassName?: string;
  iconClassName?: string;
  panelClassName?: string;
  loadingLabel?: string;
};

export function SearchBox({
  value,
  onValueChange,
  placeholder = "Buscar...",
  minLength = 2,
  loading = false,
  error = null,
  open,
  onOpenChange,
  onSubmit,
  children,
  className = "relative",
  inputClassName = "w-full rounded-xl border border-violet-200 bg-white py-2 pl-10 pr-3 text-sm font-semibold text-violet-800 outline-none transition placeholder:text-violet-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-200",
  iconClassName = "text-violet-500",
  panelClassName = "absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-xl border border-violet-200/90 bg-white shadow-[0_14px_35px_rgba(91,33,182,0.18)]",
  loadingLabel = "Buscando...",
}: SearchBoxProps) {
  const shouldShowPanel =
    (open ?? true) && value.trim().length >= minLength && Boolean(children || loading || error);

  return (
    <div className={className}>
      <input
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onSubmit?.();
        }}
        onFocus={() => onOpenChange?.(true)}
        onBlur={() => {
          if (onOpenChange) window.setTimeout(() => onOpenChange(false), 150);
        }}
        placeholder={placeholder}
        className={inputClassName}
      />
      <Search
        size={16}
        onClick={onSubmit}
        className={[
          "absolute left-3 top-1/2 -translate-y-1/2",
          onSubmit ? "cursor-pointer" : "pointer-events-none",
          iconClassName,
        ].join(" ")}
      />

      {shouldShowPanel ? (
        <div className={panelClassName}>
          {loading ? (
            <p className="px-3 py-2 text-sm text-violet-700">{loadingLabel}</p>
          ) : error ? (
            <p className="px-3 py-2 text-sm text-rose-600">{error}</p>
          ) : (
            children
          )}
        </div>
      ) : null}
    </div>
  );
}
