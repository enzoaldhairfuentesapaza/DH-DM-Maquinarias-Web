import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  LogOut,
  ExternalLink,
  Calculator,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./admin.css";

export default function AdminLayout() {
  const { user, logout, isOwner } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="dot" />
          <div>
            <h2>HDM · Panel</h2>
            <span>Administración del sitio</span>
          </div>
        </div>

        <nav>
          <NavLink to="/admin" end>
            <LayoutDashboard size={17} /> Editar Página
          </NavLink>
          <NavLink to="/admin/productos">
            <Package size={17} /> Administrar Productos
          </NavLink>
          <NavLink to="/admin/ventas-cotizaciones">
            <Receipt size={17} /> Ventas y Cotizaciones
          </NavLink>
          {isOwner && (
            <NavLink to="/admin/accesos">
              <Users size={17} /> Administrar Accesos
            </NavLink>
          )}
          <button onClick={handleLogout}>
            <LogOut size={17} /> Cerrar sesión
          </button>
        </nav>

        {user && (
          <div className="admin-sidebar-footer">
            <div className="user-name">{user.nombre}</div>
            <div className="user-rol">{user.rol}</div>
          </div>
        )}
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>

      <a
        href="/cotizador-app/index.html"
        target="_blank"
        rel="noopener noreferrer"
        className="admin-floating-site-btn admin-floating-cotizador-btn"
        title="Cotizador formal"
      >
        <Calculator size={18} />
        <span>Cotizador</span>
      </a>

      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="admin-floating-site-btn"
        title="Ver sitio público"
      >
        <ExternalLink size={18} />
        <span>Ver sitio público</span>
      </a>
    </div>
  );
}
