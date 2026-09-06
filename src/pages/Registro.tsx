import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./auth.css";

export default function Registro() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState<"dni" | "ruc">("dni");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/registro", {
        nombre,
        email,
        password,
        telefono,
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento,
        razon_social: tipoDocumento === "ruc" ? razonSocial : undefined,
      });
      // Registrado con éxito: inicia sesión automáticamente
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarte");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box auth-box-wide">
        <h1>Crear cuenta</h1>
        <p className="subtitle">
          Completa tus datos y un asesor experto se comunicará contigo a la
          brevedad cuando solicites una cotización.
        </p>

        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>
            Nombre completo *
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              autoFocus
              placeholder="Ej. Juan Pérez"
            />
          </label>

          <div className="auth-form-cols-2">
            <label>
              Teléfono / WhatsApp *
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required
                placeholder="+51 999 999 999"
              />
            </label>
            <label>
              Correo {tipoDocumento === "ruc" ? "corporativo" : "personal"} *
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="juan@tuempresa.com"
              />
            </label>
          </div>

          <label>
            Tipo de documento *
            <div className="auth-radio-row">
              <label className="auth-radio-option">
                <input
                  type="radio"
                  name="tipoDocumento"
                  checked={tipoDocumento === "dni"}
                  onChange={() => setTipoDocumento("dni")}
                />
                DNI (persona natural)
              </label>
              <label className="auth-radio-option">
                <input
                  type="radio"
                  name="tipoDocumento"
                  checked={tipoDocumento === "ruc"}
                  onChange={() => setTipoDocumento("ruc")}
                />
                RUC (empresa)
              </label>
            </div>
          </label>

          {tipoDocumento === "dni" ? (
            <label>
              N° de DNI *
              <input
                type="text"
                value={numeroDocumento}
                onChange={(e) => setNumeroDocumento(e.target.value)}
                required
                maxLength={8}
                placeholder="Número de DNI"
              />
            </label>
          ) : (
            <div className="auth-form-cols-2">
              <label>
                N° de RUC *
                <input
                  type="text"
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  required
                  maxLength={11}
                  placeholder="Número de RUC"
                />
              </label>
              <label>
                Razón social *
                <input
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  required
                  placeholder="Nombre de la empresa"
                />
              </label>
            </div>
          )}

          <label>
            Contraseña *
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
            />
          </label>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Creando cuenta..." : "Registrarme"}
          </button>
        </form>
        <p className="auth-switch">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
