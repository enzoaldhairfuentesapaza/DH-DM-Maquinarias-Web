import "./Header.css";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  ChevronDown,
  Menu,
  X,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import { useCotizacion } from "../context/CotizacionContext";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import NotificationBell from "./NotificationBell";

const nosotrosLinks = [
  { label: "Acerca de DH & DM Maquinarias SAC.", to: "/nosotros#acerca" },
  { label: "Sectores que atendemos", to: "/nosotros#sectores" },
  { label: "Responsabilidad social", to: "/nosotros#responsabilidad" },
  { label: "Trabaje con nosotros", to: "/nosotros#trabaje" },
  { label: "Políticas integrales", to: "/nosotros#politicas" },
  { label: "Sistema de cumplimiento", to: "/nosotros#cumplimiento" },
];

const repuestosCategorias = [
  "Sellos y Empaquetaduras",
  "Rodamientos y Bujes",
  "Pernos y Sujetadores",
  "Motor",
  "Filtros",
  "Transmisión",
  "Kits y Conjuntos",
  "Válvulas y Controles",
  "Tren de Rodaje",
  "Sistema Eléctrico",
  "Carrocería y Protección",
  "Sistema Hidráulico",
  "Correas y Poleas",
  "Bombas",
];

/** true cuando la barra de navegación ya no cabe y se usa el menú hamburguesa. */
function useEsMovil() {
  const [esMovil, setEsMovil] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 992
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 992px)");
    const onChange = (e: MediaQueryListEvent) => setEsMovil(e.matches);
    setEsMovil(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return esMovil;
}

