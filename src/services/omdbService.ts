const API_KEY = import.meta.env.VITE_OMDB_KEY; // o process.env.REACT_APP_OMDB_KEY
const BASE_URL = "https://www.omdbapi.com/";
const BACKEND_BASE_URL = "https://tfg-web-valoraciones-back.onrender.com/";

export async function fetchMovies(search: string, signal?: AbortSignal) {
  const url = `${BASE_URL}?apikey=${API_KEY}&s=${encodeURIComponent(search)}&type=movie`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  const data = await res.json();
  if (data.Response === "False") throw new Error(data.Error || "Sin resultados");
  return data.Search;
}

export async function fetchMovieById(id: string, signal?: AbortSignal) {
  const url = `${BASE_URL}?apikey=${API_KEY}&i=${id}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  const data = await res.json();
  if (data.Response === "False") throw new Error(data.Error || "Película no encontrada");
  return data;
}

export async function fetchBackendMovies(signal?: AbortSignal) {
  const url = `${BACKEND_BASE_URL}peliculas/`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Error HTTP backend: ${res.status}`);
  const data = await res.json();
  console.log("Películas desde el backend:", data);
  return data;
}
