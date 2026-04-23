import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { ListCard, type Lista } from "@/components/lists/list-card";
import { StatusCardsSection, type StatusCardGroup } from "@/components/status/status-cards-section";
import {
  STATUS_ORDER,
  groupManagedStatusListIds,
  isManagedStatusList,
  type StatusKey,
} from "@/lib/status-lists";
import PageLayout from "@/layouts/layout";
import {
  getListContents,
  getListsByUser,
  getMyListsWithFallback,
  createUserList,
  deleteUserList,
  type BackendLista,
} from "@/services/lists-service";

type ListsCategoryProps = {
  type: "nuestras" | "mis";
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "hsl(270 40% 96%)", border: "1.5px solid hsl(270 30% 88%)" }}
    >
      <div
        style={{
          height: 180,
          background: "linear-gradient(90deg, hsl(270 40% 92%) 25%, hsl(270 40% 96%) 50%, hsl(270 40% 92%) 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.4s infinite linear",
        }}
      />
      <div className="px-4 py-4 flex flex-col gap-3">
        <div style={{ height: 14, width: "40%", borderRadius: 99, background: "hsl(270 30% 88%)" }} />
        <div style={{ height: 18, width: "75%", borderRadius: 8, background: "hsl(270 30% 90%)" }} />
        <div style={{ height: 13, width: "90%", borderRadius: 8, background: "hsl(270 30% 92%)" }} />
        <div style={{ height: 13, width: "60%", borderRadius: 8, background: "hsl(270 30% 92%)" }} />
      </div>
    </div>
  );
}

// ── Modal crear lista ─────────────────────────────────────────────────────────

const TIPO_CONTENIDOS_OPTIONS = [
  { value: "pelicula",    label: "Película" },
  { value: "serie",       label: "Serie" },
  { value: "libro",       label: "Libro" },
  { value: "videojuego",  label: "Videojuego" },
];

const VISIBILIDAD_OPTIONS = [
  { value: "publica",         label: "Pública" },
  { value: "privada",         label: "Privada" },
  { value: "solo_seguidores", label: "Solo seguidores" },
];

