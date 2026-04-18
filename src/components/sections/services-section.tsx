import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../Card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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
      <section className="my-8 max-w-7xl mx-auto px-4">
        {icon && (
          <h2 className="text-3xl font-extrabold mb-4 flex items-center gap-2 text-[hsl(var(--color-primary))] [&_svg]:h-7 [&_svg]:w-7">
            {icon} {title}
          </h2>
        )}


        {showFilters && (
          <div className="mb-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
  // Render carrusel (estilo shadcn)
  // -------------------------
  return (
    <section className="my-10 max-w-7xl mx-auto px-4">
      {icon && (
        <h2 className="text-3xl font-extrabold mb-4 flex items-center gap-2 text-[hsl(var(--color-primary))] [&_svg]:h-7 [&_svg]:w-7">
          {icon} {title}
        </h2>
      )}

      <Carousel className="relative">
        <CarouselContent className="py-2">
          {items.map((item) => (
            <CarouselItem
              key={item.id}
              className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
            >
              <div
                onClick={() => handleCardClick(item)}
                className="cursor-pointer"
              >
                <Card {...item} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-3 md:-left-5" />
        <CarouselNext className="-right-3 md:-right-5" />
      </Carousel>
    </section>
  );
}
