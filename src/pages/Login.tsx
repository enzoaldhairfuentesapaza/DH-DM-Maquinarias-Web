import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./auth.css";

export default function Login() {
  const { login, user, isAdminOrOwner } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      setJustLoggedIn(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  if (justLoggedIn && user) {
    return (
      <div className="auth-wrap">
        <div className="auth-box">
          <h1>¡Bienvenido, {user.nombre.split(" ")[0]}!</h1>
          <p className="subtitle">Iniciaste sesión correctamente.</p>
          {isAdminOrOwner ? (
            <div className="auth-panel-cta">
              <span>Tienes acceso al panel administrativo</span>
              <Link to="/admin">Ir al panel</Link>
            </div>
          ) : null}
          <button className="auth-submit" style={{ marginTop: 16 }} onClick={() => navigate("/")}>
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <h1>Iniciar sesión</h1>
        <p className="subtitle">Ingresa a tu cuenta para solicitar cotizaciones y más.</p>

        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
        <p className="auth-switch">
          ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
}
