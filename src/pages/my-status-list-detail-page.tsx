import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageLayout from "@/layouts/layout";
import ContentCard from "@/components/content-card";
import { buildDetailPath } from "@/lib/detail-route";
import { getListContents, getMyLists } from "@/services/lists-service";
import type { BackendContenidoListado } from "@/services/lists-service";

type StatusKey = "watchlist" | "in_progress" | "completed" | "dropped";
type CategoryKey = "pelicula" | "serie" | "libro" | "videojuego";

type CategorySection = {
  category: CategoryKey;
  title: string;
  items: Array<BackendContenidoListado & { tipo: string }>;
};

const STATUS_META: Record<StatusKey, { title: string; subtitle: string }> = {
  watchlist: { title: "Pendientes", subtitle: "Pendientes" },
  in_progress: { title: "En progreso", subtitle: "Actualmente en curso" },
  completed: { title: "Finalizado", subtitle: "Completados" },
  dropped: { title: "Abandonado", subtitle: "Dejados" },
};

const CATEGORY_ORDER: CategoryKey[] = [
  "pelicula",
  "serie",
  "libro",
  "videojuego",
];

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  pelicula: "Películas",
  serie: "Series",
  libro: "Libros",
  videojuego: "Videojuegos",
};

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeCategory(value: unknown): CategoryKey | null {
  const key = normalizeKey(typeof value === "string" ? value : "");
  if (!key) return null;
  if (["pelicula", "peliculas", "movie", "movies"].includes(key)) return "pelicula";
  if (["serie", "series", "tv"].includes(key)) return "serie";
  if (["libro", "libros", "book", "books"].includes(key)) return "libro";
  if (["videojuego", "videojuegos", "game", "games", "juego_mesa"].includes(key)) {
    return "videojuego";
  }
  return null;
}

function parseManagedStatus(name: string): StatusKey | null {
  const normalized = normalizeKey(name);
  if (!normalized) return null;

  const exact = normalized.match(
    /^(proximamente|en_progreso|completado|abandonado)(?:[ _](peliculas?|series?|libros?|videojuegos?))?$/
  );
  if (!exact) return null;

  const statusKey = exact[1];
  if (statusKey === "proximamente") return "watchlist";
  if (statusKey === "en_progreso") return "in_progress";
  if (statusKey === "completado") return "completed";
  if (statusKey === "abandonado") return "dropped";
  return null;
}

function isManagedStatusList(name: string, description: string | null | undefined): boolean {
  if (parseManagedStatus(name) != null) return true;
  const normalizedDescription = normalizeKey(description ?? "");
  return normalizedDescription.startsWith("lista_automatica_de_estado");
}

function isStatusKey(value: string): value is StatusKey {
  return ["watchlist", "in_progress", "completed", "dropped"].includes(value);
}

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

