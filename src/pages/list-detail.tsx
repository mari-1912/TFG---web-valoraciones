import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import PageLayout from "@/layouts/layout";
import { getListContents } from "@/services/lists-service";
import type { BackendContenidoListado } from "@/services/lists-service";
import { buildDetailPath } from "@/lib/detail-route";
import ContentCard from "@/components/content-card";

// ── Tipos ────────────────────────────────────────────────────────────────────

type Lista = {
  listaId: number;
  nombre: string;
  descripcion?: string | null;
  tipoContenidos?: string;
  visibilidad?: string;
};

type ContenidoItem = BackendContenidoListado & { tipo?: string | null };

// Ruta hacia la página de detalle según tipo de contenido
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
                      <ContentCard
                        title={item.titulo}
                        image={item.portada}
                        type={item.tipo}
                        score={item.puntuacion ?? item.puntuacionApi}
                        to={buildDetailPath(item.tipo, item.id, item.titulo)}
                        state={{ item: { id: item.id, titulo: item.titulo, tipo: item.tipo } }}
                      />
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
