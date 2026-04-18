import ContentCard from "@/components/content-card";

type CardProps = {
  id?: number | string;
  titulo?: string;
  title?: string;
  tipo?: string;
  category?: string;
  portada?: string;
  imgSrc?: string;
  image?: string;
  rating?: number;
  generos?: string | string[];
  anio_lanzamiento?: number;
  description?: string;

  director?: string;
  duracion_min?: number;
  estudio?: string;
  plataforma?: string;
  plataformas?: string | string[];
  autor?: string;
  editorial?: string;
  paginas?: number;
  precio?: number;
  desarrollador?: string;
  duracion?: number;
  consolas?: string | string[];
};

function inferType(props: CardProps): string | undefined {
  if (props.tipo) return props.tipo;
  if (props.category) return props.category;
  if (props.autor || props.editorial || props.paginas != null) return "libro";
  if (props.desarrollador || props.consolas || props.duracion != null) return "videojuego";
  if (props.director || props.estudio || props.duracion_min != null) return "pelicula";
  if (props.plataformas) return "serie";
  return undefined;
}

export default function Card(props: CardProps) {
  const title = props.titulo ?? props.title ?? "Sin título";
  const image = props.portada ?? props.imgSrc ?? props.image ?? "";
  const type = inferType(props);

  return (
    <ContentCard
      title={title}
      image={image}
      type={type}
      score={props.rating}
      className="w-full"
    />
  );
}
