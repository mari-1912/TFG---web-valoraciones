type MostViewedItem = {
    id?: number;
    titulo?: string;
    portada?: string;
    sinopsis?: string;
    tipo?: string;
  };
  
  function MostViewedCard({
    label,
    item,
  }: {
    label: string;
    item: MostViewedItem | null;
  }) {
    if (!item) {
      return (
        <article className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="h-40 bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">
            IMAGEN
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900">{label}</h3>
            <p className="mt-2 text-sm text-gray-600">
              No hay datos esta semana.
            </p>
          </div>
        </article>
      );
    }
  
    const portadaStr = typeof item.portada === "string" ? item.portada : "";
    const hasCover = portadaStr.trim().length > 0;
  
    return (
      <article className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition">
        <div className="h-40 bg-gray-200">
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
  
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-1">
            {item.titulo || label}
          </h3>
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {item.sinopsis || "Sin sinopsis"}
          </p>
  
          <button className="mt-4 w-full rounded-md bg-violet-700 py-2 text-sm font-medium text-white hover:bg-violet-800">
            VER
          </button>
        </div>
      </article>
    );
  }
  
    export default MostViewedCard;