import { useState } from "react";
import { Link } from "react-router-dom";
// 
type ContentCardProps = {
  title: string;
  image?: string | null;
  type?: string | null;
  score?: number | null;
  to?: string;
  state?: unknown;
  onClick?: () => void;
  className?: string;
  ctaLabel?: string;
};

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  pelicula: { label: "Película", color: "#7c3aed", bg: "rgba(124,58,237,0.14)" },
  serie: { label: "Serie", color: "#0ea5e9", bg: "rgba(14,165,233,0.14)" },
  libro: { label: "Libro", color: "#16a34a", bg: "rgba(22,163,74,0.14)" },
  videojuego: { label: "Videojuego", color: "#ea580c", bg: "rgba(234,88,12,0.14)" },
};

function normalizeType(value?: string | null): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function resolveTypeKey(value?: string | null): string {
  const normalized = normalizeType(value);
  if (normalized === "peliculas") return "pelicula";
  if (normalized === "series") return "serie";
  if (normalized === "libros") return "libro";
  if (normalized === "videojuegos") return "videojuego";
  return normalized;
}

function getTypeMeta(type?: string | null) {
  const key = resolveTypeKey(type);
  if (!key) return null;
  return TYPE_META[key] ?? {
    label: type ?? "",
    color: "#6b7280",
    bg: "rgba(107,114,128,0.14)",
  };
}

function formatScore(value?: number | null): string | null {
  if (value == null || Number.isNaN(Number(value))) return null;
  return Number(value).toFixed(1);
}

function CardBody({
  title,
  image,
  type,
  score,
  interactive,
  ctaLabel,
}: {
  title: string;
  image?: string | null;
  type?: string | null;
  score?: number | null;
  interactive: boolean;
  ctaLabel?: string;
}) {
  const [imageError, setImageError] = useState(false);
  const meta = getTypeMeta(type);
  const scoreText = formatScore(score);
  const hasImage = !!image && !imageError;

  return (
    <>
      <div className="relative overflow-hidden" style={{ aspectRatio: "2/3" }}>
        {hasImage ? (
          <img
            src={image ?? undefined}
            alt={title}
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background: "linear-gradient(135deg, hsl(268 84% 62%) 0%, hsl(295 86% 65%) 100%)",
            }}
          >
            <span
              className="select-none font-black"
              style={{ fontSize: 48, color: "rgba(255,255,255,0.22)", lineHeight: 1 }}
            >
              {(title || "?").charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {scoreText && (
          <div
            className="absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
            style={{
              background: "rgba(0,0,0,0.55)",
              color: "#facc15",
              backdropFilter: "blur(6px)",
            }}
          >
            ★ {scoreText}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {meta ? (
          <span
            className="self-start rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ background: meta.bg, color: meta.color }}
          >
            {meta.label}
          </span>
        ) : null}

        <p className="line-clamp-2 text-sm font-semibold leading-snug" style={{ color: "hsl(258 24% 16%)" }}>
          {title || "Sin título"}
        </p>

        {interactive ? (
          <span className="mt-auto pt-2 text-xs font-medium" style={{ color: "hsl(268 84% 62%)" }}>
            {ctaLabel ?? "Ver detalle →"}
          </span>
        ) : null}
      </div>
    </>
  );
}

export default function ContentCard({
  title,
  image,
  type,
  score,
  to,
  state,
  onClick,
  className,
  ctaLabel,
}: ContentCardProps) {
  const rootClassName = [
    "group flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300",
    "border-[1.5px] border-[hsl(270_30%_88%)] bg-[hsl(270_40%_96%)]",
    "shadow-[0_4px_16px_rgba(80,15,120,0.08)]",
    "hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(80,15,120,0.20)]",
    className ?? "",
  ]
    .join(" ")
    .trim();

  if (to) {
    return (
      <Link to={to} state={state} className={rootClassName} style={{ textDecoration: "none" }}>
        <CardBody title={title} image={image} type={type} score={score} interactive ctaLabel={ctaLabel} />
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${rootClassName} w-full text-left`}>
        <CardBody title={title} image={image} type={type} score={score} interactive ctaLabel={ctaLabel} />
      </button>
    );
  }

  return (
    <article className={rootClassName}>
      <CardBody title={title} image={image} type={type} score={score} interactive={false} ctaLabel={ctaLabel} />
    </article>
  );
}
