import { useParams } from "react-router-dom";
import movies from "../data/movies.json";
import books from "../data/books.json";
import videoGames from "../data/video-games.json";
import series from "../data/series.json";
import Footer from "../components/sections/footer";
import { Header } from "../components/sections/header";
// Si tienes más tipos (series, música, etc.), los puedes importar igual:
// import series from "../data/series.json";
// import albums from "../data/albums.json";

export function DetailPage() {
  const { id, type } = useParams();

  // Según el tipo, elegimos de qué JSON cargar el producto
  let dataset: any[] = [];

  switch (type) {
    case "pelicula":
      dataset = movies;
      break;
    case "libro":
      dataset = books;
      break;
    case "videojuego":
      dataset = videoGames;
      break;
    case "serie":
      dataset = series;
      break;
    default:
      dataset = [];
  }

  const item = dataset.find((i) => i.id === id);

  if (!item) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-600">
        <p>No se encontró el elemento solicitado.</p>
      </main>
    );
  }

  return (
    <>
      <header className="mb-8 w-full max-w-7xl mx-auto flex justify-between items-center border-b border-gray-300 py-4 px-6">
        <Header />
      </header>
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-12">
        <div className="bg-white shadow-lg rounded-2xl p-8 max-w-3xl w-full text-center">
          <img
            src={item.imgSrc}
            alt={item.title}
            className="w-64 h-auto mx-auto mb-6 rounded-lg shadow"
          />
          <h1 className="text-3xl font-bold text-indigo-600 mb-4">
            {item.title}
          </h1>
          <p className="text-gray-700 mb-6">{item.description}</p>
          <p className="text-gray-500 mb-2 italic">
            {item.type === "libro" ? "Autor" : "Creador"}:{" "}
            {item.creator || "Desconocido"}
          </p>
          <p className="text-yellow-500 text-lg font-semibold mb-6">
            ⭐ Valoración media: {item.avgRating || item.rating || "N/A"}
          </p>

          {item.reviews && (
            <div className="text-left mt-8 border-t border-gray-200 pt-4">
              <h2 className="text-xl font-semibold mb-3 text-indigo-600">
                Reseñas destacadas
              </h2>
              <ul className="space-y-4">
                {item.reviews.map((review: any, index: number) => (
                  <li
                    key={index}
                    className="bg-gray-50 p-4 rounded-lg shadow-sm"
                  >
                    <p className="font-semibold">{review.user}</p>
                    <p className="text-yellow-500">⭐ {review.rating}</p>
                    <p className="text-gray-700 italic">"{review.comment}"</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
