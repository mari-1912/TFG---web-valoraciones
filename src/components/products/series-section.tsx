// src/components/sections/series-section.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tv } from "lucide-react";

import Card from "../Card";
import { fetchSeries } from "@/services/fetchSeries";

type SerieBackend = {
  id: number | string;
  titulo: string;
  generos: string | string[];
  anio_lanzamiento: number;
  portada?: string;
  plataformas?: string; // "Netflix;Amazon Prime Video"
};

function normalizePlataformas(value?: string): string | string[] | undefined {
  if (!value) return undefined;
  if (value.includes(";")) {
    return value.split(";").map((s) => s.trim()).filter(Boolean);
  }
  return value;
}

export default function SectionSeries() {
  const itemsPerPage = 4;
  const [startIndex, setStartIndex] = useState(0);
  const [seriesList, setSeriesList] = useState<SerieBackend[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchSeries();
        console.log("SERIES BACKEND (raw):", data);
        setSeriesList(Array.isArray(data) ? (data as SerieBackend[]) : []);
      } catch (err) {
        console.error("Error loading series:", err);
        setSeriesList([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const totalItems = seriesList.length;
  const visibleItems =
    totalItems > 0 ? seriesList.slice(startIndex, startIndex + itemsPerPage) : [];

  const handlePrev = () => setStartIndex((prev) => Math.max(prev - itemsPerPage, 0));
  const handleNext = () =>
    setStartIndex((prev) => Math.min(prev + itemsPerPage, Math.max(totalItems - itemsPerPage, 0)));

  return (
    <section className="my-8 max-w-5xl mx-auto">
      <h3 className="text-3xl font-extrabold mb-6 bg-linear-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
        <Tv className="text-purple-500" size={28} />
        Series
      </h3>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando series…</p>
      ) : totalItems === 0 ? (
        <p className="text-sm text-gray-500">
          No se han recibido series del backend (mira la consola: "SERIES BACKEND").
        </p>
      ) : null}

      <div className="relative">
        <button
          onClick={handlePrev}
          disabled={startIndex === 0}
          aria-label="Anterior"
          className={`absolute left-0 top-1/2 -translate-y-1/2 bg-indigo-600 text-white rounded-full p-2 shadow transition ${
            startIndex === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-700"
          }`}
        >
          &#8592;
        </button>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 overflow-hidden mx-12">
          {visibleItems.map((s) => (
            <div
              key={s.id}
              onClick={() => navigate(`/detail/serie/${s.id}`)}
              className="cursor-pointer hover:scale-105 transform transition"
            >
              <Card
                id={s.id}
                titulo={s.titulo}
                generos={s.generos}
                anio_lanzamiento={s.anio_lanzamiento}
                portada={s.portada}
                plataformas={normalizePlataformas(s.plataformas)}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={startIndex + itemsPerPage >= totalItems}
          aria-label="Siguiente"
          className={`absolute right-0 top-1/2 -translate-y-1/2 bg-indigo-600 text-white rounded-full p-2 shadow transition ${
            startIndex + itemsPerPage >= totalItems
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-indigo-700"
          }`}
        >
          &#8594;
        </button>
      </div>
    </section>
  );
}
