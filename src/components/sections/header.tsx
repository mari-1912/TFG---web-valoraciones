import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function Header() {
  const [activeForm, setActiveForm] = useState<"login" | "register" | null>(
    null
  );
  const navigate = useNavigate();

  return (
    <>
      <h1 className="text-indigo-600 font-extrabold text-3xl cursor-pointer">
        ValorApp
      </h1>

      <nav className="hidden md:flex gap-8 text-gray-700 font-medium">
        <a href="/inicio" className="hover:text-indigo-600 transition">
          Inicio
        </a>
        <a href="/servicios" className="hover:text-indigo-600 transition">
          Servicios
        </a>
        <a href="/listas" className="hover:text-indigo-600 transition">
          Listas
        </a>
        <a href="/comunidad" className="hover:text-indigo-600 transition">
          Comunidad
        </a>
      </nav>

      <div className="flex items-center gap-4">
        <input
          type="search"
          placeholder="Buscar..."
          className="hidden md:block px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <button
          onClick={() => navigate("/login")} // redirige a la página de login
          className="bg-indigo-600 text-white rounded px-4 py-2 hover:bg-indigo-700 transition"
        >
          Login
        </button>
        <button
          onClick={() => navigate("/registro")}
          className="bg-gray-200 rounded px-4 py-2 hover:bg-gray-300 transition"
        >
          Registro
        </button>
      </div>
    </>
  );
}