function CreateListModal({
  forAdmin,
  onClose,
  onCreate,
}: {
  forAdmin: boolean;
  onClose: () => void;
  onCreate: (lista: BackendLista) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [tipoContenidos, setTipoContenidos] = useState("pelicula");
  const [descripcion, setDescripcion] = useState("");
  const [visibilidad, setVisibilidad] = useState<"publica" | "privada" | "solo_seguidores">("publica");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setLoading(true);
    setError(null);
    try {
      const created = await createUserList({
        nombre: nombre.trim(),
        tipoContenidos,
        descripcion: descripcion.trim() || undefined,
        visibilidad,
        tipo: forAdmin ? "admin" : "user",
      });
      onCreate(created);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "No se pudo crear la lista.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,0,30,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: "#fff", boxShadow: "0 24px 60px rgba(80,15,120,0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg" style={{ color: "hsl(258 24% 16%)" }}>
            {forAdmin ? "Crear lista de Opinify" : "Crear nueva lista"}
          </h2>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-full"
            style={{ background: "hsl(270 40% 94%)", color: "hsl(258 24% 30%)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold" style={{ color: "hsl(258 16% 40%)" }}>
            Nombre <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
            maxLength={80} placeholder="Ej: Mis películas favoritas"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ border: "1.5px solid hsl(270 30% 85%)", background: "hsl(270 40% 98%)", color: "hsl(258 24% 16%)" }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold" style={{ color: "hsl(258 16% 40%)" }}>
            Tipo de contenidos
          </label>
          <select value={tipoContenidos} onChange={(e) => setTipoContenidos(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ border: "1.5px solid hsl(270 30% 85%)", background: "hsl(270 40% 98%)", color: "hsl(258 24% 16%)" }}>
            {TIPO_CONTENIDOS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold" style={{ color: "hsl(258 16% 40%)" }}>
            Visibilidad
          </label>
          <div className="flex gap-2 flex-wrap">
            {VISIBILIDAD_OPTIONS.map((o) => (
              <button key={o.value} onClick={() => setVisibilidad(o.value as typeof visibilidad)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                style={{
                  background: visibilidad === o.value ? "hsl(268 84% 62%)" : "hsl(270 40% 94%)",
                  color: visibilidad === o.value ? "#fff" : "hsl(258 24% 30%)",
                }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold" style={{ color: "hsl(258 16% 40%)" }}>
            Descripción <span style={{ color: "hsl(258 16% 60%)" }}>(opcional)</span>
          </label>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
            maxLength={300} rows={3} placeholder="Describe tu lista…"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
            style={{ border: "1.5px solid hsl(270 30% 85%)", background: "hsl(270 40% 98%)", color: "hsl(258 24% 16%)" }}
          />
        </div>

        {error && <p className="text-xs font-medium" style={{ color: "#dc2626" }}>{error}</p>}

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} disabled={loading} className="px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "hsl(270 40% 94%)", color: "hsl(258 24% 30%)" }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading || !nombre.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-bold transition"
            style={{ background: "hsl(268 84% 62%)", color: "#fff", opacity: loading || !nombre.trim() ? 0.65 : 1 }}>
            {loading ? "Creando…" : "Crear lista"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function ListsCategory({ type }: ListsCategoryProps) {
  const [lists, setLists] = useState<Lista[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [managedCounts, setManagedCounts] = useState<Record<StatusKey, number>>({
    watchlist: 0, in_progress: 0, completed: 0, dropped: 0,
  });
  const navigate = useNavigate();

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const userRole = (localStorage.getItem("userRole") ?? "").toLowerCase();
  const isAdmin = userRole === "admin";
  const canCreate = type === "mis" || (type === "nuestras" && isAdmin);

  const basePath = useMemo(
    () => (type === "nuestras" ? "/listas/nuestras-listas" : "/listas/mis-listas"),
    [type]
  );
  const title = type === "nuestras" ? "Nuestras listas" : "Mis listas";
  const isManagedListsView = type === "mis";

  // Listas sin las gestionadas por estado (solo para "mis listas")
  const visibleLists = useMemo(() => {
    if (!isManagedListsView) return lists;
    return lists.filter(
      (list) => !isManagedStatusList(String(list.nombre ?? ""), list.descripcion)
    );
  }, [lists, isManagedListsView]);

  const statusGroups = useMemo<StatusCardGroup[]>(() => {
    return STATUS_ORDER.map((status) => ({
      status,
      totalItems: managedCounts[status] ?? 0,
    }));
  }, [managedCounts]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      if (!isLoggedIn) {
        setLists([]);
        setManagedCounts({ watchlist: 0, in_progress: 0, completed: 0, dropped: 0 });
        setLoading(false);
        return;
      }

      try {
        const result =
          type === "nuestras"
            ? await getListsByUser(5)
            : await getMyListsWithFallback();
        const normalized = result as unknown as Lista[];
        setLists(normalized);

        if (type === "mis") {
          const statusToListIds = groupManagedStatusListIds(
            normalized as unknown as BackendLista[]
          );

          const nextContentCounts: Record<StatusKey, number> = {
            watchlist: 0, in_progress: 0, completed: 0, dropped: 0,
          };
          await Promise.all(
            STATUS_ORDER.map(async (status) => {
              const ids = statusToListIds[status];
              if (!ids.length) return;
              const contentIds = new Set<number>();
              const contentsByList = await Promise.all(
                ids.map(async (listId) => {
                  try {
                    const data = await getListContents(listId);
                    return Array.isArray(data?.contenidos) ? data.contenidos : [];
                  } catch {
                    return [];
                  }
                })
              );
              for (const contenidos of contentsByList) {
                for (const contenido of contenidos) {
                  const contentId = Number(contenido?.id);
                  if (Number.isFinite(contentId) && contentId > 0) {
                    contentIds.add(contentId);
                  }
                }
              }
              nextContentCounts[status] = contentIds.size;
            })
          );
          setManagedCounts(nextContentCounts);
        }
      } catch (e: unknown) {
        const msg = String((e as Error)?.message ?? "");
        if (msg.startsWith("401")) {
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("userRole");
          localStorage.removeItem("currentUser");
          navigate("/login");
          return;
        }
        setError(msg || "Error cargando listas");
        setLists([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [type, isLoggedIn, navigate]);

  const handleCreated = (created: BackendLista) => {
    setLists((prev) => [created as unknown as Lista, ...prev]);
    setShowCreate(false);
  };

  const handleDelete = async (listaId: number) => {
    await deleteUserList(listaId);
    setLists((prev) => prev.filter((l) => l.listaId !== listaId));
  };

  return (
    <PageLayout>
      {showCreate && (
        <CreateListModal
          forAdmin={type === "nuestras"}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreated}
        />
      )}

      <style>{`
        @keyframes shimmer {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <main className="min-h-screen px-6 py-16" style={{ background: "hsl(264 100% 99%)" }}>
        {/* Cabecera */}
        <div className="max-w-6xl mx-auto mb-10" style={{ animation: "fadeUp 0.5s ease both" }}>
          <div className="flex items-center gap-2 text-xs mb-4" style={{ color: "hsl(258 16% 55%)" }}>
            <Link to="/listas" style={{ color: "hsl(268 84% 62%)" }} className="hover:underline">
              Listas
            </Link>
            <span>/</span>
            <span>{title}</span>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-black tracking-tight" style={{ color: "hsl(268 84% 62%)" }}>
                {title}
              </h1>
              {!loading && !error && (
                <p className="mt-1 text-sm" style={{ color: "hsl(258 16% 45%)" }}>
                  {isManagedListsView
                    ? `4 estados y ${visibleLists.length} listas personales`
                    : `${visibleLists.length} ${visibleLists.length === 1 ? "lista" : "listas"}`}
                </p>
              )}
            </div>

            {canCreate && isLoggedIn && (
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200 active:scale-95"
                style={{
                  background: "hsl(268 84% 62%)",
                  color: "#fff",
                  boxShadow: "0 6px 20px hsl(268 84% 62% / 0.35)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.filter = "brightness(1.1)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.filter = "";
                  (e.currentTarget as HTMLElement).style.transform = "";
                }}
              >
                <Plus size={16} />
                Crear lista
              </button>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="max-w-6xl mx-auto" style={{ animation: "fadeUp 0.55s ease 0.08s both" }}>
          {!isLoggedIn ? (
            <div className="rounded-3xl p-10 text-center mx-auto max-w-md"
              style={{ background: "hsl(270 40% 96%)", border: "1.5px solid hsl(270 30% 88%)" }}>
              <p className="text-base mb-5" style={{ color: "hsl(258 16% 40%)" }}>
                Inicia sesión para ver{" "}
                {type === "nuestras" ? "las listas de Opinify" : "tus listas"}.
              </p>
              <Link to="/login" className="inline-block font-bold py-2.5 px-6 rounded-2xl text-white text-sm"
                style={{ background: "hsl(268 84% 62%)" }}>
                Iniciar sesión
              </Link>
            </div>

          ) : loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>

          ) : error ? (
            <div className="rounded-3xl p-8 mx-auto max-w-md text-center"
              style={{ background: "hsl(270 40% 96%)", border: "1.5px solid hsl(270 30% 88%)" }}>
              <p className="text-sm" style={{ color: "hsl(258 16% 40%)" }}>{error}</p>
            </div>

          ) : (
            <div className="space-y-10">
              {/* Sección estados — solo en "mis listas" */}
              {isManagedListsView && (
                <StatusCardsSection groups={statusGroups} />
              )}

              {/* Sección listas personalizadas / nuestras listas */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-black tracking-tight" style={{ color: "hsl(258 24% 16%)" }}>
                    {isManagedListsView ? "Listas personalizadas" : "Listas"}
                  </h2>
                  <span className="text-xs" style={{ color: "hsl(258 16% 45%)" }}>
                    {visibleLists.length} {visibleLists.length === 1 ? "lista" : "listas"}
                  </span>
                </div>

                {visibleLists.length === 0 ? (
                  <div className="rounded-3xl p-10 max-w-md"
                    style={{ background: "hsl(270 40% 96%)", border: "1.5px solid hsl(270 30% 88%)" }}>
                    <p className="text-base mb-5" style={{ color: "hsl(258 16% 40%)" }}>
                      {isManagedListsView
                        ? "No tienes listas personalizadas todavía."
                        : "Aún no hay listas publicadas."}
                    </p>
                    {canCreate && isLoggedIn && (
                      <button
                        onClick={() => setShowCreate(true)}
                        className="inline-flex items-center gap-2 font-bold py-2.5 px-6 rounded-2xl text-white text-sm"
                        style={{ background: "hsl(268 84% 62%)" }}
                      >
                        <Plus size={15} />
                        Crear la primera lista
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {visibleLists.map((lista, i) => (
                      <div key={lista.listaId} style={{ animation: `fadeUp 0.4s ease ${i * 0.05}s both` }}>
                        <ListCard
                          lista={lista}
                          basePath={basePath}
                          onDelete={canCreate ? handleDelete : undefined}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </PageLayout>
  );
}
