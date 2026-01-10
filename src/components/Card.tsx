type CardProps = {
  // ✅ comunes (contenidos)
  id: number | string;
  titulo: string;
  generos: string | string[];
  anio_lanzamiento: number;
  portada?: string;

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
    generos,
    anio_lanzamiento,
    portada,
    rating,
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
  const fallbackDescription = `${generosTxt}${generosTxt ? " • " : ""}${anio_lanzamiento}`;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col cursor-pointer hover:shadow-lg transition">
      {portada ? (
        <img
          src={portada}
          alt={titulo}
          className="rounded-md mb-4 object-cover h-48 w-full"
          loading="lazy"
        />
      ) : null}

      <h4 className="text-lg font-semibold mb-1">{titulo}</h4>

      <p className="text-gray-600 text-sm mb-2 line-clamp-3">
        {description?.trim() ? description : fallbackDescription}
      </p>

      {metaLine ? (
        <p className="text-gray-500 text-xs line-clamp-2">{metaLine}</p>
      ) : null}

      {typeof rating === "number" ? (
        <div className="mt-2 text-yellow-500">
          {Array(Math.round(rating))
            .fill(0)
            .map((_, i) => (
              <span key={i} aria-label="star">
                ⭐
              </span>
            ))}
        </div>
      ) : null}
    </div>
  );
}
