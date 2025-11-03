import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Header } from "../components/sections/header";
import Footer from "../components/sections/footer";
import { getCommunityFeed } from "../services/apiCommunity";
import FeaturedReviews from "../components/featured-reiews";

interface Post {
  id: string;
  user: string;
  contentType: string;
  title: string;
  rating: number;
  comment: string;
}

export default function IndexPage() {
  const navigate = useNavigate();
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    // carga simulada de actividad reciente
    getCommunityFeed().then((data) => {
      setRecentPosts((data as Post[]).slice(0, 3)); // solo las 3 más recientes
    });
  }, []);

  const userRole = localStorage.getItem("userRole") || "usuario";

  return (
    <>
      <header className="mb-8 w-full max-w-7xl mx-auto flex justify-between items-center border-b border-gray-300 py-4 px-6">
        <Header />
        {/* Para móviles, puedes agregar un botón hamburguesa (icono) para el menú */}
      </header>{" "}
      <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white px-6 py-12 flex flex-col items-center">
        <section className="text-center max-w-3xl mb-12">
          <h1 className="text-5xl font-extrabold text-indigo-700 mb-4">
            Bienvenido a ValorApp 🎬
          </h1>
          <p className="text-gray-700 text-lg">
            Estás dentro como <strong>{userRole}</strong>. Aquí podrás
            descubrir, valorar y compartir tus experiencias favoritas.
          </p>
        </section>

        {/* Sección de accesos */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16 w-full max-w-5xl">
          <button
            onClick={() => navigate("/servicios")}
            className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-6 text-center border-t-4 border-indigo-500"
          >
            <h3 className="text-xl font-semibold text-indigo-600 mb-2">
              Servicios
            </h3>
            <p className="text-gray-600 text-sm">
              Valora películas, series, libros, videojuegos y más.
            </p>
          </button>

          <button
            onClick={() => navigate("/listas")}
            className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-6 text-center border-t-4 border-teal-500"
          >
            <h3 className="text-xl font-semibold text-teal-600 mb-2">Listas</h3>
            <p className="text-gray-600 text-sm">
              Crea tus listas personales o explora las de la comunidad.
            </p>
          </button>

          <button
            onClick={() => navigate("/comunidad")}
            className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-6 text-center border-t-4 border-pink-500"
          >
            <h3 className="text-xl font-semibold text-pink-600 mb-2">
              Comunidad
            </h3>
            <p className="text-gray-600 text-sm">
              Descubre lo que otros usuarios están valorando y comentando.
            </p>
          </button>
        </section>

        <section>
          <FeaturedReviews />
        </section>
        {/* Sección de actividad reciente */}
        <section className="w-full max-w-3xl mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Últimas valoraciones de la comunidad 💬
          </h2>
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white p-5 rounded-xl shadow hover:shadow-md transition"
              >
                <p className="text-gray-700">
                  <strong>{post.user}</strong> valoró{" "}
                  <span className="font-medium text-indigo-600">
                    {post.title}
                  </span>{" "}
                  ({post.contentType}) con{" "}
                  <span className="text-yellow-500">
                    {"⭐".repeat(post.rating)}
                  </span>
                </p>
                <p className="text-gray-600 italic mt-1">“{post.comment}”</p>
              </article>
            ))}
          </div>
        </section>

        <button
          onClick={() => {
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("userRole");
            navigate("/login");
          }}
          className="mt-auto bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 transition"
        >
          Cerrar sesión
        </button>
      </main>
      <Footer />
    </>
  );
}
