import { Link, useLocation } from "react-router-dom";

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

function prettify(segment: string) {
  const decoded = decodeURIComponent(segment);
  return LABELS[decoded] ?? decoded.charAt(0).toUpperCase() + decoded.slice(1);
}

export function AppBreadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  if (!segments.length || HIDE_ON.has(segments[0])) return null;

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

            {segments.map((seg, idx) => {
              const to = "/" + segments.slice(0, idx + 1).join("/");
              const isLast = idx === segments.length - 1;

              return (
                <span key={to} className="flex items-center">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{prettify(seg)}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={to}>{prettify(seg)}</Link>
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
