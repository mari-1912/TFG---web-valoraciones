import { useState } from "react";
import { registerUser } from "../services/auth-service";
import { useNavigate } from "react-router-dom";


export default function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
   const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = registerUser({ username, email, password });

    setMessage(result.message);
    setSuccess(result.success);

    if (result.success) {
      // ✅ Guardamos el estado de login
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userRole", "usuario");
      localStorage.setItem("currentUser", username);

      setTimeout(() => {
        navigate("/inicio"); // 👈 redirige al inicio
      }, 1000);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-lg rounded-xl p-8 max-w-md w-full"
    >
      <h2 className="text-2xl font-bold text-center text-indigo-600 mb-6">
        Crear cuenta
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de usuario
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Correo electrónico
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {message && (
        <p
          className={`text-center text-sm ${
            success ? "text-green-600" : "text-red-600"
          } mb-4`}
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition"
      >
        Registrarme
      </button>
    </form>
  );
}
