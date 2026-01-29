import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";


import { Header } from "../components/sections/header";
import Footer from "../components/sections/footer";
import { fetchBooks } from "@/services/fetchBooks";
import { fetchMovies } from "@/services/fetchMovies";
import { fetchSeries } from "@/services/fetchSeries";
import { fetchVideoGames } from "@/services/fetchVideogames";
import type { ServiceList } from "@/services/services-list";
import ServiceSection from "../components/sections/services-section";
import { Popcorn, Tv, BookOpen, Gamepad2 } from "lucide-react";
import {
  ServicesFilters,
  type ServiceCategory,
  type SortKey,
  type DurationKey,
  type DateKey,
} from "../components/service-filters";

type ServiceListItem = ServiceList & { imgSrc?: string };

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

const normalizeServiceItems = (
  data: unknown,
  category: ServiceCategory,
): ServiceListItem[] => {
  const source =
    Array.isArray(data) ? data : (data as any)?.items ?? (data as any)?.data;
  const items =
    Array.isArray(source)
      ? source
      : (source as any)?.results ??
        (source as any)?.peliculas ??
        (source as any)?.series ??
        (source as any)?.libros ??
        (source as any)?.videojuegos ??
        (source as any)?.data?.items ??
        (source as any)?.data?.results ??
        (source as any)?.data?.peliculas ??
        (source as any)?.data?.series ??
        (source as any)?.data?.libros ??
        (source as any)?.data?.videojuegos;

  if (!Array.isArray(items)) return [];

  const toNumber = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  return items
    .map((item: any) => {
      const id = item?.id ?? item?._id;
      if (id == null) return null;

      const title = item?.titulo ?? item?.title ?? item?.nombre ?? "";
      const rawGenre =
        item?.generos ??
        item?.genero ??
        item?.genres ??
        item?.categoria ??
        item?.genre ??
        item?.metadataApi?.rawg?.raw?.i18n?.es?.generos ??
        item?.metadataApi?.rawg?.raw?.i18n?.en?.generos ??
        item?.metadataApi?.rawg?.raw?.genres ??
        "";
      const genre = normalizeGenres(rawGenre).join(", ");
      const year =
        toNumber(
          item?.anio_lanzamiento ??
            item?.anioLanzamiento ??
            item?.year ??
            item?.anio,
        ) ?? 0;
      const image =
        item?.portada ??
        item?.poster ??
        item?.image ??
        item?.imagen ??
        item?.cover ??
        item?.imgSrc ??
        "";
      const description =
        item?.descripcion ?? item?.description ?? item?.sinopsis ?? "";
      const creator =
        item?.creator ??
        item?.director ??
        item?.autor ??
        item?.author ??
        item?.desarrollador ??
        item?.developer ??
        item?.estudio ??
        item?.studio;
      const duration = toNumber(
        item?.duracion_min ?? item?.duracionMin ?? item?.duration ?? item?.duracion,
      );
      const rating = toNumber(
        item?.rating ?? item?.avgRating ?? item?.valoracion ?? item?.puntuacion,
      );

      const normalized: ServiceListItem = {
        id: String(id),
        category,
        title: String(title),
        genre,
        year,
        image: typeof image === "string" ? image : "",
        description: String(description ?? ""),
        creator,
        duration,
        rating,
        imgSrc: typeof image === "string" ? image : undefined,
      };

      return normalized;
    })
    .filter((item): item is ServiceListItem => item != null);
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

export default function ServicesList() {
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [sort, setSort] = useState<SortKey>("none");
  const [genre, setGenre] = useState<string>("");
  const [duration, setDuration] = useState<DurationKey>("all");
  const [date, setDate] = useState<DateKey>("all");
  const { pathname } = useLocation();
  const { categoria } = useParams<{ categoria?: string }>();
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // -------------------------
  // Géneros por categoría (fijos)
  // -------------------------
  const genres = useMemo(() => {
    switch (category) {
      case "peliculas":
        return ["Acción", "Drama", "Comedia", "Ciencia ficción"];
      case "series":
        return ["Drama", "Thriller", "Comedia"];
      case "videojuegos":
        return ["Aventura", "RPG", "Estrategia"];
      case "libros":
        return ["Fantasía", "Romance", "Historia"];
      default:
        return [];
    }
  }, [category]);

  useEffect(() => {
    const loadServices = async () => {
      setLoading(true);
      setError(null);
      try {
        const [movies, series, books, videogames] = await Promise.all([
          fetchMovies("", 50),
          fetchSeries("", 50),
          fetchBooks("", 50),
          fetchVideoGames("", 50),
        ]);
        const combined = [
          ...normalizeServiceItems(movies, "peliculas"),
          ...normalizeServiceItems(series, "series"),
          ...normalizeServiceItems(books, "libros"),
          ...normalizeServiceItems(videogames, "videojuegos"),
        ];
        setServices(combined);
      } catch (err) {
        console.error("Error cargando servicios:", err);
        setError("No se pudieron cargar los servicios");
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, []);


  // -------------------------
  // Filtrado y orden
  // -------------------------
  const filteredServices = useMemo(() => {
    const base = services
      .filter((s) => (category ? s.category === category : true))
      .filter((s) =>
        matchesGenre(s.genre, genre),
      )
      .filter((s) => {
        if (date === "2025") return s.year === 2025;
        if (date === "2024") return s.year === 2024;
        if (date === "2023") return s.year === 2023;
        if (date === "older") return s.year < 2023;
        return true;
      })
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
  }, [services, category, genre, date, duration, sort]);


  // -------------------------
  // Sincronizar categoría según URL
  // -------------------------
  useEffect(() => {
    if (categoria) {
      if (categoria === "peliculas") setCategory("peliculas");
      if (categoria === "series") setCategory("series");
      if (categoria === "libros") setCategory("libros");
      if (categoria === "videojuegos") setCategory("videojuegos");
      return;
    }
    if (pathname === "/servicios" || pathname === "/servicios/") {
      setCategory(null);
      return;
    }
    if (pathname === "/peliculas") setCategory("peliculas");
    if (pathname === "/series") setCategory("series");
    if (pathname === "/libros") setCategory("libros");
    if (pathname === "/videojuegos") setCategory("videojuegos");
  }, [categoria, pathname]);


  // -------------------------
  // Render
  // -------------------------
  return (
    <>
      <Header />
      <main className="bg-white min-h-screen pt-38">
        <section className="flex flex-col gap-8">
          <ServicesFilters
            category={category}
            onCategoryChange={(next) => {
              if (next == null) {
                setCategory(null);
                navigate("/servicios");
                return;
              }
              setCategory(next);
              navigate(`/servicios/${next}`);
            }}
            sort={sort}
            onSortChange={setSort}
            genre={genre}
            onGenreChange={setGenre}
            duration={duration}
            onDurationChange={setDuration}
            date={date}
            onDateChange={setDate}
            genres={genres}
            showFullFilters={category != null} // filtros completos solo si hay categoría
          />


          {/* Contenido según categoría */}
          <div className="mx-auto w-full max-w-7xl px-6">
            {loading && <p>Cargando servicios...</p>}
            {error && <p className="text-red-600">{error}</p>}


            {!loading && !error && (
              <>
                {category == null && (
                  <>
                    {/* /servicios → carruseles de cada categoría */}
                    <ServiceSection
                      title="Películas"
                      icon={<Popcorn />}
                      items={filteredServices.filter(
                        (s) => s.category === "peliculas",
                      )}
                    />
                    <ServiceSection
                      title="Series"
                      icon={<Tv />}
                      items={filteredServices.filter(
                        (s) => s.category === "series",
                      )}
                    />
                    <ServiceSection
                      title="Libros"
                      icon={<BookOpen />}
                      items={filteredServices.filter(
                        (s) => s.category === "libros",
                      )}
                    />
                    <ServiceSection
                      title="Videojuegos"
                      icon={<Gamepad2 />}
                      items={filteredServices.filter(
                        (s) => s.category === "videojuegos",
                      )}
                    />
                  </>
                )}


                {category != null && (
                  <>
                    {/* /servicios/peliculas (o cualquier otra) → grid grande, sin categoría arriba */}
                    <ServiceSection
                      // Opcional: puedes mostrar título solo si quieres
                      title={category[0].toUpperCase() + category.slice(1)}
                      items={filteredServices}
                      fullWidth
                    />
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
