import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // usuario y password provisionales
    if (username === "admin" && password === "1234") {
      // guardar estado simulado de sesión (solo frontend)
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userRole", "admin");

      navigate("/inicio"); // o a donde quieras llevarlo tras login
    } else {
      setError("Usuario o contraseña incorrectos.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-6">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-indigo-600 mb-6">
          Login (Temporal)
        </h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {error && (
            <p className="text-red-500 text-sm text-center mt-2">{error}</p>
          )}

          <button
            type="submit"
            className="bg-indigo-600 text-white rounded-md py-2 font-semibold hover:bg-indigo-700 transition"
          >
            Iniciar sesión
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Usuario: <strong>admin</strong> | Contraseña: <strong>1234</strong>
        </p>
      </div>
    </main>
  );
}
