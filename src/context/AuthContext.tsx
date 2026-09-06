import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, setToken } from "../api/client";

export type Rol = "cliente" | "admin" | "owner";

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
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
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    try {
      const me = await api.get<Usuario>("/api/auth/me");
      setUser(me);
    } catch {
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("hdm_token");
    if (token) {
      loadMe();
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post<{ access_token: string }>("/api/auth/login", {
      email,
      password,
    });
    setToken(res.access_token);
    await loadMe();
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  const isAdminOrOwner = user?.rol === "admin" || user?.rol === "owner";
  const isOwner = user?.rol === "owner";

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, refreshUser: loadMe, isAdminOrOwner, isOwner }}
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
