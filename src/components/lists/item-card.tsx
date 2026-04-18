import ContentCard from "@/components/content-card";

export type CatalogItem = {
  id: string;
  title: string;
  imgSrc?: string;
  rating?: number;
  type?: string;
};

export function ItemCard({
  item,
  onClick,
}: {
  item: CatalogItem;
  onClick?: () => void;
}) {
  return (
    <ContentCard
      title={item.title}
      image={item.imgSrc}
      type={item.type}
      score={item.rating}
      onClick={onClick}
      className="rounded-none border border-gray-300 shadow-none hover:shadow-[0_14px_36px_rgba(80,15,120,0.20)]"
    />
  );
}
