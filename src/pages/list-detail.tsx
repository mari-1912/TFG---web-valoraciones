import { useCallback, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import PageLayout from "@/layouts/layout";
import { deleteUserList } from "@/services/lists-service";
import {
  AddContentPanel,
  ContentSkeleton,
  CoverImagePanel,
  EditListModal,
  MembersPanel,
  RemovableContentCard,
} from "@/components/lists/list-detail-components";
import {
  useCurrentUserId,
  useListDetailData,
} from "@/hooks/lists/use-list-detail-data";

export default function ListDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const userRole = (localStorage.getItem("userRole") ?? "").toLowerCase();
  const isAdmin = userRole === "admin";

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("currentUser");
    navigate("/login");
  }, [navigate]);

  const {
    list,
    setList,
    contenidos,
    setContenidos,
    loading,
    error,
    setError,
  } = useListDetailData({
    id,
    isLoggedIn,
    onUnauthorized: handleUnauthorized,
  });
  const currentUserId = useCurrentUserId(isLoggedIn);

  const currentContentIds = useMemo(
    () => new Set(contenidos.map((content) => content.id)),
    [contenidos]
  );

  const backPath = useMemo(() => {
    if (location.pathname.includes("/listas/listas-opinify")) return "/listas/listas-opinify";
    if (location.pathname.includes("/listas/nuestras-listas")) return "/listas/listas-opinify";
    if (location.pathname.includes("/listas/mis-listas")) return "/listas/mis-listas";
    return "/listas";
  }, [location.pathname]);

  const isOwner = list != null && (isAdmin || list.userId === currentUserId);

  const handleDeleteList = async () => {
    if (!list) return;
    setDeleting(true);
    try {
      await deleteUserList(list.listaId);
      navigate(backPath, { replace: true });
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "No se pudo eliminar la lista.");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <PageLayout>
      {showEdit && list && (
        <EditListModal
          lista={list}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            setList(updated);
            setShowEdit(false);
          }}
        />
      )}

      {showDeleteConfirm && list && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(10,0,30,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: "#fff", boxShadow: "0 24px 60px rgba(80,15,120,0.3)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="font-bold text-base" style={{ color: "hsl(258 24% 16%)" }}>
              Eliminar lista
            </h3>
            <p className="text-sm" style={{ color: "hsl(258 16% 40%)" }}>
              ¿Estás seguro de que quieres eliminar <strong>"{list.nombre}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "hsl(270 40% 94%)", color: "hsl(258 24% 30%)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteList}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "#dc2626", color: "#fff", opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <main className="min-h-screen px-6 py-12" style={{ background: "hsl(264 100% 99%)" }}>
        <div className="max-w-6xl mx-auto">
          {!isLoggedIn ? (
            <div
              className="rounded-3xl p-10 text-center max-w-md mx-auto"
              style={{ background: "hsl(270 40% 96%)", border: "1.5px solid hsl(270 30% 88%)" }}
            >
              <p className="mb-5" style={{ color: "hsl(258 16% 40%)" }}>
                Inicia sesión para ver esta lista.
              </p>
              <Link
                to="/login"
                className="font-bold py-2.5 px-6 rounded-2xl text-white text-sm inline-block"
                style={{ background: "hsl(268 84% 62%)" }}
              >
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
                {Array.from({ length: 12 }).map((_, index) => (
                  <ContentSkeleton key={index} />
                ))}
              </div>
            </>
          ) : error ? (
            <div
              className="rounded-3xl p-8 max-w-md text-center"
              style={{ background: "hsl(270 40% 96%)", border: "1.5px solid hsl(270 30% 88%)" }}
            >
              <p style={{ color: "hsl(258 16% 40%)" }}>{error}</p>
            </div>
          ) : !list ? (
            <p style={{ color: "hsl(258 16% 40%)" }}>Lista no encontrada.</p>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <aside
                className="relative z-50 w-full lg:w-72 flex-shrink-0 flex flex-col gap-4"
                style={{ animation: "fadeUp 0.4s ease both" }}
              >
                <div
                  className="rounded-2xl p-5 flex flex-col gap-3"
                  style={{ background: "hsl(270 40% 97%)", border: "1.5px solid hsl(270 30% 88%)" }}
                >
                  {list.imagen && (
                    <img
                      src={list.imagen}
                      alt="Portada"
                      className="w-full rounded-xl object-cover"
                      style={{ maxHeight: 160, objectPosition: "top" }}
                    />
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <h1 className="font-black text-xl leading-snug" style={{ color: "hsl(258 24% 16%)" }}>
                      {list.nombre}
                    </h1>
                    {isOwner && (
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => setShowEdit(true)}
                          className="flex items-center justify-center w-8 h-8 rounded-full transition"
                          style={{ background: "hsl(270 40% 92%)" }}
                          aria-label="Editar lista"
                        >
                          <Pencil size={14} color="hsl(268 84% 50%)" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="flex items-center justify-center w-8 h-8 rounded-full transition"
                          style={{ background: "hsl(270 40% 92%)" }}
                          aria-label="Eliminar lista"
                        >
                          <Trash2 size={14} color="#dc2626" />
                        </button>
                      </div>
                    )}
                  </div>

                  {list.visibilidad && (
                    <span
                      className="self-start text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ background: "rgba(124,58,237,0.12)", color: "hsl(268 84% 50%)" }}
                    >
                      {list.visibilidad === "publica" ? "Pública"
                        : list.visibilidad === "privada" ? "Privada"
                        : "Seguidores"}
                    </span>
                  )}

                  {list.descripcion && (
                    <p className="text-xs leading-relaxed" style={{ color: "hsl(258 16% 40%)" }}>
                      {list.descripcion}
                    </p>
                  )}

                  <p className="text-xs" style={{ color: "hsl(258 16% 55%)" }}>
                    {contenidos.length} {contenidos.length === 1 ? "elemento" : "elementos"}
                  </p>
                </div>

                {isOwner && (
                  <CoverImagePanel lista={list} onUpdated={setList} />
                )}

                {isOwner && (
                  <MembersPanel listaId={list.listaId} />
                )}

                {isOwner && (
                  <AddContentPanel
                    listaId={list.listaId}
                    tipoContenidos={list.tipoContenidos}
                    currentIds={currentContentIds}
                    onAdded={(item) =>
                      setContenidos((prev) =>
                        prev.some((content) => content.id === item.id) ? prev : [...prev, item]
                      )
                    }
                  />
                )}
              </aside>

              <div className="relative z-0 flex-1 min-w-0" style={{ animation: "fadeUp 0.5s ease 0.1s both" }}>
                {contenidos.length === 0 ? (
                  <div
                    className="rounded-3xl p-10 text-center max-w-md"
                    style={{ background: "hsl(270 40% 96%)", border: "1.5px solid hsl(270 30% 88%)" }}
                  >
                    <p style={{ color: "hsl(258 16% 40%)" }}>Esta lista todavía no tiene contenidos.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
                    {contenidos.map((item, index) => (
                      <RemovableContentCard
                        key={item.id}
                        item={item}
                        listaId={list.listaId}
                        canRemove={isOwner}
                        onRemoved={(removedId) =>
                          setContenidos((prev) => prev.filter((content) => content.id !== removedId))
                        }
                        style={{ animation: `fadeUp 0.35s ease ${index * 0.04}s both` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </PageLayout>
  );
}
