import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ListCard, type Lista } from "@/components/lists/list-card";
import PageLayout from "@/layouts/layout";
import { getListsByUser, getMyLists } from "@/services/lists-service";

type ListsCategoryProps = {
  type: "nuestras" | "mis";
};

// Skeleton de tarjeta mientras carga
function CardSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "hsl(270 40% 96%)",
        border: "1.5px solid hsl(270 30% 88%)",
      }}
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

export default function ListsCategory({ type }: ListsCategoryProps) {
  const [lists, setLists] = useState<Lista[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  const basePath = useMemo(
    () => (type === "nuestras" ? "/listas/nuestras-listas" : "/listas/mis-listas"),
    [type]
  );

  const title = type === "nuestras" ? "Nuestras listas" : "Mis listas";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      if (!isLoggedIn) {
        setLists([]);
        setLoading(false);
        return;
      }

      try {
        const result =
          type === "nuestras" ? await getListsByUser(5) : await getMyLists();
        setLists(result as unknown as Lista[]);
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

  return (
    <PageLayout>
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

      <main
        className="min-h-screen px-6 py-12"
        style={{ background: "hsl(264 100% 99%)" }}
      >
        {/* Cabecera */}
        <div
          className="max-w-6xl mx-auto mb-10"
          style={{ animation: "fadeUp 0.5s ease both" }}
        >
          {/* Miga de pan */}
          <div className="flex items-center gap-2 text-xs mb-4" style={{ color: "hsl(258 16% 55%)" }}>
            <Link to="/listas" style={{ color: "hsl(268 84% 62%)" }} className="hover:underline">
              Listas
            </Link>
            <span>/</span>
            <span>{title}</span>
          </div>

          <h1
            className="text-3xl font-black tracking-tight"
            style={{ color: "hsl(268 84% 62%)" }}
          >
            {title}
          </h1>

          {!loading && !error && lists.length > 0 && (
            <p className="mt-1 text-sm" style={{ color: "hsl(258 16% 45%)" }}>
              {lists.length} {lists.length === 1 ? "lista" : "listas"}
            </p>
          )}
        </div>

        {/* Contenido */}
        <div
          className="max-w-6xl mx-auto"
          style={{ animation: "fadeUp 0.55s ease 0.08s both" }}
        >
          {/* No logueado */}
          {!isLoggedIn ? (
            <div
              className="rounded-3xl p-10 text-center mx-auto max-w-md"
              style={{
                background: "hsl(270 40% 96%)",
                border: "1.5px solid hsl(270 30% 88%)",
              }}
            >
              <p className="text-base mb-5" style={{ color: "hsl(258 16% 40%)" }}>
                Inicia sesión para ver{" "}
                {type === "nuestras" ? "las listas de Opinify" : "tus listas"}.
              </p>
              <Link
                to="/login"
                className="inline-block font-bold py-2.5 px-6 rounded-2xl text-white text-sm"
                style={{ background: "hsl(268 84% 62%)" }}
              >
                Iniciar sesión
              </Link>
            </div>

          /* Cargando */
          ) : loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>

          /* Error */
          ) : error ? (
            <div
              className="rounded-3xl p-8 mx-auto max-w-md text-center"
              style={{
                background: "hsl(270 40% 96%)",
                border: "1.5px solid hsl(270 30% 88%)",
              }}
            >
              <p className="text-sm" style={{ color: "hsl(258 16% 40%)" }}>
                {error}
              </p>
            </div>

          /* Sin listas */
          ) : lists.length === 0 ? (
            <div
              className="rounded-3xl p-10 mx-auto max-w-md text-center"
              style={{
                background: "hsl(270 40% 96%)",
                border: "1.5px solid hsl(270 30% 88%)",
              }}
            >
              <p className="text-base" style={{ color: "hsl(258 16% 40%)" }}>
                {type === "nuestras"
                  ? "Aún no hay listas publicadas."
                  : "Todavía no has creado ninguna lista."}
              </p>
            </div>

          /* Grid de listas */
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {lists.map((lista, i) => (
                <div
                  key={lista.listaId}
                  style={{ animation: `fadeUp 0.4s ease ${i * 0.05}s both` }}
                >
                  <ListCard lista={lista} basePath={basePath} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </PageLayout>
  );
}
