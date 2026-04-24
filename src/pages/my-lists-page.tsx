import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/sections/footer";
import { getMe, isSessionValid } from "@/services/auth-service";
import {
  getListContents,
  getMyListsWithFallback,
  type BackendContenidoListado,
  type BackendLista,
} from "@/services/lists-service";
import { buildDetailPath } from "@/lib/detail-route";

type StatusKey = "watchlist" | "completed";
type CategoryKey = "pelicula" | "serie" | "libro" | "videojuego";

type MovieItem = {
  id: number;
  type: "pelicula";
  title: string;
  image?: string | null;
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
  if (["videojuego", "videojuegos", "game", "games"].includes(key)) return "videojuego";
  return null;
}

function parseManagedStatus(name: string): StatusKey | null {
  const normalized = normalizeKey(name);
  const exact = normalized.match(
    /^(pendientes|proximamente|completado)(?:[ _](peliculas?|series?|libros?|videojuegos?))?$/
  );
  if (!exact) return null;
  return exact[1] === "completado" ? "completed" : "watchlist";
}

function isManagedStatusList(name: string, description: string | null | undefined): boolean {
  if (parseManagedStatus(name) != null) return true;
  const normalizedDescription = normalizeKey(description ?? "");
  return normalizedDescription.startsWith("lista_automatica_de_estado");
}

function mapContentToMovieItem(content: BackendContenidoListado): MovieItem | null {
  const id = Number(content.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    id,
    type: "pelicula",
    title: String(content.titulo ?? "Sin título"),
    image: content.portada ?? null,
  };
}

async function loadStatusMovies(
  lists: BackendLista[],
  status: StatusKey
): Promise<MovieItem[]> {
  const targetListIds = lists
    .filter((list) => {
      const listName = String(list.nombre ?? "");
      if (!isManagedStatusList(listName, list.descripcion)) return false;
      const listStatus = parseManagedStatus(listName);
      if (listStatus !== status) return false;
      return normalizeCategory(list.tipoContenidos) === "pelicula";
    })
    .map((list) => Number(list.listaId))
    .filter((id) => Number.isFinite(id) && id > 0);

  if (!targetListIds.length) return [];

  const results = await Promise.all(
    targetListIds.map(async (listId) => {
      try {
        const data = await getListContents(listId);
        return Array.isArray(data?.contenidos) ? data.contenidos : [];
      } catch {
        return [] as BackendContenidoListado[];
      }
    })
  );

  const deduped = new Map<number, MovieItem>();
  for (const rows of results) {
    for (const row of rows) {
      const mapped = mapContentToMovieItem(row);
      if (!mapped) continue;
      if (!deduped.has(mapped.id)) {
        deduped.set(mapped.id, mapped);
      }
    }
  }

  return [...deduped.values()];
}

export default function MyListsPage() {
  const isLoggedIn = isSessionValid();
  const [displayUser, setDisplayUser] = useState("invitado");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moviesToWatch, setMoviesToWatch] = useState<MovieItem[]>([]);
  const [moviesWatched, setMoviesWatched] = useState<MovieItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!isLoggedIn) {
        setDisplayUser("invitado");
        setMoviesToWatch([]);
        setMoviesWatched([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const me = await getMe();
        if (!cancelled) {
          setDisplayUser((me.user?.username ?? "usuario").trim() || "usuario");
        }
      } catch {
        if (!cancelled) {
          setDisplayUser("usuario");
        }
      }

      try {
        const lists = await getMyListsWithFallback();
        if (cancelled) return;
        const [toWatch, watched] = await Promise.all([
          loadStatusMovies(lists, "watchlist"),
          loadStatusMovies(lists, "completed"),
        ]);
        if (cancelled) return;
        setMoviesToWatch(toWatch);
        setMoviesWatched(watched);
      } catch (loadError) {
        if (cancelled) return;
        setMoviesToWatch([]);
        setMoviesWatched([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudieron cargar tus listas."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  return (
    <>
      <main className="min-h-screen bg-gray-50 px-6 pb-12">
        <div className="mx-auto w-full max-w-6xl">
          <h1 className="text-3xl font-semibold text-gray-900 text-center">
            Mis listas
          </h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            Guardadas para {displayUser}.
          </p>

          {!isLoggedIn ? (
            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 text-center">
              <p className="text-gray-700">
                Inicia sesión para ver tus listas personales.
              </p>
              <Link
                to="/login"
                className="mt-4 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Ir a login
              </Link>
            </div>
          ) : (
            <>
              {error ? (
                <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <section className="mt-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Películas por ver
                  </h2>
                  <span className="text-sm text-gray-500">
                    {moviesToWatch.length} guardadas
                  </span>
                </div>

                {loading ? (
                  <p className="mt-4 text-sm text-gray-600">Cargando listas…</p>
                ) : moviesToWatch.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-600">
                    Aún no tienes películas en tu lista por ver.
                  </p>
                ) : (
                  <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    {moviesToWatch.map((item) => (
                      <Link
                        key={`${item.type}-${item.id}`}
                        to={buildDetailPath(item.type, item.id, item.title)}
                        state={{ item: { id: item.id, titulo: item.title, tipo: item.type } }}
                        className="group rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition"
                      >
                        <div className="aspect-[2/3] bg-gray-200">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : null}
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">Película</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <section className="mt-12">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Películas vistas
                  </h2>
                  <span className="text-sm text-gray-500">
                    {moviesWatched.length} guardadas
                  </span>
                </div>

                {loading ? (
                  <p className="mt-4 text-sm text-gray-600">Cargando listas…</p>
                ) : moviesWatched.length === 0 ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
                      Todavía no hay películas vistas.
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    {moviesWatched.map((item) => (
                      <Link
                        key={`${item.type}-${item.id}`}
                        to={buildDetailPath(item.type, item.id, item.title)}
                        state={{ item: { id: item.id, titulo: item.title, tipo: item.type } }}
                        className="group rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition"
                      >
                        <div className="aspect-[2/3] bg-gray-200">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : null}
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">Película</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
