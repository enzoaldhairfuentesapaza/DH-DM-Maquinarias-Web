import ExcelTools from "./ExcelTools";
import type { QuoteDetail, QuoteProduct } from "../../types/content";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Trash2, Eye, Package, Truck, MessageCircle, Search } from "lucide-react";
import { api } from "../../api/client";
import { useFeedback } from "../../context/FeedbackContext";
import "./admin.css";

interface Cotizacion {
  id: number;
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente: string | null;
  empresa: string | null;
  detalle: QuoteDetail;
  estado: "pendiente" | "respondida" | "denegada";
  respuesta: string | null;
  motivo_denegacion: string | null;
  origen: string;
  creado_en: string;
  usuario_id: number | null;
}

const FILTROS = ["todas", "pendiente", "respondida", "denegada"] as const;
const TIPOS = ["todas", "productos", "contacto"] as const;

const ORIGEN_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  correo: "Correo",
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
  return productos.reduce((acc: number, p: QuoteProduct) => acc + (Number(p.cantidad) || 1), 0);
}

/** Desglosa cuántas unidades de repuestos y cuántas de maquinaria trae la solicitud. */
function resumenTipos(c: Cotizacion): { repuestos: number; maquinarias: number } | null {
  const productos = c.detalle?.productos;
  if (!Array.isArray(productos)) return null;
  let repuestos = 0;
  let maquinarias = 0;
  for (const p of productos) {
    const cant = Number(p.cantidad) || 1;
    if (p.tipo === "maquinaria") maquinarias += cant;
    else repuestos += cant;
  }
  return { repuestos, maquinarias };
}

