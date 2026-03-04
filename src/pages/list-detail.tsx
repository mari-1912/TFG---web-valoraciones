import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import SectionList from "@/components/sections/section-list";
import { getListContents } from "@/services/lists-service";

type Item = {
  id: string;
  imgSrc: string;
  title: string;
  description: string;
  rating: number;
};

type Lista = {
  listaId: number;
  nombre: string;
  descripcion?: string | null;
  tipoContenidos?: string;
  visibilidad?: string;
};

export default function ListDetail() {
  const { id } = useParams<{ id: string }>();
  const [list, setList] = useState<Lista | null>(null);
  const [contenidos, setContenidos] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  const backPath = useMemo(() => {
    if (location.pathname.includes("/listas/nuestras-listas"))
      return "/listas/nuestras-listas";
    if (location.pathname.includes("/listas/mis-listas"))
      return "/listas/mis-listas";
    return "/listas";
  }, [location.pathname]);

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
        setList(null);
        setContenidos([]);
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

        const mapped: Item[] = (data.contenidos ?? []).map((c) => {
          const score =
            typeof c.puntuacion === "number"
              ? c.puntuacion
              : typeof c.puntuacionApi === "number"
              ? c.puntuacionApi
              : null;

          const stars = score == null ? 0 : Math.max(0, Math.min(5, score / 2));

          return {
            id: String(c.id),
            imgSrc: c.portada ?? "",
            title: c.titulo,
            description: c.tipo ? String(c.tipo) : "",
            rating: stars,
          };
        });

        setContenidos(mapped);
      } catch (e: any) {
        const msg = String(e?.message ?? "");
        if (msg.startsWith("401")) {
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("userRole");
          localStorage.removeItem("currentUser");
          navigate("/login");
          return;
        }

        setError(msg || "Error cargando la lista");
        setList(null);
        setContenidos([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isLoggedIn, navigate]);

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-gray-700">Inicia sesión para ver esta lista.</p>
          <Link
            to="/login"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Ir a login
          </Link>
        </div>
      </main>
    );
  }

  if (loading) return <p className="p-6">Cargando lista...</p>;

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <Link to={backPath} className="text-sm text-indigo-700 hover:underline">
            ← Volver
          </Link>
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-gray-700">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!list) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <Link to={backPath} className="text-sm text-indigo-700 hover:underline">
            ← Volver
          </Link>
          <p className="mt-4">Lista no encontrada</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <Link to={backPath} className="text-sm text-indigo-700 hover:underline">
          ← Volver
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-indigo-700 mb-2">
          {list.nombre}
        </h1>

        {list.descripcion ? (
          <p className="mb-6 text-gray-700">{list.descripcion}</p>
        ) : (
          <p className="mb-6 text-gray-500 text-sm">Sin descripción</p>
        )}

        <div className="mb-6 text-xs text-gray-500">
          {String(list.tipoContenidos ?? "").toUpperCase()} •{" "}
          {list.visibilidad ?? ""}
        </div>

        <h2 className="text-2xl font-semibold mb-4 text-gray-900">Contenidos</h2>

        {contenidos.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-700 font-medium">
              Esta lista todavía no tiene contenidos.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Añade elementos desde la ficha de un contenido.
            </p>

            {/* Si tienes una página de búsqueda, cambia /search por tu ruta real */}
            <Link
              to="/search"
              className="mt-5 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Buscar contenido
            </Link>
          </div>
        ) : (
          <SectionList title="" items={contenidos} />
        )}
      </div>
    </main>
  );
}