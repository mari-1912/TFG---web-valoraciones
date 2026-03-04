import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ListCard, type Lista } from "@/components/lists/list-card";
import PageLayout from "@/layouts/layout";
import { getListsByUser, getMyLists } from "@/services/lists-service";

type ListsCategoryProps = {
  type: "nuestras" | "mis"; // tipo de listas
};

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
        // Nuestras listas = listas públicas del usuario Opinify (id=5)
        // Mis listas = listas del usuario autenticado
        const result =
          type === "nuestras" ? await getListsByUser(5) : await getMyLists();

        setLists(result as unknown as Lista[]);
      } catch (e: any) {
        const msg = String(e?.message ?? "");
        if (msg.startsWith("401")) {
          // Sesión caducada/no válida
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
      <main className="min-h-screen bg-gray-50 px-6 py-12">
        <h1 className="text-3xl font-bold text-indigo-700 mb-8 text-center">
          {type === "nuestras" ? "Nuestras listas" : "Mis listas"}
        </h1>

        {!isLoggedIn ? (
          <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <p className="text-gray-700">
              Inicia sesión para ver{" "}
              {type === "nuestras" ? "las listas del administrador" : "tus listas"}.
            </p>
            <Link
              to="/login"
              className="mt-4 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Ir a login
            </Link>
          </div>
        ) : loading ? (
          <p>Cargando listas...</p>
        ) : error ? (
          <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-700">{error}</p>
          </div>
        ) : lists.length === 0 ? (
          <p className="text-center text-gray-700">No hay listas disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((lista) => (
              <ListCard key={lista.listaId} lista={lista} basePath={basePath} />
            ))}
          </div>
        )}
      </main>
    </PageLayout>
  );
}