export default function Cotizaciones() {
  const feedback = useFeedback();
  const [params,setParams] = useSearchParams();
  const grupo = params.get("tipo") === "maquinaria" ? "maquinaria" : "repuesto";
  const [items, setItems] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("todas");
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]>("todas");
  const [busqueda, setBusqueda] = useState("");

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

  async function handleEliminar(id: number, nombre: string) {
    const motivo = await feedback.prompt({
      title: "Mover a la papelera",
      message: `Esta solicitud de ${nombre} se moverá a la papelera; solo el owner puede verla ahí. Cuéntanos brevemente el motivo:`,
      placeholder: "Ej. Solicitud duplicada / cliente canceló el pedido",
      confirmLabel: "Eliminar solicitud",
      danger: true,
      required: true,
    });
    if (motivo === null) return; // canceló
    try {
      await api.delete(`/api/cotizaciones/${id}`, { motivo });
      setItems((prev) => prev.filter((i) => i.id !== id));
      feedback.success("La solicitud se movió a la papelera.");
    } catch (err) {
      feedback.error(err instanceof Error ? err.message : "Error al eliminar la solicitud.");
    }
  }

  const groupItems = useMemo(() => items.filter(i => {
    const types = resumenTipos(i);
    return grupo === "maquinaria" ? !!types && types.maquinarias > 0 : !types || types.repuestos > 0 || types.maquinarias === 0;
  }), [items,grupo]);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return groupItems.filter((i) => {
      if (filtro !== "todas" && i.estado !== filtro) return false;
      if (tipo === "productos" && i.origen === "contacto") return false;
      if (tipo === "contacto" && i.origen !== "contacto") return false;
      if (!texto) return true;
      return (
        i.nombre_cliente?.toLowerCase().includes(texto) ||
        i.email_cliente?.toLowerCase().includes(texto) ||
        (i.telefono_cliente ?? "").toLowerCase().includes(texto) ||
        (i.empresa ?? "").toLowerCase().includes(texto) ||
        String(i.id).includes(texto)
      );
    });
  }, [groupItems, filtro, tipo, busqueda]);

  const totalContacto = groupItems.filter((i) => i.origen === "contacto").length;
  const totalProductos = groupItems.length - totalContacto;

  return (
    <div>
      <ExcelTools key={grupo} scope={grupo} entity="cotizaciones" onImported={() => window.location.reload()} />
      <div className="admin-header-row">
        <div>
          <h1>Cotizaciones de {grupo === "maquinaria" ? "maquinaria" : "repuestos"}</h1>
          <p className="subtitle">
            Solicitudes de cotización (WhatsApp / correo / página) y consultas del formulario de contacto.
          </p>
        </div>
        <Link to="/admin/ventas-cotizaciones" className="btn-admin outline">
          Volver
        </Link>
      </div>

      <div className="quote-group-tabs"><button className={grupo==="repuesto"?"active":""} onClick={()=>setParams({tipo:"repuesto"})}><Package size={17}/>Repuestos y otros</button><button className={grupo==="maquinaria"?"active":""} onClick={()=>setParams({tipo:"maquinaria"})}><Truck size={17}/>Maquinaria</button></div>
      <div className="admin-search-bar">
        <Search size={16} />
        <input
          type="text"
          placeholder="Buscar por nombre, correo, teléfono, empresa o N°..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div
        className="admin-tabs"
        data-tooltip="Separa las cotizaciones de productos (carrito) de las consultas generales (formulario de contacto)"
      >
        {TIPOS.map((t) => (
          <button key={t} className={tipo === t ? "active" : ""} onClick={() => setTipo(t)}>
            {t === "todas" && `Todas (${groupItems.length})`}
            {t === "productos" && (
              <>
                <Package size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                Desde el carrito ({totalProductos})
              </>
            )}
            {t === "contacto" && (
              <>
                <MessageCircle size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                Desde Contacto ({totalContacto})
              </>
            )}
          </button>
        ))}
      </div>

      <p className="quote-origin-help"><strong>Origen de la solicitud:</strong> “Desde el carrito” reúne los productos seleccionados para cotizar por WhatsApp, correo o la página. “Desde Contacto” reúne las consultas generales del formulario de Contacto; aparecen en Repuestos y otros.</p>

      <div className="admin-tabs">
        {FILTROS.map((f) => (
          <button key={f} className={filtro === f ? "active" : ""} onClick={() => setFiltro(f)}>
            {f === "todas" ? "Todas" : f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== "todas" && ` (${groupItems.filter((i) => i.estado === f).length})`}
          </button>
        ))}
      </div>

      {error && <div className="admin-error">{error}</div>}
      {loading ? (
        <p>Cargando...</p>
      ) : visibles.length === 0 ? (
        <p>No hay solicitudes en este filtro/búsqueda.</p>
      ) : (
        visibles.map((c) => {
          const cant = cantidadProductos(c);
          const tipos = resumenTipos(c);
          const esContacto = c.origen === "contacto";
          return (
            <div className="cotizacion-resumen-card" key={c.id}>
              <div className="cotizacion-resumen-main">
                <div className="cotizacion-resumen-info">
                  <strong>
                    {c.nombre_cliente}
                    {!c.usuario_id && (
                      <span className="rol-badge danger" style={{ marginLeft: 8 }}>
                        Sin cuenta
                      </span>
                    )}
                  </strong>
                  <span className="meta">
                    {c.email_cliente || "sin correo"}
                    {c.telefono_cliente ? ` · ${c.telefono_cliente}` : ""}
                    {c.empresa ? ` · ${c.empresa}` : ""}
                  </span>
                  <span className="meta">{new Date(c.creado_en).toLocaleString("es-PE")}</span>
                </div>
                <div className="cotizacion-resumen-tags">
                  {tipos && tipos.repuestos > 0 && tipos.maquinarias > 0 && <span className="duplicate-tag">Solicitud antigua mixta · visible en ambas bandejas</span>}
                  <span className="rol-badge admin">{ORIGEN_LABELS[c.origen] ?? c.origen}</span>
                  {esContacto ? (
                    <span className="rol-badge cliente">
                      <MessageCircle size={12} style={{ verticalAlign: "-2px" }} /> Consulta general
                    </span>
                  ) : tipos && (tipos.repuestos > 0 || tipos.maquinarias > 0) ? (
                    <span
                      className="rol-badge cliente"
                      data-tooltip={
                        tipos.repuestos > 0 && tipos.maquinarias > 0
                          ? "Esta solicitud combina repuestos y maquinaria"
                          : tipos.maquinarias > 0
                            ? "Esta solicitud es solo de maquinaria"
                            : "Esta solicitud es solo de repuestos"
                      }
                    >
                      {tipos.repuestos > 0 && tipos.maquinarias > 0 ? (
                        <>
                          <Package size={12} style={{ verticalAlign: "-2px" }} /> {tipos.repuestos} repuesto(s) +{" "}
                          <Truck size={12} style={{ verticalAlign: "-2px" }} /> {tipos.maquinarias} máquina(s)
                        </>
                      ) : tipos.maquinarias > 0 ? (
                        <>
                          <Truck size={12} style={{ verticalAlign: "-2px" }} /> {tipos.maquinarias} máquina(s)
                        </>
                      ) : (
                        <>
                          <Package size={12} style={{ verticalAlign: "-2px" }} /> {tipos.repuestos} repuesto(s)
                        </>
                      )}
                    </span>
                  ) : (
                    <span className="rol-badge cliente">
                      <Package size={12} style={{ verticalAlign: "-2px" }} /> {cant ?? "?"} producto(s)
                    </span>
                  )}
                  <span
                    className={`estado-badge ${c.estado}`}
                    data-tooltip={
                      c.estado === "pendiente"
                        ? "Todavía no se ha respondido"
                        : c.estado === "respondida"
                          ? "Ya se le envió una respuesta al cliente"
                          : "Se rechazó esta solicitud"
                    }
                  >
                    {labelEstado(c.estado, c.origen)}
                  </span>
                </div>
              </div>

              {/* Aceptar/Rechazar solo se hacen dentro del detalle, con motivo si aplica. */}
              <div className="cotizacion-resumen-actions">
                <Link
                  to={`/admin/cotizaciones/${c.id}`}
                  className="btn-admin small"
                  data-tooltip="Abre el detalle para revisar, responder o denegar esta solicitud"
                >
                  <Eye size={14} /> Evaluar
                </Link>
                <button
                  className="btn-admin danger small"
                  onClick={() => handleEliminar(c.id, c.nombre_cliente)}
                  data-tooltip="Mueve la solicitud a la papelera"
                >
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
