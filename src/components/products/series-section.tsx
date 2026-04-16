// src/components/sections/series-section.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Tv } from "lucide-react";

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

type SectionSeriesProps = {
  compact?: boolean;
  hideHeading?: boolean;
};

export default function SectionSeries({
  compact = false,
  hideHeading = false,
}: SectionSeriesProps) {
  const itemsPerPage = 4;
  const [startIndex, setStartIndex] = useState(0);
  const [seriesList, setSeriesList] = useState<SerieBackend[]>([]);
  const [loading, setLoading] = useState(true);
  const compactScrollerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const sectionClass = compact ? "my-0 max-w-none" : "my-8 max-w-5xl mx-auto";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchSeries("", 20);
        console.log("SERIES BACKEND (raw):", data);
        const items = Array.isArray(data)
          ? data
          : data?.items ??
            data?.data ??
            data?.results ??
            data?.series ??
            data?.data?.items ??
            data?.data?.results ??
            data?.data?.series;
        const normalized = Array.isArray(items)
          ? items
              .map((serie: any) => ({
                id: serie?.id ?? serie?._id,
                titulo: serie?.titulo ?? serie?.title ?? serie?.nombre,
                generos:
                  serie?.generos ??
                  serie?.genero ??
                  serie?.genres ??
                  serie?.categoria ??
                  "",
                anio_lanzamiento:
                  serie?.anio_lanzamiento ??
                  serie?.anioLanzamiento ??
                  serie?.year ??
                  serie?.anio ??
                  0,
                portada:
                  serie?.portada ??
                  serie?.poster ??
                  serie?.image ??
                  serie?.imagen ??
                  serie?.cover ??
                  "",
                plataformas:
                  serie?.plataformas ??
                  serie?.plataforma ??
                  serie?.platforms ??
                  serie?.platform ??
                  "",
              }))
              .filter((serie) => serie.id != null)
          : [];
        setSeriesList(normalized);
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

  const handleCompactScroll = (direction: "prev" | "next") => {
    const scroller = compactScrollerRef.current;
    if (!scroller) return;
    const amount = Math.max(180, Math.floor(scroller.clientWidth * 0.8));
    scroller.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  };

  return (
    <section className={sectionClass}>
      {!hideHeading ? (
        <h3 className="text-3xl font-extrabold mb-6 bg-linear-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
          <Tv className="text-purple-500" size={28} />
          Series
        </h3>
      ) : null}

      {loading ? (
        <p className="text-sm text-gray-500">Cargando series…</p>
      ) : totalItems === 0 ? (
        <p className="text-sm text-gray-500">
          No se han recibido series del backend (mira la consola: "SERIES BACKEND").
        </p>
      ) : null}

      {compact ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => handleCompactScroll("prev")}
            aria-label="Anterior"
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--color-primary))]/60 text-white shadow ring-1 ring-white/40 transition hover:bg-[hsl(var(--color-primary))]/70 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Anterior</span>
          </button>
          <div
            ref={compactScrollerRef}
            className="-mx-1 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex w-max gap-4 px-1">
              {seriesList.map((s) => (
                <div
                  key={s.id}
                  onClick={() => navigate(`/detail/serie/${s.id}`)}
                  className="w-[170px] shrink-0 cursor-pointer transition hover:scale-[1.02] sm:w-[210px]"
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
          </div>
          <button
            type="button"
            onClick={() => handleCompactScroll("next")}
            aria-label="Siguiente"
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--color-primary))]/60 text-white shadow ring-1 ring-white/40 transition hover:bg-[hsl(var(--color-primary))]/70 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Siguiente</span>
          </button>
        </div>
      ) : (
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
      )}
    </section>
  );
}
