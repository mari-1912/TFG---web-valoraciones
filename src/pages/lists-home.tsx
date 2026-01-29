import PageLayout from "@/layouts/layout";
import { Link } from "react-router-dom";


export default function ListsHome() {
  return (
    <PageLayout>
      <main className="min-h-screen bg-gray-50 px-6 py-12">
        <h1 className="text-3xl font-bold text-indigo-700 mb-8 text-center">
          Listas
        </h1>


        <div className="flex flex-wrap justify-center gap-6">
          <Link
            to="/listas/nuestras-listas"
            className="bg-white text-indigo-700 font-semibold px-6 py-4 rounded-lg shadow hover:bg-indigo-100 transition w-48 text-center"
          >
            Nuestras listas
          </Link>


          <Link
            to="/listas/mis-listas"
            className="bg-white text-indigo-700 font-semibold px-6 py-4 rounded-lg shadow hover:bg-indigo-100 transition w-48 text-center"
          >
            Mis listas
          </Link>
        </div>
      </main>
    </PageLayout>
  );
}


