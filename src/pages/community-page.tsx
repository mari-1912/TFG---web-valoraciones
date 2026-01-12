import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Header } from "../components/sections/header";
import Footer from "../components/sections/footer";
import { getCommunityFeed } from "../services/apiCommunity";

// Catálogos para sacar posters reales
import moviesData from "../data/movies.json";
import seriesData from "../data/series.json";
import videoGamesData from "../data/video-games.json";
import booksData from "../data/books.json";

type CommunityAction =
  | "comment"
  | "left_comment"
  | "favorite"
  | "pending"
  | "list_add"
  | "rating";

interface CommunityPost {
  id: string;
  user: string;
  avatar?: string;

  action?: CommunityAction;
  listName?: string;

  // Para posters reales:
  contentType?: "película" | "serie" | "videojuego" | "libro";
  title?: string;

  // Opcional: fuerza un poster desde community.json
  poster?: string;

  rating?: number; // 1..5
  comment?: string;
}

type CatalogItem = { id: string; title: string; imgSrc?: string };

const MOVIES = moviesData as CatalogItem[];
const SERIES = seriesData as CatalogItem[];
const GAMES = videoGamesData as CatalogItem[];
const BOOKS = booksData as CatalogItem[];

const CATALOGS: Record<string, CatalogItem[]> = {
  pelicula: MOVIES,
  película: MOVIES,
  serie: SERIES,
  videojuego: GAMES,
  libro: BOOKS,
};

function normalizeKey(s?: string) {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("í", "i")
    .replaceAll("á", "a")
    .replaceAll("é", "e")
    .replaceAll("ó", "o")
    .replaceAll("ú", "u");
}

function findPosterByType(contentType?: string, title?: string) {
  if (!contentType || !title) return undefined;
  const key = normalizeKey(contentType);
  const list = CATALOGS[key] ?? [];
  const t = title.trim().toLowerCase();
  return list.find((x) => x.title.trim().toLowerCase() === t)?.imgSrc;
}

function findPosterAnywhere(title?: string) {
  if (!title) return undefined;
  const t = title.trim().toLowerCase();
  const all = [...MOVIES, ...SERIES, ...GAMES, ...BOOKS];
  return all.find((x) => x.title.trim().toLowerCase() === t)?.imgSrc;
}

function Stars({ rating }: { rating?: number }) {
  const r = Math.max(0, Math.min(5, rating ?? 0));
  return (
    <span className="text-sm tracking-widest text-gray-900 select-none">
      {"★".repeat(r)}
      {"☆".repeat(5 - r)}
    </span>
  );
}

function buildMessage(post: CommunityPost) {
  const user = post.user || "Customer";
  const action = post.action ?? (post.rating ? "rating" : "comment");

  switch (action) {
    case "comment":
      return `${user} ha comentado`;
    case "left_comment":
      return `${user} ha dejado un comentario`;
    case "favorite":
      return `${user} ha añadido a favoritos:`;
    case "pending":
      return `${user} ha añadido a pendientes:`;
    case "list_add":
      return `${user} ha añadido a la lista de ${post.listName ?? "terror"}:`;
    case "rating":
    default:
      return `${user} ha añadido una nueva valoración:`;
  }
}

function Avatar({ user, src }: { user: string; src?: string }) {
  const [ok, setOk] = useState(true);
  const letter = (user?.trim()?.[0] ?? "C").toUpperCase();

  if (src && ok) {
    return (
      <img
        src={src}
        alt={user}
        className="w-10 h-10 rounded-full object-cover bg-gray-200"
        loading="lazy"
        onError={() => setOk(false)}
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold">
      {letter}
    </div>
  );
}

export default function CommunityPage() {
  const [feed, setFeed] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCommunityFeed()
      .then((data) => setFeed((data as CommunityPost[]) ?? []))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => feed ?? [], [feed]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-24 min-h-screen flex items-center justify-center text-gray-600">
          Cargando comunidad...
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="pt-24 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-6">

          {/* TABLA CERRADA: borde completo + overflow hidden para que quede limpio */}
          <section className="border-2 border-indigo-600 overflow-hidden">
            {rows.map((post) => {
              const msg = buildMessage(post);
              const action = post.action ?? (post.rating ? "rating" : "comment");

              const showStars = action === "rating";
              const showQuotedComment =
                action === "rating" && (post.comment?.trim()?.length ?? 0) > 0;

              const posterSrc =
                post.poster ??
                findPosterByType(post.contentType, post.title) ??
                findPosterAnywhere(post.title);

              return (
                <div
                  key={post.id}
                  className="grid grid-cols-[90px_1fr_160px_90px] border-b-2 border-indigo-600 last:border-b-0"
                >
                  {/* Col 1: Avatar */}
                  <div className="flex flex-col items-center justify-center py-4 border-r-2 border-indigo-600">
                    <Avatar user={post.user} src={post.avatar} />
                    <span className="mt-2 text-[10px] font-semibold text-gray-700 uppercase">
                      customer
                    </span>
                  </div>

                  {/* Col 2: Texto */}
                  <div className="py-4 px-4">
                    <p className="text-sm text-gray-800">{msg}</p>

                    {showStars && (
                      <div className="mt-2">
                        <Stars rating={post.rating} />
                      </div>
                    )}

                    {showQuotedComment && (
                      <p className="mt-2 text-sm text-gray-700">
                        “{post.comment}”
                      </p>
                    )}

                    {action === "comment" && post.comment?.trim() ? (
                      <p className="mt-2 text-sm text-gray-700">{post.comment}</p>
                    ) : null}
                  </div>

                  {/* Col 3: Título */}
                  <div className="flex items-center justify-end px-4 text-sm">
                    <span
                      className={
                        post.title ? "font-semibold text-gray-900" : "text-gray-400"
                      }
                    >
                      {post.title ?? "Título"}
                    </span>
                  </div>

                  {/* Col 4: Poster */}
                  <div className="flex items-center justify-center border-l-2 border-indigo-600 py-4">
                    {posterSrc ? (
                      <img
                        src={posterSrc}
                        alt={`Poster ${post.title ?? ""}`}
                        className="w-14 h-14 object-cover bg-gray-200"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gray-200" />
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
