import { Button } from "./ui/button";
import { Input } from "./ui/input";

type LoginFormProps = {
  onClose: () => void;
};

export default function LoginForm({ onClose }: LoginFormProps) {
  return (
    <section className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-20 z-10">
      <div className="auth-card relative animate-fade-in">
        <Button onClick={onClose} className="close-btn" aria-label="Cerrar">
          ×
        </Button>
        <h2 className="auth-card-title">Iniciar sesión</h2>
        <Input
          type="email"
          placeholder="Correo electrónico"
          className="input-field"
        />
        <Input
          type="password"
          placeholder="Contraseña"
          className="input-field mb-4"
        />
        <button className="submit-btn w-full mt-2">Entrar</button>
      </div>
    </section>
  );
}
