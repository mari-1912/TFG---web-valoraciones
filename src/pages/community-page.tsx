import { useEffect, useState } from "react";
import { getCommunityFeed } from "../services/apiCommunity";
import Footer from "../components/sections/footer";
import { Header } from "../components/sections/header";

interface Post {
  id: string;
  user: string;
  avatar: string;
  contentType: string;
  title: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export default function CommunityPage() {
  const [feed, setFeed] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCommunityFeed().then((data) => {
      setFeed(data as Post[]);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-600">
        Cargando comunidad...
      </main>
    );
  }

  return (
    <>
      <header className="mb-8 w-full max-w-7xl mx-auto flex justify-between items-center border-b border-gray-300 py-4 px-6">
        <Header />
        {/* Para móviles, puedes agregar un botón hamburguesa (icono) para el menú */}
      </header>
      <main className="min-h-screen bg-gray-50 px-6 py-12 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-indigo-700 mb-10 text-center">
          Comunidad
        </h2>

        <section className="space-y-6">
          {feed.map((post) => (
            <article
              key={post.id}
              className="bg-white shadow-md rounded-2xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={post.avatar}
                  alt={post.user}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h4 className="font-semibold text-indigo-700">{post.user}</h4>
                  <span className="text-gray-400 text-sm">
                    {new Date(post.timestamp).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <p className="text-gray-700 mb-2">
                Valoró <strong>{post.title}</strong> ({post.contentType}) con{" "}
                <span className="text-yellow-500">
                  {"⭐".repeat(post.rating)}
                </span>
              </p>

              <p className="text-gray-600 italic">“{post.comment}”</p>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
