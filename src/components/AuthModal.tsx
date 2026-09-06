import { useState, useEffect, useRef, FormEvent } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import "./AuthModal.css";

export default function AuthModal() {
  const { mode, close, openLogin, openRegistro } = useAuthModal();
  const { login, user, isAdminOrOwner } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const isOpen = mode !== null;

  // Resetea el formulario cada vez que se abre o cambia de modo
  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setPassword("");
      setError("");
      setSuccess(false);
    }
  }, [mode, isOpen]);

  // Cerrar con ESC
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) close();
  }

  async function handleLoginSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-modal-overlay" ref={overlayRef} onMouseDown={handleBackdropClick}>
      <div className="auth-modal-box" role="dialog" aria-modal="true">
        <button className="auth-modal-close" onClick={close} aria-label="Cerrar">
          <X size={20} />
        </button>

        {success && user ? (
          <>
            <h2>¡Bienvenido, {user.nombre.split(" ")[0]}!</h2>
            <p className="auth-modal-subtitle">
              {mode === "registro" ? "Tu cuenta se creó correctamente." : "Iniciaste sesión correctamente."}
            </p>
            {isAdminOrOwner && (
              <div className="auth-modal-panel-cta">
                <span>Tienes acceso al panel administrativo</span>
                <Link to="/admin" onClick={close}>
                  Ir al panel
                </Link>
              </div>
            )}
            <button className="auth-modal-submit" style={{ marginTop: 14 }} onClick={close}>
              Continuar navegando
            </button>
          </>
        ) : mode === "login" ? (
          <>
            <h2>Iniciar sesión</h2>
            <p className="auth-modal-subtitle">Ingresa a tu cuenta para solicitar cotizaciones.</p>
            {error && <div className="auth-modal-error">{error}</div>}
            <form onSubmit={handleLoginSubmit}>
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
              <button type="submit" className="auth-modal-submit" disabled={loading}>
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>
            <p className="auth-modal-switch">
              ¿No tienes cuenta?{" "}
              <button type="button" onClick={openRegistro}>
                Regístrate aquí
              </button>
            </p>
          </>
        ) : (
          <>
            <h2>Crear cuenta</h2>
            <p className="auth-modal-subtitle">
              Para registrarte necesitamos algunos datos adicionales
              (teléfono, tipo de documento, etc.), así que te llevamos a la
              página de registro.
            </p>
            <Link to="/registro" className="auth-modal-submit auth-modal-submit-link" onClick={close}>
              Ir a registrarme
            </Link>
            <p className="auth-modal-switch">
              ¿Ya tienes cuenta?{" "}
              <button type="button" onClick={openLogin}>
                Inicia sesión
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
