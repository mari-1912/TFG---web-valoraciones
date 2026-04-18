import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import PageLayout from "@/layouts/layout";
import { getListContents } from "@/services/lists-service";
import type { BackendContenidoListado } from "@/services/lists-service";

// ── Tipos ────────────────────────────────────────────────────────────────────

type Lista = {
  listaId: number;
  nombre: string;
  descripcion?: string | null;
  tipoContenidos?: string;
  visibilidad?: string;
};

type ContenidoItem = BackendContenidoListado & { tipo?: string | null };

// ── Helpers ──────────────────────────────────────────────────────────────────

const TIPO_META: Record<string, { label: string; color: string; bg: string }> = {
  pelicula:   { label: "Película",   color: "#7c3aed", bg: "rgba(124,58,237,0.14)" },
  serie:      { label: "Serie",      color: "#0ea5e9", bg: "rgba(14,165,233,0.14)"  },
  libro:      { label: "Libro",      color: "#16a34a", bg: "rgba(22,163,74,0.14)"   },
  videojuego: { label: "Videojuego", color: "#ea580c", bg: "rgba(234,88,12,0.14)"   },
};

function getTipoMeta(tipo?: string | null) {
  return TIPO_META[(tipo ?? "").toLowerCase()] ?? { label: tipo ?? "", color: "#6b7280", bg: "rgba(107,114,128,0.14)" };
}

function formatScore(puntuacion?: number | null, puntuacionApi?: number | null) {
  const val = puntuacion ?? puntuacionApi;
  if (val == null) return null;
  return Number(val).toFixed(1);
}

// Ruta hacia la página de detalle según tipo de contenido
function buildDetailPath(tipo: string | null | undefined, id: number | string) {
  const t = (tipo ?? "").toLowerCase();
  return `/detail/${t}/${id}`;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function ContentSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: "hsl(270 40% 96%)",
        border: "1.5px solid hsl(270 30% 88%)",
      }}
    >
      <div
        style={{
          aspectRatio: "2/3",
          background:
            "linear-gradient(90deg, hsl(270 40% 92%) 25%, hsl(270 40% 96%) 50%, hsl(270 40% 92%) 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.4s infinite linear",
        }}
      />
      <div className="p-3 flex flex-col gap-2">
        <div style={{ height: 13, width: "55%", borderRadius: 99, background: "hsl(270 30% 88%)" }} />
        <div style={{ height: 16, width: "85%", borderRadius: 6, background: "hsl(270 30% 90%)" }} />
        <div style={{ height: 13, width: "40%", borderRadius: 6, background: "hsl(270 30% 92%)" }} />
      </div>
    </div>
  );
}

// ── Tarjeta de contenido ─────────────────────────────────────────────────────

