import { ServicesList } from "../components/sections/services-list";
import { Header } from "../components/sections/header";
import Footer from "../components/sections/footer";

export default function ServicesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 flex flex-col pt-10">
        {/* Para móviles, puedes agregar un botón hamburguesa (icono) para el menú */}

        {/* Intro */}
        <section className="max-w-5xl mx-auto text-center py-15 px-6">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-4 mt-4">
            Nuestros Servicios
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            En nuestra plataforma puedes valorar, descubrir y compartir tus
            opiniones sobre tus películas, series, videojuegos, libros, discos y
            juegos de mesa favoritos. Creamos una comunidad donde tus gustos
            cuentan.
          </p>
        </section>
        {/* Servicios destacados */}
        <ServicesList />
        {/* CTA final 
        <section className="bg-linear-to-r from-indigo-500 to-purple-600 text-white py-16 text-center px-6">
          <h3 className="text-3xl font-bold mb-4">
            ¿Listo para unirte a la comunidad?
          </h3>
          <p className="text-lg mb-6">
            Crea tu perfil y empieza a valorar tus obras favoritas hoy mismo.
          </p>
          <a
            href="/registro"
            className="bg-white text-indigo-600 font-semibold px-6 py-3 rounded-full shadow hover:bg-gray-100 transition"
          >
            Crear cuenta
          </a>
        </section>
        
        */}
      </main>
      <Footer />
    </>
  );
}
