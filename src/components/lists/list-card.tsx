import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";

export type Lista = {
  listaId: number;
  userId: number;
  tipo?: string;
  tipoContenidos: string;
  nombre: string;
  descripcion?: string | null;
  visibilidad?: string;
  imagen?: string | null;
};

const TIPO_META: Record<string, { label: string; color: string; bg: string }> = {
  pelicula:   { label: "Película",   color: "#7c3aed", bg: "rgba(124,58,237,0.15)" },
  serie:      { label: "Serie",      color: "#0ea5e9", bg: "rgba(14,165,233,0.15)" },
  libro:      { label: "Libro",      color: "#16a34a", bg: "rgba(22,163,74,0.15)"  },
  videojuego: { label: "Videojuego", color: "#ea580c", bg: "rgba(234,88,12,0.15)"  },
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

function ConfirmDeleteModal({
  nombre,
  onConfirm,
  onCancel,
  loading,
}: {
  nombre: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,0,30,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: "#fff", boxShadow: "0 24px 60px rgba(80,15,120,0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-base" style={{ color: "hsl(258 24% 16%)" }}>
          Eliminar lista
        </h3>
        <p className="text-sm" style={{ color: "hsl(258 16% 40%)" }}>
          ¿Estás seguro de que quieres eliminar{" "}
          <strong>"{nombre}"</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end mt-1">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "hsl(270 40% 94%)", color: "hsl(258 24% 30%)" }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "#dc2626", color: "#fff", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ListCard({
  lista,
  basePath,
  onDelete,
}: {
  lista: Lista;
  basePath: string;
  onDelete?: (listaId: number) => Promise<void>;
}) {
  const [imgError, setImgError] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const meta = getTipoMeta(lista.tipoContenidos);
  const hasImage = !!lista.imagen && !imgError;

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(lista.listaId);
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      {showConfirm && (
        <ConfirmDeleteModal
          nombre={lista.nombre}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          loading={deleting}
        />
      )}

      <div className="relative group">
        {onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowConfirm(true);
            }}
            aria-label="Eliminar lista"
            className="absolute top-2 right-2 z-20 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
            style={{
              background: "rgba(220,38,38,0.88)",
              backdropFilter: "blur(4px)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
            }}
          >
            <Trash2 size={14} color="#fff" />
          </button>
        )}

        <Link
          to={`${basePath}/${lista.listaId}`}
          className="flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
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
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, hsl(268 84% 62%) 0%, hsl(295 86% 65%) 100%)",
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

          <div className="flex flex-col gap-2 px-4 py-4 flex-1">
            <span
              className="self-start text-[11px] font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: meta.bg, color: meta.color }}
            >
              {meta.label}
            </span>
            <p
              className="font-bold text-base leading-snug line-clamp-2"
              style={{ color: "hsl(258 24% 16%)" }}
            >
              {lista.nombre}
            </p>
            {lista.descripcion ? (
              <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: "hsl(258 16% 40%)" }}>
                {lista.descripcion}
              </p>
            ) : null}
            <div className="mt-auto pt-3">
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold"
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
      </div>
    </>
  );
}
