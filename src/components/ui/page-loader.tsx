import { LoaderCircle } from "lucide-react";

type PageLoaderProps = {
  title?: string;
  message?: string;
  className?: string;
  overlay?: boolean;
};

export function PageLoader({
  title = "Cargando",
  message,
  className = "",
  overlay = false,
}: PageLoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute h-16 w-16 animate-ping rounded-full bg-violet-300/35" />
        <span className="absolute h-12 w-12 rounded-full bg-violet-100" />
        <LoaderCircle className="relative h-8 w-8 animate-spin text-violet-700" />
      </div>
      <p className="mt-4 text-sm font-semibold text-violet-800">{title}</p>
      {message ? (
        <p className="mt-1 max-w-sm text-xs text-violet-700/75">{message}</p>
      ) : null}
      <div className="mt-4 flex gap-1.5" aria-hidden="true">
        <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.2s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.1s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500" />
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div
        className={`fixed inset-0 z-[200] flex items-center justify-center bg-white/80 px-4 backdrop-blur-sm ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="rounded-2xl border border-violet-100 bg-white px-8 py-7 shadow-[0_18px_45px_rgba(80,15,120,0.18)]">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-3xl border border-violet-100 bg-white/90 px-6 py-8 shadow-[0_14px_35px_rgba(124,58,237,0.12)] ${className}`}
      role="status"
      aria-live="polite"
    >
      {content}
    </div>
  );
}
