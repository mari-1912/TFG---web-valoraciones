import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type LoginFormProps = {
  onClose: () => void;
};

export default function LoginForm({ onClose }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <section className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-20 z-10">
      <div className="auth-card relative animate-fade-in">
        <Button onClick={onClose} className="close-btn" aria-label="Cerrar">
          ×
        </Button>
        <h2 className="auth-card-title">Iniciar sesión</h2>
        <Input
          type="text"
          placeholder="Usuario o correo electrónico"
          autoComplete="username"
          className="input-field"
        />
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            autoComplete="current-password"
            className="input-field mb-4 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <button className="submit-btn w-full mt-2">Entrar</button>
      </div>
    </section>
  );
}