export default function MyStatusListDetailPage() {
  const { estado } = useParams<{ estado: string }>();
  const navigate = useNavigate();

  const normalizedStatus = normalizeKey(estado ?? "");
  const status = (isStatusKey(normalizedStatus) ? normalizedStatus : null) as StatusKey | null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<CategorySection[]>([]);

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      if (!isLoggedIn) {
        setSections([]);
        setLoading(false);
        return;
      }

      if (!status) {
        setSections([]);
        setError("Estado inválido.");
        setLoading(false);
        return;
      }

      try {
        const lists = await getMyLists();

        const targetListIdsByCategory = new Map<CategoryKey, number[]>();

        for (const list of lists) {
          const listName = String(list.nombre ?? "");
          if (!isManagedStatusList(listName, list.descripcion)) continue;
          const listStatus = parseManagedStatus(listName);
          if (!listStatus || listStatus !== status) continue;
          const category = normalizeCategory(list.tipoContenidos);
          if (!category) continue;
          const listId = Number(list.listaId);
          if (!Number.isFinite(listId) || listId <= 0) continue;
          const current = targetListIdsByCategory.get(category) ?? [];
          if (!current.includes(listId)) {
            current.push(listId);
          }
          targetListIdsByCategory.set(category, current);
        }

        const nextSections: CategorySection[] = [];

        for (const category of CATEGORY_ORDER) {
          const listIds = targetListIdsByCategory.get(category) ?? [];
          if (!listIds.length) {
            nextSections.push({ category, title: CATEGORY_LABELS[category], items: [] });
            continue;
          }

          try {
            const dedupe = new Map<number, BackendContenidoListado & { tipo: string }>();

            for (const listId of listIds) {
              const data = await getListContents(listId);
              const rawItems = Array.isArray(data?.contenidos) ? data.contenidos : [];
              for (const raw of rawItems) {
                const id = Number(raw.id);
                if (!Number.isFinite(id) || id <= 0) continue;
                if (dedupe.has(id)) continue;
                dedupe.set(id, {
                  ...raw,
                  tipo: String(raw.tipo ?? category),
                });
              }
            }

            nextSections.push({
              category,
              title: CATEGORY_LABELS[category],
              items: [...dedupe.values()],
            });
          } catch {
            nextSections.push({ category, title: CATEGORY_LABELS[category], items: [] });
          }
        }

        setSections(nextSections);
      } catch (e: unknown) {
        const msg = String((e as Error)?.message ?? "");
        if (msg.startsWith("401")) {
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("userRole");
          localStorage.removeItem("currentUser");
          navigate("/login");
          return;
        }
        setError(msg || "Error cargando el estado.");
        setSections([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isLoggedIn, navigate, status]);

  const title = status ? STATUS_META[status].title : "Estado";
  const subtitle = status ? STATUS_META[status].subtitle : "";
  const totalItems = useMemo(
    () => sections.reduce((sum, section) => sum + section.items.length, 0),
    [sections]
  );

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
          <nav
            className="flex items-center gap-2 text-xs mb-8"
            style={{ color: "hsl(258 16% 55%)", animation: "fadeUp 0.4s ease both" }}
          >
            <Link to="/listas" style={{ color: "hsl(268 84% 62%)" }} className="hover:underline">Listas</Link>
            <span>/</span>
            <Link to="/listas/mis-listas" style={{ color: "hsl(268 84% 62%)" }} className="hover:underline">Mis listas</Link>
            <span>/</span>
            <span>{title}</span>
          </nav>

          {!isLoggedIn ? (
            <div className="rounded-3xl p-10 text-center max-w-md mx-auto"
              style={{ background: "hsl(270 40% 96%)", border: "1.5px solid hsl(270 30% 88%)" }}>
              <p className="mb-5" style={{ color: "hsl(258 16% 40%)" }}>Inicia sesión para ver esta lista.</p>
              <Link to="/login" className="font-bold py-2.5 px-6 rounded-2xl text-white text-sm inline-block"
                style={{ background: "hsl(268 84% 62%)" }}>
                Iniciar sesión
              </Link>
            </div>
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
          ) : error ? (
            <div className="rounded-3xl p-8 max-w-md text-center"
              style={{ background: "hsl(270 40% 96%)", border: "1.5px solid hsl(270 30% 88%)" }}>
              <p style={{ color: "hsl(258 16% 40%)" }}>{error}</p>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <div className="flex flex-wrap items-start gap-3 mb-2">
                  <h1 className="text-3xl font-black tracking-tight" style={{ color: "hsl(258 24% 16%)" }}>
                    {title}
                  </h1>
                  <span
                    className="self-center text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: "rgba(124,58,237,0.12)", color: "hsl(268 84% 50%)" }}
                  >
                    {subtitle}
                  </span>
                </div>
                <p className="text-sm" style={{ color: "hsl(258 16% 40%)" }}>
                  {totalItems} {totalItems === 1 ? "contenido" : "contenidos"}
                </p>
              </div>

              <div className="space-y-10">
                {sections.map((section) => (
                  <section key={section.category}>
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-xl font-black tracking-tight" style={{ color: "hsl(258 24% 16%)" }}>
                        {section.title}
                      </h2>
                      <span className="text-xs" style={{ color: "hsl(258 16% 45%)" }}>
                        {section.items.length} {section.items.length === 1 ? "contenido" : "contenidos"}
                      </span>
                    </div>

                    {section.items.length === 0 ? (
                      <div
                        className="rounded-3xl p-6 max-w-md"
                        style={{
                          background: "hsl(270 40% 96%)",
                          border: "1.5px solid hsl(270 30% 88%)",
                        }}
                      >
                        <p className="text-sm" style={{ color: "hsl(258 16% 40%)" }}>
                          No hay contenidos en esta categoría.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 items-stretch">
                        {section.items.map((item, i) => (
                          <div key={`${section.category}-${item.id}`} className="flex" style={{ animation: `fadeUp 0.35s ease ${i * 0.04}s both` }}>
                            <ContentCard
                              title={item.titulo}
                              image={item.portada ?? undefined}
                              type={item.tipo}
                              score={item.puntuacion ?? item.puntuacionApi}
                              to={buildDetailPath(item.tipo, item.id, item.titulo)}
                              state={{ item: { id: item.id, titulo: item.titulo, tipo: item.tipo } }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </PageLayout>
  );
}