function ContentCard({ item }: { item: ContenidoItem }) {
  const [imgError, setImgError] = useState(false);
  const meta = getTipoMeta(item.tipo);
  const score = formatScore(item.puntuacion, item.puntuacionApi);
  const detailPath = buildDetailPath(item.tipo, item.id);
  const hasImage = !!item.portada && !imgError;

  return (
    <Link
      to={detailPath}
      className="group flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: "hsl(270 40% 96%)",
        border: "1.5px solid hsl(270 30% 88%)",
        boxShadow: "0 4px 16px rgba(80,15,120,0.08)",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 14px 36px rgba(80,15,120,0.20)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(80,15,120,0.08)";
      }}
    >
      {/* Poster */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "2/3" }}>
        {hasImage ? (
          <img
            src={item.portada!}
            alt={item.titulo}
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
              style={{ fontSize: 48, color: "rgba(255,255,255,0.22)", lineHeight: 1 }}
            >
              {item.titulo.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Score flotante */}
        {score && (
          <div
            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
            style={{
              background: "rgba(0,0,0,0.55)",
              color: "#facc15",
              backdropFilter: "blur(6px)",
            }}
          >
            ★ {score}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <span
          className="self-start text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: meta.bg, color: meta.color }}
        >
          {meta.label}
        </span>

        <p
          className="font-semibold text-sm leading-snug line-clamp-2"
          style={{ color: "hsl(258 24% 16%)" }}
        >
          {item.titulo}
        </p>

        <span
          className="text-xs font-medium mt-auto pt-2"
          style={{ color: "hsl(268 84% 62%)" }}
        >
          Ver detalle →
        </span>
      </div>
    </Link>
  );
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function ListDetail() {
  const { id } = useParams<{ id: string }>();
  const [list, setList] = useState<Lista | null>(null);
  const [contenidos, setContenidos] = useState<ContenidoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  const backPath = useMemo(() => {
    if (location.pathname.includes("/listas/nuestras-listas")) return "/listas/nuestras-listas";
    if (location.pathname.includes("/listas/mis-listas")) return "/listas/mis-listas";
    return "/listas";
  }, [location.pathname]);

  const backLabel = backPath.includes("nuestras") ? "Nuestras listas" : "Mis listas";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      if (!isLoggedIn) {
        setList(null);
        setContenidos([]);
        setLoading(false);
        return;
      }

      const listaId = Number(id);
      if (!Number.isFinite(listaId)) {
        setError("ID de lista inválido");
        setLoading(false);
        return;
      }

      try {
        const data = await getListContents(listaId);

        setList({
          listaId: data.lista.listaId,
          nombre: data.lista.nombre,
          descripcion: data.lista.descripcion,
          tipoContenidos: data.lista.tipoContenidos,
          visibilidad: data.lista.visibilidad,
        });

        setContenidos(data.contenidos ?? []);
      } catch (e: unknown) {
        const msg = String((e as Error)?.message ?? "");
        if (msg.startsWith("401")) {
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("userRole");
          localStorage.removeItem("currentUser");
          navigate("/login");
          return;
        }
        setError(msg || "Error cargando la lista");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isLoggedIn, navigate]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <PageLayout>
      <style>{`
        @keyframes shimmer {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <main
        className="min-h-screen px-6 py-12"
        style={{ background: "hsl(264 100% 99%)" }}
      >
        <div className="max-w-6xl mx-auto">

          {/* Miga de pan */}
          <nav
            className="flex items-center gap-2 text-xs mb-8"
            style={{ color: "hsl(258 16% 55%)", animation: "fadeUp 0.4s ease both" }}
          >
            <Link to="/listas" style={{ color: "hsl(268 84% 62%)" }} className="hover:underline">Listas</Link>
            <span>/</span>
            <Link to={backPath} style={{ color: "hsl(268 84% 62%)" }} className="hover:underline">{backLabel}</Link>
            {list && <><span>/</span><span>{list.nombre}</span></>}
          </nav>

          {/* No logueado */}
          {!isLoggedIn ? (
            <div className="rounded-3xl p-10 text-center max-w-md mx-auto"
              style={{ background: "hsl(270 40% 96%)", border: "1.5px solid hsl(270 30% 88%)" }}>
              <p className="mb-5" style={{ color: "hsl(258 16% 40%)" }}>Inicia sesión para ver esta lista.</p>
              <Link to="/login" className="font-bold py-2.5 px-6 rounded-2xl text-white text-sm inline-block"
                style={{ background: "hsl(268 84% 62%)" }}>
                Iniciar sesión
              </Link>
            </div>

          /* Cargando */
          ) : loading ? (
            <>
              <div className="mb-10" style={{ animation: "fadeUp 0.4s ease both" }}>
                <div style={{ height: 36, width: 260, borderRadius: 10, background: "hsl(270 30% 90%)", marginBottom: 12 }} />
                <div style={{ height: 16, width: 420, borderRadius: 8, background: "hsl(270 30% 92%)" }} />
              </div>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {Array.from({ length: 12 }).map((_, i) => <ContentSkeleton key={i} />)}
              </div>
            </>

          /* Error */
          ) : error ? (
            <div className="rounded-3xl p-8 max-w-md text-center"
              style={{ background: "hsl(270 40% 96%)", border: "1.5px solid hsl(270 30% 88%)" }}>
              <p style={{ color: "hsl(258 16% 40%)" }}>{error}</p>
            </div>

          /* Lista no encontrada */
          ) : !list ? (
            <p style={{ color: "hsl(258 16% 40%)" }}>Lista no encontrada.</p>

          /* Contenido */
          ) : (
            <>
              {/* Cabecera de la lista */}
              <div className="mb-10">
                <div className="flex flex-wrap items-start gap-3 mb-2">
                  <h1 className="text-3xl font-black tracking-tight" style={{ color: "hsl(258 24% 16%)" }}>
                    {list.nombre}
                  </h1>
                  {list.visibilidad && (
                    <span
                      className="self-center text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ background: "rgba(124,58,237,0.12)", color: "hsl(268 84% 50%)" }}
                    >
                      {list.visibilidad === "publica" ? "Pública"
                        : list.visibilidad === "privada" ? "Privada"
                        : "Seguidores"}
                    </span>
                  )}
                </div>

                {list.descripcion ? (
                  <p className="text-sm max-w-2xl" style={{ color: "hsl(258 16% 40%)" }}>
                    {list.descripcion}
                  </p>
                ) : null}


              </div>

              {/* Grid de contenidos */}
              {contenidos.length === 0 ? (
                <div className="rounded-3xl p-10 text-center max-w-md"
                  style={{ background: "hsl(270 40% 96%)", border: "1.5px solid hsl(270 30% 88%)" }}>
                  <p style={{ color: "hsl(258 16% 40%)" }}>Esta lista todavía no tiene contenidos.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 items-stretch"
                  style={{ animation: "fadeUp 0.5s ease 0.1s both" }}>
                  {contenidos.map((item, i) => (
                    <div key={item.id} className="flex" style={{ animation: `fadeUp 0.35s ease ${i * 0.04}s both` }}>
                      <ContentCard item={item} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </PageLayout>
  );
}
