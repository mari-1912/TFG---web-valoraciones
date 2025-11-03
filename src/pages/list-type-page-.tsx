import { useParams } from "react-router-dom";
import { Header } from "../components/sections/header";
import Footer from "../components/sections/footer";

const listasMock = {
  peliculas: {
    genericas: [
      {
        id: "g1",
        name: "Top Pelis Sci-Fi",
        description: "...",
        items: ["Matrix", "Inception"],
      },
    ],
    personales: [
      {
        id: "m1",
        name: "Mis Pelis 90s",
        description: "...",
        items: ["Jurassic", "Toy Story"],
      },
    ],
  },
  series: {
    genericas: [
      {
        id: "g2",
        name: "Series Recomendadas",
        description: "...",
        items: ["Lost", "Friends"],
      },
    ],
    personales: [
      {
        id: "m2",
        name: "Mis Series Favoritas",
        description: "...",
        items: ["Dark", "Stranger Things"],
      },
    ],
  },
  // Más categorías...
};

export default function ListTypePage() {
  const { categoria } = useParams();
  const listas = (categoria &&
    listasMock[categoria as keyof typeof listasMock]) || {
    genericas: [],
    personales: [],
  };

  return (
    <>
      <header className="mb-8 w-full max-w-7xl mx-auto flex justify-between items-center border-b border-gray-300 py-4 px-6">
        <Header />
        {/* Para móviles, puedes agregar un botón hamburguesa (icono) para el menú */}
      </header>{" "}
      <main className="min-h-screen bg-gray-50 px-6 py-12 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-indigo-700 mb-8 text-center">
          Listas de {categoria?.replace(/-/g, " ")}
        </h2>
        
        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-4">Listas genéricas</h3>
          {listas.genericas.length === 0 && (
            <p>No hay listas genéricas para esta categoría.</p>
          )}
          {/* Aquí renderiza las listas genéricas como cards o lo que prefieras */}
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4">Mis listas</h3>
          {listas.personales.length === 0 && (
            <p>No tienes listas personales en esta categoría.</p>
          )}
          {/* Aquí renderiza las listas personales */}
        </section>
      </main>
      <Footer />
    </>
  );
}
