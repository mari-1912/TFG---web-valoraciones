import Footer from "@/components/sections/footer";
import { Users, Sparkles, Heart, Rocket, MessageCircle } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-gray-900">
            Sobre nosotros
          </h1>
          <p className="mt-4 text-gray-600 leading-relaxed">
            En Opinify creemos que las mejores recomendaciones nacen de la
            comunidad. Creamos un espacio donde descubrir, valorar y compartir
            opiniones sobre entretenimiento sea fácil, visual y honesto.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-5">
              <div className="flex items-center gap-2 text-violet-700">
                <Rocket className="h-5 w-5" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Nuestra misión
                </h2>
              </div>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Ayudarte a encontrar qué ver, leer o jugar en minutos, con
                reseñas reales y listas claras.
              </p>
            </div>
            <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-5">
              <div className="flex items-center gap-2 text-violet-700">
                <Sparkles className="h-5 w-5" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Nuestra visión
                </h2>
              </div>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Ser el punto de encuentro donde las recomendaciones tienen
                contexto y las valoraciones importan.
              </p>
            </div>
            <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-5">
              <div className="flex items-center gap-2 text-violet-700">
                <Heart className="h-5 w-5" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Nuestros valores
                </h2>
              </div>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Transparencia, comunidad y calidad en cada reseña y en cada
                lista.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 text-violet-700">
                <Users className="h-5 w-5" />
                <h3 className="text-lg font-semibold text-gray-900">
                  ¿Qué puedes hacer aquí?
                </h3>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li>• Descubrir títulos por categoría y popularidad.</li>
                <li>• Guardar tus favoritos y crear listas personales.</li>
                <li>• Compartir valoraciones y ayudar a otras personas.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-dashed border-violet-200 bg-white p-5">
              <div className="flex items-center gap-2 text-violet-700">
                <MessageCircle className="h-5 w-5" />
                <h3 className="text-lg font-semibold text-gray-900">
                  ¿Quieres colaborar?
                </h3>
              </div>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Estamos mejorando Opinify cada día. Si tienes sugerencias,
                escríbenos y cuéntanos qué te gustaría ver.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
