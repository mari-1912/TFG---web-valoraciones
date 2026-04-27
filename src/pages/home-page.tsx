import LoginForm from "../components/login-form";
import RegisterForm from "../components/register-form";
import Footer from "../components/sections/footer";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchFeaturedRandom,
  type FeaturedRandomResponse,
} from "../services/fetch-featured-random";
import FeaturedCard from "@/components/featured-card";
import {
  fetchMostViewedWeek,
  type MostViewedWeekResponse,
} from "../services/fetch-most-viewed-week";
import MostViewedCard from "@/components/most-viewed-card";
import LogoPng from "@/assets/LOGO.png";
import { Skeleton } from "@/components/ui/skeleton";
import { buildDetailPath } from "@/lib/detail-route";

export default function HomePage() {
  const navigate = useNavigate();
  const [activeForm, setActiveForm] = useState<"login" | "register" | null>(null);

  const [featured, setFeatured] = useState<FeaturedRandomResponse | null>(null);
  const [featuredError, setFeaturedError] = useState<string | null>(null);
  const [featuredLoading, setFeaturedLoading] = useState(false);

  const [mostViewed, setMostViewed] = useState<MostViewedWeekResponse | null>(null);
  const [mostViewedLoading, setMostViewedLoading] = useState(false);
  const [mostViewedError, setMostViewedError] = useState<string | null>(null);
  function CardSkeleton() {
    return (
      <div className="space-y-2 rounded-xl border border-violet-100 bg-white p-3">
        {/* Imagen */}
        <Skeleton className="aspect-[2/3] w-full rounded-lg" />
  
        {/* Título */}
        <Skeleton className="h-4 w-3/4" />
  
        {/* Subtexto */}
        <Skeleton className="h-3 w-1/2" />
      </div>
    );
  }
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setFeaturedLoading(true);
        setFeaturedError(null);
        const data = await fetchFeaturedRandom();
        if (!cancelled) setFeatured(data);
      } catch (e) {
        if (!cancelled) {
          setFeaturedError(e instanceof Error ? e.message : "Error desconocido");
        }
      } finally {
        if (!cancelled) setFeaturedLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMostViewed() {
      try {
        setMostViewedLoading(true);
        setMostViewedError(null);
        const data = await fetchMostViewedWeek();
        if (!cancelled) setMostViewed(data);
      } catch (e) {
        if (!cancelled) {
          setMostViewedError(e instanceof Error ? e.message : "Error desconocido");
        }
      } finally {
        if (!cancelled) setMostViewedLoading(false);
      }
    }

    loadMostViewed();
    return () => {
      cancelled = true;
    };
  }, []);

  const getType = (label: string) => {
    if (label === "Película") return "pelicula";
    if (label === "Serie") return "serie";
    if (label === "Libro") return "libro";
    if (label === "Videojuego") return "videojuego";
    return "pelicula";
  };

  const openItem = (label: string, item: any) => {
    if (!item) return;

    const type = getType(label);
    const id = item.id ?? item.contenidoId ?? item.contenido_id;
    const title = item.titulo ?? item.title ?? item.nombre ?? "detalle";

    if (id == null) return;

    navigate(buildDetailPath(type, id, title), {
      state: {
        item: {
          ...item,
          tipo: type,
        },
      },
    });
  };

  return (
    <main className="min-h-screen bg-white">
      {activeForm === "login" && (
        <LoginForm onClose={() => setActiveForm(null)} />
      )}
      {activeForm === "register" && (
        <RegisterForm onClose={() => setActiveForm(null)} />
      )}

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-6">
        <section className="flex justify-center">
          <div className="flex w-full max-w-3xl flex-col justify-center rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-gray-900">
              <span>Bienvenido a </span>
              <span className="inline-flex items-center align-middle font-extrabold">
                <img src={LogoPng} alt="Logo" className="w-30 object-contain" />
              </span>
              <span>!</span>
            </h1>

            <p className="mt-3 leading-relaxed text-gray-600">
              Añade, descubre y valora películas, series, libros y más. Comparte
              tus opiniones con la comunidad y encuentra recomendaciones.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/categorías")}
                className="rounded-md bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800"
              >
                Descubrir
              </button>
              <button
                type="button"
                onClick={() => navigate("/sobre-nosotros")}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Saber más
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-center text-xl font-extrabold text-[#e000ff]">
            ¡Nuestros destacados!
          </h2>

          {featuredLoading && (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
)}
          {featuredError && (
            <p className="text-center text-sm text-red-600">{featuredError}</p>
          )}

          {!featuredLoading && !featuredError && featured && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: "Película", item: featured.pelicula },
                { label: "Serie", item: featured.serie },
                { label: "Libro", item: featured.libro },
                { label: "Videojuego", item: featured.videojuego },
              ].map(({ label, item }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => openItem(label, item)}
                  className="text-left transition hover:-translate-y-1"
                >
                  <FeaturedCard label={label} item={item ?? null} />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-center text-xl font-extrabold text-[#e000ff]">
            ¡Lo más visto de la semana!
          </h2>

          {featuredLoading && (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
)}
          {mostViewedError && (
            <p className="text-center text-sm text-red-600">{mostViewedError}</p>
          )}

          {!mostViewedLoading && !mostViewedError && mostViewed && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: "Película", item: mostViewed.pelicula },
                { label: "Serie", item: mostViewed.serie },
                { label: "Libro", item: mostViewed.libro },
                { label: "Videojuego", item: mostViewed.videojuego },
              ].map(({ label, item }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => openItem(label, item)}
                  className="text-left transition hover:-translate-y-1"
                >
                  <MostViewedCard label={label} item={item ?? null} />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border-t border-gray-100 bg-white py-8 md:py-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            <div className="space-y-2 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
                <span className="text-lg text-violet-700">⭐</span>
              </div>
              <h3 className="font-medium text-gray-900">
                Lleva un registro de lo que te gusta
              </h3>
              <p className="text-sm leading-snug text-gray-600">
                Crea tu propia lista personalizada de películas, libros y juegos
                favoritos.
              </p>
            </div>

            <div className="space-y-2 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
                <span className="text-lg text-violet-700">🔍</span>
              </div>
              <h3 className="font-medium text-gray-900">
                Guarda y reseña tus experiencias
              </h3>
              <p className="text-sm leading-snug text-gray-600">
                Añade reseñas y valoraciones para recordar lo que más disfrutaste.
              </p>
            </div>

            <div className="space-y-2 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
                <span className="text-lg text-violet-700">👥</span>
              </div>
              <h3 className="font-medium text-gray-900">
                Dile a tus amigos cuáles valen la pena
              </h3>
              <p className="text-sm leading-snug text-gray-600">
                Comparte tus opiniones y descubre nuevas recomendaciones de la
                comunidad.
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="mt-10">
        <Footer />
      </footer>
    </main>
  );
}