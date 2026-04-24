import { Facebook, Twitter, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import LogoPng from "@/assets/LOGO.png";

export default function Footer() {
  return (
    <footer className="w-full bg-linear-to-r from-indigo-500 to-purple-600 px-6 text-center text-white">
      <div className="max-w-7xl mx-auto px-6 py-3.5 grid md:grid-cols-3 gap-4">
        {/* Logo / Nombre */}
        <div className="flex flex-col items-center">
          <img
            src={LogoPng}
            alt="Logo Opinify"
            className="h-10 w-auto object-contain"
          />
          <p className="mt-2 text-white-400">
            Descubre, valora y comparte tus experiencias de entretenimiento
            favoritas.
          </p>
        </div>

        {/* Enlaces internos */}
        <div>
          <h3 className="font-semibold mb-4">Enlaces</h3>
          <ul className="grid grid-cols-2 gap-x-1 gap-y-1.5">
            <li>
              <Link to="/home" className="hover:text-indigo-400 transition">
                Inicio
              </Link>
            </li>
            <li>
              <Link
                to="/categorías"
                className="hover:text-indigo-400 transition"
              >
                Categorías
              </Link>
            </li>
            <li>
              <Link to="/listas" className="hover:text-indigo-400 transition">
                Listas
              </Link>
            </li>
            <li>
              <Link
                to="/comunidad"
                className="hover:text-indigo-400 transition"
              >
                Comunidad
              </Link>
            </li>
            <li>
              <Link
                to="/sobre-nosotros"
                className="hover:text-indigo-400 transition"
              >
                Sobre Nosotros
              </Link>
            </li>
          </ul>
        </div>

        {/* Redes sociales (externas) */}
        <div className="flex flex-col items-center">
          <h3 className="font-semibold mb-4">Síguenos</h3>
          <div className="flex gap-4">
            <a
              href="https://www.facebook.com/"
              aria-label="Facebook"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-400 transition"
            >
              <Facebook />
            </a>
            <a
              href="https://x.com/"
              aria-label="Twitter"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-400 transition"
            >
              <Twitter />
            </a>
            <a
              href="https://www.instagram.com/"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-400 transition"
            >
              <Instagram />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 mt-2">
        <p className="text-center py-1.5 text-white text-sm">
          &copy; 2025 Opinify. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
