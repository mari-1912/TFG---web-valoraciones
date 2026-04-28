import { LogOut, Menu, User, UserCircle } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LogoPng from "@/assets/LOGO.png";
import {
  ensureSessionValid,
  getSessionExpiry,
  logoutUser,
} from "@/services/auth-service";
import { fetchMyProfile } from "@/services/profile-service";
import {
  importExternalContent,
  type ExternalContentType,
} from "@/hooks/search/use-external-content-search";
import {
  useGlobalSearch,
  type GlobalSearchResultItem,
} from "@/hooks/search/use-global-search";
import { buildDetailPath } from "@/lib/detail-route";
import { SearchBox } from "@/components/search/search-box";


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
import { FollowerNotificationsMenu } from "@/components/notifications/follower-notifications-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


//import { useIsMobile } from "@/hooks/use-mobile";
import { AppBreadcrumb } from "../global-breadcrumb";


export function Header() {
  ///const isMobile = useIsMobile();
  const [isImporting, setIsImporting] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === "undefined") return false;
    return ensureSessionValid();
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    query,
    setQuery,
    items: searchItems,
    users: searchUserResults,
    loading: searchLoading,
    error: searchError,
    minLength: MIN_QUERY_LENGTH,
    runSearch,
  } = useGlobalSearch();
  const CONTENT_TYPE_ORDER = [
    "pelicula",
    "serie",
    "libro",
    "videojuego",
    "juego-mesa",
  ];
  const CONTENT_TYPE_LABELS: Record<string, string> = {
    pelicula: "Películas",
    serie: "Series",
    libro: "Libros",
    videojuego: "Videojuegos",
    "juego-mesa": "Juegos de mesa",
  };
  const groupContentItems = (items: GlobalSearchResultItem[]) =>
    items.reduce(
      (acc, item) => {
        const key = item.tipo ?? "otros";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {} as Record<string, GlobalSearchResultItem[]>
    );
  const getOrderedTypes = (grouped: Record<string, GlobalSearchResultItem[]>) => [
    ...CONTENT_TYPE_ORDER.filter((key) => grouped[key]?.length),
    ...Object.keys(grouped).filter(
      (key) => !CONTENT_TYPE_ORDER.includes(key)
    ),
  ];
  const formatTypeLabel = (tipo: string) =>
    CONTENT_TYPE_LABELS[tipo] ??
    tipo
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  useLayoutEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl || typeof window === "undefined") return;

    const root = document.documentElement;
    const updateOffset = () => {
      root.style.setProperty("--app-header-offset", `${headerEl.offsetHeight}px`);
    };

    updateOffset();
    const resizeObserver = new ResizeObserver(updateOffset);
    resizeObserver.observe(headerEl);
    window.addEventListener("resize", updateOffset);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateOffset);
    };
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "isLoggedIn" || e.key === "sessionExpiresAt") {
        setIsLoggedIn(ensureSessionValid());
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
    setIsLoggedIn(ensureSessionValid());
  }, [location.pathname]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const expiresAt = getSessionExpiry();
    if (!expiresAt) return;
    const delay = Math.max(0, expiresAt - Date.now());
    const timer = window.setTimeout(() => {
      setIsLoggedIn(ensureSessionValid());
    }, delay + 250);
    return () => window.clearTimeout(timer);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      setProfileImage(null);
      setCurrentUserId(null);
      return;
    }

    const controller = new AbortController();
    fetchMyProfile(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setProfileImage(data.perfil?.avatarUrl ?? null);
        const userId = Number(data.perfil?.userId ?? 0);
        setCurrentUserId(Number.isFinite(userId) && userId > 0 ? userId : null);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setProfileImage(null);
        setCurrentUserId(null);
      });

    return () => controller.abort();
  }, [isLoggedIn]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      setIsLoggedIn(false);
      navigate("/home");
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleContentSelect = async (
    item: GlobalSearchResultItem,
    onSelect?: () => void
  ) => {
    if (item.source === "external" && item.externalId != null) {
      setIsImporting(true);
      try {
        const imported = await importExternalContent(
          item.tipo as ExternalContentType,
          item.externalId
        );
        const importedItem = imported?.item ?? imported;
        const importedId = importedItem?.id ?? importedItem?._id;

        if (!importedId) {
          alert("Se importó el título, pero no se pudo obtener su ID.");
          return;
        }

        const importedTitle =
          importedItem?.titulo ??
          importedItem?.title ??
          item.titulo ??
          "";
        navigate(buildDetailPath(item.tipo, importedId, importedTitle), {
          state: { item: importedItem },
        });
        onSelect?.();
      } catch (err) {
        console.error("Error importando:", err);
        alert("No se pudo importar el título solicitado.");
      } finally {
        setIsImporting(false);
      }
      return;
    }

    navigate(buildDetailPath(item.tipo, item.id, item.titulo));
    onSelect?.();
  };

  const renderSearchResults = (onSelect?: () => void) => {
    const hasItems = searchItems.length > 0;
    const hasUsers = searchUserResults.length > 0;
    const groupedItems = groupContentItems(searchItems);
    const orderedTypes = getOrderedTypes(groupedItems);
    const limitedUsers = searchUserResults.slice(0, 2);
    const hasMoreResults =
      searchUserResults.length > limitedUsers.length ||
      orderedTypes.some((tipo) => groupedItems[tipo].length > 2);

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
              {limitedUsers.map((user) => {
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
          <>
            {orderedTypes.map((tipo) => (
              <div key={tipo} className="py-2">
                <div className="px-3 pb-1 text-xs uppercase tracking-wide text-white/70">
                  {formatTypeLabel(tipo)}
                </div>
                <ul className="flex flex-col">
                  {groupedItems[tipo].slice(0, 2).map((item) => (
                    <li key={`${item.tipo}-${item.id}`}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          handleContentSelect(item, onSelect);
                        }}
                        disabled={isImporting}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
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
                        <div className="flex flex-1 items-center justify-between gap-2">
                          <span className="leading-tight">{item.titulo}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}
        {hasMoreResults && (
          <div className="border-t border-white/10 px-3 py-2">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setIsSearchDialogOpen(true);
                onSelect?.();
              }}
              className="w-full rounded-md border border-white/30 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Ver más resultados
            </button>
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

      {/* CATEGORÍAS — texto clicable a /categorías + dropdown */}
      <NavigationMenuItem className="hover:bg-[hsl(var(--color-primary-soft))] rounded-lg">
        <NavigationMenuTrigger>
          <span
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate("/categorías");
              onNavigate?.();
            }}
            className="cursor-pointer"
          >
            Categorías
          </span>
        </NavigationMenuTrigger>

        <NavigationMenuContent
          className="
      rounded-lg
      min-w-[10rem] sm:min-w-[13rem]
      border border-[hsl(var(--color-border-subtle))]
      bg-[hsl(var(--color-primary-strong))]
      text-white
      shadow-lg
    "
        >
          <ul className="flex w-64 flex-col py-2 sm:w-52">
            <li>
              <NavigationMenuLink
                asChild
                className="hover:bg-[hsl(var(--color-primary-soft))] text-white"
              >
                <Link
                  to="/categorías/peliculas"
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
                  to="/categorías/series"
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
                  to="/categorías/libros"
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
                  to="/categorías/videojuegos"
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
      min-w-[10rem] sm:min-w-[13rem]
      border border-[hsl(var(--color-border-subtle))]
      bg-[hsl(var(--color-primary-strong))]
      text-white
      shadow-lg
    "
        >
          <ul className="flex w-64 flex-col py-2 sm:w-52">
            <li>
              <NavigationMenuLink
                asChild
                className="hover:bg-[hsl(var(--color-primary-soft))] text-white"
              >
                <Link
                  to="/listas/listas-opinify"
                  onClick={onNavigate}
                  className="block px-3 py-2 text-sm hover:bg-[hsl(var(--color-primary-soft))] text-white"
                >
                  Listas Opinify
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
    <header
      ref={headerRef}
      className="fixed left-0 top-0 z-[120] w-full [background-image:var(--gradient-primary)]"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 text-white lg:grid lg:min-w-0 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
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
          <SearchBox
            value={query}
            onValueChange={setQuery}
            placeholder="Buscar..."
            minLength={MIN_QUERY_LENGTH}
            open={isSearchOpen}
            onOpenChange={setIsSearchOpen}
            onSubmit={() => {
              setIsSearchOpen(true);
              void runSearch();
            }}
            className="relative hidden w-full max-w-[14rem] lg:block xl:max-w-[20rem]"
            inputClassName="w-full rounded-md border border-white/40 bg-transparent py-2 pl-10 pr-4 text-white placeholder-gray-200 transition duration-200 ease-in-out hover:border-white/80 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/80"
            iconClassName="text-indigo-200 transition hover:text-white"
            panelClassName="absolute left-0 top-full z-50 mt-2 w-full min-w-[16rem] max-w-[28rem] max-h-[70vh] overflow-y-auto rounded-lg border border-white/20 bg-[hsl(var(--color-primary-strong))] text-white shadow-lg"
          >
            {renderSearchResults(() => {
              setIsSearchOpen(false);
              setIsMobileMenuOpen(false);
            })}
          </SearchBox>

          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <FollowerNotificationsMenu userId={currentUserId} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/60 bg-white/15 text-white shadow-sm transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    aria-label="Menú de perfil"
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
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={10}
                  className="z-[9999] w-56 overflow-hidden rounded-xl border border-white/25 bg-[hsl(var(--color-primary-strong))] p-0 text-white shadow-[0_18px_45px_rgba(80,15,120,0.35)]"
                >
                  <div className="flex items-center gap-3 border-b border-white/15 bg-white/10 px-3 py-3">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Perfil"
                        className="h-9 w-9 rounded-full object-cover ring-2 ring-white/45"
                      />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/35">
                        <UserCircle className="h-5 w-5" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight">Mi cuenta</p>
                      <p className="text-xs text-white/70">Opciones de perfil</p>
                    </div>
                  </div>
                  <div className="p-1.5">
                  <DropdownMenuItem
                    onClick={() => navigate("/perfil")}
                    className="cursor-pointer rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:bg-white/15 focus:text-white"
                  >
                    <User className="h-4 w-4 text-white/80" />
                    Ver perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 bg-white/15" />
                  <DropdownMenuItem
                    onClick={() => void handleLogout()}
                    className="cursor-pointer rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:bg-white/15 focus:text-white"
                  >
                    <LogOut className="h-4 w-4 text-white/80" />
                    Logout
                  </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
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
        <div className="mx-auto max-w-7xl px-6 pb-4 lg:hidden">
          <SearchBox
            value={query}
            onValueChange={setQuery}
            placeholder="Buscar..."
            minLength={MIN_QUERY_LENGTH}
            open={isSearchOpen}
            onOpenChange={setIsSearchOpen}
            onSubmit={() => {
              setIsSearchOpen(true);
              void runSearch();
            }}
            className="relative mb-3"
            inputClassName="w-full rounded-md border border-white/40 bg-transparent py-2 pl-10 pr-4 text-white placeholder-gray-200 transition duration-200 ease-in-out hover:border-white/80 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/80"
            iconClassName="text-indigo-200 transition hover:text-white"
            panelClassName="absolute left-0 right-0 top-full z-50 mt-2 max-h-[60vh] overflow-y-auto rounded-lg border border-white/20 bg-[hsl(var(--color-primary-strong))] text-white shadow-lg"
          >
            {renderSearchResults(() => {
              setIsSearchOpen(false);
              setIsMobileMenuOpen(false);
            })}
          </SearchBox>
          <NavigationMenu viewport={false} className="w-full">
            <NavigationMenuList className="flex w-full flex-wrap justify-start gap-2">
              <NavItems onNavigate={closeMobileMenu} />
            </NavigationMenuList>
            <NavigationMenuIndicator />
          </NavigationMenu>
        </div>
      )}
      {isSearchDialogOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div className="text-sm font-semibold text-gray-700">
                Resultados de búsqueda
              </div>
              <button
                type="button"
                onClick={() => setIsSearchDialogOpen(false)}
                className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
              {searchUserResults.length > 0 && (
                <div className="mb-6">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Usuarios
                  </div>
                  <ul className="flex flex-col gap-1">
                    {searchUserResults.map((user) => {
                      const avatar = user.avatarUrl ?? user.avatarPath ?? "";
                      const letter = (user.username?.trim()?.[0] ?? "U").toUpperCase();
                      return (
                        <li key={`dialog-${user.userId}`}>
                          <button
                            type="button"
                            onClick={() => {
                              navigate(`/perfil?userId=${user.userId}`);
                              setIsSearchDialogOpen(false);
                              setIsSearchOpen(false);
                            }}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50"
                          >
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={user.username}
                                className="h-9 w-9 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
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

              {(() => {
                if (searchItems.length === 0) return null;
                const groupedItems = groupContentItems(searchItems);
                const orderedTypes = getOrderedTypes(groupedItems);
                return orderedTypes.map((tipo) => (
                  <div key={`dialog-${tipo}`} className="mb-6">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {formatTypeLabel(tipo)}
                    </div>
                    <ul className="flex flex-col gap-1">
                      {groupedItems[tipo].map((item) => (
                        <li key={`dialog-${item.tipo}-${item.id}`}>
                          <button
                            type="button"
                            onClick={() => {
                              handleContentSelect(item, () => {
                                setIsSearchDialogOpen(false);
                                setIsSearchOpen(false);
                              });
                            }}
                            disabled={isImporting}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {item.portada ? (
                              <img
                                src={item.portada}
                                alt={item.titulo}
                                className="h-10 w-8 rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-8 items-center justify-center rounded bg-gray-200 text-[10px] uppercase tracking-wide text-gray-700">
                                {item.tipo.slice(0, 2)}
                              </div>
                            )}
                            <div className="flex flex-1 items-center justify-between gap-2">
                              <span className="leading-tight">{item.titulo}</span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
      <AppBreadcrumb />
    </header>
  );
}
