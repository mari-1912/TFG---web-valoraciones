import { Search, CircleStar } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import moviesData from "../../data/movies.json";
import booksData from "../../data/books.json";
import seriesData from "../../data/series.json";
import videoGamesData from "../../data/video-games.json";
import boardGamesData from "../../data/board-games.json";
import discos from "../../data/music.json";

type Item = {
  id: string;
  title: string;
  description?: string;
  imgSrc?: string;
  rating?: number;
};

const datasets: Record<string, Item[]> = {
  pelicula: moviesData as Item[],
  libro: booksData as Item[],
  serie: seriesData as Item[],
  videojuego: videoGamesData as Item[],
  juegoMesa: boardGamesData as Item[],
  discos: discos as Item[],
};

export function Header() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const handleSearch = () => {
    const q = normalize(query.trim());
    if (!q) return;

    let found: Item | null = null;
    let foundType: string | null = null;

    for (const [type, items] of Object.entries(datasets)) {
      const match =
        items.find((item) => normalize(item.title) === q) ||
        items.find((item) => normalize(item.title).includes(q));
      if (match) {
        found = match;
        foundType = type;
        break;
      }
    }

    if (found && foundType) {
      navigate(`/detail/${foundType}/${found.id}`);
    } else {
      alert(`No se encontraron resultados para: "${query}"`);
    }
  };

  return (
    <header className="w-full bg-linear-to-r from-indigo-500 to-purple-600 text-white shadow-md fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* 🔹 Logo */}
        <div
          className="flex items-center gap-2 font-extrabold text-2xl cursor-pointer"
          onClick={() => navigate("/")}
        >
          Opinify
          <CircleStar size={22} />
        </div>

        {/* 🔹 Navegación central */}
        <nav className="hidden md:flex gap-8 font-medium">
          <Link to="/inicio" className="hover:text-gray-200 transition">
            Inicio
          </Link>
          <Link to="/servicios" className="hover:text-gray-200 transition">
            Servicios
          </Link>
          <Link to="/listas" className="hover:text-gray-200 transition">
            Listas
          </Link>
          <Link to="/comunidad" className="hover:text-gray-200 transition">
            Comunidad
          </Link>
        </nav>

        {/* 🔹 Buscador y botones */}
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <input
              type="search"
              placeholder="Buscar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="px-4 py-2 rounded-md text-white placeholder-gray-200 bg-transparent border border-white border-opacity-40 hover:border-opacity-80 focus:border-opacity-100 focus:outline-none focus:ring-2 focus:ring-white/80 transition duration-200 ease-in-out"
            />
            <Search
              onClick={handleSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-200 cursor-pointer hover:text-white transition"
              size={18}
            />
          </div>

          <button
            onClick={() => navigate("/login")}
            className="bg-transparent border border-white rounded px-4 py-2 hover:bg-white hover:text-indigo-600 transition cursor-pointer"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/registro")}
            className="bg-transparent border border-white rounded px-4 py-2 hover:bg-white hover:text-indigo-600 transition cursor-pointer"
          >
            Registro
          </button>
        </div>
      </div>
    </header>
  );
}
