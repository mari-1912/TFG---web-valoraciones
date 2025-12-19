import { NavLink } from "react-router-dom";

export type ListCategoryKey = "peliculas" | "series" | "videojuegos" | "libros";

const CATEGORIES: Array<{ key: ListCategoryKey; label: string }> = [
  { key: "peliculas", label: "Películas" },
  { key: "series", label: "Series" },
  { key: "videojuegos", label: "Videojuegos" },
  { key: "libros", label: "Libros" },
];

export function CategoryTabs({ current }: { current?: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      {CATEGORIES.map((c) => (
        <NavLink
          key={c.key}
          to={`/listas/${c.key}`}
          className={({ isActive }) =>
            [
              "px-6 py-2 border border-gray-400 rounded-md text-sm",
              "hover:bg-gray-50 transition",
              isActive || current === c.key ? "bg-gray-100" : "bg-white",
            ].join(" ")
          }
        >
          {c.label}
        </NavLink>
      ))}
    </div>
  );
}
