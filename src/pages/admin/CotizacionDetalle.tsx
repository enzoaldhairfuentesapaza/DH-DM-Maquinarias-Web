import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Truck, Mail, Phone, Building2, FileText } from "lucide-react";
import { api, API_URL } from "../../api/client";
import { useMaquinarias, useRepuestos } from "../../hooks/useApiData";
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

const ORIGEN_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  pagina: "Por la página",
  contacto: "Formulario de contacto",
  web: "Web",
};

export default function CotizacionDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: maquinarias } = useMaquinarias();
  const { data: repuestos } = useRepuestos();

  const [c, setC] = useState<Cotizacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<Cotizacion>(`/api/cotizaciones/${id}`);
      setC(data);
      setRespuesta(data.respuesta ?? "");
      setMotivo(data.motivo_denegacion ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  async function updateEstado(estado: "pendiente" | "respondida" | "denegada") {
    if (!c) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = { estado };
      if (estado === "respondida") body.respuesta = respuesta;
      if (estado === "denegada") body.motivo_denegacion = motivo;
      const updated = await api.put<Cotizacion>(`/api/cotizaciones/${c.id}/estado`, body);
      setC(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSaving(false);
    }
  }

  async function handleEliminar() {
    if (!c) return;
    if (!confirm("¿Eliminar esta solicitud? Esta acción no se puede deshacer.")) return;
    try {
      await api.delete(`/api/cotizaciones/${c.id}`);
      navigate("/admin/cotizaciones");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  if (loading) return <p>Cargando...</p>;
  if (error) return <div className="admin-error">{error}</div>;
  if (!c) return <p>No encontrada.</p>;

  const esContacto = c.origen === "contacto";
  const productos: any[] = Array.isArray(c.detalle?.productos) ? c.detalle.productos : [];

  function buscarProducto(p: any) {
    if (p.tipo === "maquinaria") {
      const idNum = Number(String(p.codigo ?? "").replace("MAQ-", "")) || undefined;
      return maquinarias.find((m) => m.id === idNum || m.nombre === p.nombre);
    }
    return repuestos.find((r) => r.codigo === p.codigo || r.nombre === p.nombre);
  }

  return (
    <div>
      <div className="admin-header-row">
        <div>
          <p className="subtitle" style={{ marginBottom: 4 }}>
            <Link to="/admin/cotizaciones" style={{ color: "#999" }}>
              Cotizaciones recibidas
            </Link>{" "}
            / #{c.id}
          </p>
          <h1>{esContacto ? "Consulta de contacto" : "Solicitud de cotización"}</h1>
        </div>
        <Link to="/admin/cotizaciones" className="btn-admin outline">
          <ArrowLeft size={16} /> Volver a la lista
        </Link>
      </div>

      <div className="cotizacion-detalle-grid">
        <div>
          <div className="admin-form" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 14, fontSize: 16 }}>Información del cliente</h3>
            <p className="detalle-info-row"><strong>{c.nombre_cliente}</strong></p>
            <p className="detalle-info-row"><Mail size={14} /> {c.email_cliente || "No registrado"}</p>
            {c.telefono_cliente && (
              <p className="detalle-info-row"><Phone size={14} /> {c.telefono_cliente}</p>
            )}
            {(c.empresa || c.detalle?.razon_social) && (
              <p className="detalle-info-row"><Building2 size={14} /> {c.empresa || c.detalle.razon_social}</p>
            )}
            {c.detalle?.tipo_documento && (
              <p className="detalle-info-row">
                <FileText size={14} /> {c.detalle.tipo_documento === "ruc" ? "RUC" : "DNI"}: {c.detalle.numero_documento}
              </p>
            )}
            <p className="detalle-info-row meta">
              Canal: {ORIGEN_LABELS[c.origen] ?? c.origen} · {new Date(c.creado_en).toLocaleString("es-PE")}
            </p>
          </div>

          {esContacto ? (
            <div className="admin-form">
              <h3 style={{ marginBottom: 14, fontSize: 16 }}>Mensaje</h3>
              {c.detalle?.asunto && <p style={{ marginBottom: 10 }}><strong>Asunto:</strong> {c.detalle.asunto}</p>}
              <p style={{ whiteSpace: "pre-wrap", color: "#444" }}>{c.detalle?.mensaje || "(sin mensaje)"}</p>
            </div>
          ) : (
            <div className="admin-form">
              <h3 style={{ marginBottom: 14, fontSize: 16 }}>Productos solicitados ({productos.length})</h3>
              {productos.length === 0 ? (
                <p>No se registraron productos.</p>
              ) : (
                <div className="detalle-productos-grid">
                  {productos.map((p, i) => {
                    const match = buscarProducto(p);
                    const imagen = match?.imagen;
                    const linkTo = p.tipo === "maquinaria" ? `/maquinaria/${match?.id}` : `/repuestos/${match?.id}`;
                    return (
                      <div className="detalle-producto-card" key={i}>
                        <div className="detalle-producto-media">
                          {imagen ? (
                            <img src={imagen.startsWith("/uploads") ? `${API_URL}${imagen}` : imagen} alt={p.nombre} />
                          ) : p.tipo === "maquinaria" ? (
                            <Truck size={26} />
                          ) : (
                            <Package size={26} />
                          )}
                        </div>
                        <div>
                          <strong>{p.nombre}</strong>
                          <p className="meta">
                            {p.codigo ? `Código: ${p.codigo} · ` : ""}
                            Cantidad: {p.cantidad ?? 1} ·{" "}
                            {p.tipo === "maquinaria" ? "Maquinaria" : "Repuesto"}
                          </p>
                          {match && (
                            <Link to={linkTo} target="_blank" className="detalle-producto-link">
                              Ver producto en el sitio →
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="admin-form">
            <h3 style={{ marginBottom: 14, fontSize: 16 }}>
              Estado: <span className={`estado-badge ${c.estado}`}>{c.estado}</span>
            </h3>

            {c.respuesta && (
              <p style={{ marginBottom: 10, fontSize: 13.5 }}><strong>Respuesta guardada:</strong> {c.respuesta}</p>
            )}
            {c.motivo_denegacion && (
              <p style={{ marginBottom: 10, fontSize: 13.5, color: "#c0392b" }}>
                <strong>Motivo:</strong> {c.motivo_denegacion}
              </p>
            )}

            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              Respuesta ({esContacto ? "al atender" : "al aceptar"})
              <textarea
                style={{ width: "100%", marginTop: 6, padding: 10, border: "1.5px solid #e4e4e4", borderRadius: 8, minHeight: 70 }}
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                placeholder="Ej. Se cotizó por WhatsApp, precio S/ ..."
              />
            </label>

            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              Motivo ({esContacto ? "al descartar" : "al rechazar"})
              <textarea
                style={{ width: "100%", marginTop: 6, padding: 10, border: "1.5px solid #e4e4e4", borderRadius: 8, minHeight: 70 }}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Sin stock disponible / mensaje de spam"
              />
            </label>

            <div className="cotizacion-actions">
              {c.estado !== "pendiente" && (
                <button className="btn-admin outline small" disabled={saving} onClick={() => updateEstado("pendiente")}>
                  Marcar {esContacto ? "en espera" : "pendiente"}
                </button>
              )}
              {c.estado !== "respondida" && (
                <button className="btn-admin yellow small" disabled={saving} onClick={() => updateEstado("respondida")}>
                  {esContacto ? "Marcar como atendida" : "Aceptar / Marcar como respondida"}
                </button>
              )}
              {c.estado !== "denegada" && (
                <button className="btn-admin outline small" disabled={saving} onClick={() => updateEstado("denegada")}>
                  {esContacto ? "Descartar" : "Rechazar"}
                </button>
              )}
            </div>

            <button className="btn-admin danger small" style={{ marginTop: 14 }} onClick={handleEliminar}>
              Eliminar solicitud
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
