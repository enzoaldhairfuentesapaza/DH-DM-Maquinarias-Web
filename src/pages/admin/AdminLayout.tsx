import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  LogOut,
  ExternalLink,
  Calculator,
  Mail,
  BarChart3,
  ScrollText,
  Trash2,
  Settings,
  UserCircle,
  X,
  LifeBuoy,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { APP_VERSION } from "../../version";
import "./admin.css";

const ROL_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  cotizador: "Cotizador",
  cliente: "Cliente",
};

export default function AdminLayout() {
  const { user, logout, isOwner, isCotizador } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(false);

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
            <h2>{"DH&DM · Panel"}</h2>
            <span>Administración del sitio</span>
          </div>
        </div>

        <nav>
          {/* El cotizador solo ve ventas/cotizaciones y estadísticas. */}
          {!isCotizador && (
            <>
              <NavLink to="/admin" end>
                <LayoutDashboard size={17} /> Editar Página
              </NavLink>
              <NavLink to="/admin/productos">
                <Package size={17} /> Administrar Productos
              </NavLink>
            </>
          )}
          <NavLink to="/admin/ventas-cotizaciones">
            <Receipt size={17} /> Cotizaciones
          </NavLink>
          <NavLink to="/admin/estadisticas">
            <BarChart3 size={17} /> Estadísticas
          </NavLink>
          {!isCotizador && (
            <NavLink to="/admin/sugerencias">
              <MessageSquare size={17} /> Sugerencias y reclamos
            </NavLink>
          )}
          {isOwner && (
            <NavLink to="/admin/accesos">
              <Users size={17} /> Administrar Accesos
            </NavLink>
          )}
          {isOwner && (
            <NavLink to="/admin/cotizaciones/papelera">
              <Trash2 size={17} /> Papelera de cotizaciones
            </NavLink>
          )}
          {isOwner && (
            <NavLink to="/admin/auditoria">
              <ScrollText size={17} /> Registro de actividad
            </NavLink>
          )}
          <NavLink to="/admin/excel"><Receipt size={17} /> Importar / exportar Excel</NavLink>
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
        <div className="admin-sidebar-version">v{APP_VERSION}</div>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>

      {/* Fondo transparente para poder cerrar el menú tocando fuera */}
      {menuAbierto && (
        <div className="admin-fab-backdrop" onClick={() => setMenuAbierto(false)} />
      )}

      <div className="admin-fab-wrap">
        {menuAbierto && (
          <div className="admin-fab-menu">
            <button
              type="button"
              className="admin-fab-item perfil"
              onClick={() => {
                setPerfilAbierto(true);
                setMenuAbierto(false);
              }}
            >
              <UserCircle size={17} /> Ver perfil
            </button>

            <a
              href="/cotizador-app/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-fab-item"
            >
              <Calculator size={17} /> Cotizador
            </a>

            <a
              href="https://dh-dm-maquinarias.com:2003/sessnd8m1gaFmuNX5Tnd/mail/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-fab-item"
            >
              <Mail size={17} /> Correo empresarial
            </a>

            <a href="/" target="_blank" rel="noopener noreferrer" className="admin-fab-item">
              <ExternalLink size={17} /> Ver sitio público
            </a>

            <a
              href="https://wa.me/51953770220?text=Hola,%20necesito%20soporte%20con%20el%20panel%20de%20administraci%C3%B3n%20de%20la%20p%C3%A1gina"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-fab-item asistencia"
              data-tooltip="Si algo falla en la página o necesitas un arreglo, escríbenos por aquí"
            >
              <LifeBuoy size={17} /> Asistencia (953 770 220)
            </a>
          </div>
        )}

        <button
          type="button"
          className={`admin-fab-btn ${menuAbierto ? "abierto" : ""}`}
          onClick={() => setMenuAbierto((v) => !v)}
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          title="Accesos rápidos"
        >
          {menuAbierto ? <X size={22} /> : <Settings size={22} />}
        </button>
      </div>

      {perfilAbierto && user && (
        <div className="perfil-modal-overlay" onClick={() => setPerfilAbierto(false)}>
          <div className="perfil-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="perfil-modal-avatar">{user.nombre.charAt(0).toUpperCase()}</div>
            <h3 style={{ marginBottom: 4 }}>{user.nombre}</h3>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>
              {ROL_LABELS[user.rol] ?? user.rol}
            </p>

            <div className="perfil-modal-row">
              <span>Correo</span>
              <span>{user.email}</span>
            </div>
            {user.telefono && (
              <div className="perfil-modal-row">
                <span>Teléfono</span>
                <span>{user.telefono}</span>
              </div>
            )}
            {user.numero_documento && (
              <div className="perfil-modal-row">
                <span>{user.tipo_documento === "ruc" ? "RUC" : "Documento"}</span>
                <span>{user.numero_documento}</span>
              </div>
            )}
            {user.razon_social && (
              <div className="perfil-modal-row">
                <span>Razón social</span>
                <span>{user.razon_social}</span>
              </div>
            )}

            <button
              className="btn-admin outline"
              style={{ width: "100%", marginTop: 18, justifyContent: "center" }}
              onClick={() => setPerfilAbierto(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
