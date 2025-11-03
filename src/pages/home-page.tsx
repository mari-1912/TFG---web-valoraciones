import { useState } from "react";
import LoginForm from "../components/login-form";
import RegisterForm from "../components/register-form";
import { ServicesList } from "../components/sections/services-list";
import { Header } from "../components/sections/header";
import Footer from "../components/sections/footer";

export default function HomePage() {
  const [activeForm, setActiveForm] = useState<"login" | "register" | null>(
    null
  );

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <header className="mb-8 w-full max-w-7xl mx-auto flex justify-between items-center border-b border-gray-300 py-4 px-6">
        <Header />
        {/* Para móviles, puedes agregar un botón hamburguesa (icono) para el menú */}
      </header>

      {/* CARD de formulario */}
      {activeForm && (
        <section className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-20 z-10">
          <div className="auth-card relative animate-fade-in">
            <button
              onClick={() => setActiveForm(null)}
              className="close-btn"
              aria-label="Cerrar"
            >
              ×
            </button>
            {activeForm === "login" && (
              <LoginForm onClose={() => setActiveForm(null)} />
            )}

            {activeForm === "register" && (
              <RegisterForm onClose={() => setActiveForm(null)} />
            )}
          </div>
        </section>
      )}

      {/* Servicios a valorar */}
      <ServicesList />
      <Footer/>
    </main>
  );
}
