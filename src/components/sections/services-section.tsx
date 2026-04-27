import React from "react";
import ContentCard from "@/components/content-card";
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
  fullWidth?: boolean;
  showFilters?: boolean;
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

export default function ServiceSection({
  title,
  icon,
  items,
  fullWidth = false,
  showFilters = false,
}: Props) {
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

  const filteredItems = React.useMemo(() => {
    const base = items
      .filter((service) => matchesGenre((service as any).genre, genre))
      .filter((service) => {
        if (!service.duration || duration === "all") return true;
        if (duration === "short") return service.duration <= 60;
        if (duration === "medium") {
          return service.duration > 60 && service.duration <= 120;
        }
        if (duration === "long") return service.duration > 120;
        return true;
      });

    if (sort === "none") return base;

    return [...base].sort((a, b) => {
      if (sort === "az") return a.title.localeCompare(b.title);
      if (sort === "za") return b.title.localeCompare(a.title);
      if (sort === "rating_high") return (b.rating ?? 0) - (a.rating ?? 0);
      if (sort === "rating_low") return (a.rating ?? 0) - (b.rating ?? 0);
      if (sort === "newest") return b.year - a.year;
      if (sort === "oldest") return a.year - b.year;
      return 0;
    });
  }, [items, genre, duration, sort]);

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
            {filteredItems.map((service) => {
              const detailType = toDetailType(service.category);

              return (
                <ContentCard
                  key={`${detailType}:${service.id}`}
                  title={service.title}
                  image={(service as any).image ?? (service as any).imgSrc}
                  type={detailType}
                  score={(service as any).rating}
                  to={buildDetailPath(detailType, service.id, service.title)}
                  state={{ item: { ...service, tipo: detailType } }}
                />
              );
            })}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="mx-auto my-7 max-w-7xl px-4 sm:my-8">
      {icon && (
        <h2 className="mb-3 flex items-center gap-2 text-3xl font-extrabold text-[hsl(var(--color-primary))] [&_svg]:h-7 [&_svg]:w-7">
          {icon} {title}
        </h2>
      )}

      <Carousel className="relative">
        <CarouselContent className="py-1">
          {items.map((service) => {
            const detailType = toDetailType(service.category);

            return (
              <CarouselItem
                key={`${detailType}:${service.id}`}
                className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
              >
                <ContentCard
                  title={service.title}
                  image={(service as any).image ?? (service as any).imgSrc}
                  type={detailType}
                  score={(service as any).rating}
                  to={buildDetailPath(detailType, service.id, service.title)}
                  state={{ item: { ...service, tipo: detailType } }}
                />
              </CarouselItem>
            );
          })}
        </CarouselContent>

        <CarouselPrevious className="border-violet-300 bg-violet-600 text-white shadow-[0_8px_18px_rgba(88,28,135,0.28)] hover:bg-violet-800 hover:text-white sm:flex" />
        <CarouselNext className="border-violet-300 bg-violet-600 text-white shadow-[0_8px_18px_rgba(88,28,135,0.28)] hover:bg-violet-800 hover:text-white sm:flex" />
      </Carousel>
    </section>
  );
}