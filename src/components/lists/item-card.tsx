import { useState } from "react";

export type CatalogItem = {
  id: string;
  title: string;
  imgSrc?: string;
  rating?: number;
};

export function ItemCard({
  item,
  onClick,
}: {
  item: CatalogItem;
  onClick?: () => void;
}) {
  const [imgOk, setImgOk] = useState(true);

  return (
    <article
      onClick={onClick}
      className="border border-gray-300 bg-white cursor-pointer hover:bg-gray-50 transition"
    >
      <div className="p-4">
        {item.imgSrc && imgOk ? (
          <img
            src={item.imgSrc}
            alt={item.title}
            className="h-28 w-full object-cover bg-gray-200"
            onError={() => setImgOk(false)}
            loading="lazy"
          />
        ) : (
          <div className="h-28 bg-gray-200" />
        )}
      </div>

      <div className="px-4 pb-4">
        <p className="text-sm text-gray-900">{item.title}</p>
      </div>
    </article>
  );
}
