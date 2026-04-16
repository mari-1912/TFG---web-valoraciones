import { Search, Menu, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LogoPng from "@/assets/LOGO.png";
import {
  ensureSessionValid,
  getSessionExpiry,
  logoutUser,
} from "@/services/auth-service";
import { fetchMyProfile } from "@/services/profile-service";
import {
  searchContentsAcrossCategories,
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

type ExternalType = "pelicula" | "serie" | "libro" | "videojuego";

type SearchResultItem = ContentSearchItem & {
  source?: "local" | "external";
  externalId?: string | number;
  provider?: string;
};

type ExternalSearchItem = {
  externalId?: string | number;
  titulo?: string;
  title?: string;
  aliases?: string[];
  tipo?: string;
  portada?: string;
  anio_lanzamiento?: number;
  anioLanzamiento?: number;
};

const API_URL = (
  import.meta.env.VITE_API_URL ??
  "https://tfg-web-valoraciones-back-i9b5.onrender.com"
).replace(/\/+$/, "");

const EXTERNAL_SEARCH_ENDPOINTS: Record<ExternalType, string> = {
  pelicula: "peliculas/tmdb/search",
  serie: "series/tmdb/search",
  libro: "libros/google/search",
  videojuego: "videojuegos/rawg/search",
};

const EXTERNAL_IMPORT_ENDPOINTS: Record<ExternalType, string> = {
  pelicula: "peliculas/import/tmdb",
  serie: "series/import/tmdb",
  libro: "libros/import/google",
  videojuego: "videojuegos/import/rawg",
};

const EXTERNAL_PROVIDER_LABEL: Record<ExternalType, string> = {
  pelicula: "TMDB",
  serie: "TMDB",
  libro: "Google Books",
  videojuego: "RAWG",
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const buildApiUrl = (path: string) =>
  `${API_URL}/${path.replace(/^\/+/, "")}`;

const pickExternalTitle = (item: ExternalSearchItem) =>
  (typeof item.titulo === "string" && item.titulo.trim()) ||
  (typeof item.title === "string" && item.title.trim())
    ? (item.titulo ?? item.title ?? "").trim()
    : "";

const getAliases = (item: ExternalSearchItem) =>
  Array.isArray(item.aliases) ? item.aliases.filter(Boolean) : [];


export function Header() {
  ///const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [searchItems, setSearchItems] = useState<SearchResultItem[]>([]);
  const [searchUserResults, setSearchUserResults] = useState<UserSearchItem[]>(
    []
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === "undefined") return false;
    return ensureSessionValid();
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const MIN_QUERY_LENGTH = 2;
  const SEARCH_DEBOUNCE_MS = 300;
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
  const groupContentItems = (items: SearchResultItem[]) =>
    items.reduce(
      (acc, item) => {
        const key = item.tipo ?? "otros";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {} as Record<string, SearchResultItem[]>
    );
  const getOrderedTypes = (grouped: Record<string, SearchResultItem[]>) => [
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

  const scoreExternalMatch = (item: ExternalSearchItem, q: string) => {
    const normalizedQuery = normalizeText(q);
    const title = pickExternalTitle(item);
    const normalizedTitle = normalizeText(title);
    const aliases = getAliases(item).map((alias) => normalizeText(alias));

    let score = 0;
    if (normalizedTitle === normalizedQuery) score = 4;
    else if (normalizedTitle.includes(normalizedQuery)) score = 2;

    for (const alias of aliases) {
      if (alias === normalizedQuery) score = Math.max(score, 3);
      else if (alias.includes(normalizedQuery)) score = Math.max(score, 1);
    }

    return score;
  };

  const fetchExternalSearchResults = async (
    endpoint: string,
    q: string,
    signal?: AbortSignal
  ) => {
    const attempt = async (param: "q" | "query") => {
      const url = new URL(buildApiUrl(endpoint));
      url.searchParams.set(param, q);
      const res = await fetch(url.toString(), { signal });
      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      const items = Array.isArray(data)
        ? data
        : data?.items ?? data?.results ?? data?.data ?? [];
      return Array.isArray(items) ? items : [];
    };

    const primary = await attempt("q");
    if (primary && primary.length > 0) return primary;
    const fallback = await attempt("query");
    return fallback ?? primary ?? [];
  };

  const searchExternalContents = async (
    q: string,
    signal?: AbortSignal
  ): Promise<SearchResultItem[]> => {
    const types: ExternalType[] = [
      "pelicula",
      "serie",
      "libro",
      "videojuego",
    ];

    const results = await Promise.all(
      types.map(async (type) => {
        const endpoint = EXTERNAL_SEARCH_ENDPOINTS[type];
        const items = await fetchExternalSearchResults(
          endpoint,
          q,
          signal
        );
        return items.map((item: ExternalSearchItem) => ({ type, item }));
      })
    );

    const flattened = results.flat();
    const scored = flattened
      .map((candidate) => ({
        type: candidate.type,
        item: candidate.item,
        score: scoreExternalMatch(candidate.item, q),
      }))
      .filter((entry) => entry.score > 0);

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((entry) => {
        const title = pickExternalTitle(entry.item);
        return {
          id: `external-${entry.type}-${entry.item.externalId ?? title}`,
          tipo: (entry.item.tipo as string) ?? entry.type,
          titulo: title || "Sin título",
          portada: entry.item.portada ?? null,
          puntuacion: null,
          puntuacionApi: null,
          source: "external" as const,
          externalId: entry.item.externalId,
          provider: EXTERNAL_PROVIDER_LABEL[entry.type],
        };
      })
      .filter((item) => item.externalId != null);
  };

  const importExternalItem = async (
    type: ExternalType,
    externalId: string | number
  ) => {
    const endpoint = EXTERNAL_IMPORT_ENDPOINTS[type];
    const url = buildApiUrl(
      `${endpoint}/${encodeURIComponent(String(externalId))}`
    );
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${res.status} ${text}`.trim());
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  };

  const fetchSearchResults = async (
    q: string,
    signal?: AbortSignal
  ): Promise<{
    items: SearchResultItem[];
    users: UserSearchItem[];
    error: string | null;
  }> => {
    const [itemsRes, usersRes] = await Promise.allSettled([
      searchContentsAcrossCategories(q, signal, { pageSize: 100 }),
      searchUsers(q, signal),
    ]);

    const localItems =
      itemsRes.status === "fulfilled"
        ? (itemsRes.value.items ?? []).map((item) => ({
            ...item,
            source: "local" as const,
          }))
        : [];
    const users =
      usersRes.status === "fulfilled" ? usersRes.value.results ?? [] : [];

    const error =
      itemsRes.status === "rejected" && usersRes.status === "rejected"
        ? "No se pudo buscar ahora mismo."
        : null;

    let externalItems: SearchResultItem[] = [];

    if (!signal?.aborted && q.trim().length >= MIN_QUERY_LENGTH) {
      try {
        externalItems = await searchExternalContents(q, signal);
      } catch (err) {
        if ((err as { name?: string })?.name !== "AbortError") {
          console.error("Error buscando en APIs externas:", err);
        }
      }
    }

    if (localItems.length > 0 && externalItems.length > 0) {
      const seen = new Set(
        localItems.map((item) =>
          `${item.tipo}:${normalizeText(item.titulo)}`
        )
      );
      externalItems = externalItems.filter(
        (item) => !seen.has(`${item.tipo}:${normalizeText(item.titulo)}`)
      );
    }

    return { items: [...localItems, ...externalItems], users, error };
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
  };

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

  const handleContentSelect = async (
    item: SearchResultItem,
    onSelect?: () => void
  ) => {
    if (item.source === "external" && item.externalId != null) {
      setIsImporting(true);
      try {
        const imported = await importExternalItem(
          item.tipo as ExternalType,
          item.externalId
        );
        const importedItem = imported?.item ?? imported;
        const importedId = importedItem?.id ?? importedItem?._id;

        if (!importedId) {
          alert("Se importó el título, pero no se pudo obtener su ID.");
          return;
        }

        navigate(`/detail/${item.tipo}/${importedId}`, {
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

    navigate(`/detail/${item.tipo}/${item.id}`);
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

      {/* CATEGORÍAS — dropdown */}
      {/* CATEGORÍAS — link a /categorías + botón para abrir dropdown */}
      <NavigationMenuItem className="hover:bg-[hsl(var(--color-primary-soft))] rounded-lg">
        <div className="flex items-center">
          {/* Link clicable */}
          <NavigationMenuLink
            asChild
            className={navigationMenuTriggerStyle()}
          >
            <Link to="/categorías" onClick={onNavigate}>
              Categorías
            </Link>
          </NavigationMenuLink>

          {/* Flecha/trigger solo para desplegar */}
          <NavigationMenuTrigger
            className="px-2"
            aria-label="Abrir menú de categorías"
          />
        </div>

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
              <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-[16rem] max-w-[28rem] max-h-[70vh] overflow-y-auto rounded-lg border border-white/20 bg-[hsl(var(--color-primary-strong))] text-white shadow-lg">
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
            <div className="mb-3 max-h-[60vh] overflow-y-auto rounded-lg border border-white/20 bg-[hsl(var(--color-primary-strong))] text-white shadow-lg">
              {renderSearchResults(() => {
                setIsSearchOpen(false);
                setIsMobileMenuOpen(false);
              })}
            </div>
          )}
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
