import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, RotateCcw } from "lucide-react";
import { api } from "../../api/client";
import { useFeedback } from "../../context/FeedbackContext";
import "./admin.css";

interface CotizacionEliminada {
  id: number;
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente: string | null;
  estado: string;
  eliminado_en: string;
  eliminado_por_nombre: string | null;
  motivo_eliminacion: string | null;
  creado_en: string;
}

export default function Papelera() {
  const feedback = useFeedback();
  const [items, setItems] = useState<CotizacionEliminada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<CotizacionEliminada[]>("/api/cotizaciones/papelera");
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la papelera");
    } finally {
      setLoading(false);
    }
  }

  async function handleRestaurar(id: number) {
    const ok = await feedback.confirm({
      title: "Restaurar solicitud",
      message: "Volverá a aparecer en la lista de cotizaciones.",
      confirmLabel: "Sí, restaurar",
    });
    if (!ok) return;
    try {
      await api.put(`/api/cotizaciones/${id}/restaurar`, {});
      setItems((prev) => prev.filter((i) => i.id !== id));
      feedback.success("La solicitud se restauró.");
    } catch (err) {
      feedback.error(err instanceof Error ? err.message : "Error al restaurar.");
    }
  }

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return items;
    return items.filter(
      (i) =>
        i.nombre_cliente?.toLowerCase().includes(texto) ||
        i.email_cliente?.toLowerCase().includes(texto) ||
        (i.eliminado_por_nombre ?? "").toLowerCase().includes(texto) ||
        (i.motivo_eliminacion ?? "").toLowerCase().includes(texto),
    );
  }, [items, busqueda]);

  return (
    <div>
      <div className="admin-header-row">
        <div>
          <h1>Papelera de cotizaciones</h1>
          <p className="subtitle">
            Solicitudes eliminadas por el equipo. Solo el owner puede ver esta lista.
          </p>
        </div>
        <Link to="/admin/cotizaciones" className="btn-admin outline">
          <ArrowLeft size={16} /> Volver
        </Link>
      </div>

      <div className="admin-search-bar">
        <Search size={16} />
        <input
          type="text"
          placeholder="Buscar por cliente, quién lo eliminó o motivo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {error && <div className="admin-error">{error}</div>}
      {loading ? (
        <p>Cargando...</p>
      ) : visibles.length === 0 ? (
        <p>No hay solicitudes en la papelera.</p>
      ) : (
        visibles.map((c) => (
          <div className="papelera-row" key={c.id}>
            <strong>
              {c.nombre_cliente} <span className="meta">#{c.id}</span>
            </strong>
            <p className="meta">
              {c.email_cliente}
              {c.telefono_cliente ? ` · ${c.telefono_cliente}` : ""}
            </p>
            <p style={{ fontSize: 13.5, margin: "8px 0" }}>
              <strong>Motivo:</strong> {c.motivo_eliminacion || "(sin especificar)"}
            </p>
            <p className="meta">
              Eliminado por <strong>{c.eliminado_por_nombre || "desconocido"}</strong> el{" "}
              {new Date(c.eliminado_en).toLocaleString("es-PE")}
            </p>
            <button
              className="btn-admin outline small"
              style={{ marginTop: 10 }}
              onClick={() => handleRestaurar(c.id)}
              data-tooltip="Devuelve esta solicitud a la lista de cotizaciones"
            >
              <RotateCcw size={14} /> Restaurar
            </button>
          </div>
        ))
      )}
    </div>
  );
}
