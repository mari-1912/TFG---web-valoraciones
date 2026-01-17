import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import moviesData from "../data/movies.json";
import seriesData from "../data/series.json";
import videoGamesData from "../data/video-games.json";
import booksData from "../data/books.json";
import boardGamesData from "../data/board-games.json";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const LABELS: Record<string, string> = {
  home: "Home",
  inicio: "Home",
  servicios: "Servicios",
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

export function AppBreadcrumb() {
  const { pathname, state } = useLocation();
  const segments = useMemo(() => pathname.split("/").filter(Boolean), [pathname]);
  const [remoteDetailName, setRemoteDetailName] = useState<string | null>(null);

  if (!segments.length || HIDE_ON.has(segments[0])) return null;

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

  const crumbs = (() => {
    if (detailInfo) {
      const type = detailInfo.type;
      const typeCrumb = DETAIL_CRUMBS[type] ?? { label: prettify(type) };

      return [
        { label: typeCrumb.label, to: typeCrumb.to },
        { label: detailName ?? remoteDetailName ?? prettify(detailInfo.id) },
      ];
    }

    return segments.map((seg, idx) => ({
      label: prettify(seg),
      to: "/" + segments.slice(0, idx + 1).join("/"),
    }));
  })();

  return (
    <div className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-3">
        <Breadcrumb>
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
