import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchUserProfile } from "@/services/profile-service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import moviesData from "../data/movies.json";
import seriesData from "../data/series.json";
import videoGamesData from "../data/video-games.json";
import booksData from "../data/books.json";
import boardGamesData from "../data/board-games.json";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const LABELS: Record<string, string> = {
  home: "Home",
  inicio: "Home",
  servicios: "Categorías",
  categorias: "Categorías",
  "categorías": "Categorías",
  pelicula: "Película",
  serie: "Serie",
  libro: "Libro",
  videojuego: "Videojuego",
  "juego-mesa": "Juego de mesa",
  peliculas: "Películas",
  series: "Series",
  libros: "Libros",
  videojuegos: "Videojuegos",
  listas: "Listas",
  "mis-listas": "Mis listas",
  comunidad: "Comunidad",
  detail: "Detalle",
  estado: "Estado",
  watchlist: "Pendientes",
  in_progress: "En progreso",
  completed: "Finalizado",
  dropped: "Abandonado",
};

const HIDE_ON = new Set(["login", "registro"]);

const API_URL =
  import.meta.env.VITE_API_URL ??
  "https://tfg-web-valoraciones-back-i9b5.onrender.com";

const TYPE_ENDPOINTS: Record<string, string> = {
  pelicula: "peliculas",
  serie: "series",
  libro: "libros",
  videojuego: "videojuegos",
};

const CATALOGS: Record<string, Array<{ id: string; title?: string; titulo?: string }>> = {
  pelicula: moviesData as Array<{ id: string; title?: string; titulo?: string }>,
  serie: seriesData as Array<{ id: string; title?: string; titulo?: string }>,
  videojuego: videoGamesData as Array<{ id: string; title?: string; titulo?: string }>,
  libro: booksData as Array<{ id: string; title?: string; titulo?: string }>,
  "juego-mesa": boardGamesData as Array<{ id: string; title?: string; titulo?: string }>,
};

const DETAIL_CRUMBS: Record<string, { label: string; to?: string }> = {
  pelicula: { label: "Películas", to: "/peliculas" },
  serie: { label: "Series", to: "/series" },
  libro: { label: "Libros", to: "/libros" },
  videojuego: { label: "Videojuegos", to: "/videojuegos" },
};

function prettify(segment: string) {
  const decoded = decodeURIComponent(segment);
  return LABELS[decoded] ?? decoded.charAt(0).toUpperCase() + decoded.slice(1);
}

function pickTitle(value?: unknown, fallback?: unknown) {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof fallback === "string" && fallback.trim()) return fallback;
  return null;
}

