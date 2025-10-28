import { Search, CircleStar } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// importa todos tus archivos JSON
import moviesData from "../../data/movies.json";
import booksData from "../../data/books.json";
import seriesData from "../../data/series.json";
import videoGamesData from "../../data/video-games.json";
import boardGamesData from "../../data/board-games.json";
import discos from "../../data/music.json";

// tipado base
type Item = {
  id: string;
  title: string;
  description?: string;
  imgSrc?: string;
  rating?: number;
};

// mapeo de tipo -> dataset
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

    // Buscar en todos los tipos
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
      // Navegar dinámicamente según el tipo
      navigate(`/detail/${foundType}/${found.id}`);
    } else {
      alert(`No se encontraron resultados para: "${query}"`);
    }
  };

  return (
    <>
      <h1
        className="text-indigo-600 font-extrabold text-3xl cursor-pointer flex"
        onClick={() => navigate("/")}
      >
        Opinify
        <CircleStar />
      </h1>

      <nav className="hidden md:flex gap-8 text-gray-700 font-medium">
        <a href="/inicio" className="hover:text-indigo-600 transition">
          Inicio
        </a>
        <a href="/servicios" className="hover:text-indigo-600 transition">
          Servicios
        </a>
        <a href="/listas" className="hover:text-indigo-600 transition">
          Listas
        </a>
        <a href="/comunidad" className="hover:text-indigo-600 transition">
          Comunidad
        </a>
      </nav>

      <div className="flex items-center gap-4">
        <input
          type="search"
          placeholder="Buscar..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="hidden md:block px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <Search
          onClick={handleSearch}
          className="cursor-pointer hover:text-indigo-600 transition"
        />

        <button
          onClick={() => navigate("/login")}
          className="bg-indigo-600 text-white rounded px-4 py-2 hover:bg-indigo-700 transition"
        >
          Login
        </button>
        <button
          onClick={() => navigate("/registro")}
          className="bg-gray-200 rounded px-4 py-2 hover:bg-gray-300 transition"
        >
          Registro
        </button>
      </div>
    </>
  );
}
