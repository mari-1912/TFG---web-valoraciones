import { BrowserRouter, Routes, Route } from "react-router-dom"
import  HomePage  from "../pages/home-page"
import { DetailPage } from "../pages/detail-page"
import { Layout } from "../layouts/layout"

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/detail/:id" element={<DetailPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
