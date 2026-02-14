import { Search, Menu, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LogoPng from "@/assets/LOGO.png";
import { logoutUser } from "@/services/auth-service";
import { fetchMyProfile } from "@/services/profile-service";
import {
  searchContents,
  searchUsers,
  type ContentSearchItem,
  type UserSearchItem,
} from "@/services/search-service";


import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";


//import { useIsMobile } from "@/hooks/use-mobile";
import { AppBreadcrumb } from "../global-breadcrumb";


export function Header() {
  ///const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [searchItems, setSearchItems] = useState<ContentSearchItem[]>([]);
  const [searchUserResults, setSearchUserResults] = useState<UserSearchItem[]>(
    []
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("isLoggedIn") === "true";
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const MIN_QUERY_LENGTH = 2;
  const SEARCH_DEBOUNCE_MS = 300;

  const fetchSearchResults = async (
    q: string,
    signal?: AbortSignal
  ): Promise<{
    items: ContentSearchItem[];
    users: UserSearchItem[];
    error: string | null;
  }> => {
    const [itemsRes, usersRes] = await Promise.allSettled([
      searchContents(q, signal),
      searchUsers(q, signal),
    ]);

    const items =
      itemsRes.status === "fulfilled" ? itemsRes.value.items ?? [] : [];
    const users =
      usersRes.status === "fulfilled" ? usersRes.value.results ?? [] : [];

    const error =
      itemsRes.status === "rejected" && usersRes.status === "rejected"
        ? "No se pudo buscar ahora mismo."
        : null;

    return { items, users, error };
  };

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;

    setIsSearchOpen(true);
    setSearchLoading(true);
    setSearchError(null);

    const { items, users, error } = await fetchSearchResults(q);
    setSearchItems(items);
    setSearchUserResults(users);
    setSearchError(error);
    setSearchLoading(false);

    if (items[0]) {
      navigate(`/detail/${items[0].tipo}/${items[0].id}`);
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
      return;
    }

    if (users[0]) {
      navigate(`/perfil?userId=${users[0].userId}`);
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
      return;
    }

    if (!error) {
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
    const handleProfileImageUpdate = (event: Event) => {
      const detail =
        event instanceof CustomEvent ? (event.detail as string | null) : null;
      if (typeof detail === "string" || detail === null) {
        setProfileImage(detail);
      }
    };
    window.addEventListener("profile-image-updated", handleProfileImageUpdate);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("profile-image-updated", handleProfileImageUpdate);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
  }, [location.pathname]);

  useEffect(() => {
    if (!isLoggedIn) {
      setProfileImage(null);
      return;
    }

    const controller = new AbortController();
    fetchMyProfile(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setProfileImage(data.perfil?.avatarUrl ?? null);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setProfileImage(null);
      });

    return () => controller.abort();
  }, [isLoggedIn]);

  useEffect(() => {
    const q = query.trim();

    if (q.length < MIN_QUERY_LENGTH) {
      setSearchItems([]);
      setSearchUserResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);
      const { items, users, error } = await fetchSearchResults(
        q,
        controller.signal
      );
      if (controller.signal.aborted) return;
      setSearchItems(items);
      setSearchUserResults(users);
      setSearchError(error);
      setSearchLoading(false);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      setIsLoggedIn(false);
      navigate("/home");
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);

  const renderSearchResults = (onSelect?: () => void) => {
    const hasItems = searchItems.length > 0;
    const hasUsers = searchUserResults.length > 0;

    if (searchLoading) {
      return (
        <div className="px-3 py-2 text-sm text-white/80">Buscando...</div>
      );
    }

    if (searchError) {
      return (
        <div className="px-3 py-2 text-sm text-red-200">{searchError}</div>
      );
    }

    if (!hasItems && !hasUsers) {
      return (
        <div className="px-3 py-2 text-sm text-white/80">
          Sin resultados.
        </div>
      );
    }

    return (
      <>
        {hasUsers && (
          <div className="py-2">
            <div className="px-3 pb-1 text-xs uppercase tracking-wide text-white/70">
              Usuarios
            </div>
            <ul className="flex flex-col">
              {searchUserResults.map((user) => {
                const avatar = user.avatarUrl ?? user.avatarPath ?? "";
                const letter = (user.username?.trim()?.[0] ?? "U").toUpperCase();
                return (
                  <li key={user.userId}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        navigate(`/perfil?userId=${user.userId}`);
                        onSelect?.();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-white/15"
                    >
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={user.username}
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                          {letter}
                        </div>
                      )}
                      <span>{user.username}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {hasItems && (
          <div className="py-2">
            <div className="px-3 pb-1 text-xs uppercase tracking-wide text-white/70">
              Items
            </div>
            <ul className="flex flex-col">
              {searchItems.map((item) => (
                <li key={`${item.tipo}-${item.id}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      navigate(`/detail/${item.tipo}/${item.id}`);
                      onSelect?.();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-white/15"
                  >
                    {item.portada ? (
                      <img
                        src={item.portada}
                        alt={item.titulo}
                        className="h-8 w-6 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-6 items-center justify-center rounded bg-white/20 text-[10px] uppercase tracking-wide">
                        {item.tipo.slice(0, 2)}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="leading-tight">{item.titulo}</span>
                      <span className="text-xs text-white/70">
                        {item.tipo}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  };

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
      <div className="flex w-full items-center justify-between px-6 py-4 text-white lg:grid lg:min-w-0 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
        {/* LOGO */}
        <div
          className="flex cursor-pointer items-center text-2xl font-extrabold lg:justify-self-start"
          onClick={() => navigate("/home")}
        >
          <img
            src={LogoPng}
            alt="Logo"
            className="w-32 object-contain"
          />
        </div>


        {/* NAVIGATION MENU SHADCN */}
        <NavigationMenu
          viewport={false}
          className="hidden lg:flex lg:min-w-0 lg:justify-self-center" /*</div>viewport={isMobile}*/
        >
          <NavigationMenuList className="flex-wrap justify-center lg:max-w-full">
            <NavItems />
          </NavigationMenuList>


          <NavigationMenuIndicator />
        </NavigationMenu>


        {/* BUSCADOR + BOTONES */}
        <div className="ml-auto flex items-center gap-4 lg:ml-0 lg:min-w-0 lg:justify-end lg:justify-self-end">
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
          <div className="relative hidden lg:block w-full max-w-[14rem] xl:max-w-[20rem]">
            <input
              type="search"
              placeholder="Buscar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onFocus={openSearch}
              onBlur={() => window.setTimeout(closeSearch, 150)}
              className="rounded-md border border-white/40 bg-transparent pl-10 pr-4 py-2 text-white placeholder-gray-200 transition duration-200 ease-in-out hover:border-white/80 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/80"
            />
            <Search
              onClick={handleSearch}
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer text-indigo-200 transition hover:text-white"
            />
            {isSearchOpen && query.trim().length >= MIN_QUERY_LENGTH && (
              <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-[16rem] max-w-[28rem] overflow-hidden rounded-lg border border-white/20 bg-[hsl(var(--color-primary-strong))] text-white shadow-lg">
                {renderSearchResults(() => {
                  setIsSearchOpen(false);
                  setIsMobileMenuOpen(false);
                })}
              </div>
            )}
          </div>


          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="cursor-pointer rounded border border-white px-4 py-2 text-sm font-medium transition hover:bg-white hover:text-indigo-600"
              >
                Logout
              </button>
              <button
                type="button"
                onClick={() => navigate("/perfil")}
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/60 bg-white/15 text-white shadow-sm transition hover:bg-white/25"
                aria-label="Perfil"
                title="Perfil"
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Perfil"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-6 w-6" />
                )}
              </button>
            </div>
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
                onFocus={openSearch}
                onBlur={() => window.setTimeout(closeSearch, 150)}
                className="w-full rounded-md border border-white/40 bg-transparent pl-10 pr-4 py-2 text-white placeholder-gray-200 transition duration-200 ease-in-out hover:border-white/80 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/80"
              />
              <Search
                onClick={handleSearch}
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer text-indigo-200 transition hover:text-white"
              />
            </div>
          </div>
          {isSearchOpen && query.trim().length >= MIN_QUERY_LENGTH && (
            <div className="mb-3 overflow-hidden rounded-lg border border-white/20 bg-[hsl(var(--color-primary-strong))] text-white shadow-lg">
              {renderSearchResults(() => {
                setIsSearchOpen(false);
                setIsMobileMenuOpen(false);
              })}
            </div>
          )}
          <NavigationMenu viewport={false} className="w-full">
            <NavigationMenuList className="grid w-full grid-cols-2 gap-x-1 gap-y-1.5">
              <NavItems onNavigate={closeMobileMenu} />
            </NavigationMenuList>
            <NavigationMenuIndicator />
          </NavigationMenu>
        </div>
      )}
      <AppBreadcrumb />
    </header>
  );
}
