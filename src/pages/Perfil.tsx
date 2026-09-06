import { useState, FormEvent } from "react";
import "./auth.css";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Perfil() {
  const { user, refreshUser } = useAuth();

  const [nombre, setNombre] = useState(user?.nombre ?? "");
  const [telefono, setTelefono] = useState(user?.telefono ?? "");
  const [tipoDocumento, setTipoDocumento] = useState<"dni" | "ruc">(
    (user?.tipo_documento as "dni" | "ruc") ?? "dni"
  );
  const [numeroDocumento, setNumeroDocumento] = useState(user?.numero_documento ?? "");
  const [razonSocial, setRazonSocial] = useState(user?.razon_social ?? "");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOk(false);
    setLoading(true);
    try {
      await api.put("/api/auth/me", {
        nombre,
        telefono,
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento,
        razon_social: tipoDocumento === "ruc" ? razonSocial : undefined,
      });
      await refreshUser();
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar tu perfil");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box auth-box-wide">
        <h1>Mi perfil</h1>
        <p className="subtitle">
          Mantén tus datos actualizados para agilizar tus solicitudes de
          cotización.
        </p>

        {error && <div className="auth-error">{error}</div>}
        {ok && (
          <div className="auth-error" style={{ background: "#e8f7ee", color: "#1e7d43" }}>
            Perfil actualizado correctamente.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>
            Nombre completo *
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
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
              Correo electrónico
              <input type="email" value={user.email} disabled />
            </label>
          </div>

          <label>
            Tipo de documento *
            <div className="auth-radio-row">
              <label className="auth-radio-option">
                <input
                  type="radio"
                  name="tipoDocumentoPerfil"
                  checked={tipoDocumento === "dni"}
                  onChange={() => setTipoDocumento("dni")}
                />
                DNI (persona natural)
              </label>
              <label className="auth-radio-option">
                <input
                  type="radio"
                  name="tipoDocumentoPerfil"
                  checked={tipoDocumento === "ruc"}
                  onChange={() => setTipoDocumento("ruc")}
                />
                RUC (empresa)
              </label>
            </div>
          </label>

          {tipoDocumento === "dni" ? (
            <label>
              N° de DNI
              <input
                type="text"
                value={numeroDocumento}
                onChange={(e) => setNumeroDocumento(e.target.value)}
                maxLength={8}
              />
            </label>
          ) : (
            <div className="auth-form-cols-2">
              <label>
                N° de RUC
                <input
                  type="text"
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  maxLength={11}
                />
              </label>
              <label>
                Razón social
                <input
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                />
              </label>
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}
