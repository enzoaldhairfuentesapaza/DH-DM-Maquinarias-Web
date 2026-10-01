import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { routePermission } from "../../context/permissions";
import { useAuth, Rol } from "../../context/AuthContext";

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles: Rol[];
}) {
  const { user, loading, canAccessPanel, can } = useAuth();
  const {pathname}=useLocation();

  if (loading) return <div className="admin-loading">Cargando...</div>;

  if (!user) return <Navigate to="/admin/login" replace />;

  const permission=routePermission(pathname);
  const permitted=permission==="hub" ? canAccessPanel : can(permission);
  if (!permitted || (allowedRoles.length===1 && allowedRoles[0]==="owner" && user.rol!=="owner")) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
