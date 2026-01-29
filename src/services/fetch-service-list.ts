// src/services/fetchAllServices.ts


import type { ServiceList } from "./services-list";
import { fetchMovies } from "./fetchMovies";
import { fetchSeries } from "./fetchSeries";
import { fetchBooks } from "./fetchBooks";
import { fetchVideoGames } from "./fetchVideogames";
import { normalizeMovie } from "./movies";
import { normalizeSerie } from "./series";
import { normalizeBook } from "./books";
import { normalizeGame } from "./video-games";

/** Función principal: devuelve todos los servicios normalizados */
export async function fetchAllServices(): Promise<ServiceList[]> {
  const [moviesData, seriesData, booksData, gamesData] = await Promise.all([
    fetchMovies("", 50),
    fetchSeries("", 50),
    fetchBooks("", 50),
    fetchVideoGames("", 50),
  ]);


  const normalizedServices: ServiceList[] = [
    ...(Array.isArray(moviesData) ? moviesData.map(normalizeMovie) : []),
    ...(Array.isArray(seriesData) ? seriesData.map(normalizeSerie) : []),
    ...(Array.isArray(booksData) ? booksData.map(normalizeBook) : []),
    ...(Array.isArray(gamesData) ? gamesData.map(normalizeGame) : []),
  ];


  return normalizedServices;
}

