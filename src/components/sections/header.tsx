import { Search, CircleStar } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import moviesData from "../../data/movies.json";
import booksData from "../../data/books.json";
import seriesData from "../../data/series.json";
import videoGamesData from "../../data/video-games.json";
import boardGamesData from "../../data/board-games.json";
import discos from "../../data/music.json";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

//import { useIsMobile } from "@/hooks/use-mobile";
import { AppBreadcrumb } from "../global-breadcrumb";

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
  ///const isMobile = useIsMobile();
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
    <header className="fixed left-0 top-0 z-50 w-full [background-image:var(--gradient-primary)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 text-white">
        {/* LOGO */}
        <div
          className="flex cursor-pointer items-center gap-2 text-2xl font-extrabold"
          onClick={() => navigate("/home")}
        >
          Opinify
          <CircleStar size={22} />
        </div>

        {/* NAVIGATION MENU SHADCN */}
        <NavigationMenu className="hidden md:flex" /*</div>viewport={isMobile}*/>
  <NavigationMenuList className="flex-wrap">

    {/* INICIO — link directo */}
    <NavigationMenuItem className="hover:bg-[hsl(var(--color-primary-soft))] rounded-lg">
  <NavigationMenuLink
    asChild
    className={navigationMenuTriggerStyle()}
  >
    <Link to="/home">Home</Link>
  </NavigationMenuLink>
</NavigationMenuItem>

    {/* SERVICIOS — dropdown */}
    {/* SERVICIOS — link a /servicios + botón para abrir dropdown */}
<NavigationMenuItem className="hover:bg-[hsl(var(--color-primary-soft))] rounded-lg">
  <div className="flex items-center">
    {/* Link clicable */}
    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
      <Link to="/servicios">Servicios</Link>
    </NavigationMenuLink>

    {/* Flecha/trigger solo para desplegar */}
    <NavigationMenuTrigger className="px-2" aria-label="Abrir menú de servicios" />
  </div>

  <NavigationMenuContent
    className="
      rounded-lg
      border border-[hsl(var(--color-border-subtle))]
      bg-[hsl(var(--color-primary-strong))]
      text-white
      shadow-lg
    "
  >
    <ul className="flex w-52 flex-col py-2">
      <li>
        <NavigationMenuLink asChild className="hover:bg-[hsl(var(--color-primary-soft))] text-white">
          <Link
            to="/servicios/peliculas"
            className="block px-3 py-2 text-sm hover:bg-[hsl(var(--color-primary-soft))] text-white"
          >
            Películas
          </Link>
        </NavigationMenuLink>
      </li>

      <li>
        <NavigationMenuLink asChild className="hover:bg-[hsl(var(--color-primary-soft))] text-white">
          <Link
            to="/servicios/series"
            className="block px-3 py-2 text-sm hover:bg-[hsl(var(--color-primary-soft))] text-white"
          >
            Series
          </Link>
        </NavigationMenuLink>
      </li>

      <li>
        <NavigationMenuLink asChild className="hover:bg-[hsl(var(--color-primary-soft))] text-white">
          <Link
            to="/servicios/libros"
            className="block px-3 py-2 text-sm hover:bg-[hsl(var(--color-primary-soft))] text-white"
          >
            Libros
          </Link>
        </NavigationMenuLink>
      </li>

      <li>
        <NavigationMenuLink asChild className="hover:bg-[hsl(var(--color-primary-soft))] text-white">
          <Link
            to="/servicios/videojuegos"
            className="block px-3 py-2 text-sm hover:bg-[hsl(var(--color-primary-soft))] text-white"
          >
            Videojuegos
          </Link>
        </NavigationMenuLink>
      </li>
    </ul>
  </NavigationMenuContent>
</NavigationMenuItem>


{/* LISTAS — texto clicable a /listas + dropdown */}
<NavigationMenuItem className="hover:bg-[hsl(var(--color-primary-soft))] rounded-lg">
  <NavigationMenuTrigger>
    <span
      onClick={(e) => {
        e.preventDefault(); // evita que abra/cierre el dropdown
        e.stopPropagation(); // evita que el trigger reciba el click
        navigate("/listas"); // navega a /listas
      }}
      className="cursor-pointer"
    >
      Listas
    </span>
  </NavigationMenuTrigger>

  <NavigationMenuContent
    className="
      rounded-lg
      border border-[hsl(var(--color-border-subtle))]
      bg-[hsl(var(--color-primary-strong))]
      text-white
      shadow-lg
    "
  >
    <ul className="flex w-52 flex-col py-2">
      <li>
        <NavigationMenuLink
          asChild
          className="hover:bg-[hsl(var(--color-primary-soft))] text-white"
        >
          <Link
            to="/listas"
            className="block px-3 py-2 text-sm hover:bg-[hsl(var(--color-primary-soft))] text-white"
          >
            Genéricas
          </Link>
        </NavigationMenuLink>
      </li>

      <li>
        <NavigationMenuLink
          asChild
          className="hover:bg-[hsl(var(--color-primary-soft))] text-white"
        >
          <Link
            to="/mis-listas"
            className="block px-3 py-2 text-sm hover:bg-[hsl(var(--color-primary-soft))] text-white"
          >
            Creadas por mí
          </Link>
        </NavigationMenuLink>
      </li>
    </ul>
  </NavigationMenuContent>
</NavigationMenuItem>





    {/* COMUNIDAD — link directo */}
    <NavigationMenuItem className="hover:bg-[hsl(var(--color-primary-soft))] rounded-lg">
      <NavigationMenuLink
        asChild
        className={navigationMenuTriggerStyle()}
      >
        <Link to="/comunidad">Comunidad</Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
    <NavigationMenuItem className="hover:bg-[hsl(var(--color-primary-soft))] rounded-lg">
      <NavigationMenuLink
        asChild
        className={navigationMenuTriggerStyle()}
      >
        <Link to="/comunidad">Sobre Nosotros</Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>

  <NavigationMenuIndicator />
  <NavigationMenuViewport />
</NavigationMenu>


        {/* BUSCADOR + BOTONES */}
        <div className="flex items-center gap-4">
          {/* Buscador */}
          <div className="relative hidden md:block">
            <input
              type="search"
              placeholder="Buscar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="rounded-md border border-white/40 bg-transparent px-4 py-2 text-white placeholder-gray-200 transition duration-200 ease-in-out hover:border-white/80 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/80"
            />
            <Search
              onClick={handleSearch}
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-indigo-200 transition hover:text-white"
            />
          </div>

          {/* Botón Login */}
          <button
            onClick={() => navigate("/login")}
            className="cursor-pointer rounded border border-white px-4 py-2 text-sm font-medium transition hover:bg-white hover:text-indigo-600"
          >
            Login
          </button>

          {/* Botón Registro */}
          <button
            onClick={() => navigate("/registro")}
            className="cursor-pointer rounded border border-white px-4 py-2 text-sm font-medium transition hover:bg-white hover:text-indigo-600"
          >
            Registro
          </button>
        </div>
      </div>
      <AppBreadcrumb />
    </header>
    
  );
}
