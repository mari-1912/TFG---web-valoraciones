import { useState } from "react";
import { Link } from "react-router-dom";

export type Lista = {
  listaId: number;
  userId: number;
  tipo?: string;
  tipoContenidos: string;
  nombre: string;
  descripcion?: string | null;
  visibilidad?: string;
  imagen?: string | null; // URL devuelta por el backend (_resolve_lista_image)
};

// Colores y etiquetas por tipo de contenido
const TIPO_META: Record<string, { label: string; color: string; bg: string }> = {
  pelicula:    { label: "Película",    color: "#7c3aed", bg: "rgba(124,58,237,0.15)" },
  serie:       { label: "Serie",       color: "#0ea5e9", bg: "rgba(14,165,233,0.15)" },
  libro:       { label: "Libro",       color: "#16a34a", bg: "rgba(22,163,74,0.15)"  },
  videojuego:  { label: "Videojuego",  color: "#ea580c", bg: "rgba(234,88,12,0.15)"  },
};

function getTipoMeta(tipo: string) {
  return TIPO_META[tipo.toLowerCase()] ?? { label: tipo, color: "#6b7280", bg: "rgba(107,114,128,0.15)" };
}

function VisibilidadBadge({ visibilidad }: { visibilidad?: string }) {
  const map: Record<string, string> = {
    publica: "Pública",
    privada: "Privada",
    solo_seguidores: "Seguidores",
  };
  const label = map[visibilidad ?? ""] ?? visibilidad ?? "";
  if (!label) return null;
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: "rgba(255,255,255,0.18)",
        color: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(4px)",
        border: "1px solid rgba(255,255,255,0.2)",
      }}
    >
      {label}
    </span>
  );
}

export function ListCard({
  lista,
  basePath,
}: {
  lista: Lista;
  basePath: string;
}) {
  const [imgError, setImgError] = useState(false);
  const meta = getTipoMeta(lista.tipoContenidos);
  const hasImage = !!lista.imagen && !imgError;

  return (
    <Link
      to={`${basePath}/${lista.listaId}`}
      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: "hsl(270 40% 96%)",
        border: "1.5px solid hsl(270 30% 88%)",
        boxShadow: "0 4px 20px rgba(80,15,120,0.10)",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 40px rgba(80,15,120,0.22)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(80,15,120,0.10)";
      }}
      aria-label={`Abrir lista ${lista.nombre}`}
    >
      {/* Imagen / Cover */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "3/2" }}>
        {hasImage ? (
          <img
            src={lista.imagen!}
            alt={lista.nombre}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          /* Fallback: gradiente con inicial */
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, hsl(268 84% 62%) 0%, hsl(295 86% 65%) 100%)`,
              minHeight: 0,
            }}
          >
            <span
              className="font-black select-none"
              style={{ fontSize: 56, color: "rgba(255,255,255,0.25)", lineHeight: 1 }}
            >
              {lista.nombre.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Overlay con visibilidad */}
        <div
          className="absolute inset-0 flex items-start justify-end p-3"
          style={{
            background: hasImage
              ? "linear-gradient(to bottom, rgba(10,0,25,0.35) 0%, transparent 50%)"
              : "none",
          }}
        >
          <VisibilidadBadge visibilidad={lista.visibilidad} />
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 px-4 py-4 flex-1">
        {/* Badge tipo contenido */}
        <span
          className="self-start text-[11px] font-bold px-2.5 py-0.5 rounded-full"
          style={{ background: meta.bg, color: meta.color }}
        >
          {meta.label}
        </span>

        {/* Nombre */}
        <p
          className="font-bold text-base leading-snug line-clamp-2"
          style={{ color: "hsl(258 24% 16%)" }}
        >
          {lista.nombre}
        </p>

        {/* Descripción */}
        {lista.descripcion ? (
          <p
            className="text-xs line-clamp-2 leading-relaxed"
            style={{ color: "hsl(258 16% 40%)" }}
          >
            {lista.descripcion}
          </p>
        ) : null}

        {/* Ver lista — aparece en hover */}
        <div className="mt-auto pt-3">
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold transition-all duration-200"
            style={{ color: "hsl(268 84% 62%)" }}
          >
            Ver lista
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="translate-x-0 group-hover:translate-x-1 transition-transform duration-200">
              <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
