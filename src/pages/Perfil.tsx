import { useState, useEffect, FormEvent } from "react";
import "./auth.css";
import { api, downloadApiFile } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface CotizacionCliente {
  id: number;
  estado: "pendiente" | "respondida" | "denegada";
  respuesta: string | null;
  motivo_denegacion: string | null;
  archivo_respuesta: string | null;
  origen: string;
  creado_en: string;
  detalle: { asunto?: string; mensaje?: string; canal?: string; productos?: { nombre: string; codigo?: string; cantidad: number; tipo: string }[] };
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "En espera",
  respondida: "Resuelta",
  rechazada: "Rechazada",
  denegada: "Rechazada",
};

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
  const [tab, setTab] = useState<"datos" | "cotizaciones" | "contactos">("datos");
  const [cotizaciones, setCotizaciones] = useState<CotizacionCliente[]>([]);
  const [loadingCotizaciones, setLoadingCotizaciones] = useState(false);

  useEffect(() => {
    if (tab === "datos" || !user) return;
    setCotizaciones([]);
    setLoadingCotizaciones(true);
    api
      .get<CotizacionCliente[]>(tab === "contactos" ? "/api/contactos/mias" : "/api/cotizaciones/mias")
      .then(setCotizaciones)
      .catch(() => setCotizaciones([]))
      .finally(() => setLoadingCotizaciones(false));
  }, [tab, user]);

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

        <div className="perfil-tabs" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => setTab("datos")}
            className={`perfil-tab-btn ${tab === "datos" ? "active" : ""}`}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "1.5px solid #121212",
              background: tab === "datos" ? "#121212" : "#fff",
              color: tab === "datos" ? "#fff" : "#121212",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Mis datos
          </button>
          <button
            type="button"
            onClick={() => setTab("cotizaciones")}
            className={`perfil-tab-btn ${tab === "cotizaciones" ? "active" : ""}`}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "1.5px solid #121212",
              background: tab === "cotizaciones" ? "#121212" : "#fff",
              color: tab === "cotizaciones" ? "#fff" : "#121212",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Mis cotizaciones
          </button>
          <button type="button" className={`perfil-tab-btn ${tab === "contactos" ? "active" : ""}`} onClick={()=>setTab("contactos")}>Mis mensajes de contacto</button>
        </div>

        {tab === "datos" && (
          <>
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
          </>
        )}

        {tab !== "datos" && (
          <div className="perfil-historial">
            {loadingCotizaciones ? (
              <p>Cargando historial...</p>
            ) : cotizaciones.length === 0 ? (
              <p>{tab === "contactos" ? "Aún no has enviado mensajes de contacto." : "Aún no has realizado ninguna cotización."}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {cotizaciones.map((c) => {
                  const productos = c.detalle?.productos ?? [];
                  const estadoClase =
                    c.estado === "respondida"
                      ? "in-stock"
                      : c.estado === "denegada"
                        ? "out-of-stock"
                        : "";
                  return (
                    <div
                      key={c.id}
                      style={{
                        border: "1.5px solid #e4e4e4",
                        borderRadius: 10,
                        padding: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <strong>{tab === "contactos" ? "Mensaje" : "Cotización"} #{c.id}</strong>
                        <span className={`stock-badge ${estadoClase}`}>
                          {ESTADO_LABEL[c.estado] ?? c.estado}
                        </span>
                      </div>
                      <p style={{ fontSize: 12.5, color: "#888", marginBottom: 8 }}>
                        {new Date(c.creado_en).toLocaleString("es-PE")}
                      </p>
                      {tab === "contactos" && <p><strong>{c.detalle.asunto}</strong><br/>{c.detalle.mensaje}<br/><small>Canal: {c.detalle.canal ?? "página"}</small></p>}
                      {productos.length > 0 && (
                        <ul style={{ margin: "0 0 8px", paddingLeft: 18, fontSize: 13.5 }}>
                          {productos.map((p, i) => (
                            <li key={i}>
                              {p.nombre} — Cant: {p.cantidad}
                            </li>
                          ))}
                        </ul>
                      )}
                      {c.estado === "respondida" && c.respuesta && (
                        <p style={{ fontSize: 13.5, color: "#1e7d43" }}>
                          <strong>Respuesta:</strong> {c.respuesta}
                        </p>
                      )}
                      {c.estado === "denegada" && c.motivo_denegacion && (
                        <p style={{ fontSize: 13.5, color: "#c0392b" }}>
                          <strong>Motivo:</strong> {c.motivo_denegacion}
                        </p>
                      )}
                      {c.archivo_respuesta && (
                        <a href="#" onClick={(event) => { event.preventDefault(); event.stopPropagation(); void downloadApiFile(c.archivo_respuesta!).catch((error: unknown) => window.alert(error instanceof Error ? error.message : "No se pudo descargar.")); }}
                          style={{ fontSize: 13.5, fontWeight: 600 }}
                        >
                          {tab === "contactos" ? "Ver archivo de la respuesta →" : "Ver archivo de la cotización →"}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
