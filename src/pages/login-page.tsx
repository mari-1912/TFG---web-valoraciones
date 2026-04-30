import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, User } from "lucide-react";

import Footer from "@/components/sections/footer";
import { PageLoader } from "@/components/ui/page-loader";
import { loginUser } from "@/services/auth-service";

function resolvePostLoginTarget(target: string) {
  if (typeof window === "undefined") return target || "/home";

  try {
    const url = new URL(target || "/home", window.location.origin);
    if (url.origin !== window.location.origin) return "/home";
    if (url.pathname === "/perfil" && url.searchParams.has("userId")) {
      return "/perfil";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/home";
  }
}

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const fromState = (
    location.state as { from?: string | { pathname?: string } } | null
  )?.from;
  const fromQuery = searchParams.get("from");
  const reason = searchParams.get("reason");
  const from =
    typeof fromState === "string"
      ? fromState
      : fromState?.pathname ?? (fromQuery?.trim() || "/home");

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
      
        if (loading) return;
      
        setError(null);
        setSuccess(null);
        setLoading(true);
      
        try {
          const result = await loginUser(identifier.trim(), password, remember);
      
          if (!result.success) {
            setError(result.message);
            return;
          }
      
          setSuccess(result.message);
          navigate(resolvePostLoginTarget(from), { replace: true });
        } finally {
          setLoading(false);
        }
      };

  return (
    <main className="min-h-screen flex flex-col bg-white" aria-busy={loading}>
      {loading ? (
        <PageLoader
          overlay
          title="Iniciando sesión"
          message="Puede tardar unos segundos."
        />
      ) : null}
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
          <h1 className="text-center text-5xl font-extrabold tracking-wide text-violet-700">
            LOGIN
          </h1>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            {/* USERNAME OR EMAIL */}
            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="USUARIO O EMAIL"
                className="h-[48px] w-full rounded-xl border border-violet-200 bg-white px-5 pr-12 text-sm font-semibold tracking-widest text-violet-700 placeholder-violet-500/70 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                autoComplete="username"
              />
              <User className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-700" />
            </div>

            {/* PASSWORD */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="PASSWORD"
                className="h-[48px] w-full rounded-xl border border-violet-200 bg-white px-5 pr-12 text-sm font-semibold tracking-widest text-violet-700 placeholder-violet-500/70 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 hover:text-gray-900"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-violet-700">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-400"
                />
                Recordar
              </label>

              <button
                type="button"
                className="text-violet-700 hover:underline"
                onClick={() => navigate("/recuperar-password")}
              >
                ¿Has olvidado la contraseña?
              </button>
            </div>

            {error && (
              <p className="text-center text-sm font-medium text-red-600">
                {error}
              </p>
            )}
            {!error && reason === "session-expired" ? (
              <p className="text-center text-sm font-medium text-amber-700">
                Tu sesión ha expirado. Inicia sesión de nuevo.
              </p>
            ) : null}
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
              {loading ? "ENTRANDO..." : "LOGIN"}
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-violet-700">
            ¿Aún no tienes cuenta?{" "}
            <Link
              to="/registro"
              className="font-semibold text-violet-800 hover:underline"
            >
              Registro
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
