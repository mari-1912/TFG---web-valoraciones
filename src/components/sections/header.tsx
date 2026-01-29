import { Search, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LogoPng from "@/assets/logo1.png";
import { logoutUser } from "@/services/auth-service";

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
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("isLoggedIn") === "true";
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "isLoggedIn") {
        setIsLoggedIn(e.newValue === "true");
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      setIsLoggedIn(false);
      navigate("/home");
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const NavItems = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {/* INICIO — link directo */}
      <NavigationMenuItem className="hover:bg-[hsl(var(--color-primary-soft))] rounded-lg">
        <NavigationMenuLink
          asChild
          className={navigationMenuTriggerStyle()}
        >
          <Link to="/home" onClick={onNavigate}>
            Home
          </Link>
        </NavigationMenuLink>
      </NavigationMenuItem>

      {/* SERVICIOS — dropdown */}
      {/* SERVICIOS — link a /servicios + botón para abrir dropdown */}
      <NavigationMenuItem className="hover:bg-[hsl(var(--color-primary-soft))] rounded-lg">
        <div className="flex items-center">
          {/* Link clicable */}
          <NavigationMenuLink
            asChild
            className={navigationMenuTriggerStyle()}
          >
            <Link to="/servicios" onClick={onNavigate}>
              Servicios
            </Link>
          </NavigationMenuLink>

          {/* Flecha/trigger solo para desplegar */}
          <NavigationMenuTrigger
            className="px-2"
            aria-label="Abrir menú de servicios"
          />
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
              <NavigationMenuLink
                asChild
                className="hover:bg-[hsl(var(--color-primary-soft))] text-white"
              >
                <Link
                  to="/servicios/peliculas"
                  onClick={onNavigate}
                  className="block px-3 py-2 text-sm hover:bg-[hsl(var(--color-primary-soft))] text-white"
                >
                  Películas
                </Link>
              </NavigationMenuLink>
            </li>

            <li>
              <NavigationMenuLink
                asChild
                className="hover:bg-[hsl(var(--color-primary-soft))] text-white"
              >
                <Link
                  to="/servicios/series"
                  onClick={onNavigate}
                  className="block px-3 py-2 text-sm hover:bg-[hsl(var(--color-primary-soft))] text-white"
                >
                  Series
                </Link>
              </NavigationMenuLink>
            </li>

            <li>
              <NavigationMenuLink
                asChild
                className="hover:bg-[hsl(var(--color-primary-soft))] text-white"
              >
                <Link
                  to="/servicios/libros"
                  onClick={onNavigate}
                  className="block px-3 py-2 text-sm hover:bg-[hsl(var(--color-primary-soft))] text-white"
                >
                  Libros
                </Link>
              </NavigationMenuLink>
            </li>

            <li>
              <NavigationMenuLink
                asChild
                className="hover:bg-[hsl(var(--color-primary-soft))] text-white"
              >
                <Link
                  to="/servicios/videojuegos"
                  onClick={onNavigate}
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
              onNavigate?.();
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
                  to="/listas/nuestras-listas"
                  onClick={onNavigate}
                  className="block px-3 py-2 text-sm hover:bg-[hsl(var(--color-primary-soft))] text-white"
                >
                  Nuestras Listas
                </Link>
              </NavigationMenuLink>
            </li>

            <li>
              <NavigationMenuLink
                asChild
                className="hover:bg-[hsl(var(--color-primary-soft))] text-white"
              >
                <Link
                  to="/listas/mis-listas"
                  onClick={onNavigate}
                  className="block px-3 py-2 text-sm hover:bg-[hsl(var(--color-primary-soft))] text-white"
                >
                  Mis listas
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
          <Link to="/comunidad" onClick={onNavigate}>
            Comunidad
          </Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem className="hover:bg-[hsl(var(--color-primary-soft))] rounded-lg">
        <NavigationMenuLink
          asChild
          className={navigationMenuTriggerStyle()}
        >
          <Link to="/sobre-nosotros" onClick={onNavigate}>
            Sobre Nosotros
          </Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
    </>
  );


  return (
    <header className="fixed left-0 top-0 z-50 w-full [background-image:var(--gradient-primary)]">
      <div className="flex w-full items-center justify-between px-6 py-4 text-white">
        {/* LOGO */}
        <div
          className="flex cursor-pointer items-center text-2xl font-extrabold"
          onClick={() => navigate("/home")}
        >
          <img
            src={LogoPng}
            alt="Logo"
            className="h-12 w-12 object-contain"
          />
          <span className="text-[#e000ff]">pinify</span>
        </div>


        {/* NAVIGATION MENU SHADCN */}
        <NavigationMenu
          className="hidden lg:flex" /*</div>viewport={isMobile}*/
        >
          <NavigationMenuList className="flex-wrap">
            <NavItems />
          </NavigationMenuList>


          <NavigationMenuIndicator />
          <NavigationMenuViewport />
        </NavigationMenu>


        {/* BUSCADOR + BOTONES */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center justify-center rounded border border-white/60 p-2 text-white transition hover:bg-white/15"
            aria-label="Abrir menú"
            aria-expanded={isMobileMenuOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
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


          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="cursor-pointer rounded border border-white px-4 py-2 text-sm font-medium transition hover:bg-white hover:text-indigo-600"
            >
              Logout
            </button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="lg:hidden px-6 pb-4">
          <div className="mb-3">
            <div className="relative">
              <input
                type="search"
                placeholder="Buscar..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full rounded-md border border-white/40 bg-transparent px-4 py-2 text-white placeholder-gray-200 transition duration-200 ease-in-out hover:border-white/80 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/80"
              />
              <Search
                onClick={handleSearch}
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-indigo-200 transition hover:text-white"
              />
            </div>
          </div>
          <NavigationMenu className="w-full">
            <NavigationMenuList className="flex w-full flex-col gap-1">
              <NavItems onNavigate={closeMobileMenu} />
            </NavigationMenuList>
            <NavigationMenuIndicator />
            <NavigationMenuViewport />
          </NavigationMenu>
        </div>
      )}
      <AppBreadcrumb />
    </header>
  );
}
