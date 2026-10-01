import "./GloboSugerencias.css";
import { useState } from "react";
import { MessageSquarePlus, X, Send, CheckCircle2 } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function GloboSugerencias() {
  const { user } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<"sugerencia" | "reclamo">("sugerencia");
  const [nombre, setNombre] = useState(user?.nombre ?? "");
  const [correo, setCorreo] = useState(user?.email ?? "");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  async function handleEnviar() {
    if (!nombre.trim() || !mensaje.trim()) {
      setError("Completa tu nombre y el mensaje antes de enviar.");
      return;
    }
    setError("");
    setEnviando(true);
    try {
      await api.post("/api/sugerencias", { tipo, nombre, correo, mensaje });
      setEnviado(true);
      setMensaje("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar, intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  function cerrar() {
    setAbierto(false);
    setTimeout(() => setEnviado(false), 300);
  }

  return (
    <div className="globo-sugerencias">
      {!abierto && (
        <button
          type="button"
          className="globo-btn"
          onClick={() => setAbierto(true)}
          aria-label="Enviar una sugerencia o reclamo"
          data-tooltip="Sugerencias y reclamos"
        >
          <MessageSquarePlus size={22} />
        </button>
      )}

      {abierto && (
        <div className="globo-panel">
          <div className="globo-panel-header">
            <h4>Sugerencias y reclamos</h4>
            <button type="button" onClick={cerrar} aria-label="Cerrar">
              <X size={16} />
            </button>
          </div>

          {enviado ? (
            <div className="globo-exito">
              <CheckCircle2 size={32} />
              <p>¡Gracias! Tu mensaje llegó a nuestro equipo.</p>
              <button className="btn-admin outline small" onClick={cerrar}>
                Cerrar
              </button>
            </div>
          ) : (
            <>
              <div className="globo-tabs">
                <button
                  className={tipo === "sugerencia" ? "active" : ""}
                  onClick={() => setTipo("sugerencia")}
                  type="button"
                >
                  Sugerencia
                </button>
                <button
                  className={tipo === "reclamo" ? "active" : ""}
                  onClick={() => setTipo("reclamo")}
                  type="button"
                >
                  Reclamo
                </button>
              </div>

              <input
                type="text"
                placeholder="Tu nombre *"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              <input
                type="email"
                placeholder="Tu correo (opcional, por si te respondemos)"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
              <textarea
                placeholder={
                  tipo === "sugerencia"
                    ? "Cuéntanos tu idea para mejorar..."
                    : "Cuéntanos qué pasó..."
                }
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={4}
              />

              {error && <p className="globo-error">{error}</p>}

              <button
                type="button"
                className="btn-admin yellow"
                onClick={handleEnviar}
                disabled={enviando}
              >
                <Send size={14} /> {enviando ? "Enviando..." : "Enviar"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
