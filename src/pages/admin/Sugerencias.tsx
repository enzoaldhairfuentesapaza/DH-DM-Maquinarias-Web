import { useEffect, useState, useCallback } from "react";
import { MessageSquare, Trash2, Mail, Check } from "lucide-react";
import { api } from "../../api/client";
import { useFeedback } from "../../context/FeedbackContext";
import { abrirGmailCompose } from "../../utils/email";
import "./admin.css";

interface Sugerencia {
  id: number;
  tipo: "sugerencia" | "reclamo";
  nombre: string;
  correo: string | null;
  mensaje: string;
  leido: number | boolean;
  creado_en: string;
}

const FILTROS = ["todas", "sugerencia", "reclamo", "no_leidas"] as const;

export default function Sugerencias() {
  const feedback = useFeedback();
  const [items, setItems] = useState<Sugerencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("todas");

  const showError = feedback.error;
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Sugerencia[]>("/api/sugerencias");
      setItems(data);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al cargar.");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { void load(); }, [load]);

  async function marcarLeido(s: Sugerencia) {
    try {
      await api.put(`/api/sugerencias/${s.id}`, { leido: !s.leido });
      setItems((prev) => prev.map((i) => (i.id === s.id ? { ...i, leido: !s.leido } : i)));
    } catch (err) {
      feedback.error(err instanceof Error ? err.message : "Error al actualizar.");
    }
  }

  async function eliminar(id: number) {
    const ok = await feedback.confirm({
      title: "Eliminar mensaje",
      message: "¿Seguro que quieres eliminar este mensaje? No se puede deshacer.",
      confirmLabel: "Sí, eliminar",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/api/sugerencias/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      feedback.success("Mensaje eliminado.");
    } catch (err) {
      feedback.error(err instanceof Error ? err.message : "Error al eliminar.");
    }
  }

  const visibles = items.filter((i) => {
    if (filtro === "sugerencia") return i.tipo === "sugerencia";
    if (filtro === "reclamo") return i.tipo === "reclamo";
    if (filtro === "no_leidas") return !i.leido;
    return true;
  });

  const noLeidas = items.filter((i) => !i.leido).length;

  return (
    <div>
      <div className="admin-header-row">
        <div>
          <h1>Sugerencias y reclamos</h1>
          <p className="subtitle">
            Mensajes enviados por el globo flotante de la página. Solo tú y
            otros admins/owners pueden verlos.
          </p>
        </div>
      </div>

      <div className="admin-tabs">
        {FILTROS.map((f) => (
          <button key={f} className={filtro === f ? "active" : ""} onClick={() => setFiltro(f)}>
            {f === "todas" && `Todas (${items.length})`}
            {f === "sugerencia" && `Sugerencias (${items.filter((i) => i.tipo === "sugerencia").length})`}
            {f === "reclamo" && `Reclamos (${items.filter((i) => i.tipo === "reclamo").length})`}
            {f === "no_leidas" && `Sin leer (${noLeidas})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : visibles.length === 0 ? (
        <p>No hay mensajes en este filtro.</p>
      ) : (
        visibles.map((s) => (
          <div
            className="cotizacion-resumen-card"
            key={s.id}
            style={{ opacity: s.leido ? 0.7 : 1 }}
          >
            <div className="cotizacion-resumen-main">
              <div className="cotizacion-resumen-info">
                <strong>
                  {s.nombre}
                  {!s.leido && (
                    <span className="rol-badge danger" style={{ marginLeft: 8 }}>
                      Nuevo
                    </span>
                  )}
                </strong>
                <span className="meta">{s.correo || "sin correo"}</span>
                <span className="meta">{new Date(s.creado_en).toLocaleString("es-PE")}</span>
                <p style={{ marginTop: 8, fontSize: 13.5 }}>{s.mensaje}</p>
              </div>
              <div className="cotizacion-resumen-tags">
                <span className={`rol-badge ${s.tipo === "reclamo" ? "danger" : "cliente"}`}>
                  <MessageSquare size={12} style={{ verticalAlign: "-2px" }} />{" "}
                  {s.tipo === "reclamo" ? "Reclamo" : "Sugerencia"}
                </span>
              </div>
            </div>

            <div className="cotizacion-resumen-actions">
              <button
                className="btn-admin small"
                onClick={() => marcarLeido(s)}
                data-tooltip={s.leido ? "Marcar como no leído" : "Marcar como leído"}
              >
                <Check size={14} /> {s.leido ? "Marcar sin leer" : "Marcar leído"}
              </button>
              {s.correo && (
                <button
                  className="btn-admin small"
                  onClick={() => abrirGmailCompose({ to: s.correo!, subject: `Sobre tu ${s.tipo}` })}
                  data-tooltip="Responderle por correo"
                >
                  <Mail size={14} /> Responder
                </button>
              )}
              <button
                className="btn-admin danger small"
                onClick={() => eliminar(s.id)}
                data-tooltip="Elimina este mensaje permanentemente"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
