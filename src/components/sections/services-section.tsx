import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../Card";
import {
  ServicesFilters,
  type DurationKey,
  type SortKey,
} from "../service-filters";
import type { ServiceList } from "@/services/services-list";
import { buildDetailPath } from "@/lib/detail-route";


interface Props {
  title: string;
  icon?: React.ReactNode;
  items: ServiceList[];
  fullWidth?: boolean; // si true: mostrar grid completo
  showFilters?: boolean; // si true: mostrar filtros
  marqueeDirection?: "left" | "right";
}

const normalizeGenres = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeGenres(item));
  }
  if (value && typeof value === "object") {
    const obj = value as {
      nombre?: unknown;
      name?: unknown;
      title?: unknown;
      genre?: unknown;
      genero?: unknown;
    };
    const candidate =
      obj.nombre ?? obj.name ?? obj.title ?? obj.genre ?? obj.genero;
    return candidate ? normalizeGenres(candidate) : [];
  }
  if (typeof value !== "string") return [];
  return value
    .split(/[,/;|&]/)
    .map((g) => g.trim())
    .filter(Boolean);
};

const GENRE_ALIASES: Record<string, string> = {
  "sci fi": "ciencia ficcion",
  "science fiction": "ciencia ficcion",
  scifi: "ciencia ficcion",
  fantasy: "fantasia",
  mystery: "misterio",
  platformer: "plataformas",
  action: "accion",
  adventure: "aventura",
  strategy: "estrategia",
  comedy: "comedia",
};

const normalizeGenreKey = (value: string) => {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return GENRE_ALIASES[normalized] ?? normalized;
};

const matchesGenre = (itemGenre: unknown, selected: string) => {
  if (!selected) return true;
  const selectedKey = normalizeGenreKey(selected);
  const tokens = normalizeGenres(itemGenre).map(normalizeGenreKey);
  return tokens.includes(selectedKey);
};

export default function ServiceSection({
  title,
  icon,
  items,
  fullWidth = false,
  showFilters = false,
  marqueeDirection = "left",
}: Props) {
  const navigate = useNavigate();
  const [genre, setGenre] = React.useState<string>("");
  const [sort, setSort] = React.useState<SortKey>("none");
  const [duration, setDuration] = React.useState<DurationKey>("all");

  const availableGenres = React.useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      normalizeGenres((item as any).genre).forEach((g) => set.add(g));
    });
    return Array.from(set);
  }, [items]);


  // Filtrado local si showFilters = true
  const filteredItems = React.useMemo(() => {
    const base = items
      .filter((s) =>
        matchesGenre((s as any).genre, genre),
      )
      .filter((s) => {
        if (!s.duration || duration === "all") return true;
        if (duration === "short") return s.duration <= 60;
        if (duration === "medium") return s.duration > 60 && s.duration <= 120;
        if (duration === "long") return s.duration > 120;
        return true;
      });

    if (sort === "none") return base;

    return base.sort((a, b) => {
      if (sort === "az") return a.title.localeCompare(b.title);
      if (sort === "za") return b.title.localeCompare(a.title);
      if (sort === "rating_high") return (b.rating ?? 0) - (a.rating ?? 0);
      if (sort === "rating_low") return (a.rating ?? 0) - (b.rating ?? 0);
      if (sort === "newest") return b.year - a.year;
      if (sort === "oldest") return a.year - b.year;
      return 0;
    });
  }, [items, genre, duration, sort]);


  // -------------------------
  // Render grid completo
  // -------------------------
  const toDetailType = (category?: string) => {
    switch (category) {
      case "peliculas":
        return "pelicula";
      case "series":
        return "serie";
      case "libros":
        return "libro";
      case "videojuegos":
        return "videojuego";
      default:
        return "pelicula";
    }
  };

  const handleCardClick = (item: ServiceList) => {
    const detailType = toDetailType(item.category);
    navigate(buildDetailPath(detailType, item.id, item.title), {
      state: { item: { ...item, tipo: detailType } },
    });
  };

  if (fullWidth) {
    return (
      <section className="my-5 w-full px-0 sm:my-6">
        {icon && (
          <h2 className="mb-3 flex items-center gap-2 text-3xl font-extrabold text-[hsl(var(--color-primary))] [&_svg]:h-7 [&_svg]:w-7">
            {icon} {title}
          </h2>
        )}


        {showFilters && (
          <div className="mb-4">
            <ServicesFilters
              category={null}
              onCategoryChange={() => {}}
              genres={availableGenres}
              genre={genre}
              onGenreChange={setGenre}
              sort={sort}
              onSortChange={setSort}
              duration={duration}
              onDurationChange={setDuration}
              showFullFilters
            />
          </div>
        )}


        {filteredItems.length === 0 ? (
          <p className="text-gray-500">No hay elementos para mostrar.</p>
        ) : (
          <div className="grid w-full grid-cols-3 gap-1 sm:gap-3 md:grid-cols-4 lg:grid-cols-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className="cursor-pointer"
              >
                <Card {...item} />
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }


  // -------------------------
  // Render carrusel en movimiento continuo
  // -------------------------
  const baseItems = [...items, ...items, ...items];
  const loopItems = [...baseItems, ...baseItems];

  return (
    <section className="my-7 mx-auto max-w-7xl px-4 sm:my-8">
      {icon && (
        <h2 className="mb-3 flex items-center gap-2 text-3xl font-extrabold text-[hsl(var(--color-primary))] [&_svg]:h-7 [&_svg]:w-7">
          {icon} {title}
        </h2>
      )}

      <div className="home-marquee overflow-hidden py-1">
        <div
          className={[
            "home-marquee-track flex w-max gap-4",
            marqueeDirection === "right"
              ? "home-marquee-track--right"
              : "home-marquee-track--left",
          ].join(" ")}
        >
          {loopItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="w-[min(68vw,240px)] shrink-0 sm:w-[220px] md:w-[240px]"
              aria-hidden={index >= baseItems.length ? "true" : undefined}
            >
              <div
                onClick={() => handleCardClick(item)}
                className="cursor-pointer"
              >
                <Card {...item} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
