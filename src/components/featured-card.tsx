type FeaturedCardProps = {
    label: string;
    item: {
      id?: number;
      titulo?: string;
      portada?: string;
      sinopsis?: string;
      tipo?: string;
    } | null;
  };
  
  export default function FeaturedCard({ label, item }: FeaturedCardProps) {
    // Si viene null/undefined, no crashees
    if (!item) {
      return (
        <article className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="h-28 bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">
            IMAGEN
          </div>
          <div className="p-3">
            <p className="text-xs font-medium text-violet-700">{label}</p>
            <h3 className="mt-1 text-sm font-semibold text-gray-900">Sin datos</h3>
            <p className="mt-1 text-xs text-gray-600">
              No se ha recibido contenido para esta categoría.
            </p>
          </div>
        </article>
      );
    }
  
    const portadaStr = typeof item.portada === "string" ? item.portada : "";
    const hasCover = portadaStr.trim().length > 0;
  
    return (
      <article className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition">
        <div className="h-28 bg-gray-200">
          {hasCover ? (
            <img
              src={portadaStr}
              alt={item.titulo || label}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-500 font-semibold">
              IMAGEN
            </div>
          )}
        </div>
  
        <div className="p-3">
          <p className="text-xs font-medium text-violet-700">{label}</p>
  
          <h3 className="mt-1 text-sm font-semibold text-gray-900 line-clamp-1">
            {item.titulo || "Sin título"}
          </h3>
  
          <p className="mt-1 text-xs text-gray-600 line-clamp-2">
            {item.sinopsis || "Sin sinopsis"}
          </p>
  
          <button className="mt-3 w-full rounded-md bg-violet-700 py-2 text-xs font-medium text-white hover:bg-violet-800">
            Ver
          </button>
        </div>
      </article>
    );
  }
  