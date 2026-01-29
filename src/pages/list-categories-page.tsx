import { useEffect, useState } from "react";
import { ListCard, type Lista } from "@/components/lists/list-card";
import PageLayout from "@/layouts/layout";


type ListsCategoryProps = {
  type: "nuestras" | "mis"; // tipo de listas
};


export default function ListsCategory({ type }: ListsCategoryProps) {
  const [lists, setLists] = useState<Lista[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const load = async () => {
      setLoading(true);


      // Simulación con mock
      const mockLists: Lista[] =
        type === "nuestras"
          ? [
              {
                id: "1",
                name: "Películas por ver",
                description: "Lista de películas que recomendamos ver",
                items: ["peliculas-1", "peliculas-2"],
              },
              {
                id: "2",
                name: "Películas vistas",
                description: "Películas que ya hemos visto",
                items: ["peliculas-3"],
              },
            ]
          : [
              {
                id: "3",
                name: "Mi lista de series",
                description: "Series que quiero ver",
                items: ["series-1"],
              },
            ];


      // Simulamos retraso de fetch
      await new Promise((r) => setTimeout(r, 300));
      setLists(mockLists);
      setLoading(false);
    };


    load();
  }, [type]);


  return (
    <PageLayout>
      <main className="min-h-screen bg-gray-50 px-6 py-12">
        <h1 className="text-3xl font-bold text-indigo-700 mb-8 text-center">
          {type === "nuestras" ? "Nuestras listas" : "Mis listas"}
        </h1>


        {loading ? (
          <p>Cargando listas...</p>
        ) : lists.length === 0 ? (
          <p>No hay listas disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((lista) => (
              <ListCard key={lista.id} lista={lista} />
            ))}
          </div>
        )}
      </main>
    </PageLayout>
  );
}


