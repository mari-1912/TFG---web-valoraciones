import LoginForm from "../components/login-form";
import RegisterForm from "../components/register-form";
import { Header } from "../components/sections/header";
import Footer from "../components/sections/footer";
import BackgroundImg from "@/img/bg-img.avif"
import { useEffect, useState } from "react";
import { fetchFeaturedRandom, type FeaturedRandomResponse, type FeaturedItem } from "../services/fetch-featured-random";
import FeaturedCard from "@/components/featured-card";
import { fetchMostViewedWeek, type MostViewedWeekResponse } from "../services/fetch-most-viewed-week";
import MostViewedCard from "@/components/most-viewed-card";


export default function HomePage() {
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
      {/* HEADER fijo para que no “empuje” el layout y no lo tape */}
      <header className="fixed top-0 left-0 w-full z-50 bg-violet-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Header />

          {/* Si tu Header NO incluye botones de auth, descomenta esto:
          <div className="flex gap-2">
            <button
              onClick={() => setActiveForm("login")}
              className="rounded-md bg-white/15 px-3 py-1.5 text-sm hover:bg-white/20"
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setActiveForm("register")}
              className="rounded-md bg-white px-3 py-1.5 text-sm text-violet-700 hover:bg-violet-50"
            >
              Registrarse
            </button>
          </div>
          */}
        </div>
      </header>

      {/* Spacer: evita que el contenido se meta debajo del header fijo */}
      <div className="h-[64px] md:h-[72px]" />

      {/* MODAL auth */}
      {activeForm && (
        <section className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl animate-fade-in">
            <button
              onClick={() => setActiveForm(null)}
              className="absolute right-3 top-2 text-2xl leading-none text-gray-500 hover:text-gray-800"
              aria-label="Cerrar"
            >
              ×
            </button>

            <div className="p-6">
              {activeForm === "login" && (
                <LoginForm onClose={() => setActiveForm(null)} />
              )}
              {activeForm === "register" && (
                <RegisterForm onClose={() => setActiveForm(null)} />
              )}
            </div>
          </div>
        </section>
      )}

      {/* CONTENIDO */}
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-10">
        {/* HERO (imagen izq + texto der) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Imagen/portada */}
          <div className="rounded-xl overflow-hidden shadow-sm bg-gray-200 min-h-[240px] lg:min-h-[320px]">
          <div className="rounded-xl overflow-hidden shadow-sm min-h-[240px] lg:min-h-[320px]">
            <img
              src={BackgroundImg}
              alt="Fondo Opinify"
              className="h-full w-full object-cover"
            />
          </div>
          </div>

          {/* Texto bienvenida */}
          <div className="rounded-xl bg-white shadow-sm border border-gray-200 p-6 flex flex-col justify-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Bienvenido a Opinify!
            </h1>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Añade, descubre y valora películas, series, libros y más. Comparte
              tus opiniones con la comunidad y encuentra recomendaciones.
            </p>

            <div className="mt-5 flex gap-3">
              <button className="rounded-md bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800">
                Descubrir
              </button>
              <button className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Saber más
              </button>
            </div>
          </div>
        </section>

        {/* FILA CATEGORÍAS (4 mini cards) */}
        <section className="space-y-4">
  <h2 className="text-center text-lg font-semibold text-gray-900">
    Destacados aleatorios
  </h2>

  {featuredLoading && (
    <p className="text-center text-sm text-gray-500">Cargando destacados…</p>
  )}

  {featuredError && (
    <p className="text-center text-sm text-red-600">{featuredError}</p>
  )}

  {!featuredLoading && !featuredError && featured && (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <FeaturedCard label="Película" item={featured?.pelicula ?? null} />
<FeaturedCard label="Serie" item={featured?.serie ?? null} />
<FeaturedCard label="Libro" item={featured?.libro ?? null} />
<FeaturedCard label="Videojuego" item={featured?.videojuego ?? null} />

    </div>
  )}
</section>

        {/* LO MÁS VISTO */}
        <section className="space-y-4">
  <h2 className="text-center text-lg font-semibold text-gray-900">
    ¡Lo más visto de la semana!
  </h2>

  {mostViewedLoading && (
    <p className="text-center text-sm text-gray-500">Cargando lo más visto…</p>
  )}

  {mostViewedError && (
    <p className="text-center text-sm text-red-600">{mostViewedError}</p>
  )}

  {!mostViewedLoading && !mostViewedError && mostViewed && (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MostViewedCard label="Película" item={mostViewed.pelicula ?? null} />
      <MostViewedCard label="Serie" item={mostViewed.serie ?? null} />
      <MostViewedCard label="Libro" item={mostViewed.libro ?? null} />
      <MostViewedCard label="Videojuego" item={mostViewed.videojuego ?? null} />
    </div>
  )}
</section>


        {/* COMUNIDAD */}
        <section className="bg-white py-12 border-t border-gray-100 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
                <span className="text-violet-700 text-xl">⭐</span>
              </div>
              <h3 className="font-medium text-gray-900">
                Lleva un registro de lo que te gusta
              </h3>
              <p className="text-sm text-gray-600">
                Crea tu propia lista personalizada de películas, libros y juegos
                favoritos.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
                <span className="text-violet-700 text-xl">🔍</span>
              </div>
              <h3 className="font-medium text-gray-900">
                Guarda y reseña tus experiencias
              </h3>
              <p className="text-sm text-gray-600">
                Añade reseñas y valoraciones para recordar lo que más
                disfrutaste.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
                <span className="text-violet-700 text-xl">👥</span>
              </div>
              <h3 className="font-medium text-gray-900">
                Dile a tus amigos cuáles valen la pena
              </h3>
              <p className="text-sm text-gray-600">
                Comparte tus opiniones y descubre nuevas recomendaciones de la
                comunidad.
              </p>
            </div>
          </div>
        </section>

        {/* RECOMENDACIONES */}
        <section className="space-y-6">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Échale un ojo a nuestras recomendaciones
            </h2>

            <p className="mt-2 text-sm text-gray-600 max-w-md">
              Sugerencias personalizadas y tendencias para que siempre encuentres
              algo nuevo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {["Título 1", "Título 2"].map((t) => (
              <div
                key={t}
                className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
              >
                <div className="h-40 bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">
                  IMAGEN
                </div>
                <div className="p-4 text-sm text-gray-700">{t}</div>
              </div>
            ))}
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
