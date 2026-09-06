import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Eye, Package, MessageCircle } from "lucide-react";
import { api } from "../../api/client";
import "./admin.css";

interface Cotizacion {
  id: number;
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente: string | null;
  empresa: string | null;
  detalle: Record<string, any>;
  estado: "pendiente" | "respondida" | "denegada";
  respuesta: string | null;
  motivo_denegacion: string | null;
  origen: string;
  creado_en: string;
}

const FILTROS = ["todas", "pendiente", "respondida", "denegada"] as const;

const ORIGEN_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  pagina: "Por la página",
  contacto: "Formulario de contacto",
  web: "Web",
};

function labelEstado(estado: string, origen: string) {
  if (origen === "contacto") {
    if (estado === "pendiente") return "En espera";
    if (estado === "respondida") return "Atendida";
    if (estado === "denegada") return "Descartada";
  }
  return estado.charAt(0).toUpperCase() + estado.slice(1);
}

function cantidadProductos(c: Cotizacion): number | null {
  const productos = c.detalle?.productos;
  if (!Array.isArray(productos)) return null;
  return productos.reduce((acc: number, p: any) => acc + (Number(p.cantidad) || 1), 0);
}

export default function Cotizaciones() {
  const [items, setItems] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("todas");
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<Cotizacion[]>("/api/cotizaciones");
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  async function updateEstado(id: number, estado: "pendiente" | "respondida" | "denegada") {
    setSavingId(id);
    try {
      const updated = await api.put<Cotizacion>(`/api/cotizaciones/${id}/estado`, { estado });
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSavingId(null);
    }
  }

  async function handleEliminar(id: number) {
    if (!confirm("¿Eliminar esta solicitud? Esta acción no se puede deshacer (útil para spam).")) return;
    try {
      await api.delete(`/api/cotizaciones/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  const visibles = items.filter((i) => filtro === "todas" || i.estado === filtro);

  return (
    <div>
      <div className="admin-header-row">
        <div>
          <h1>Cotizaciones recibidas</h1>
          <p className="subtitle">
            Solicitudes de cotización (WhatsApp / página) y consultas del formulario de contacto.
          </p>
        </div>
        <Link to="/admin/ventas-cotizaciones" className="btn-admin outline">
          Volver
        </Link>
      </div>

      <div className="admin-tabs">
        {FILTROS.map((f) => (
          <button key={f} className={filtro === f ? "active" : ""} onClick={() => setFiltro(f)}>
            {f === "todas" ? "Todas" : f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== "todas" && ` (${items.filter((i) => i.estado === f).length})`}
          </button>
        ))}
      </div>

      {error && <div className="admin-error">{error}</div>}
      {loading ? (
        <p>Cargando...</p>
      ) : visibles.length === 0 ? (
        <p>No hay solicitudes en este filtro.</p>
      ) : (
        visibles.map((c) => {
          const cant = cantidadProductos(c);
          const esContacto = c.origen === "contacto";
          return (
            <div className="cotizacion-resumen-card" key={c.id}>
              <div className="cotizacion-resumen-main">
                <div className="cotizacion-resumen-info">
                  <strong>{c.nombre_cliente}</strong>
                  <span className="meta">
                    {c.email_cliente || "sin correo"}
                    {c.telefono_cliente ? ` · ${c.telefono_cliente}` : ""}
                    {c.empresa ? ` · ${c.empresa}` : ""}
                  </span>
                  <span className="meta">{new Date(c.creado_en).toLocaleString("es-PE")}</span>
                </div>
                <div className="cotizacion-resumen-tags">
                  <span className="rol-badge admin">{ORIGEN_LABELS[c.origen] ?? c.origen}</span>
                  {esContacto ? (
                    <span className="rol-badge cliente">
                      <MessageCircle size={12} style={{ verticalAlign: "-2px" }} /> Consulta general
                    </span>
                  ) : (
                    <span className="rol-badge cliente">
                      <Package size={12} style={{ verticalAlign: "-2px" }} /> {cant ?? "?"} producto(s)
                    </span>
                  )}
                  <span className={`estado-badge ${c.estado}`}>{labelEstado(c.estado, c.origen)}</span>
                </div>
              </div>

              <div className="cotizacion-resumen-actions">
                <Link to={`/admin/cotizaciones/${c.id}`} className="btn-admin small">
                  <Eye size={14} /> Evaluar
                </Link>
                {c.estado !== "respondida" && (
                  <button
                    className="btn-admin yellow small"
                    disabled={savingId === c.id}
                    onClick={() => updateEstado(c.id, "respondida")}
                  >
                    {esContacto ? "Atender" : "Aceptar"}
                  </button>
                )}
                {c.estado !== "denegada" && (
                  <button
                    className="btn-admin outline small"
                    disabled={savingId === c.id}
                    onClick={() => updateEstado(c.id, "denegada")}
                  >
                    {esContacto ? "Descartar" : "Rechazar"}
                  </button>
                )}
                <button className="btn-admin danger small" onClick={() => handleEliminar(c.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
