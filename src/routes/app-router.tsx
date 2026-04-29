import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import type { ReactElement } from "react";
import HomePage from "../pages/home-page";
import CategoriesPage from "../pages/categories-page";
import LoginPage from "../pages/login-page";
import ForgotPasswordPage from "../pages/forgot-password-page";
import ResetPasswordPage from "../pages/reset-password-page";
import VerifyEmailPage from "../pages/verify-email-page";
import { DetailPage } from "../pages/detail-page";
import CommunityPage from "../pages/community-page";
import RegisterPage from "../pages/register-page";
import ListsHome from "@/pages/lists-home";
import ListsCategory from "../pages/list-categories-page";
import ListDetail from "@/pages/list-detail";
import AboutPage from "@/pages/about-page";
import ProfilePage from "@/pages/profile-page";
import ProfileStatsPage from "@/pages/profile-stats-page";
import MyStatusListDetailPage from "@/pages/my-status-list-detail-page";
import { ensureSessionValid } from "@/services/auth-service";

function RequireAuth({ children }: { children: ReactElement }) {
  const location = useLocation();
  const isAuthed = ensureSessionValid();
  if (!isAuthed) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }
  return children;
}

function LegacyServicesCategoryRedirect() {
  const { categoria } = useParams();
  const encodedCategory = encodeURIComponent(categoria ?? "");
  return <Navigate to={`/categorías/${encodedCategory}`} replace />;
}

function LegacyNuestrasListDetailRedirect() {
  const { id } = useParams();
  const encodedId = encodeURIComponent(id ?? "");
  return <Navigate to={`/listas/listas-opinify/${encodedId}`} replace />;
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
            <CategoriesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/series"
        element={
            <RequireAuth>
            <CategoriesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/libros"
        element={
            <RequireAuth>
            <CategoriesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/videojuegos"
        element={
            <RequireAuth>
            <CategoriesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/categorías/:categoria"
        element={
            <RequireAuth>
            <CategoriesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/categorias/:categoria"
        element={<LegacyServicesCategoryRedirect />}
      />
      <Route
        path="/servicios/:categoria"
        element={<LegacyServicesCategoryRedirect />}
      />
      <Route path="/inicio" element={<Navigate to="/home" replace />} />
      <Route
        path="/categorías"
        element={
            <RequireAuth>
            <CategoriesPage />
          </RequireAuth>
        }
      />
      <Route path="/categorias" element={<Navigate to="/categorías" replace />} />
      <Route path="/servicios" element={<Navigate to="/categorías" replace />} />
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
        path="/listas/listas-opinify"
        element={
          <RequireAuth>
            <ListsCategory type="nuestras" />
          </RequireAuth>
        }
      />
      <Route
        path="/listas/nuestras-listas"
        element={<Navigate to="/listas/listas-opinify" replace />}
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
        path="/listas/listas-opinify/:id"
        element={
          <RequireAuth>
            <ListDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/listas/nuestras-listas/:id"
        element={<LegacyNuestrasListDetailRedirect />}
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
        path="/listas/mis-listas/estado/:estado"
        element={
          <RequireAuth>
            <MyStatusListDetailPage />
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
      <Route path="/recuperar-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verificar-email" element={<VerifyEmailPage />} />
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
        path="/perfil/estadisticas"
        element={
          <RequireAuth>
            <ProfileStatsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/detail/:type/:id/:slug"
        element={
          <RequireAuth>
            <DetailPage />
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
