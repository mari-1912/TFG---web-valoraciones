import ContentCard from "@/components/content-card";
import { buildDetailPath } from "@/lib/detail-route";

type FeaturedCardProps = {
  label: string;
  item: {
    id?: number | string;
    titulo?: string;
    portada?: string;
    sinopsis?: string;
    tipo?: string;
  } | null;
};

function normalizeType(value?: string) {
  if (!value) return undefined;
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized === "pelicula") return "pelicula";
  if (normalized === "serie") return "serie";
  if (normalized === "libro") return "libro";
  if (normalized === "videojuego") return "videojuego";
  return undefined;
}

function resolveType(label: string, itemType?: string) {
  return normalizeType(itemType) ?? normalizeType(label);
}

export default function FeaturedCard({ label, item }: FeaturedCardProps) {
  // Si viene null/undefined, no crashees
  if (!item) {
    return (
      <article className="w-full max-w-[240px] rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
        No se ha recibido contenido para {label.toLowerCase()}.
      </article>
    );
  }

  const portadaStr = typeof item.portada === "string" ? item.portada : "";
  const resolvedType = resolveType(label, item.tipo);
  const detailPath =
    resolvedType && item.id != null
      ? buildDetailPath(resolvedType, item.id, item.titulo)
      : undefined;

  return (
    <ContentCard
      title={item.titulo || "Sin título"}
      image={portadaStr}
      type={resolvedType}
      to={detailPath}
      state={resolvedType ? { item: { ...item, tipo: resolvedType } } : undefined}
      className="mx-auto w-full max-w-[240px]"
    />
  );
}
