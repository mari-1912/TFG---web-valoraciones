import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/home-page";
import ServicesPage from "../pages/services-page";
import LoginPage from "../pages/login-page";
import { DetailPage } from "../pages/detail-page";
import IndexPage from "../pages/index-page";
import ListCategoriesPage from "../pages/list-categories-page";
import ListasPorCategoria from "../pages/list-page";
import CommunityPage from "../pages/community-page";
import RegisterForm from "../components/register-form";

export const RoutesComponent = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/peliculas" element={<ServicesPage />} />
      <Route path="/series" element={<ServicesPage />} />
      <Route path="/libros" element={<ServicesPage />} />
      <Route path="/videojuegos" element={<ServicesPage />} />
      <Route path="/inicio" element={<IndexPage />} />
      <Route path="/servicios" element={<ServicesPage />} />
      <Route path="/listas" element={<ListCategoriesPage  />} />
      <Route path="/listas/:categoria" element={<ListasPorCategoria />} />
      <Route path="/comunidad" element={<CommunityPage/>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterForm/>} />
      <Route path="/detail/:type/:id" element={<DetailPage />} />
    </Routes>
  );
};
