import "./App.css";
import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import FloatingContacts from "./components/FloatingContacts";
import FloatingCotizadorBtn from "./components/FloatingCotizadorBtn";
import Home from "./pages/Home";
import Nosotros from "./pages/Nosotros";
import Maquinaria from "./pages/Maquinaria";
import MaquinariaDetalle from "./pages/MaquinariaDetalle";
import SectorDetalle from "./pages/SectorDetalle";
import Repuestos from "./pages/Repuestos";
import RepuestoDetalle from "./pages/RepuestoDetalle";
import Novedades from "./pages/Novedades";
import Blog from "./pages/Blog";
import BlogDetalle from "./pages/BlogDetalle";
import Promociones from "./pages/Promociones";
import Cotizacion from "./pages/Cotizacion";
import Contacto from "./pages/Contacto";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Perfil from "./pages/Perfil";
import RequireAuth from "./components/RequireAuth";
import { AuthProvider } from "./context/AuthContext";
import { AuthModalProvider } from "./context/AuthModalContext";
import AuthModal from "./components/AuthModal";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import AdminLogin from "./pages/admin/Login";
import AdminLayout from "./pages/admin/AdminLayout";
import EditarPagina from "./pages/admin/EditarPagina";
import ProductosHub from "./pages/admin/ProductosHub";
import CategoriasAdmin from "./pages/admin/CategoriasAdmin";
import VentasCotizacionesHub from "./pages/admin/VentasCotizacionesHub";
import Cotizaciones from "./pages/admin/Cotizaciones";
import CotizacionDetalle from "./pages/admin/CotizacionDetalle";
import ContentList from "./pages/admin/ContentList";
import ContentForm from "./pages/admin/ContentForm";
import Accesos from "./pages/admin/Accesos";

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 80);
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function PublicLayout() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/maquinaria" element={<Maquinaria />} />
        <Route path="/maquinaria/:id" element={<MaquinariaDetalle />} />
        <Route path="/nosotros/sectores/:slug" element={<SectorDetalle />} />
        <Route path="/repuestos" element={<Repuestos />} />
        <Route path="/repuestos/:id" element={<RepuestoDetalle />} />
        <Route path="/novedades" element={<Novedades />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogDetalle />} />
        <Route path="/promociones" element={<Promociones />} />
        <Route path="/cotizacion" element={<Cotizacion />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route
          path="/perfil"
          element={
            <RequireAuth>
              <Perfil />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Home />} />
      </Routes>
      <Footer />
      <FloatingContacts />
      <FloatingCotizadorBtn />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthModalProvider>
        <ScrollToTop />
        <AuthModal />
        <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<EditarPagina />} />
          <Route path="productos" element={<ProductosHub />} />
          <Route path="productos/categorias" element={<CategoriasAdmin />} />
          <Route path="ventas-cotizaciones" element={<VentasCotizacionesHub />} />
          <Route path="cotizaciones" element={<Cotizaciones />} />
          <Route path="cotizaciones/:id" element={<CotizacionDetalle />} />
          <Route path=":entityKey" element={<ContentList />} />
          <Route path=":entityKey/nuevo" element={<ContentForm />} />
          <Route path=":entityKey/:id" element={<ContentForm />} />
          <Route
            path="accesos"
            element={
              <ProtectedRoute allowedRoles={["owner"]}>
                <Accesos />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/*" element={<PublicLayout />} />
        </Routes>
      </AuthModalProvider>
    </AuthProvider>
  );
}

export default App;