export default function Header() {
  const [nosotrosOpen, setNosotrosOpen] = useState(false);
  const [repuestosOpen, setRepuestosOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const { totalItems } = useCotizacion();
  const { user, canAccessPanel, logout } = useAuth();
  const { openLogin } = useAuthModal();
  const navigate = useNavigate();
  const esMovil = useEsMovil();

  // Al volver a escritorio se cierra el panel móvil para no dejarlo colgado.
  useEffect(() => {
    if (!esMovil) {
      setMobileOpen(false);
      setNosotrosOpen(false);
      setRepuestosOpen(false);
    }
  }, [esMovil]);

  // Bloquea el scroll del fondo mientras el menú móvil está abierto.
  useEffect(() => {
    document.body.style.overflow = mobileOpen && esMovil ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen, esMovil]);

  const cerrarMenu = () => {
    setMobileOpen(false);
    setNosotrosOpen(false);
    setRepuestosOpen(false);
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    if (busqueda.trim()) {
      navigate(`/repuestos?buscar=${encodeURIComponent(busqueda.trim())}`);
      cerrarMenu();
    }
  };

  // En escritorio los menús se abren al pasar el mouse; en móvil, al tocar.
  const hoverProps = (setter: (v: boolean) => void) =>
    esMovil
      ? {}
      : {
          onMouseEnter: () => setter(true),
          onMouseLeave: () => setter(false),
        };

  const triggerProps = (abierto: boolean, setter: (v: boolean) => void) =>
    esMovil
      ? {
          onClick: (e: React.MouseEvent) => {
            e.preventDefault();
            setter(!abierto);
          },
        }
      : {};

  return (
    <header className="header-wrap">
      <div className="logo-bar">
        <Link to="/" className="logo-bar-link" onClick={cerrarMenu}>
          <img
            src="/Logo.jpg"
            alt="DH & DM Maquinarias SAC."
            className="logo"
          />
        </Link>

        <div className="logo-bar-right">
          <form className="search-box" onSubmit={handleBuscar}>
            <Search size={20} />
            <input
              type="text"
              placeholder="Busca repuestos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </form>

          <Link to="/cotizacion" className="quote-btn cart-btn">
            <ShoppingCart size={18} />
            Mi cotización
            <span className="cart-badge">{totalItems}</span>
          </Link>

          <div className="account-area">
            {!user && (
              <>
                <button className="account-link" onClick={openLogin}>
                  <User size={16} /> Iniciar sesión
                </button>
                <Link className="account-btn-primary" to="/registro">
                  Registrarme
                </Link>
              </>
            )}

            {user && (
              <>
                <NotificationBell />
                <Link
                  to="/perfil"
                  className="account-greeting"
                  style={{ textDecoration: "none" }}
                >
                  <User size={16} /> Hola, {user.nombre.split(" ")[0]}
                </Link>
                {canAccessPanel && (
                  <Link
                    to="/admin"
                    className="account-btn-primary admin-panel-cta"
                  >
                    <Settings size={16} /> Panel de administración
                  </Link>
                )}
                <button className="account-link" onClick={logout}>
                  <LogOut size={16} /> Salir
                </button>
              </>
            )}
          </div>
        </div>

        {/* Atajos que siguen visibles en móvil junto al botón de menú */}
        <div className="header-mobile-actions">
          {user && <NotificationBell />}
          <Link to="/cotizacion" className="mobile-cart-link" aria-label="Mi cotización">
            <ShoppingCart size={22} />
            {totalItems > 0 && (
              <span className="mobile-cart-badge">{totalItems}</span>
            )}
          </Link>
          <button
            className="burger"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Fondo oscuro detrás del panel móvil */}
      {mobileOpen && esMovil && (
        <div className="mobile-backdrop" onClick={cerrarMenu} />
      )}

      <div className="header">
        <nav className={`navbar ${mobileOpen ? "open" : ""}`}>
          {/* Buscador dentro del menú móvil */}
          <form className="mobile-search" onSubmit={handleBuscar}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Busca repuestos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </form>

          <Link to="/" onClick={cerrarMenu}>
            Inicio
          </Link>

          <div className="nav-dropdown-wrap" {...hoverProps(setNosotrosOpen)}>
            <Link
              to="/nosotros"
              className={`nav-drop-trigger ${nosotrosOpen ? "abierto" : ""}`}
              {...triggerProps(nosotrosOpen, setNosotrosOpen)}
            >
              Nosotros <ChevronDown size={15} />
            </Link>
            {nosotrosOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-menu-inner dropdown-simple">
                  {nosotrosLinks.map((l) => (
                    <Link key={l.label} to={l.to} onClick={cerrarMenu}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link to="/maquinaria" onClick={cerrarMenu}>
            Maquinaria
          </Link>

          <div className="nav-dropdown-wrap" {...hoverProps(setRepuestosOpen)}>
            <Link
              to="/repuestos"
              className={`nav-drop-trigger ${repuestosOpen ? "abierto" : ""}`}
              {...triggerProps(repuestosOpen, setRepuestosOpen)}
            >
              Repuestos <ChevronDown size={15} />
            </Link>
            {repuestosOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-menu-inner dropdown-grid">
                  {repuestosCategorias.map((c) => (
                    <Link
                      key={c}
                      to={`/repuestos?categoria=${encodeURIComponent(c)}`}
                      onClick={cerrarMenu}
                    >
                      {c}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link to="/novedades" onClick={cerrarMenu}>
            Novedades
          </Link>
          <Link to="/blog" onClick={cerrarMenu}>
            Blog
          </Link>
          <Link to="/promociones" onClick={cerrarMenu}>
            Promociones
          </Link>
          <Link to="/contacto" onClick={cerrarMenu}>
            Contacto
          </Link>

          {/* Opciones de cuenta dentro del menú móvil */}
          <div className="mobile-account">
            {!user && (
              <>
                <button
                  className="mobile-account-btn"
                  onClick={() => {
                    cerrarMenu();
                    openLogin();
                  }}
                >
                  <User size={17} /> Iniciar sesión
                </button>
                <Link
                  className="mobile-account-btn primary"
                  to="/registro"
                  onClick={cerrarMenu}
                >
                  Registrarme
                </Link>
              </>
            )}

            {user && (
              <>
                <Link
                  className="mobile-account-btn"
                  to="/perfil"
                  onClick={cerrarMenu}
                >
                  <User size={17} /> Mi perfil ({user.nombre.split(" ")[0]})
                </Link>
                <Link
                  className="mobile-account-btn"
                  to="/cotizacion"
                  onClick={cerrarMenu}
                >
                  <ShoppingCart size={17} /> Mi cotización ({totalItems})
                </Link>
                {canAccessPanel && (
                  <Link
                    className="mobile-account-btn primary"
                    to="/admin"
                    onClick={cerrarMenu}
                  >
                    <Settings size={17} /> Panel de administración
                  </Link>
                )}
                <button
                  className="mobile-account-btn"
                  onClick={() => {
                    cerrarMenu();
                    logout();
                  }}
                >
                  <LogOut size={17} /> Salir
                </button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
