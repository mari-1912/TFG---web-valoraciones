import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Popcorn, Tv, Gamepad2, BookOpen } from "lucide-react";

import Footer from "../components/sections/footer";

import moviesData from "../data/movies.json";
import seriesData from "../data/series.json";
import videoGamesData from "../data/video-games.json";
import booksData from "../data/books.json";

import { CategoryTabs } from "../components/lists/category-tabs";
import type { ListCategoryKey } from "../components/lists/category-tabs";
import { buildDetailPath } from "@/lib/detail-route";

import { ItemCard } from "../components/lists/item-card";
import type { CatalogItem } from "../components/lists/item-card";

import heroMovies from "../img/movies/interstellar.png";
import heroSeries from "../img/series/severance.png";
import heroBooks from "../img/books/trono-dioses.png";
import heroGames from "../img/video-games/zelda-tears-kingdom.png";

const DATASETS: Record<ListCategoryKey, CatalogItem[]> = {
  peliculas: moviesData as CatalogItem[],
  series: seriesData as CatalogItem[],
  videojuegos: videoGamesData as CatalogItem[],
  libros: booksData as CatalogItem[],
};

const DETAIL_TYPE: Record<ListCategoryKey, string> = {
  peliculas: "pelicula",
  series: "serie",
  videojuegos: "videojuego",
  libros: "libro",
};

const UI: Record<
  ListCategoryKey,
  { label: string; hero: string; Icon: React.ComponentType<{ size?: number }> }
> = {
  peliculas: { label: "películas", hero: heroMovies, Icon: Popcorn },
  series: { label: "series", hero: heroSeries, Icon: Tv },
  videojuegos: { label: "videojuegos", hero: heroGames, Icon: Gamepad2 },
  libros: { label: "libros", hero: heroBooks, Icon: BookOpen },
};

type SortKey = "az" | "za" | "rating_high" | "rating_low";

export default function ListasPorCategoria() {
  const { categoria } = useParams();
  const navigate = useNavigate();

  const key = (categoria as ListCategoryKey) || "peliculas";
  const { hero, label, Icon } = UI[key];

  const [sort, setSort] = useState<SortKey>("az");
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const items = useMemo(() => {
    const base = DATASETS[key] ?? [];
    const sorted = [...base].sort((a, b) => {
      if (sort === "az") return a.title.localeCompare(b.title);
      if (sort === "za") return b.title.localeCompare(a.title);
      if (sort === "rating_high") return (b.rating ?? 0) - (a.rating ?? 0);
      return (a.rating ?? 0) - (b.rating ?? 0);
    });
    return sorted;
  }, [key, sort]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage]);

  const detailType = DETAIL_TYPE[key];

  return (
    <>
      <main className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
          {/* Izquierda + Hero derecha */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
              <h1 className="text-4xl font-semibold text-gray-900 capitalize">
                Listas de {label}
              </h1>

              <div className="mt-8 w-40 h-32 border-2 border-indigo-700 rounded-lg flex flex-col items-center justify-center gap-2">
                <Icon size={28} />
                <span className="text-xs text-indigo-700 text-center px-2 capitalize">
                  Listas de {label}
                </span>
              </div>
            </div>

            <div className="w-full">
              <img
                src={hero}
                alt={`Hero ${label}`}
                className="w-full h-72 object-cover"
                loading="lazy"
              />
            </div>
          </section>

          {/* Ordenar + Tabs */}
          <section className="mt-8 flex flex-wrap items-center gap-4">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortKey);
                setPage(1);
              }}
              className="border border-gray-400 rounded-md px-4 py-2 text-sm bg-white"
            >
              <option value="az">Ordenar Por</option>
              <option value="az">Nombre (A-Z)</option>
              <option value="za">Nombre (Z-A)</option>
              <option value="rating_high">Valoración (alta)</option>
              <option value="rating_low">Valoración (baja)</option>
            </select>

            <CategoryTabs current={key} />
          </section>

          {/* Grid con borde exterior */}
          <section className="mt-6">
            <div className="border border-gray-400 p-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
                {paged.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={{ ...item, type: detailType }}
                    onClick={() =>
                      navigate(buildDetailPath(detailType, item.id, item.title), {
                        state: { item: { ...item, tipo: detailType } },
                      })
                    }
                  />
                ))}
              </div>
            </div>

            {/* Paginación abajo derecha (1-3 como en tu captura) */}
            <div className="flex justify-end mt-4 gap-2">
              {Array.from({ length: totalPages })
                .slice(0, 3)
                .map((_, idx) => {
                  const n = idx + 1;
                  const active = n === currentPage;
                  return (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={[
                        "w-6 h-6 rounded-full border text-xs",
                        active
                          ? "border-indigo-700 text-indigo-700"
                          : "border-gray-400 text-gray-700",
                      ].join(" ")}
                    >
                      {n}
                    </button>
                  );
                })}
            </div>
          </section>

          <div className="h-12" />
        </div>
      </main>

      <Footer />
    </>
  );
}
