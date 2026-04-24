import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Mail, User, Check, X } from "lucide-react";

import Footer from "@/components/sections/footer";
import { registerUser } from "@/services/auth-service";

// ── Reglas de contraseña ───────────────────────────────────────────────────

type Rule = { id: string; label: string; test: (p: string) => boolean };

const PASSWORD_RULES: Rule[] = [
  { id: "length",  label: "Mínimo 8 caracteres",        test: (p) => p.length >= 8 },
  { id: "upper",   label: "Una letra mayúscula",         test: (p) => /[A-Z]/.test(p) },
  { id: "lower",   label: "Una letra minúscula",         test: (p) => /[a-z]/.test(p) },
  { id: "number",  label: "Un número",                   test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "Un carácter especial (!@#…)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function usePasswordStrength(password: string) {
  return useMemo(() => {
    const results = PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(password) }));
    const passed  = results.filter((r) => r.ok).length;
    const pct     = (passed / PASSWORD_RULES.length) * 100;

    let label = "";
    let color = "";
    if (password.length > 0) {
      if      (passed <= 1) { label = "Muy débil";  color = "#ef4444"; }
      else if (passed === 2) { label = "Débil";      color = "#f97316"; }
      else if (passed === 3) { label = "Regular";    color = "#eab308"; }
      else if (passed === 4) { label = "Fuerte";     color = "#22c55e"; }
      else                   { label = "Muy fuerte"; color = "#7c3aed"; }
    }

    return { results, passed, pct, label, color, isValid: passed === PASSWORD_RULES.length };
  }, [password]);
}

// ── Página ─────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [email, setEmail]                   = useState("");
  const [username, setUsername]             = useState("");
  const [password, setPassword]             = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [remember, setRemember]             = useState(false);
  const [touched, setTouched]               = useState(false);

  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate  = useNavigate();
  const strength  = usePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!strength.isValid) {
      setError("La contraseña no cumple todos los requisitos.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser(
        { username: username.trim(), email: email.trim(), password },
        { remember }
      );
      if (!result.success) { setError(result.message); return; }
      setSuccess(result.message);
      setTimeout(() => navigate("/home"), 200);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "h-[48px] w-full rounded-xl border border-violet-200 bg-white px-5 pr-12 text-sm font-semibold tracking-widest text-violet-700 placeholder-violet-500/70 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200";

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
          <h1 className="text-center text-5xl font-extrabold tracking-wide text-gray-900">
            SIGN UP
          </h1>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">

            {/* Email */}
            <div className="relative">
              <input type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EMAIL" className={inputClass} autoComplete="email" />
              <Mail className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-700 pointer-events-none" />
            </div>

            {/* Username */}
            <div className="relative">
              <input type="text" required value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="USERNAME" className={inputClass} autoComplete="username" />
              <User className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-700 pointer-events-none" />
            </div>

            {/* Password + indicador de fuerza */}
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setTouched(true); }}
                  placeholder="PASSWORD"
                  className={inputClass}
                  autoComplete="new-password"
                />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 hover:text-gray-900"
                  aria-label={showPassword ? "Ocultar" : "Mostrar"}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Barra + etiqueta */}
              {touched && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, background: "hsl(270 30% 88%)" }}>
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${strength.pct}%`, background: strength.color }} />
                    </div>
                    {strength.label && (
                      <span className="text-xs font-bold w-20 text-right"
                        style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    )}
                  </div>

                  {/* Lista de requisitos */}
                  <ul className="space-y-1.5 rounded-xl border border-violet-200 bg-white/70 px-4 py-3">
                    {strength.results.map((r) => (
                      <li key={r.id} className="flex items-center gap-2 text-xs font-medium">
                        {r.ok
                          ? <Check className="h-3.5 w-3.5 shrink-0" style={{ color: "#22c55e" }} />
                          : <X    className="h-3.5 w-3.5 shrink-0" style={{ color: "#ef4444" }} />
                        }
                        <span style={{ color: r.ok ? "#16a34a" : "#6b7280" }}>{r.label}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="REPETIR PASSWORD"
                className={`${inputClass} ${
                  confirmPassword && confirmPassword !== password
                    ? "border-red-400 focus:ring-red-200"
                    : confirmPassword && confirmPassword === password
                    ? "border-green-400 focus:ring-green-200"
                    : ""
                }`}
                autoComplete="new-password"
              />
              <button type="button" tabIndex={-1}
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 hover:text-gray-900"
                aria-label={showConfirm ? "Ocultar" : "Mostrar"}>
                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Coincidencia de contraseñas */}
            {confirmPassword && (
              <p className="text-xs font-medium flex items-center gap-1.5"
                style={{ color: confirmPassword === password ? "#16a34a" : "#ef4444" }}>
                {confirmPassword === password
                  ? <><Check className="h-3.5 w-3.5" /> Las contraseñas coinciden</>
                  : <><X className="h-3.5 w-3.5" /> Las contraseñas no coinciden</>
                }
              </p>
            )}

            {/* Recordar */}
            <label className="inline-flex items-center gap-2 text-sm text-violet-700">
              <input type="checkbox" checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-gray-400" />
              Recordar
            </label>

            {error && <p className="text-center text-sm font-medium text-red-600">{error}</p>}
            {success && <p className="text-center text-sm font-medium text-green-600">{success}</p>}

            <button
              type="submit"
              disabled={loading || (touched && !strength.isValid) || (!!confirmPassword && confirmPassword !== password)}
              className="mt-2 h-[46px] w-full rounded-lg bg-violet-700 text-sm font-semibold tracking-wider text-white shadow-[0_12px_22px_rgba(30,10,70,0.22)] transition hover:bg-violet-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "CREANDO..." : "SIGN UP"}
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-violet-700">
            ¿Tienes ya cuenta?{" "}
            <Link to="/login" className="font-semibold text-violet-800 hover:underline">Login</Link>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
