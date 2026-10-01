import type { QuoteDetail, QuoteProduct } from "../../types/content";
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Truck,
  Mail,
  Phone,
  Building2,
  FileText,
  Paperclip,
  UserX,
  UserCheck,
  MessageCircle,
  Globe,
  Ban,
  HelpCircle,
  X,
  CheckCircle2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { api, resolveApiAsset, downloadApiFile } from "../../api/client";
import { useMaquinarias, useRepuestos } from "../../hooks/useApiData";
import { useFeedback } from "../../context/FeedbackContext";
import { abrirWebmailPanel } from "../../utils/email";
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
  archivo_respuesta: string | null;
  canal_respuesta: string | null;
  mostrar_en_pagina: boolean;
  origen: string;
  creado_en: string;
  usuario_id: number | null;
}

const ORIGEN_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  correo: "Correo",
  pagina: "Por la página",
  contacto: "Formulario de contacto",
  web: "Web",
};


const AYUDA_KEY = "hdm_ayuda_evaluar_cotizacion_oculta";

export default function CotizacionDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: maquinarias } = useMaquinarias();
  const { data: repuestos } = useRepuestos();
  const feedback = useFeedback();
  const [mostrarAyuda, setMostrarAyuda] = useState(() => localStorage.getItem(AYUDA_KEY) !== "1");

  const [c, setC] = useState<Cotizacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);

  // Canales por los que se respondió: no son excluyentes, se pueden marcar varios.
  const [canales, setCanales] = useState<Set<"whatsapp" | "correo" | "pagina">>(new Set());
  // Por defecto SI se notifica en la página; si la cotización ya fue
  // respondida/denegada antes, respetamos lo que quedó guardado.
  const [mostrarEnPagina, setMostrarEnPagina] = useState(true);
  // Toggle rojo: al activarlo se bloquea el formulario normal y se pide el motivo.
  const [denegando, setDenegando] = useState(false);

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
      // Si ya se respondió/denegó antes, respeta lo que quedó guardado.
      // Si sigue pendiente, se deja el valor por defecto (activado).
      if (data.estado !== "pendiente") {
        setMostrarEnPagina(!!data.mostrar_en_pagina);
      }
      setDenegando(data.estado === "denegada");
      const canalesGuardados = (data.canal_respuesta ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean) as ("whatsapp" | "correo" | "pagina")[];
      setCanales(new Set(canalesGuardados));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  function toggleCanal(canal: "whatsapp" | "correo" | "pagina") {
    if (canal === "pagina" && !c?.usuario_id) return; // bloqueado: cliente sin cuenta
    setCanales((prev) => {
      const next = new Set(prev);
      if (next.has(canal)) next.delete(canal);
      else next.add(canal);
      return next;
    });
  }

  function construirMensajeRespuesta(): string {
    const saludo = `Hola ${c?.nombre_cliente ?? ""}, gracias por escoger a DH & DM Maquinarias.`;
    const cuerpo = denegando
      ? motivo || "Lamentablemente no podremos atender tu solicitud en esta ocasión."
      : respuesta || "Adjuntamos el detalle de tu cotización.";
    return `${saludo}\n\n${cuerpo}\n\n— Equipo DH & DM Maquinarias SAC.`;
  }

  function abrirWhatsapp() {
    if (!c?.telefono_cliente) return;
    const numero = c.telefono_cliente.replace(/\D/g, "");
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(construirMensajeRespuesta())}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function abrirCorreo() {
    if (!c?.email_cliente) return;
    const asunto = denegando
      ? `Sobre tu cotización #${c.id} - DH & DM Maquinarias`
      : `Tu cotización #${c.id} - DH & DM Maquinarias`;
    const mensajeCompleto = `Para: ${c.email_cliente}\nAsunto: ${asunto}\n\n${construirMensajeRespuesta()}`;
    // El correo del negocio se maneja desde el webmail del hosting (Webuzo),
    // no desde Gmail. Ese webmail no admite rellenar un "Nuevo mensaje" desde
    // una URL externa, así que abrimos la bandeja y copiamos el mensaje ya
    // armado (destinatario, asunto y cuerpo) para pegarlo directamente.
    const copiado = await abrirWebmailPanel(mensajeCompleto);
    if (copiado) {
      feedback.success(
        "Se abrió el correo del panel en una pestaña nueva y copiamos el mensaje (destinatario, asunto y cuerpo). Solo pégalo en un mensaje nuevo.",
        "Mensaje copiado",
      );
    } else {
      feedback.warning(
        "Se abrió el correo del panel, pero no pudimos copiar el mensaje automáticamente. Cópialo desde aquí:\n\n" + mensajeCompleto,
        "Copia el mensaje manualmente",
      );
    }
  }

  function handleClickCanal(canal: "whatsapp" | "correo" | "pagina") {
    toggleCanal(canal);
    // Ademas de marcar el canal, abrimos la herramienta correspondiente para
    // redactar/enviar el mensaje. Ninguno de los tres saca de la pantalla.
    if (canal === "whatsapp") abrirWhatsapp();
    if (canal === "correo") abrirCorreo();
  }

  async function guardar(estadoFinal: "pendiente" | "respondida" | "denegada") {
    if (!c) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append("estado", estadoFinal);
      if (estadoFinal === "denegada") {
        form.append("motivo_denegacion", motivo);
      } else {
        form.append("respuesta", respuesta);
      }
      if (canales.size > 0) form.append("canal", Array.from(canales).join(","));
      form.append("mostrar_en_pagina", mostrarEnPagina && c.usuario_id ? "1" : "");
      if (archivo) form.append("archivo", archivo);
      const updated = await api.post<Cotizacion>(`/api/cotizaciones/${c.id}/responder`, form);
      setC(updated);
      setArchivo(null);
      if (estadoFinal === "pendiente") {
        feedback.info("La solicitud volvió a estar pendiente de respuesta.", "Estado actualizado");
      } else if (estadoFinal === "denegada") {
        feedback.warning("Se guardó el rechazo. Recuerda enviarlo por el canal elegido.", "Solicitud denegada");
      } else {
        feedback.success(
          esContacto ? "La consulta quedó marcada como atendida." : "La cotización quedó marcada como respondida.",
          "Guardado",
        );
      }
    } catch (err) {
      feedback.error(err instanceof Error ? err.message : "Error al actualizar la solicitud.");
    } finally {
      setSaving(false);
    }
  }

  function handleToggleDenegar() {
    setDenegando((d) => !d);
  }

  async function handleVolverPendiente() {
    const ok = await feedback.confirm({
      title: "¿Volver a marcar como pendiente?",
      message:
        "La solicitud volverá a aparecer como pendiente de respuesta. Esto no borra la respuesta ni el archivo que ya guardaste, por si quieres retomarlos.",
      confirmLabel: "Sí, volver a pendiente",
      cancelLabel: "Cancelar",
    });
    if (!ok) return;
    setDenegando(false);
    await guardar("pendiente");
  }

  async function handleEliminar() {
    if (!c) return;
    const motivoEliminacion = await feedback.prompt({
      title: "Mover a la papelera",
      message: "Esta solicitud se moverá a la papelera (solo el owner puede verla ahí). Cuéntanos brevemente por qué la eliminas:",
      placeholder: "Ej. Solicitud duplicada / cliente canceló el pedido",
      confirmLabel: "Eliminar solicitud",
      danger: true,
      required: true,
    });
    if (motivoEliminacion === null) return; // canceló
    try {
      await api.delete(`/api/cotizaciones/${c.id}`, { motivo: motivoEliminacion });
      feedback.success("La solicitud se movió a la papelera.");
      navigate("/admin/cotizaciones");
    } catch (err) {
      feedback.error(err instanceof Error ? err.message : "Error al eliminar la solicitud.");
    }
  }

  if (loading) return <p>Cargando...</p>;
  if (error) return <div className="admin-error">{error}</div>;
  if (!c) return <p>No encontrada.</p>;

  const esContacto = c.origen === "contacto";
  const productos: QuoteProduct[] = Array.isArray(c.detalle?.productos) ? c.detalle.productos : [];

  function buscarProducto(p: QuoteProduct) {
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
        <div style={{ display: "flex", gap: 8 }}>
          {!mostrarAyuda && (
            <button
              type="button"
              className="btn-admin outline small"
              data-tooltip="Vuelve a mostrar la guía de esta pantalla"
              onClick={() => setMostrarAyuda(true)}
            >
              <HelpCircle size={15} /> Ayuda
            </button>
          )}
          <Link
            to="/admin/cotizaciones"
            className="btn-admin outline"
            data-tooltip="Regresa a la lista de cotizaciones recibidas"
          >
            <ArrowLeft size={16} /> Volver a la lista
          </Link>
        </div>
      </div>

      {mostrarAyuda && (
        <div className="ayuda-evaluar-box">
          <button
            type="button"
            className="ayuda-evaluar-cerrar"
            aria-label="Cerrar ayuda"
            onClick={() => {
              setMostrarAyuda(false);
              localStorage.setItem(AYUDA_KEY, "1");
            }}
          >
            <X size={15} />
          </button>
          <div className="ayuda-evaluar-titulo">
            <HelpCircle size={17} /> ¿Cómo evaluar esta solicitud?
          </div>
          <div className="ayuda-evaluar-pasos">
            <div className="ayuda-paso">
              <span className="ayuda-paso-num">1</span>
              <div>
                <strong>Revisa los datos</strong>
                <p>Mira si el cliente tiene cuenta en la web y qué {esContacto ? "consulta hizo" : "productos pidió"}.</p>
              </div>
            </div>
            <div className="ayuda-paso">
              <span className="ayuda-paso-num">2</span>
              <div>
                <strong>Responde por un canal</strong>
                <p>Elige WhatsApp, correo o la página (o varios a la vez) y escribe tu respuesta o el motivo si vas a denegar.</p>
              </div>
            </div>
            <div className="ayuda-paso">
              <span className="ayuda-paso-num">3</span>
              <div>
                <strong>Guarda el estado</strong>
                <p>Marca como respondida o deniega. Si te equivocas, puedes volver a "pendiente" cuando quieras.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="cotizacion-detalle-grid">
        <div>
          <div className="admin-form" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 14, fontSize: 16 }}>Información del cliente</h3>

            {c.usuario_id ? (
              <div className="cliente-aviso registrado">
                <UserCheck size={16} />
                <span>
                  <strong>Cliente registrado.</strong> Tiene cuenta en la web, así que
                  puede recibir la respuesta en su buzón de notificaciones si activas
                  la opción "Mostrar en la página".
                </span>
              </div>
            ) : (
              <div className="cliente-aviso no-registrado">
                <UserX size={16} />
                <span>
                  <strong>Cliente NO registrado.</strong> Envió la solicitud sin tener
                  cuenta, por lo que no verá la respuesta en la web: hay que contactarlo
                  directamente por correo o teléfono/WhatsApp.
                </span>
              </div>
            )}

            <p className="detalle-info-row"><strong>{c.nombre_cliente}</strong></p>
            <p className="detalle-info-row">
              <Mail size={14} /> {c.email_cliente || "No registrado"}
            </p>
            {c.telefono_cliente && (
              <p className="detalle-info-row">
                <Phone size={14} /> {c.telefono_cliente}
              </p>
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
              Canal de solicitud: {ORIGEN_LABELS[c.origen] ?? c.origen} · {new Date(c.creado_en).toLocaleString("es-PE")}
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
                            <img src={resolveApiAsset(imagen)} alt={p.nombre} />
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
            <div className="estado-row">
              <h3 style={{ margin: 0, fontSize: 16 }}>
                Estado: <span className={`estado-badge ${c.estado}`}>{c.estado}</span>
              </h3>
              {c.estado !== "pendiente" && (
                <button
                  type="button"
                  className="btn-admin outline small"
                  data-tooltip="Reabre la solicitud para volver a responderla o corregir algo"
                  onClick={handleVolverPendiente}
                  disabled={saving}
                >
                  <RotateCcw size={14} /> Volver a pendiente
                </button>
              )}
            </div>

            {c.respuesta && (
              <p style={{ marginBottom: 10, fontSize: 13.5 }}><strong>Respuesta guardada:</strong> {c.respuesta}</p>
            )}
            {c.motivo_denegacion && (
              <p style={{ marginBottom: 10, fontSize: 13.5, color: "#c0392b" }}>
                <strong>Motivo:</strong> {c.motivo_denegacion}
              </p>
            )}
            {c.archivo_respuesta && (
              <p style={{ marginBottom: 14, fontSize: 13.5 }}>
                <a href="#" onClick={(event) => { event.preventDefault(); event.stopPropagation(); void downloadApiFile(c.archivo_respuesta!).catch((error: unknown) => window.alert(error instanceof Error ? error.message : "No se pudo descargar.")); }}
                  style={{ fontWeight: 600 }}
                >
                  <Paperclip size={13} style={{ verticalAlign: "-2px" }} /> Ver / descargar archivo enviado
                </a>
                {c.canal_respuesta && (
                  <span style={{ color: "#888" }}>
                    {" "}· enviado por{" "}
                    {c.canal_respuesta
                      .split(",")
                      .map((ch) => ORIGEN_LABELS[ch] ?? ch)
                      .join(", ")}
                  </span>
                )}
              </p>
            )}

            {/* ---- Flag: notificar al cliente en su buzón de la página ---- */}
            <div
              className="switch-row"
              data-tooltip={!c.usuario_id ? "Bloqueado: este cliente no tiene cuenta en la web." : "Actívalo para que la respuesta le llegue también a su buzón de notificaciones"}
            >
              <button
                type="button"
                role="switch"
                aria-checked={mostrarEnPagina && !!c.usuario_id}
                className={`toggle-switch ${mostrarEnPagina && c.usuario_id ? "on" : ""}`}
                disabled={!c.usuario_id}
                onClick={() => setMostrarEnPagina((v) => !v)}
              >
                <span className="toggle-switch-knob" />
              </button>
              <div className="switch-row-text">
                <strong>Avisarle al cliente en la página</strong>
                <span>
                  {!c.usuario_id
                    ? "Bloqueado: este cliente no tiene una cuenta en la web."
                    : mostrarEnPagina
                      ? "Activado: le va a llegar una notificación a su buzón con esta respuesta."
                      : "Desactivado: no verá nada en su buzón, solo por los canales que marques abajo."}
                </span>
              </div>
            </div>

            {/* ---- Los 3 canales de envío: no son excluyentes ---- */}
            <p style={{ fontSize: 12.5, fontWeight: 700, color: "#666", margin: "16px 0 8px" }}>
              Enviar respuesta por:
            </p>
            <div className="canales-envio-row">
              <button
                type="button"
                className={`canal-btn ${canales.has("whatsapp") ? "activo" : ""}`}
                onClick={() => handleClickCanal("whatsapp")}
                data-tooltip="Abre WhatsApp con el mensaje ya redactado, listo para enviar"
              >
                <MessageCircle size={15} /> WhatsApp
              </button>
              <button
                type="button"
                className={`canal-btn ${canales.has("correo") ? "activo" : ""}`}
                onClick={() => handleClickCanal("correo")}
                disabled={!c.email_cliente}
                data-tooltip={!c.email_cliente ? "El cliente no dejó un correo" : "Abre tu programa de correo con el mensaje ya redactado"}
              >
                <Mail size={15} /> Correo
              </button>
              <button
                type="button"
                className={`canal-btn ${canales.has("pagina") ? "activo" : ""}`}
                onClick={() => handleClickCanal("pagina")}
                disabled={!c.usuario_id}
                data-tooltip={!c.usuario_id ? "Bloqueado: el cliente no tiene cuenta en la web" : "Marca que también respondiste por la página"}
              >
                <Globe size={15} /> Página
              </button>
            </div>

            {!denegando ? (
              <>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginTop: 18, marginBottom: 16 }}>
                  Adjuntar archivo de la cotización (PDF u otro)
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                    style={{ display: "block", marginTop: 6 }}
                  />
                  {archivo && <span style={{ fontSize: 12, color: "#666" }}>Seleccionado: {archivo.name}</span>}
                </label>

                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                  Respuesta ({esContacto ? "al atender" : "al aceptar"})
                  <textarea
                    style={{ width: "100%", marginTop: 6, padding: 10, border: "1.5px solid #e4e4e4", borderRadius: 8, minHeight: 70 }}
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    placeholder="Ej. Se cotizó por WhatsApp, precio S/ ..."
                  />
                </label>
              </>
            ) : (
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, margin: "18px 0 16px" }}>
                Mensaje de motivo por el rechazo
                <textarea
                  style={{ width: "100%", marginTop: 6, padding: 10, border: "1.5px solid #f3c2c2", background: "#fff8f8", borderRadius: 8, minHeight: 80 }}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej. Sin stock disponible / fuera de nuestra zona de cobertura"
                />
              </label>
            )}

            <div className="cotizacion-actions">
              {c.estado !== "respondida" && !denegando && (
                <button
                  className="btn-admin yellow small"
                  disabled={saving}
                  onClick={() => guardar("respondida")}
                  data-tooltip={esContacto ? "Guarda la respuesta y avisa al cliente por los canales elegidos" : "Guarda la cotización como respondida y avisa al cliente"}
                >
                  <CheckCircle2 size={15} />{" "}
                  {saving ? "Guardando..." : esContacto ? "Marcar como atendida" : "Marcar como respondida"}
                </button>
              )}

              {denegando && (
                <button
                  className="btn-admin danger small"
                  disabled={saving || !motivo.trim()}
                  onClick={() => guardar("denegada")}
                  data-tooltip="Guarda el rechazo con el motivo escrito arriba y avisa al cliente"
                >
                  <Ban size={15} /> {saving ? "Guardando..." : "Confirmar y enviar rechazo"}
                </button>
              )}

              <button
                type="button"
                className={`btn-denegar-toggle ${denegando ? "activo" : ""}`}
                onClick={handleToggleDenegar}
                data-tooltip={denegando ? "Cancela el rechazo y vuelve al formulario normal" : "Cambia a modo rechazo para explicar por qué no se puede atender"}
              >
                <Ban size={15} /> {denegando ? "Denegar: ACTIVADO" : "Denegar"}
              </button>
            </div>

            <button
              className="btn-admin danger small"
              style={{ marginTop: 14 }}
              onClick={handleEliminar}
              data-tooltip="Mueve la solicitud a la papelera (solo el owner puede verla y restaurarla)"
            >
              <Trash2 size={14} /> Eliminar solicitud
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
