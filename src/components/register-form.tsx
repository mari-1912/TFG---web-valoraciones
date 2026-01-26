import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, User } from "lucide-react";

import { registerUser } from "@/services/auth-service";

type RegisterFormProps = {
  onClose?: () => void;
};

export default function RegisterForm({ onClose }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const result = await registerUser({
        username: username.trim(),
        email: email.trim(),
        password,
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      localStorage.setItem("rememberMe", remember ? "true" : "false");
      setSuccess(result.message);

      setTimeout(() => {
        onClose?.();
        navigate("/home");
      }, 200);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
      <div className="relative w-full max-w-[560px] rounded-2xl bg-violet-100/70 px-14 py-14 shadow-[0_20px_45px_rgba(80,15,120,0.16)] animate-fade-in">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-3 text-2xl leading-none text-gray-600 hover:text-gray-900"
            aria-label="Cerrar"
          >
            ×
          </button>
        )}

        <h2 className="text-center text-5xl font-extrabold tracking-wide text-gray-900">
          SIGN UP
        </h2>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="EMAIL"
              className="h-[48px] w-full rounded-xl border border-violet-200 bg-white px-5 pr-12 text-sm font-semibold tracking-widest text-violet-700 placeholder-violet-500/70 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
              autoComplete="email"
            />
            <Mail className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-700" />
          </div>

          <div className="relative">
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="USERNAME"
              className="h-[48px] w-full rounded-xl border border-violet-200 bg-white px-5 pr-12 text-sm font-semibold tracking-widest text-violet-700 placeholder-violet-500/70 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
              autoComplete="username"
            />
            <User className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-700" />
          </div>

          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="PASSWORD"
              className="h-[48px] w-full rounded-xl border border-violet-200 bg-white px-5 pr-12 text-sm font-semibold tracking-widest text-violet-700 placeholder-violet-500/70 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
              autoComplete="new-password"
            />
            <Lock className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-700" />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-violet-700">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-gray-400"
            />
            Recordar
          </label>

          {error && (
            <p className="text-center text-sm font-medium text-red-600">
              {error}
            </p>
          )}
          {success && (
            <p className="text-center text-sm font-medium text-green-600">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-[46px] w-full rounded-lg bg-violet-700 text-sm font-semibold tracking-wider text-white shadow-[0_12px_22px_rgba(30,10,70,0.22)] transition hover:bg-violet-800 disabled:opacity-60"
          >
            {loading ? "CREANDO..." : "SIGN UP"}
          </button>
        </form>

        <p className="mt-10 text-center text-sm text-violet-700">
          ¿Tienes ya cuenta?{" "}
          <Link
            to="/login"
            className="font-semibold text-violet-800 hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}
