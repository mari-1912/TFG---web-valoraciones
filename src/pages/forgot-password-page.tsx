import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";

import Footer from "@/components/sections/footer";
import { requestPasswordReset } from "@/services/auth-service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Introduce tu email.");
      return;
    }

    setLoading(true);
    try {
      const result = await requestPasswordReset(normalizedEmail);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setSuccess(result.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <section className="relative flex-1 flex items-center justify-center px-4 py-20">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute left-10 top-10 inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="w-full max-w-[560px] rounded-2xl bg-violet-100/70 px-14 py-14 shadow-[0_20px_45px_rgba(80,15,120,0.16)]">
          <h1 className="text-center text-4xl font-extrabold tracking-wide text-violet-700">
            RECUPERAR CONTRASEÑA
          </h1>

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

            {error && (
              <p className="text-center text-sm font-medium text-red-600">
                {error}
              </p>
            )}
            {success && (
              <p className="text-center text-sm font-medium text-green-700">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-[46px] w-full rounded-lg bg-violet-700 text-sm font-semibold tracking-wider text-white shadow-[0_12px_22px_rgba(30,10,70,0.22)] transition hover:bg-violet-800 disabled:opacity-60"
            >
              {loading ? "ENVIANDO..." : "ENVIAR ENLACE"}
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-violet-700">
            ¿Ya tienes acceso?{" "}
            <Link to="/login" className="font-semibold text-violet-800 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
