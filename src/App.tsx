import "./App.css";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { useEffect, ReactNode, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import FloatingContacts from "./components/FloatingContacts";
import GloboSugerencias from "./components/GloboSugerencias";
import FloatingCotizadorBtn from "./components/FloatingCotizadorBtn";
const Home = lazy(() => import("./pages/Home"));
const Nosotros = lazy(() => import("./pages/Nosotros"));
const Maquinaria = lazy(() => import("./pages/Maquinaria"));
const MaquinariaDetalle = lazy(() => import("./pages/MaquinariaDetalle"));
const SectorDetalle = lazy(() => import("./pages/SectorDetalle"));
const Repuestos = lazy(() => import("./pages/Repuestos"));
const RepuestoDetalle = lazy(() => import("./pages/RepuestoDetalle"));
const Novedades = lazy(() => import("./pages/Novedades"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogDetalle = lazy(() => import("./pages/BlogDetalle"));
const Promociones = lazy(() => import("./pages/Promociones"));
const Cotizacion = lazy(() => import("./pages/Cotizacion"));
const Contacto = lazy(() => import("./pages/Contacto"));
const Login = lazy(() => import("./pages/Login"));
const Registro = lazy(() => import("./pages/Registro"));
const Perfil = lazy(() => import("./pages/Perfil"));
import RequireAuth from "./components/RequireAuth";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AuthModalProvider } from "./context/AuthModalContext";
import { FeedbackProvider } from "./context/FeedbackContext";
import AuthModal from "./components/AuthModal";
import ProtectedRoute from "./components/admin/ProtectedRoute";
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const EditarPagina = lazy(() => import("./pages/admin/EditarPagina"));
const ConfiguracionSitio = lazy(() => import("./pages/admin/ConfiguracionSitio"));
const ProductosHub = lazy(() => import("./pages/admin/ProductosHub"));
const CategoriasAdmin = lazy(() => import("./pages/admin/CategoriasAdmin"));
const VentasCotizacionesHub = lazy(() => import("./pages/admin/VentasCotizacionesHub"));
const Cotizaciones = lazy(() => import("./pages/admin/Cotizaciones"));
const CotizacionDetalle = lazy(() => import("./pages/admin/CotizacionDetalle"));
const ContentList = lazy(() => import("./pages/admin/ContentList"));
const ContentForm = lazy(() => import("./pages/admin/ContentForm"));
const Accesos = lazy(() => import("./pages/admin/Accesos"));
const Papelera = lazy(() => import("./pages/admin/Papelera"));
const Auditoria = lazy(() => import("./pages/admin/Auditoria"));
const Sugerencias = lazy(() => import("./pages/admin/Sugerencias"));
const Estadisticas = lazy(() => import("./pages/admin/Estadisticas"));

const NotFound = lazy(() => import("./pages/NotFound"));

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 80);
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function FormalQuoteRedirect({ history = false }: { history?: boolean }) {
  const { user, loading } = useAuth();
  useEffect(() => {
    if (!loading && user && ["admin", "owner", "cotizador"].includes(user.rol)) {
      window.location.replace(`/cotizador-app/${history ? "historial.html" : "index.html"}`);
    }
  }, [user, loading, history]);
  if (loading) return <p>Cargando...</p>;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!["admin", "owner", "cotizador"].includes(user.rol)) return <Navigate to="/" replace />;
  return <p>Abriendo cotizador...</p>;
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
        <Route path="/cotizador" element={<FormalQuoteRedirect />} />
        <Route path="/cotizador/historial" element={<FormalQuoteRedirect history />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <FloatingContacts />
      <GloboSugerencias />
      <FloatingCotizadorBtn />
    </>
  );
}

/**
 * Guarda las secciones de contenido (:entityKey). El cotizador solo puede
 * entrar a "ventas"; el resto del contenido es de admin/owner.
 */
function ContenidoRoute({ children }: { children: ReactNode }) {
  const { isCotizador } = useAuth();
  const { entityKey } = useParams<{ entityKey: string }>();
  if (isCotizador && entityKey !== "ventas") {
    return <Navigate to="/admin/ventas-cotizaciones" replace />;
  }
  return <>{children}</>;
}

/**
 * Pantalla inicial del panel: los admin/owner ven "Editar Página";
 * el cotizador no tiene acceso ahí, así que va directo a sus secciones.
 */
function AdminHome() {
  const { isCotizador } = useAuth();
  if (isCotizador) return <Navigate to="/admin/ventas-cotizaciones" replace />;
  return <EditarPagina />;
}

function App() {
  return (
    <FeedbackProvider>
    <AuthProvider>
      <AuthModalProvider>
        <Suspense fallback={<p role="status" style={{ padding: 24 }}>Cargando página...</p>}>
        <ScrollToTop />
        <AuthModal />
        <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner", "cotizador"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* El cotizador entra directo a Ventas y Cotizaciones */}
          <Route index element={<AdminHome />} />
          <Route
            path="productos"
            element={
              <ProtectedRoute allowedRoles={["admin", "owner"]}>
                <ProductosHub />
              </ProtectedRoute>
            }
          />
          <Route
            path="productos/categorias"
            element={
              <ProtectedRoute allowedRoles={["admin", "owner"]}>
                <CategoriasAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="configuracion"
            element={
              <ProtectedRoute allowedRoles={["admin", "owner"]}>
                <ConfiguracionSitio />
              </ProtectedRoute>
            }
          />
          <Route path="ventas-cotizaciones" element={<VentasCotizacionesHub />} />
          <Route path="estadisticas" element={<Estadisticas />} />
          <Route path="cotizaciones" element={<Cotizaciones />} />
          <Route path="cotizaciones/:id" element={<CotizacionDetalle />} />
          <Route
            path=":entityKey"
            element={
              <ContenidoRoute>
                <ContentList />
              </ContenidoRoute>
            }
          />
          <Route
            path=":entityKey/nuevo"
            element={
              <ContenidoRoute>
                <ContentForm />
              </ContenidoRoute>
            }
          />
          <Route
            path=":entityKey/:id"
            element={
              <ContenidoRoute>
                <ContentForm />
              </ContenidoRoute>
            }
          />
          <Route
            path="accesos"
            element={
              <ProtectedRoute allowedRoles={["owner"]}>
                <Accesos />
              </ProtectedRoute>
            }
          />
          <Route
            path="cotizaciones/papelera"
            element={
              <ProtectedRoute allowedRoles={["owner"]}>
                <Papelera />
              </ProtectedRoute>
            }
          />
          <Route
            path="auditoria"
            element={
              <ProtectedRoute allowedRoles={["owner"]}>
                <Auditoria />
              </ProtectedRoute>
            }
          />
          <Route
            path="sugerencias"
            element={
              <ProtectedRoute allowedRoles={["admin", "owner"]}>
                <Sugerencias />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/*" element={<PublicLayout />} />
        </Routes>
      </Suspense>
      </AuthModalProvider>
    </AuthProvider>
    </FeedbackProvider>
  );
}

export default App;
