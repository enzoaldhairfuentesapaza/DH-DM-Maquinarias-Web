import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth, Rol } from "../../context/AuthContext";

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles: Rol[];
}) {
  const { user, loading } = useAuth();

  if (loading) return <div className="admin-loading">Cargando...</div>;

  if (!user) return <Navigate to="/admin/login" replace />;

  if (!allowedRoles.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
