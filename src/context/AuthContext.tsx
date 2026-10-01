import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, setToken, getToken, ApiError } from "../api/client";

export type Rol = string;

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  permisos: string[];
  rol_nombre?: string;
  telefono?: string | null;
  tipo_documento?: string | null;
  numero_documento?: string | null;
  razon_social?: string | null;
}

interface AuthContextValue {
  user: Usuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdminOrOwner: boolean;
  isOwner: boolean;
  /** El cotizador solo ve ventas, cotizaciones de repuestos y calculadora. */
  isCotizador: boolean;
  /** Cualquier rol con acceso al panel de administracion. */
  canAccessPanel: boolean;
  can: (section: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    try {
      const me = await api.get<Usuario>("/api/auth/me");
      setUser(me);
    } catch (error) {
      setUser(null);
      if (error instanceof ApiError && error.status === 401) setToken(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const onFocus = () => { if(getToken())void loadMe(); };
    window.addEventListener("focus",onFocus);
    const onUnauthorized = () => setUser(null);
    window.addEventListener("hdm:unauthorized", onUnauthorized);
    const token = getToken();
    if (token) {
      loadMe();
    } else {
      setLoading(false);
    }
    return () => { window.removeEventListener("hdm:unauthorized", onUnauthorized);window.removeEventListener("focus",onFocus); };
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post<{ access_token: string }>("/api/auth/login", {
      email,
      password,
    });
    setToken(res.access_token);
    try {
      const me = await api.get<Usuario>("/api/auth/me");
      setUser(me);
    } catch (error) {
      setToken(null);
      throw error;
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  const isAdminOrOwner = user?.rol === "admin" || user?.rol === "owner";
  const isOwner = user?.rol === "owner";
  const isCotizador = user?.rol === "cotizador";
  const can = (section: string) => !!user?.permisos?.includes(section);
  const canAccessPanel = !!user?.permisos?.length;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser: loadMe,
        isAdminOrOwner,
        isOwner,
        isCotizador,
        canAccessPanel,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
