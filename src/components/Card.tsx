type CardProps = {
  // ✅ comunes (contenidos)
  id?: number | string;
  titulo?: string;
  title?: string;
  generos?: string | string[];
  anio_lanzamiento?: number;
  portada?: string;
  imgSrc?: string;

  // ✅ UI (opcionales)
  rating?: number; // 0..5
  description?: string; // texto libre extra si lo quieres

  // 🎬 Películas
  director?: string;
  duracion_min?: number;
  estudio?: string;
  plataforma?: string;

  // 📺 Series
  plataformas?: string | string[];

  // 📚 Libros
  autor?: string;
  editorial?: string;
  paginas?: number;
  precio?: number;

  // 🎮 Videojuegos
  desarrollador?: string;
  duracion?: number;
  consolas?: string | string[];
};

function joinMaybe(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value.join(", ") : value;
}

export default function Card(props: CardProps) {
  const {
    titulo,
    title,
    generos,
    anio_lanzamiento,
    portada,
    imgSrc,
    description,

    // específicos
    director,
    duracion_min,
    estudio,
    plataforma,

    plataformas,

    autor,
    editorial,
    paginas,
    precio,

    desarrollador,
    duracion,
    consolas,
  } = props;

  const resolvedTitle = titulo ?? title ?? "";
  const resolvedCover = portada ?? imgSrc;

  const generosTxt = joinMaybe(generos);
  const plataformasTxt = joinMaybe(plataformas);
  const consolasTxt = joinMaybe(consolas);

  // Construimos una línea “meta” con lo que exista (sin forzar campos vacíos)
  const metaParts: string[] = [];

  if (director) metaParts.push(director);
  if (autor) metaParts.push(`Autor: ${autor}`);
  if (desarrollador) metaParts.push(desarrollador);

  if (duracion_min != null) metaParts.push(`${duracion_min} min`);
  if (duracion != null) metaParts.push(`${duracion} h`);

  if (plataforma) metaParts.push(plataforma);
  if (plataformasTxt) metaParts.push(`Plataformas: ${plataformasTxt}`);
  if (consolasTxt) metaParts.push(`Consolas: ${consolasTxt}`);

  if (estudio) metaParts.push(estudio);
  if (editorial) metaParts.push(editorial);

  if (paginas != null) metaParts.push(`${paginas} págs`);
  if (precio != null) metaParts.push(`${precio.toFixed(2)} €`);

  const metaLine = metaParts.join(" • ");

  // Si no te viene sinopsis “real”, usamos una descripción base coherente
  const fallbackParts: string[] = [];
  if (generosTxt) fallbackParts.push(generosTxt);
  if (anio_lanzamiento != null) fallbackParts.push(String(anio_lanzamiento));
  const fallbackDescription = fallbackParts.join(" • ");

  return (
    <div className="bg-white rounded-lg shadow-md p-4 pb-1.5 flex flex-col cursor-pointer hover:shadow-lg transition w-full max-w-[240px] mx-auto">
      {resolvedCover ? (
        <img
          src={resolvedCover}
          alt={resolvedTitle}
          className="rounded-md mb-4 w-full aspect-[2/3] object-cover"
          loading="lazy"
        />
      ) : (
        <div className="rounded-md mb-4 w-full aspect-[2/3] bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Sin imagen
        </div>
      )}

      <h4 className="text-lg font-semibold mb-1 line-clamp-3 leading-tight h-[4rem]">
        {resolvedTitle}
      </h4>

      <p className="text-gray-600 text-sm mb-1 line-clamp-3 h-[3.75rem]">
        {description?.trim() ? description : fallbackDescription}
      </p>

      <p className="text-gray-500 text-xs line-clamp-1 h-[0.2rem]">
        {metaLine || "\u00A0"}
      </p>

      
    </div>
  );
}
