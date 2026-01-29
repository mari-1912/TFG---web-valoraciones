import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import SectionList  from "@/components/sections/section-list";


type Item = {
  id: string;
  imgSrc: string;
  title: string;
  description: string;
  rating: number;
};


type Lista = {
  id: string;
  name: string;
  description: string;
  items: string[];
};


export default function ListDetail() {
  const { id } = useParams<{ id: string }>();
  const [list, setList] = useState<Lista | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const load = async () => {
      setLoading(true);


      // Mock de detalle
      const mockLists: Lista[] = [
        {
          id: "1",
          name: "Películas por ver",
          description: "Lista de películas que recomendamos ver",
          items: ["peliculas-1", "peliculas-2", "peliculas-3"],
        },
        {
          id: "2",
          name: "Películas vistas",
          description: "Películas que ya hemos visto",
          items: ["peliculas-4", "peliculas-5"],
        },
        {
          id: "3",
          name: "Mi lista de series",
          description: "Series que quiero ver",
          items: ["series-1", "series-2"],
        },
      ];


      // Simulación de fetch
      await new Promise((r) => setTimeout(r, 300));
      const found = mockLists.find((l) => l.id === id);
      setList(found ?? null);
      setLoading(false);
    };


    load();
  }, [id]);


  if (loading) return <p>Cargando lista...</p>;
  if (!list) return <p>Lista no encontrada</p>;


  // Convertimos cada item en formato SectionList
  const items: Item[] = list.items.map((i, idx) => ({
    id: i,
    imgSrc: "/placeholder.png",
    title: i,
    description: "",
    rating: Math.floor(Math.random() * 5),
  }));


  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <h1 className="text-3xl font-bold text-indigo-700 mb-4">{list.name}</h1>
      <p className="mb-8 text-gray-700">{list.description}</p>


      <SectionList title="Items" items={items} />
    </main>
  );
}


