import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "@/layouts/layout";
import { fetchMovies } from "@/services/fetchMovies";
import { fetchSeries } from "@/services/fetchSeries";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "https://tfg-web-valoraciones-back-i9b5.onrender.com";

// Tipos para la respuesta del backend
type ContentItem = {
  portada?: string | null;
  [key: string]: unknown;
};

type ContentListResponse = {
  items?: ContentItem[];
} | ContentItem[];

type FetchOptions = {
  pageSize: number;
  order: string;
  desc: boolean;
};

// Normaliza la URL de portada: si ya es absoluta la deja, si no prefija el backend
function resolvePortada(portada: string | null | undefined): string | null {
  if (!portada) return null;
  if (portada.startsWith("http")) return portada;
  return `${API_URL}${portada.startsWith("/") ? "" : "/"}${portada}`;
}

// ──────────────────────────────────────────────
// Hook: carga las portadas desde el backend
// ──────────────────────────────────────────────
function useCarouselImages(
  fetchFn: (options: FetchOptions) => Promise<ContentListResponse>,
  count = 8
) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const stableFetch = useCallback(fetchFn, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await stableFetch({ pageSize: count, order: "rating", desc: true });
        if (cancelled) return;
        // El backend devuelve { items: [...] } o un array directamente
        const items: ContentItem[] = Array.isArray(data) ? data : (data as { items?: ContentItem[] })?.items ?? [];
        const urls = items
          .map((item) => resolvePortada(item?.portada))
          .filter((url): url is string => Boolean(url));
        setImages(urls.length > 0 ? urls : []);
      } catch {
        if (!cancelled) setImages([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [stableFetch, count]);

  return { images, loading };
}

// ──────────────────────────────────────────────
// Carrusel automático
// ──────────────────────────────────────────────
interface CarouselProps {
  images: string[];
  loading: boolean;
  intervalMs?: number;
}

function AutoCarousel({ images, loading, intervalMs = 2200 }: CarouselProps) {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reinicia índice si cambian las imágenes
  useEffect(() => {
    setCurrent(0);
    setPrev(null);
    setAnimating(false);
  }, [images]);

  useEffect(() => {
    if (images.length < 2) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => {
        const next = (c + 1) % images.length;
        setPrev(c);
        setAnimating(true);
        return next;
      });
    }, intervalMs);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [images, intervalMs]);

  useEffect(() => {
    if (!animating) return;
    const t = setTimeout(() => { setAnimating(false); setPrev(null); }, 480);
    return () => clearTimeout(t);
  }, [animating, current]);

  // Skeleton mientras carga
  if (loading) {
    return (
      <div
        className="w-full rounded-2xl overflow-hidden"
        style={{ height: 260, background: "hsl(270 40% 90%)" }}
      >
        <div
          className="w-full h-full"
          style={{
            background:
              "linear-gradient(90deg, hsl(270 40% 90%) 25%, hsl(270 40% 94%) 50%, hsl(270 40% 90%) 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.4s infinite linear",
          }}
        />
      </div>
    );
  }

  // Sin imágenes: fallback con gradiente
  if (images.length === 0) {
    return (
      <div
        className="w-full rounded-2xl overflow-hidden flex items-center justify-center"
        style={{
          height: 260,
          background: "linear-gradient(135deg, hsl(268 84% 62%) 0%, hsl(295 86% 65%) 100%)",
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
          Sin portadas disponibles
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: 260 }}>
      {/* Imagen anterior saliendo */}
      {prev !== null && animating && (
        <img
          key={`prev-${prev}`}
          src={images[prev]}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ animation: "slideOutLeft 0.48s ease forwards" }}
        />
      )}

      {/* Imagen actual entrando */}
      <img
        key={`curr-${current}`}
        src={images[current]}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ animation: animating ? "slideInRight 0.48s ease forwards" : "none" }}
      />

      {/* Puntos indicadores */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
        {images.map((_, i) => (
          <span
            key={i}
            className="block rounded-full transition-all duration-300"
            style={{
              width: i === current ? 18 : 7,
              height: 7,
              background:
                i === current ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
            }}
          />
        ))}
      </div>

      {/* Gradiente inferior */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent 55%, rgba(20,0,40,0.65) 100%)",
        }}
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// Tarjeta de sección
// ──────────────────────────────────────────────
interface SectionCardProps {
  to: string;
  label: string;
  subtitle: string;
  images: string[];
  loadingImages: boolean;
  accentColor: string;
  intervalMs?: number;
}

function SectionCard({
  to,
  label,
  subtitle,
  images,
  loadingImages,
  accentColor,
  intervalMs,
}: SectionCardProps) {
  return (
    <div
      className="flex flex-col rounded-3xl overflow-hidden"
      style={{
        width: 320,
        boxShadow: "0 24px 60px rgba(80, 15, 120, 0.28)",
        background: "hsl(270 40% 96%)",
        border: "1.5px solid hsl(270 30% 88%)",
      }}
    >
      <AutoCarousel images={images} loading={loadingImages} intervalMs={intervalMs} />

      <div className="px-5 py-5 flex flex-col items-center gap-3">
        <p
          className="text-sm font-medium text-center"
          style={{ color: "hsl(258 16% 40%)" }}
        >
          {subtitle}
        </p>

        <Link
          to={to}
          className="w-full text-center font-bold text-base py-3 px-6 rounded-2xl transition-all duration-200 active:scale-95"
          style={{
            background: accentColor,
            color: "#fff",
            letterSpacing: "0.02em",
            boxShadow: `0 8px 24px ${accentColor}55`,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.filter = "brightness(1.12)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.filter = "";
            (e.currentTarget as HTMLElement).style.transform = "";
          }}
        >
          {label}
        </Link>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Página principal
// ──────────────────────────────────────────────
export default function ListsHome() {
  const { images: movieImages, loading: loadingMovies } = useCarouselImages(fetchMovies);
  const { images: seriesImages, loading: loadingSeries } = useCarouselImages(fetchSeries);

  return (
    <PageLayout>
      <style>{`
        @keyframes slideOutLeft {
          from { transform: translateX(0); opacity: 1; }
          to   { transform: translateX(-100%); opacity: 0; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }
      `}</style>

      <main
        className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
        style={{ background: "hsl(264 100% 99%)" }}
      >
        {/* Cabecera */}
        <div
          className="text-center mb-12"
          style={{ animation: "fadeUp 0.6s ease both" }}
        >
          <h1
            className="text-4xl font-black tracking-tight"
            style={{ color: "hsl(268 84% 62%)" }}
          >
            Listas
          </h1>
        </div>

        {/* Cards */}
        <div
          className="flex flex-wrap justify-center gap-8"
          style={{ animation: "fadeUp 0.7s ease 0.1s both" }}
        >
          <SectionCard
            to="/listas/nuestras-listas"
            label="Nuestras listas"
            subtitle="Descubre las colecciones de Opinify"
            images={movieImages}
            loadingImages={loadingMovies}
            accentColor="hsl(268 84% 62%)"
            intervalMs={2000}
          />

          <SectionCard
            to="/listas/mis-listas"
            label="Mis listas"
            subtitle="Gestiona tus colecciones personales"
            images={seriesImages}
            loadingImages={loadingSeries}
            accentColor="hsl(295 86% 65%)"
            intervalMs={2400}
          />
        </div>
      </main>
    </PageLayout>
  );
}
