import { Link } from "react-router-dom";

const categorias = [
  "peliculas",
  "series",
  "libros",
  "videojuegos",
  "juegos-de-mesa",
  "discos",
];

export default function CategoriasListas() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <h1 className="text-3xl font-bold text-indigo-700 mb-8 text-center">
        Categorías de listas
      </h1>
      <div className="flex flex-wrap justify-center gap-6">
        {categorias.map((cat) => (
          <Link
            key={cat}
            to={`/listas/${cat}`}
            className="bg-white text-indigo-700 font-semibold px-6 py-4 rounded-lg shadow hover:bg-indigo-100 transition w-48 text-center"
          >
            Listas de {cat.replace(/-/g, " ")}
          </Link>
        ))}
      </div>
    </main>
  );
}
