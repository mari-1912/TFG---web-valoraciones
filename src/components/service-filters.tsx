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
export type DateKey = "all" | "2025" | "2024" | "2023" | "older";


type Props = {
  category: ServiceCategory | null;
  onCategoryChange: (v: ServiceCategory | null) => void;


  sort?: SortKey;
  onSortChange?: (v: SortKey) => void;


  genre?: string;
  onGenreChange?: (v: string) => void;


  duration?: DurationKey;
  onDurationChange?: (v: DurationKey) => void;


  date?: DateKey;
  onDateChange?: (v: DateKey) => void;


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
  date,
  onDateChange,
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
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


          {duration && onDurationChange && (
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


          {date && onDateChange && (
            <select
              value={date}
              onChange={(e) => onDateChange(e.target.value as DateKey)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">Fecha</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="older">Anterior</option>
            </select>
          )}
        </div>
      )}
    </section>
  );
}


