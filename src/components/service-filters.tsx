export type ServiceCategory = "peliculas" | "series" | "videojuegos" | "libros";
export type SortKey =
  | "none"
  | "az"
  | "za"
  | "rating_high"
  | "rating_low"
  | "newest"
  | "oldest";
export type DurationKey = "all" | "short" | "medium" | "long";
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


type Props = {
  category: ServiceCategory | null;
  onCategoryChange: (v: ServiceCategory | null) => void;


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
  genres?: string[];


  // Nuevo: mostrar filtros completos solo si hay categoría
  showFullFilters?: boolean;
};


const tabBase = "rounded-md border px-4 py-2 text-sm transition";
const tabActive = "bg-gray-100 font-medium";
const tabIdle = "bg-white hover:bg-gray-50";


export function ServicesFilters({
  category,
  onCategoryChange,
  sort,
  onSortChange,
  genre,
  onGenreChange,
  duration,
  onDurationChange,
  seasons,
  onSeasonsChange,
  bookSeries,
  onBookSeriesChange,
  platform,
  onPlatformChange,
  genres = [],
  showFullFilters = false,
}: Props) {
  return (
    <section className="mx-auto max-w-7xl px-6">
      {/* ----------------- Categorías siempre visibles ----------------- */}
      <div className="mb-3 flex items-center gap-3">
        <span className="text-lg font-semibold text-gray-900">Categoría</span>
        <div className="flex flex-wrap gap-3">
          {(
            [
              "peliculas",
              "series",
              "videojuegos",
              "libros",
            ] as ServiceCategory[]
          ).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(category === cat ? null : cat)}
              className={`${tabBase} ${category === cat ? tabActive : tabIdle}`}
            >
              {cat[0].toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>


      {/* ----------------- Filtros completos solo si showFullFilters ----------------- */}
      {showFullFilters && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          {sort && onSortChange && (
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as SortKey)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
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
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Géneros</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          )}


          {category === "peliculas" && duration && onDurationChange && (
            <select
              value={duration}
              onChange={(e) => onDurationChange(e.target.value as DurationKey)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">Duración</option>
              <option value="short">Corta</option>
              <option value="medium">Media</option>
              <option value="long">Larga</option>
            </select>
          )}

          {category === "series" && seasons && onSeasonsChange && (
            <select
              value={seasons}
              onChange={(e) => onSeasonsChange(e.target.value as SeasonKey)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">Temporadas</option>
              <option value="1">1 temporada</option>
              <option value="2-3">2-3 temporadas</option>
              <option value="4-6">4-6 temporadas</option>
              <option value="7+">7+ temporadas</option>
            </select>
          )}

          {category === "libros" && bookSeries && onBookSeriesChange && (
            <select
              value={bookSeries}
              onChange={(e) =>
                onBookSeriesChange(e.target.value as BookSeriesKey)
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">Saga/Serie</option>
              <option value="autoconclusivo">Autoconclusivo</option>
              <option value="bilogia">Bilogia</option>
              <option value="trilogia">Trilogia</option>
              <option value="serie">Serie</option>
              <option value="saga">Saga</option>
            </select>
          )}

          {category === "videojuegos" && platform && onPlatformChange && (
            <select
              value={platform}
              onChange={(e) => onPlatformChange(e.target.value as PlatformKey)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
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
      )}
    </section>
  );
}

