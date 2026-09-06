import "./Header.css";
import { useState } from "react";
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

export default function Header() {
  const [nosotrosOpen, setNosotrosOpen] = useState(false);
  const [repuestosOpen, setRepuestosOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const { totalItems } = useCotizacion();
  const { user, isAdminOrOwner, logout } = useAuth();
  const { openLogin } = useAuthModal();
  const navigate = useNavigate();

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    if (busqueda.trim()) {
      navigate(`/repuestos?buscar=${encodeURIComponent(busqueda.trim())}`);
    }
  };

  return (
    <header className="header-wrap">
      <div className="logo-bar">
        <Link to="/" className="logo-bar-link">
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

            {user && !isAdminOrOwner && (
              <>
                <Link
                  to="/perfil"
                  className="account-greeting"
                  style={{ textDecoration: "none" }}
                >
                  <User size={16} /> Hola, {user.nombre.split(" ")[0]}
                </Link>
                <button className="account-link" onClick={logout}>
                  <LogOut size={16} /> Salir
                </button>
              </>
            )}

            {user && isAdminOrOwner && (
              <>
                <Link
                  to="/perfil"
                  className="account-greeting"
                  style={{ textDecoration: "none" }}
                >
                  <User size={16} /> Hola, {user.nombre.split(" ")[0]}
                </Link>
                <Link
                  to="/admin"
                  className="account-btn-primary admin-panel-cta"
                >
                  <Settings size={16} /> Panel de administración
                </Link>
                <button className="account-link" onClick={logout}>
                  <LogOut size={16} /> Salir
                </button>
              </>
            )}
          </div>
        </div>

        <button
          className="burger"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Menú"
        >
          {mobileOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      <div className="header">
        <nav className={`navbar ${mobileOpen ? "open" : ""}`}>
          <Link to="/" onClick={() => setMobileOpen(false)}>
            Inicio
          </Link>

          <div
            className="nav-dropdown-wrap"
            onMouseEnter={() => setNosotrosOpen(true)}
            onMouseLeave={() => setNosotrosOpen(false)}
          >
            <Link to="/nosotros" className="nav-drop-trigger">
              Nosotros <ChevronDown size={15} />
            </Link>
            {nosotrosOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-menu-inner dropdown-simple">
                  {nosotrosLinks.map((l) => (
                    <Link
                      key={l.label}
                      to={l.to}
                      onClick={() => setMobileOpen(false)}
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link to="/maquinaria" onClick={() => setMobileOpen(false)}>
            Maquinaria
          </Link>

          <div
            className="nav-dropdown-wrap"
            onMouseEnter={() => setRepuestosOpen(true)}
            onMouseLeave={() => setRepuestosOpen(false)}
          >
            <Link to="/repuestos" className="nav-drop-trigger">
              Repuestos <ChevronDown size={15} />
            </Link>
            {repuestosOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-menu-inner dropdown-grid">
                  {repuestosCategorias.map((c) => (
                    <Link
                      key={c}
                      to={`/repuestos?categoria=${encodeURIComponent(c)}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      {c}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link to="/novedades" onClick={() => setMobileOpen(false)}>
            Novedades
          </Link>
          <Link to="/blog" onClick={() => setMobileOpen(false)}>
            Blog
          </Link>
          <Link to="/promociones" onClick={() => setMobileOpen(false)}>
            Promociones
          </Link>
          <Link to="/contacto" onClick={() => setMobileOpen(false)}>
            Contacto
          </Link>
        </nav>
      </div>
    </header>
  );
}
