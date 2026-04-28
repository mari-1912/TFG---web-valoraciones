import { SearchBox } from "@/components/search/search-box";

type CategoryApiSearchBarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  suggestions?: Array<{
    id: string;
    title: string;
    image?: string | null;
    provider?: string;
  }>;
  loading?: boolean;
  error?: string | null;
  onSelectSuggestion?: (id: string) => void;
  minLength?: number;
};

export function CategoryApiSearchBar({
  query,
  onQueryChange,
  suggestions = [],
  loading = false,
  error = null,
  onSelectSuggestion,
  minLength = 2,
}: CategoryApiSearchBarProps) {
  return (
    <SearchBox
      value={query}
      onValueChange={onQueryChange}
      placeholder="Buscar contenido..."
      minLength={minLength}
      loading={loading}
      error={error}
      inputClassName="w-full rounded-xl border border-violet-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,243,255,0.98))] py-2 pl-10 pr-3 text-sm font-semibold text-violet-800 shadow-[0_6px_16px_rgba(91,33,182,0.08)] outline-none transition placeholder:text-violet-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
    >
      {suggestions.length === 0 ? (
        <p className="px-3 py-2 text-sm text-gray-600">Sin resultados externos.</p>
      ) : (
        <ul className="max-h-72 overflow-y-auto py-1">
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelectSuggestion?.(item.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-violet-50"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-8 w-6 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-6 items-center justify-center rounded bg-violet-100 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                    API
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-violet-900">
                    {item.title}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </SearchBox>
  );
}
