import { useEffect, useRef, useState } from "react";
import Card from "../Card";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Gamepad2 } from "lucide-react";
import { fetchVideoGames } from "../../services/fetchVideogames";
import { buildDetailPath } from "@/lib/detail-route";

type SectionVideoGamesProps = {
  compact?: boolean;
  hideHeading?: boolean;
};

export default function SectionVideoGames({
  compact = false,
  hideHeading = false,
}: SectionVideoGamesProps) {
  const itemsPerPage = 4;
  const [startIndex, setStartIndex] = useState(0);
  const compactScrollerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const [games, setGames] = useState<any[]>([]);
  const sectionClass = compact ? "my-0 max-w-none" : "my-8 max-w-5xl mx-auto";

  useEffect(() => {
    const loadVideoGames = async () => {
      try {
        const data = await fetchVideoGames("", 20);
        const items = Array.isArray(data) ? data : data?.items;
        setGames(Array.isArray(items) ? items : []);
      } catch (error) {
        console.error("Error loading videogames", error);
        setGames([]);
      }
    };

    loadVideoGames();
  }, []);

  const totalItems = games.length;

  const visibleItems =
    totalItems > 0
      ? games.slice(startIndex, startIndex + itemsPerPage)
      : [];

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(prev - itemsPerPage, 0));
  };

  const handleNext = () => {
    setStartIndex((prev) =>
      Math.min(prev + itemsPerPage, Math.max(totalItems - itemsPerPage, 0))
    );
  };

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
          <Gamepad2 className="text-purple-500" size={28} />
          Videojuegos
        </h3>
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
              {games.map((m) => (
                <div
                  key={m.id}
                  onClick={() =>
                    navigate(buildDetailPath("videojuego", m.id, m.titulo), {
                      state: { item: { ...m, tipo: "videojuego" } },
                    })
                  }
                  className="w-[170px] shrink-0 cursor-pointer transition hover:scale-[1.02] sm:w-[210px]"
                >
                  <Card
                    id={m.id}
                    titulo={m.titulo}
                    generos={m.generos}
                    anio_lanzamiento={m.anioLanzamiento}
                    portada={m.portada}
                    desarrollador={m.desarrollador}
                    duracion={m.duracion}
                    consolas={m.consolas}
                    plataforma={m.plataforma}
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
            className={`absolute left-0 top-1/2 -translate-y-1/2 bg-indigo-600 text-white rounded-full p-2 shadow ${
              startIndex === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            &#8592;
          </button>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 overflow-hidden mx-12">
            {visibleItems.map((m) => (
              <div
                key={m.id}
                onClick={() =>
                  navigate(buildDetailPath("videojuego", m.id, m.titulo), {
                    state: { item: { ...m, tipo: "videojuego" } },
                  })
                }
                className="cursor-pointer hover:scale-105 transform transition"
              >
                <Card
                  id={m.id}
                  titulo={m.titulo}
                  generos={m.generos}
                  anio_lanzamiento={m.anioLanzamiento}
                  portada={m.portada}
                  desarrollador={m.desarrollador}
                  duracion={m.duracion}
                  consolas={m.consolas}
                  plataforma={m.plataforma}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={startIndex + itemsPerPage >= totalItems}
            aria-label="Siguiente"
            className={`absolute right-0 top-1/2 -translate-y-1/2 bg-indigo-600 text-white rounded-full p-2 shadow ${
              startIndex + itemsPerPage >= totalItems
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            &#8594;
          </button>
        </div>
      )}
    </section>
  );
}
