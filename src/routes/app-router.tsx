import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "../pages/home-page";
import ServicesPage from "../pages/services-page";
import LoginPage from "../pages/login-page";
import { DetailPage } from "../pages/detail-page";
import ListCategoriesPage from "../pages/list-categories-page";
import ListasPorCategoria from "../pages/list-page";
import MyListsPage from "../pages/my-lists-page";
import CommunityPage from "../pages/community-page";
import RegisterPage from "../pages/register-page";

export const RoutesComponent = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/peliculas" element={<ServicesPage />} />
      <Route path="/series" element={<ServicesPage />} />
      <Route path="/libros" element={<ServicesPage />} />
      <Route path="/videojuegos" element={<ServicesPage />} />
      <Route path="/servicios/:categoria" element={<ServicesPage />} />
      <Route path="/inicio" element={<Navigate to="/home" replace />} />
      <Route path="/servicios" element={<ServicesPage />} />
      <Route path="/listas" element={<ListCategoriesPage  />} />
      <Route path="/listas/:categoria" element={<ListasPorCategoria />} />
      <Route path="/mis-listas" element={<MyListsPage />} />
      <Route path="/comunidad" element={<CommunityPage/>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage/>} />
      <Route path="/detail/:type/:id" element={<DetailPage />} />
    </Routes>
  );
};
