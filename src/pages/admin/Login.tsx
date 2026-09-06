import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./admin.css";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-box">
        <div className="admin-login-logo">
          <div className="mark">H</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#121212" }}>HDM</div>
            <div className="company">Panel administrativo</div>
          </div>
        </div>
        <h1>Bienvenido de vuelta</h1>
        <p className="subtitle">Ingresa tus credenciales para administrar el sitio.</p>

        {error && <div className="admin-error">{error}</div>}
        <form className="admin-form" style={{ border: "none", padding: 0 }} onSubmit={handleSubmit}>
          <label>
            Correo electrónico
            <input
              type="email"
              placeholder="tucorreo@empresa.com"
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            className="btn-admin yellow"
            style={{ width: "100%", justifyContent: "center", marginTop: 6 }}
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Ingresar al panel"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: 22, fontSize: 13, color: "#999" }}>
          Acceso exclusivo para administradores y owners
        </p>
      </div>
    </div>
  );
}
