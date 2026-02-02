import { Routes, Route, Navigate } from "react-router-dom";
import type { ReactElement } from "react";
import HomePage from "../pages/home-page";
import ServicesPage from "../pages/services-page";
import LoginPage from "../pages/login-page";
import { DetailPage } from "../pages/detail-page";
import CommunityPage from "../pages/community-page";
import RegisterPage from "../pages/register-page";
import ListsHome from "@/pages/lists-home";
import ListsCategory from "../pages/list-categories-page";
import ListDetail from "@/pages/list-detail";
import AboutPage from "@/pages/about-page";
import ProfilePage from "@/pages/profile-page";

function RequireAuth({ children }: { children: ReactElement }) {
  // Temporalmente sin guardas de login (solo entra a /login si se pulsa allí).
  return children;
}


export const RoutesComponent = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/sobre-nosotros" element={<AboutPage />} />
      <Route
        path="/peliculas"
        element={
          <RequireAuth>
            <ServicesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/series"
        element={
          <RequireAuth>
            <ServicesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/libros"
        element={
          <RequireAuth>
            <ServicesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/videojuegos"
        element={
          <RequireAuth>
            <ServicesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/servicios/:categoria"
        element={
          <RequireAuth>
            <ServicesPage />
          </RequireAuth>
        }
      />
      <Route path="/inicio" element={<Navigate to="/home" replace />} />
      <Route
        path="/servicios"
        element={
          <RequireAuth>
            <ServicesPage />
          </RequireAuth>
        }
      />
      {/* Esta es la página principal de listas */}
      <Route
        path="/listas"
        element={
          <RequireAuth>
            <ListsHome />
          </RequireAuth>
        }
      />


      {/* Grids de listas */}
      <Route
        path="/listas/nuestras-listas"
        element={
          <RequireAuth>
            <ListsCategory type="nuestras" />
          </RequireAuth>
        }
      />
      <Route
        path="/listas/mis-listas"
        element={
          <RequireAuth>
            <ListsCategory type="mis" />
          </RequireAuth>
        }
      />


      {/* Detalle de cada lista */}
      <Route
        path="/listas/nuestras-listas/:id"
        element={
          <RequireAuth>
            <ListDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/listas/mis-listas/:id"
        element={
          <RequireAuth>
            <ListDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/comunidad"
        element={
          <RequireAuth>
            <CommunityPage />
          </RequireAuth>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route
        path="/perfil"
        element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        }
      />
      <Route
        path="/detail/:type/:id"
        element={
          <RequireAuth>
            <DetailPage />
          </RequireAuth>
        }
      />
    </Routes>
  );
};