function parseUserId(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function AppBreadcrumb() {
  const { pathname, search, state } = useLocation();
  const navigate = useNavigate();
  const segments = useMemo(() => pathname.split("/").filter(Boolean), [pathname]);
  const [remoteDetailName, setRemoteDetailName] = useState<string | null>(null);
  const [statusOwnerUsername, setStatusOwnerUsername] = useState<string | null>(null);
  const shouldHide = !segments.length || HIDE_ON.has(segments[0]);
  const statusOwnerUserId = useMemo(
    () => parseUserId(new URLSearchParams(search).get("userId")),
    [search]
  );
  const isStatusRoute =
    segments[0] === "listas" &&
    segments[1] === "mis-listas" &&
    segments[2] === "estado" &&
    segments.length >= 4;

  const detailInfo = useMemo(() => {
    if (segments[0] !== "detail" || segments.length < 3) return null;
    return { type: segments[1], id: segments[2] };
  }, [segments]);

  const detailName = useMemo(() => {
    if (!detailInfo) return null;
    const itemFromState = (state as { item?: any } | null)?.item;
    const stateTitle = pickTitle(itemFromState?.title, itemFromState?.titulo);
    if (stateTitle) return stateTitle;

    const dataset = CATALOGS[detailInfo.type];
    if (!dataset) return null;
    const found = dataset.find(
      (entry) => String(entry.id) === String(detailInfo.id)
    );
    return pickTitle(found?.title, found?.titulo);
  }, [detailInfo, state]);

  useEffect(() => {
    if (!detailInfo) {
      setRemoteDetailName(null);
      return;
    }
    setRemoteDetailName(null);
    if (detailName) return;
    const endpoint = TYPE_ENDPOINTS[detailInfo.type];
    if (!endpoint) return;

    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/${endpoint}/${detailInfo.id}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        const item = data?.item ?? data;
        setRemoteDetailName(pickTitle(item?.titulo, item?.title));
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
      }
    };

    load();
    return () => controller.abort();
  }, [detailInfo, detailName]);

  useEffect(() => {
    let cancelled = false;

    if (!isStatusRoute || statusOwnerUserId == null) {
      setStatusOwnerUsername(null);
      return;
    }

    const loadOwner = async () => {
      try {
        const profile = await fetchUserProfile(statusOwnerUserId);
        if (cancelled) return;
        const username = String(profile?.perfil?.username ?? "").trim();
        setStatusOwnerUsername(username || null);
      } catch {
        if (cancelled) return;
        setStatusOwnerUsername(null);
      }
    };

    void loadOwner();
    return () => {
      cancelled = true;
    };
  }, [isStatusRoute, statusOwnerUserId]);

  const crumbs = (() => {
    if (detailInfo) {
      const type = detailInfo.type;
      const typeCrumb = DETAIL_CRUMBS[type] ?? { label: prettify(type) };

      return [
        { label: typeCrumb.label, to: typeCrumb.to },
        { label: detailName ?? remoteDetailName ?? prettify(detailInfo.id) },
      ];
    }

    const defaultCrumbs = segments.map((seg, idx) => ({
      label: prettify(seg),
      to: "/" + segments.slice(0, idx + 1).join("/"),
    }));

    if (isStatusRoute && statusOwnerUserId != null && defaultCrumbs.length >= 2) {
      const ownerLabel =
        statusOwnerUsername && statusOwnerUsername.length > 0
          ? `Perfil @${statusOwnerUsername}`
          : `Perfil user-${statusOwnerUserId}`;
      defaultCrumbs[1] = {
        label: ownerLabel,
        to: `/perfil?userId=${statusOwnerUserId}`,
      };
    }

    return defaultCrumbs;
  })();

  const mobileShortcutCrumbs = useMemo(() => {
    const shortcuts: Array<{ label: string; to: string }> = [
      { label: "Home", to: "/home" },
    ];

    for (const crumb of crumbs.slice(0, -1)) {
      if (!crumb.to) continue;
      shortcuts.push({ label: crumb.label, to: crumb.to });
    }

    const deduped: Array<{ label: string; to: string }> = [];
    for (const item of shortcuts) {
      if (deduped.some((existing) => existing.to === item.to)) continue;
      deduped.push(item);
    }
    return deduped;
  }, [crumbs]);

  if (shouldHide) return null;

  return (
    <div className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-1.5 sm:px-6 sm:py-2">
        <Breadcrumb className="sm:hidden">
          <BreadcrumbList className="flex-nowrap overflow-hidden whitespace-nowrap text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/home" className="shrink-0">
                  Home
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {crumbs.length <= 1 ? (
              crumbs.map((crumb, idx) => (
                <span key={`mobile-${crumb.label}-${idx}`} className="flex min-w-0 items-center">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem className="min-w-0">
                    {idx === crumbs.length - 1 || !crumb.to ? (
                      <BreadcrumbPage className="inline-block max-w-[180px] truncate align-bottom">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.to} className="inline-block max-w-[180px] truncate align-bottom">
                          {crumb.label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              ))
            ) : (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem className="shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Mostrar rutas"
                        className="rounded-md hover:bg-gray-100"
                      >
                        <BreadcrumbEllipsis className="size-6" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="min-w-[190px] border-gray-200 bg-white text-gray-900 shadow-xl"
                    >
                      {mobileShortcutCrumbs.map((crumb) => (
                        <DropdownMenuItem
                          key={`mobile-shortcut-${crumb.to}`}
                          onSelect={() => navigate(crumb.to)}
                          className="text-xs"
                        >
                          {crumb.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbPage className="inline-block max-w-[180px] truncate align-bottom">
                    {crumbs[crumbs.length - 1]?.label}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/home">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {crumbs.map((crumb, idx) => {
              const isLast = idx === crumbs.length - 1;
              const label = crumb.label;

              return (
                <span key={`${crumb.label}-${idx}`} className="flex items-center">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast || !crumb.to ? (
                      <BreadcrumbPage>{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.to}>{label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}
