import { useMemo } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/sections/footer";
import { Header } from "../components/sections/header";
import {
  getCurrentUser,
  loadWatchlist,
  loadWatchedList,
} from "../services/watchlist";
import { isSessionValid } from "@/services/auth-service";

export default function MyListsPage() {
  const isLoggedIn = isSessionValid();
  const currentUser = getCurrentUser();
  const displayUser = isLoggedIn ? currentUser : "invitado";

  const watchlist = useMemo(() => loadWatchlist(currentUser), [currentUser]);
  const watchedlist = useMemo(() => loadWatchedList(currentUser), [currentUser]);
  const moviesToWatch = watchlist
    .filter((item) => item.type === "pelicula")
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  const moviesWatched = watchedlist
    .filter((item) => item.type === "pelicula")
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt));

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 px-6 pb-12 pt-32">
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
              <section className="mt-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Películas por ver
                  </h2>
                  <span className="text-sm text-gray-500">
                    {moviesToWatch.length} guardadas
                  </span>
                </div>

                {moviesToWatch.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-600">
                    Aún no tienes películas en tu lista por ver.
                  </p>
                ) : (
                  <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    {moviesToWatch.map((item) => (
                      <Link
                        key={`${item.type}-${item.id}`}
                        to={`/detail/${item.type}/${item.id}`}
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
                                (e.currentTarget as HTMLImageElement).style.display =
                                  "none";
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

                {moviesWatched.length === 0 ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
                      Todavía no hay películas vistas.
                    </div>
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
                      + Añadir pelicula vista (visual)
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    {moviesWatched.map((item) => (
                      <Link
                        key={`${item.type}-${item.id}`}
                        to={`/detail/${item.type}/${item.id}`}
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
                                (e.currentTarget as HTMLImageElement).style.display =
                                  "none";
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
