import { Popcorn, Tv, BookOpen, Gamepad2, Disc3, Dices } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "../components/sections/footer";
import { Header } from "../components/sections/header";

const categorias = [
  { name: "peliculas", icon: Popcorn },
  { name: "series", icon: Tv },
  { name: "libros", icon: BookOpen },
  { name: "videojuegos", icon: Gamepad2 },
  { name: "juegos-de-mesa", icon: Dices },
  { name: "discos", icon: Disc3 },
];

export default function ListCategoriesPage() {
  return (
    <>
      <header className="mb-8 w-full max-w-7xl mx-auto flex justify-between items-center border-b border-gray-300 py-4 px-6">
        <Header />
        {/* Para móviles, puedes agregar un botón hamburguesa (icono) para el menú */}
      </header>
      <main className="min-h-screen bg-gray-50 px-10 py-20">
        <h1 className="text-4xl font-extrabold text-indigo-700 mb-12 text-center tracking-wide">
          Categorías de listas
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 max-w-7xl mx-auto">
          {categorias.map(({ name, icon: Icon }) => (
            <Link
              key={name}
              to={`/listas/${name}`}
              className="bg-white text-indigo-700 font-semibold border-2 border-indigo-700 py-8 rounded-xl shadow-lg flex flex-col justify-center items-center text-center h-full
                 hover:bg-indigo-700 hover:text-white transition cursor-pointer select-none"
            >
              <Icon size={64} className="mb-4" />
              <span className="text-lg tracking-wide capitalize">
                Listas de {name.replace(/-/g, " ")}
              </span>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
