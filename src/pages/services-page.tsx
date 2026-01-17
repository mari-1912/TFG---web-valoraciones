import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import SectionBooks from "../components/products/books-section";
import SectionVideoGames from "../components/products/video-games-section";
import SectionMovies from "../components/products/movies-section";
import SectionSeries from "../components/products/series-section";
import { Header } from "../components/sections/header";
import Footer from "../components/sections/footer";

import {
  ServicesFilters,
  type ServiceCategory,
  type SortKey,
  type DurationKey,
  type DateKey,
} from "../components/service-filters";

export default function ServicesList() {
  // -------------------------
  // Estado de filtros
  // -------------------------
  const [category, setCategory] = useState<ServiceCategory>("peliculas");
  const [sort, setSort] = useState<SortKey>("az");
  const [genre, setGenre] = useState<string>("");
  const [duration, setDuration] = useState<DurationKey>("all");
  const [date, setDate] = useState<DateKey>("all");
  const { pathname } = useLocation();
  const { categoria } = useParams<{ categoria?: ServiceCategory }>();

  useEffect(() => {
    if (categoria) {
      if (categoria === "peliculas") setCategory("peliculas");
      if (categoria === "series") setCategory("series");
      if (categoria === "libros") setCategory("libros");
      if (categoria === "videojuegos") setCategory("videojuegos");
      return;
    }
    if (pathname === "/peliculas") setCategory("peliculas");
    if (pathname === "/series") setCategory("series");
    if (pathname === "/libros") setCategory("libros");
    if (pathname === "/videojuegos") setCategory("videojuegos");
  }, [categoria, pathname]);

  // -------------------------
  // Géneros por categoría (mock)
  // Luego puedes sacarlos del backend o JSON
  // -------------------------
  const genres = useMemo(() => {
    switch (category) {
      case "peliculas":
        return ["Acción", "Drama", "Comedia", "Ciencia ficción"];
      case "series":
        return ["Drama", "Thriller", "Comedia"];
      case "videojuegos":
        return ["Aventura", "RPG", "Estrategia"];
      case "libros":
        return ["Fantasía", "Romance", "Historia"];
      default:
        return [];
    }
  }, [category]);

  // -------------------------
  // Render
  // -------------------------
  return (
    <>
      <Header />
      <main className="bg-white min-h-screen pt-38">
        <section className="flex flex-col gap-8">
          {/* Filtros */}
          <ServicesFilters
            category={category}
            onCategoryChange={setCategory}
            sort={sort}
            onSortChange={setSort}
            genre={genre}
            onGenreChange={setGenre}
            duration={duration}
            onDurationChange={setDuration}
            date={date}
            onDateChange={setDate}
            genres={genres}
          />

          {/* Contenido según categoría */}
          <div className="mx-auto w-full max-w-7xl px-6">
            {category === "peliculas" && <SectionMovies />}
            {category === "series" && <SectionSeries />}
            {category === "libros" && <SectionBooks />}
            {category === "videojuegos" && <SectionVideoGames />}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
