// src/components/sections/featured-reviews.tsx
import { Star } from "lucide-react";
import featuredData from "../data/most-week-relevants.json";

type Review = {
  id: number;
  title: string;
  year: number;
  user: string;
  rating: number;
  comment: string;
  likes: number;
  imgSrc: string;
};

function ReviewList({ title, reviews }: { title: string; reviews: Review[] }) {
  return (
    <div className="mb-12">
      <h3 className="text-xl font-semibold mb-6 text-indigo-300 border-b border-indigo-500 pb-2">
        {title}
      </h3>
      <div className="space-y-8">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="flex items-start gap-6 border-b border-gray-800 pb-6 hover:bg-gray-800/30 rounded-lg transition"
          >
            <img
              src={review.imgSrc}
              alt={review.title}
              className="w-20 h-28 rounded-md object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-white">
                  {review.title}{" "}
                  <span className="text-gray-400 text-base">{review.year}</span>
                </h4>
              </div>
              <p className="text-sm text-gray-400">@{review.user}</p>
              <div className="flex items-center my-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={
                      i < review.rating
                        ? "text-green-400 fill-green-400"
                        : "text-gray-600"
                    }
                  />
                ))}
              </div>
              <p className="italic text-gray-300 mb-2">{review.comment}</p>
              <p className="text-sm text-gray-500">❤️ {review.likes} likes</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FeaturedReviews() {
  const { pelicula, serie, libro } = featuredData.semana;

  return (
    <section className="bg-indigo-800 text-gray-200 py-12 px-6 rounded-2xl shadow-lg max-w-5xl mx-auto mt-12">
      <h2 className="text-2xl font-semibold mb-10 border-b border-indigo-300 pb-2 text-indigo-200">
        Valoraciones destacadas de la semana
      </h2>

      <ReviewList title="🎬 Película destacada" reviews={pelicula} />
      <ReviewList title="📺 Serie destacada" reviews={serie} />
      <ReviewList title="📚 Libro destacado" reviews={libro} />
    </section>
  );
}
