import { useState } from "react";
import LoginForm from "../components/login-form";
import RegisterForm from "../components/register-form";
import SectionMovies from "../components/movies-section";
import SectionBooks from "../components/books-section";

export default function HomePage() {
  const [activeForm, setActiveForm] = useState<"login" | "register" | null>(
    null
  );

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <header className="mb-8 w-full max-w-7xl mx-auto flex justify-between items-center border-b border-gray-300 py-4 px-6">
        <h1 className="text-indigo-600 font-extrabold text-3xl cursor-pointer">
          ValorApp
        </h1>

        <nav className="hidden md:flex gap-8 text-gray-700 font-medium">
          <a href="#" className="hover:text-indigo-600 transition">
            Inicio
          </a>
          <a href="#" className="hover:text-indigo-600 transition">
            Servicios
          </a>
          <a href="#" className="hover:text-indigo-600 transition">
            Listas
          </a>
          <a href="#" className="hover:text-indigo-600 transition">
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
            onClick={() => setActiveForm("login")}
            className="bg-indigo-600 text-white rounded px-4 py-2 hover:bg-indigo-700 transition"
          >
            Login
          </button>
          <button
            onClick={() => setActiveForm("register")}
            className="bg-gray-200 rounded px-4 py-2 hover:bg-gray-300 transition"
          >
            Registro
          </button>
        </div>

        {/* Para móviles, puedes agregar un botón hamburguesa (icono) para el menú */}
      </header>

      {/* CARD de formulario */}
      {activeForm && (
        <section className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-20 z-10">
          <div className="auth-card relative animate-fade-in">
            <button
              onClick={() => setActiveForm(null)}
              className="close-btn"
              aria-label="Cerrar"
            >
              ×
            </button>
            {activeForm === "login" && (
              <LoginForm onClose={() => setActiveForm(null)} />
            )}

            {activeForm === "register" && (
              <RegisterForm onClose={() => setActiveForm(null)} />
            )}
          </div>
        </section>
      )}

      {/* Servicios a valorar */}
      <section className="mt-12 w-full max-w-5xl">
        <h3 className="flex text-2xl font-semibold mb-6 text-gray-800">
          Lleva un registro de lo que te gusta.
        </h3>
        <h3 className="text-2xl font-semibold mb-6 text-gray-800">Guarda y reseña tus experiencias.</h3>
        <h3 className="text-2xl font-semibold mb-6 text-gray-800">¡Dile a tus amigos cuáles valen la pena! </h3>
        <SectionMovies />
        <SectionBooks />
        {/* Agrega más secciones aquí */}
      </section>
      <footer>PIE DE PAGINA</footer>
    </main>
  );
}
