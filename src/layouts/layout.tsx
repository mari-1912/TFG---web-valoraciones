import { Outlet, Link } from "react-router-dom";

export const Layout = () => (
  <div className="min-h-screen flex flex-col bg-gray-100">
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">🎬 ValorHub</h1>
      <nav className="space-x-4">
        <Link to="/">Inicio</Link>
        <Link to="/movies">Películas</Link>
        <Link to="/series">Series</Link>
        <Link to="/games">Juegos</Link>
        <Link to="/books">Libros</Link>
      </nav>
    </header>

    <main className="flex-1 p-6">
      <Outlet />
    </main>

    <footer className="bg-gray-800 text-white text-center py-4">
      © 2025 ValorHub — Todos los derechos reservados
    </footer>
  </div>
);
