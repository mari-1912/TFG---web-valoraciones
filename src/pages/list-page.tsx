import { useParams } from "react-router-dom";
import lists from "../data/lists.json";
import { Header } from "../components/sections/header";
import Footer from "../components/sections/footer";

interface Lista {
  id: string;
  name: string;
  description: string;
  items: string[];
  creator: string;
}

interface ListCategoriesPage {
  [key: string]: {
    categorias: {
      genericas: Lista[];
      personales: Lista[];
    };
  };
}

export default function ListasPorCategoria() {
  const { categoria } = useParams();
  const listas = (categoria &&
    (lists as ListCategoriesPage)[categoria]?.categorias) || {
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
        <h2 className="text-3xl font-bold text-indigo-700 mb-10 text-center capitalize">
          Listas de {categoria?.replace(/-/g, " ")}
        </h2>

        {/* Sección de listas genéricas */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800">
            Listas genéricas
          </h3>

          {listas.genericas.length === 0 ? (
            <p className="text-gray-600">
              No hay listas genéricas para esta categoría.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {listas.genericas.map((lista) => (
                <article
                  key={lista.id}
                  className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <h4 className="text-lg font-bold text-indigo-600 mb-2">
                    {lista.name}
                  </h4>
                  <p className="text-gray-700 mb-3">{lista.description}</p>
                  <ul className="list-disc list-inside text-gray-600">
                    {lista.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Sección de listas personales */}
        <section>
          <h3 className="text-2xl font-semibold mb-6 text-gray-800">
            Mis listas
          </h3>

          {listas.personales.length === 0 ? (
            <p className="text-gray-600">
              No tienes listas personales en esta categoría.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {listas.personales.map((lista) => (
                <article
                  key={lista.id}
                  className="bg-indigo-50 rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <h4 className="text-lg font-bold text-indigo-700 mb-2">
                    {lista.name}
                  </h4>
                  <p className="text-gray-700 mb-3">{lista.description}</p>
                  <ul className="list-disc list-inside text-gray-600">
                    {lista.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                  <p className="text-sm text-gray-500 mt-2">
                    Creada por:{" "}
                    <span className="font-medium">{lista.creator}</span>
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
