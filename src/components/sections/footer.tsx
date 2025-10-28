import { Facebook, Twitter, Instagram } from "lucide-react";
import { CircleStar } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-200 mt-12 w-full">
      <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8">
        {/* Logo / Nombre */}
        <div>
          <h2 className="text-2xl font-bold text-indigo-500 flex">Opinify <CircleStar /></h2>
          <p className="mt-2 text-gray-400">
            Descubre, valora y comparte tus experiencias de entretenimiento
            favoritas.
          </p>
        </div>

        {/* Enlaces */}
        <div>
          <h3 className="font-semibold mb-4">Enlaces</h3>
          <ul className="space-y-2">
            <li>
              <a href="/inicio" className="hover:text-indigo-400 transition">
                Inicio
              </a>
            </li>
            <li>
              <a href="/servicios" className="hover:text-indigo-400 transition">
                Servicios
              </a>
            </li>
            <li>
              <a href="/listas" className="hover:text-indigo-400 transition">
                Listas
              </a>
            </li>
            <li>
              <a href="/comunidad" className="hover:text-indigo-400 transition">
                Comunidad
              </a>
            </li>
          </ul>
        </div>

        {/* Redes sociales */}
        <div>
          <h3 className="font-semibold mb-4">Síguenos</h3>
          <div className="flex gap-4">
            <a
              href="https://www.facebook.com/"
              aria-label="Facebook"
              className="hover:text-indigo-400 transition"
            >
              <Facebook />
            </a>
            <a
              href="https://x.com/"
              aria-label="Twitter"
              className="hover:text-indigo-400 transition"
            >
              <Twitter />
            </a>
            <a
              href="https://www.instagram.com/"
              aria-label="Instagram"
              className="hover:text-indigo-400 transition"
            >
              <Instagram />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 mt-6">
        <p className="text-center py-4 text-gray-500 text-sm">
          &copy; 2025 Opinify. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
