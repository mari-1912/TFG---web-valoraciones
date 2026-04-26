import LoginForm from "../components/login-form";
import RegisterForm from "../components/register-form";
import Footer from "../components/sections/footer";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { fetchFeaturedRandom, type FeaturedRandomResponse } from "../services/fetch-featured-random";
import FeaturedCard from "@/components/featured-card";
import { fetchMostViewedWeek, type MostViewedWeekResponse } from "../services/fetch-most-viewed-week";
import MostViewedCard from "@/components/most-viewed-card";
import LogoPng from "@/assets/LOGO.png";
import { Skeleton } from "@/components/ui/skeleton";

type HomeCarouselDirection = "left" | "right";

type HomeCarouselItem = {
  label: string;
  content: ReactNode;
};

function MovingHomeCarousel({
  items,
  direction,
}: {
  items: HomeCarouselItem[];
  direction: HomeCarouselDirection;
}) {
  const baseItems = [...items, ...items, ...items];
  const loopItems = [...baseItems, ...baseItems];

  return (
    <div className="home-marquee overflow-hidden py-2">
      <div
        className={[
          "home-marquee-track flex w-max gap-4",
          direction === "right"
            ? "home-marquee-track--right"
            : "home-marquee-track--left",
        ].join(" ")}
      >
        {loopItems.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="w-[min(68vw,240px)] shrink-0 sm:w-[220px] md:w-[240px]"
            aria-hidden={index >= baseItems.length ? "true" : undefined}
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
}

function MovingHomeCarouselSkeleton({
  direction,
  label,
}: {
  direction: HomeCarouselDirection;
  label: string;
}) {
  return (
    <div className="home-marquee overflow-hidden py-2" aria-label={label}>
      <div
        className={[
          "home-marquee-track flex w-max gap-4",
          direction === "right"
            ? "home-marquee-track--right"
            : "home-marquee-track--left",
        ].join(" ")}
      >
        {Array.from({ length: 24 }).map((_, index) => (
          <div
            key={`${label}-skeleton-${index}`}
            className="w-[min(68vw,240px)] shrink-0 space-y-3 rounded-xl border border-violet-100 bg-white p-3 sm:w-[220px] md:w-[240px]"
          >
            <Skeleton className="aspect-[2/3] w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [activeForm, setActiveForm] = useState<"login" | "register" | null>(null);

  const [featured, setFeatured] = useState<FeaturedRandomResponse | null>(null);
const [featuredError, setFeaturedError] = useState<string | null>(null);
const [featuredLoading, setFeaturedLoading] = useState(false);

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


const [mostViewed, setMostViewed] = useState<MostViewedWeekResponse | null>(null);
const [mostViewedLoading, setMostViewedLoading] = useState(false);
const [mostViewedError, setMostViewedError] = useState<string | null>(null);

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


  return (
    <main className="min-h-screen bg-white">
      {activeForm === "login" && (
        <LoginForm onClose={() => setActiveForm(null)} />
      )}
      {activeForm === "register" && (
        <RegisterForm onClose={() => setActiveForm(null)} />
      )}

      {/* CONTENIDO */}
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-10">
        {/* HERO (imagen izq + texto der) */}
        <section className="flex justify-center">
          {/* Imagen/portada */}
          {/* <div className="rounded-xl overflow-hidden shadow-sm bg-gray-200 min-h-[240px] lg:min-h-[320px]">
          <div className="rounded-xl overflow-hidden shadow-sm min-h-[240px] lg:min-h-[320px]">
            <img
              src={BackgroundImg}
              alt="Fondo Opinify"
              className="h-full w-full object-cover"
            />
          </div>
          </div> */}

          {/* Texto bienvenida */}
          <div className="flex w-full max-w-3xl flex-col justify-center rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-gray-900">
              <span>Bienvenido a </span>
              <span className="inline-flex items-center align-middle font-extrabold">
                <img
                  src={LogoPng}
                  alt="Logo"
                  className="w-30 object-contain"
                />
              </span>
              <span>!</span>
            </h1>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Añade, descubre y valora películas, series, libros y más. Comparte
              tus opiniones con la comunidad y encuentra recomendaciones.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => navigate("/categorías")}
                className="rounded-md bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800"
              >
                Descubrir
              </button>
              <button
                onClick={() => navigate("/sobre-nosotros")}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Saber más
              </button>
            </div>
          </div>
        </section>

        {/* FILA CATEGORÍAS (4 mini cards) */}
        <section className="space-y-4">
  <h2 className="text-center text-xl font-extrabold text-[#e000ff]">
    ¡Nuestros destacados!
  </h2>

  {featuredLoading && (
    <MovingHomeCarouselSkeleton
      direction="left"
      label="Cargando destacados"
    />
  )}

  {featuredError && (
    <p className="text-center text-sm text-red-600">{featuredError}</p>
  )}

  {!featuredLoading && !featuredError && featured && (
    <MovingHomeCarousel
      direction="left"
      items={[
        {
          label: "Película",
          content: <FeaturedCard label="Película" item={featured.pelicula ?? null} />,
        },
        {
          label: "Serie",
          content: <FeaturedCard label="Serie" item={featured.serie ?? null} />,
        },
        {
          label: "Libro",
          content: <FeaturedCard label="Libro" item={featured.libro ?? null} />,
        },
        {
          label: "Videojuego",
          content: <FeaturedCard label="Videojuego" item={featured.videojuego ?? null} />,
        },
      ]}
    />
  )}
</section>

        {/* LO MÁS VISTO */}
        <section className="space-y-4">
        <h2 className="text-center text-xl font-extrabold text-[#e000ff]">
        ¡Lo más visto de la semana!
  </h2>

  {mostViewedLoading && (
    <MovingHomeCarouselSkeleton
      direction="right"
      label="Cargando lo más visto"
    />
  )}

  {mostViewedError && (
    <p className="text-center text-sm text-red-600">{mostViewedError}</p>
  )}

  {!mostViewedLoading && !mostViewedError && mostViewed && (
    <MovingHomeCarousel
      direction="right"
      items={[
        {
          label: "Película",
          content: <MostViewedCard label="Película" item={mostViewed.pelicula ?? null} />,
        },
        {
          label: "Serie",
          content: <MostViewedCard label="Serie" item={mostViewed.serie ?? null} />,
        },
        {
          label: "Libro",
          content: <MostViewedCard label="Libro" item={mostViewed.libro ?? null} />,
        },
        {
          label: "Videojuego",
          content: <MostViewedCard label="Videojuego" item={mostViewed.videojuego ?? null} />,
        },
      ]}
    />
  )}
</section>


        {/* COMUNIDAD */}
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
                Añade reseñas y valoraciones para recordar lo que más
                disfrutaste.
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

      {/* FOOTER */}
      <footer className="mt-10">
        <Footer />
      </footer>
    </main>
  );
}
