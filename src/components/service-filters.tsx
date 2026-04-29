import type { ReactNode } from "react";

export type ServiceCategory = "peliculas" | "series" | "videojuegos" | "libros";
export type SortKey =
  | "none"
  | "az"
  | "za"
  | "rating_high"
  | "rating_low"
  | "newest"
  | "oldest";
export type DurationKey = "all" | "short" | "medium" | "long" | "unlimited";
export type SeasonKey = "all" | "1" | "2-3" | "4-6" | "7+";
export type BookSeriesKey =
  | "all"
  | "autoconclusivo"
  | "bilogia"
  | "trilogia"
  | "serie"
  | "saga";
export type PlatformKey =
  | "all"
  | "pc"
  | "playstation"
  | "xbox"
  | "nintendo"
  | "mobile"
  | "other";
export type GenreOption = string | { label: string; value: string | string[] };


type Props = {
  category: ServiceCategory | null;
  onCategoryChange: (v: ServiceCategory | null) => void;
  showCategoryHeading?: boolean;
  categoryHeading?: string;


  sort?: SortKey;
  onSortChange?: (v: SortKey) => void;


  genre?: string;
  onGenreChange?: (v: string) => void;


  duration?: DurationKey;
  onDurationChange?: (v: DurationKey) => void;

  seasons?: SeasonKey;
  onSeasonsChange?: (v: SeasonKey) => void;

  bookSeries?: BookSeriesKey;
  onBookSeriesChange?: (v: BookSeriesKey) => void;

  platform?: PlatformKey;
  onPlatformChange?: (v: PlatformKey) => void;


  // Si quieres poblar géneros dinámicos según categoría
  genres?: GenreOption[];


  // Nuevo: mostrar filtros completos solo si hay categoría
  showFullFilters?: boolean;
  searchBar?: ReactNode;
};


const tabBase =
  "w-auto min-w-[4.6rem] whitespace-nowrap rounded-full border px-2 py-1.5 text-[9px] font-semibold leading-tight tracking-wide transition-all duration-200 sm:min-w-[5rem] sm:px-2.5 sm:py-2 sm:text-[10px]";
const tabActive =
  "border-violet-300 bg-[linear-gradient(135deg,rgba(76,29,149,0.92),rgba(124,58,237,0.9),rgba(224,0,255,0.84))] text-white shadow-[0_8px_22px_rgba(88,28,135,0.32)]";
const tabIdle =
  "border-violet-200 bg-white/95 text-violet-700 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800";
const selectBaseClass =
  "w-full min-w-0 rounded-xl border border-violet-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,243,255,0.98))] px-2 py-2 text-xs font-semibold text-violet-700 shadow-[0_6px_16px_rgba(91,33,182,0.08)] outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200 sm:w-auto sm:min-w-[10.5rem] sm:shrink-0 sm:px-3 sm:text-sm";

const CATEGORY_OPTIONS: Array<{ key: ServiceCategory; label: string }> = [
  { key: "peliculas", label: "Películas" },
  { key: "series", label: "Series" },
  { key: "videojuegos", label: "Videojuegos" },
  { key: "libros", label: "Libros" },
];


export function ServicesFilters({
  category,
  onCategoryChange,
  showCategoryHeading = false,
  categoryHeading = "Categorías",
  sort,
  onSortChange,
  genre,
  onGenreChange,
  platform,
  onPlatformChange,
  duration,
  onDurationChange,
  genres = [],
  showFullFilters = false,
  searchBar,
}: Props) {
  return (
    <section className="mx-auto max-w-7xl px-6">
      {/* ----------------- Categorías siempre visibles ----------------- */}
      <div className="mb-2">
        {showCategoryHeading ? (
          <h1
            className="text-3xl font-black tracking-tight text-center"
            style={{ color: "hsl(268 84% 62%)" }}
          >
            {categoryHeading}
          </h1>
        ) : (
          <span className="text-lg font-semibold text-gray-900">Categoría</span>
        )}
        <div
          className={`mt-2 flex flex-wrap gap-1.5 ${showCategoryHeading ? "sm:mt-3 justify-center" : "justify-start"}`}
        >
          {CATEGORY_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onCategoryChange(category === key ? null : key)}
              className={`${tabBase} ${category === key ? tabActive : tabIdle}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>


      {/* ----------------- Filtros completos solo si showFullFilters ----------------- */}
      {showFullFilters && (
        <div className="mb-4 space-y-2.5">
          {searchBar}

          <div className="grid w-full grid-cols-2 gap-2 pb-1 sm:flex sm:flex-wrap sm:gap-2.5">
          {sort && onSortChange && (
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as SortKey)}
              className={selectBaseClass}
            >
              <option value="none">Ordenar por</option>
              <option value="az">Nombre (A-Z)</option>
              <option value="za">Nombre (Z-A)</option>
              <option value="rating_high">Valoración (alta)</option>
              <option value="rating_low">Valoración (baja)</option>
              <option value="newest">Más nuevos</option>
              <option value="oldest">Más antiguos</option>
            </select>
          )}


          {genres && genre !== undefined && onGenreChange && (
            <select
              value={genre}
              onChange={(e) => onGenreChange(e.target.value)}
              className={selectBaseClass}
            >
              <option value="">Géneros</option>
              {genres.map((g) => (
                <option
                  key={
                    typeof g === "string"
                      ? g
                      : Array.isArray(g.value)
                        ? `${g.label}:${g.value.join("|")}`
                        : `${g.label}:${g.value}`
                  }
                  value={
                    typeof g === "string"
                      ? g
                      : Array.isArray(g.value)
                        ? g.value.join(",")
                        : g.value
                  }
                >
                  {typeof g === "string" ? g : g.label}
                </option>
              ))}
            </select>
          )}


          {category && category !== "series" && duration && onDurationChange && (
            <select
              value={duration}
              onChange={(e) => onDurationChange(e.target.value as DurationKey)}
              className={selectBaseClass}
            >
              {category === "videojuegos" ? (
                <>
                  <option value="all">Duración</option>
                  <option value="short">Cortos (hasta 5h)</option>
                  <option value="medium">Medios (6-20h)</option>
                  <option value="long">Largos (más de 20h)</option>
                  <option value="unlimited">Sin duración</option>
                </>
              ) : category === "libros" ? (
                <>
                  <option value="all">Extensión</option>
                  <option value="short">Cortos (hasta 250 pág.)</option>
                  <option value="medium">Medios (251-500 pág.)</option>
                  <option value="long">Largos (más de 500 pág.)</option>
                </>
              ) : (
                <>
                  <option value="all">Duración</option>
                  <option value="short">Cortas (menos de 1h)</option>
                  <option value="medium">Media (de hasta 1h 30min)</option>
                  <option value="long">Largas (más de 1h 30min)</option>
                </>
              )}
            </select>
          )}


          {category === "videojuegos" && platform && onPlatformChange && (
            <select
              value={platform}
              onChange={(e) => onPlatformChange(e.target.value as PlatformKey)}
              className={selectBaseClass}
            >
              <option value="all">Plataforma</option>
              <option value="pc">PC</option>
              <option value="playstation">PlayStation</option>
              <option value="xbox">Xbox</option>
              <option value="nintendo">Nintendo</option>
              <option value="mobile">Móvil</option>
              <option value="other">Otras</option>
            </select>
          )}
          </div>
        </div>
      )}
    </section>
  );
}
