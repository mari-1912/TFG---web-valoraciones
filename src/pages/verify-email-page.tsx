import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, MailCheck, XCircle } from "lucide-react";

import Footer from "@/components/sections/footer";
import { verifyEmail } from "@/services/auth-service";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [error, setError] = useState<string | null>(
    token ? null : "El enlace no incluye token de verificación."
  );
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async () => {
    setError(null);
    setSuccess(null);

    if (!token) {
      setError("El enlace de verificación no es válido.");
      return;
    }

    setLoading(true);
    try {
      const result = await verifyEmail(token);
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
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-violet-700 shadow-sm">
            <MailCheck className="h-8 w-8" />
          </div>

          <h1 className="mt-6 text-center text-4xl font-extrabold tracking-wide text-violet-700">
            VERIFICAR EMAIL
          </h1>

          <p className="mt-5 text-center text-sm font-medium leading-6 text-violet-800">
            Confirma tu dirección para activar la cuenta y poder iniciar sesión con normalidad.
          </p>

          <div className="mt-10 space-y-6">
            {error && (
              <p className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
                <XCircle className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            {success && (
              <p className="flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {success}
              </p>
            )}

            <button
              type="button"
              onClick={handleVerify}
              disabled={!token || loading || Boolean(success)}
              className="h-[46px] w-full rounded-lg bg-violet-700 text-sm font-semibold tracking-wider text-white shadow-[0_12px_22px_rgba(30,10,70,0.22)] transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "VERIFICANDO..." : success ? "EMAIL VERIFICADO" : "VERIFICAR EMAIL"}
            </button>
          </div>

          <p className="mt-10 text-center text-sm text-violet-700">
            ¿Ya verificaste tu cuenta?{" "}
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
