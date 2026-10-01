import "./pages.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Truck,
  Send,
  ShoppingCart,
  Globe,
  Lock,
  CheckCircle2,
  AlertCircle,
  Mail,
} from "lucide-react";
import { useCotizacion } from "../context/CotizacionContext";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import { api } from "../api/client";
import QtyInput from "../components/QtyInput";
import { abrirGmailCompose } from "../utils/email";
import { useConfiguracionSitio } from "../hooks/useApiData";

interface DatosCliente {
  nombre: string;
  telefono: string;
  correo: string;
  tipoDocumento: "dni" | "ruc";
  numeroDocumento: string;
  razonSocial: string;
}

export default function Cotizacion() {
  const { items: todosItems, quitarItem, actualizarCantidad } =
    useCotizacion();
  const { user } = useAuth();
  const { openLogin } = useAuthModal();
  const { data: config } = useConfiguracionSitio();

  const [grupo,setGrupo] = useState<"repuesto"|"maquinaria">(() => todosItems.some(i=>i.tipo!=="maquinaria") || !todosItems.length ? "repuesto" : "maquinaria");
  const items = todosItems.filter(i => grupo === "maquinaria" ? i.tipo === "maquinaria" : i.tipo !== "maquinaria");
  const vaciarCarrito = () => items.forEach(i=>quitarItem(i.uid));
  const [datos, setDatos] = useState<DatosCliente>({
    nombre: "",
    telefono: "",
    correo: "",
    tipoDocumento: "dni",
    numeroDocumento: "",
    razonSocial: "",
  });

  const [enviado, setEnviado] = useState<null | "whatsapp" | "pagina" | "correo">(null);
  const [enviando, setEnviando] = useState<null | "whatsapp" | "pagina" | "correo">(null);
  const [errorEnvio, setErrorEnvio] = useState("");
  const [confirmandoWhatsapp, setConfirmandoWhatsapp] = useState(false);
  const [confirmandoCorreo, setConfirmandoCorreo] = useState(false);

  const numeroDestino = () => grupo === "maquinaria" ? config.whatsapp_secundario : config.whatsapp_primario;

  const datosCompletos = () => {
    if (user) return true;
    if (
      !datos.nombre ||
      !datos.telefono ||
      !datos.correo ||
      !datos.numeroDocumento
    )
      return false;
    if (datos.tipoDocumento === "ruc" && !datos.razonSocial) return false;
    return true;
  };

  const construirMensajeWhatsapp = (): string => {
    let msg = `*Solicitud de Cotización de ${grupo === "maquinaria" ? "Maquinaria" : "Repuestos"} - DH & DM Maquinarias SAC.*\n\n`;
    if (user) {
      msg += `*Cliente:* ${user.nombre}\n`;
      msg += `*Correo:* ${user.email}\n`;
      if (user.telefono) msg += `*Teléfono:* ${user.telefono}\n`;
    } else {
      msg += `*Cliente:* ${datos.nombre}\n`;
      msg += `*Teléfono:* ${datos.telefono}\n`;
      msg += `*Correo:* ${datos.correo}\n`;
      msg += `*${datos.tipoDocumento === "dni" ? "DNI" : "RUC"}:* ${datos.numeroDocumento}\n`;
      if (datos.tipoDocumento === "ruc")
        msg += `*Razón social:* ${datos.razonSocial}\n`;
    }
    msg += `\n*Productos solicitados:*\n`;
    items.forEach((i, idx) => {
      msg += `${idx + 1}. ${i.nombre}${i.codigo ? ` (Cód. ${i.codigo})` : ""} — Cant: ${i.cantidad} [${
        i.tipo === "repuesto" ? "Repuesto" : "Maquinaria"
      }]\n`;
    });
    return msg;
  };

  const construirDetalleParaGuardar = () => ({
    productos: items.map((i) => ({
      nombre: i.nombre,
      codigo: i.codigo,
      tipo: i.tipo,
      cantidad: i.cantidad,
    })),
    ...(user
      ? {}
      : {
          tipo_documento: datos.tipoDocumento,
          numero_documento: datos.numeroDocumento,
          razon_social:
            datos.tipoDocumento === "ruc" ? datos.razonSocial : undefined,
        }),
  });

  const guardarSolicitud = async (origen: "whatsapp" | "pagina" | "correo") => {
    await api.post("/api/cotizaciones", {
      nombre_cliente: user ? user.nombre : datos.nombre,
      email_cliente: user ? user.email : datos.correo,
      telefono_cliente: user ? (user.telefono ?? "") : datos.telefono,
      detalle: construirDetalleParaGuardar(),
      origen,
    });
  };

  const handleEnviarWhatsapp = () => {
    if (items.length === 0) return;
    if (!datosCompletos()) {
      setErrorEnvio(
        "Completa tu nombre, teléfono, correo y documento (marcados con *) antes de enviar la solicitud.",
      );
      return;
    }
    setErrorEnvio("");
    const url = `https://wa.me/${numeroDestino()}?text=${encodeURIComponent(construirMensajeWhatsapp())}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setConfirmandoWhatsapp(true);
  };

  const handleEnviarCorreo = () => {
    if (items.length === 0) return;
    if (!datosCompletos()) {
      setErrorEnvio(
        "Completa tu nombre, teléfono, correo y documento (marcados con *) antes de enviar la solicitud.",
      );
      return;
    }
    setErrorEnvio("");
    const asunto = `Cotización de ${grupo === "maquinaria" ? "maquinaria" : "repuestos"} - DH & DM Maquinarias`;
    const cuerpo = construirMensajeWhatsapp();
    // Abrimos Gmail en una pestaña nueva con el mensaje ya armado (mailto:
    // no abre nada si no hay un programa de correo de escritorio instalado).
    abrirGmailCompose({ to: config.correo_contacto, subject: asunto, body: cuerpo });
    setConfirmandoCorreo(true);
  };

  const confirmarCorreoExitoso = async (exitoso: boolean) => {
    setConfirmandoCorreo(false);
    if (!exitoso) return;
    setEnviando("correo");
    setErrorEnvio("");
    try {
      await guardarSolicitud("correo");
      setEnviado("correo");
      vaciarCarrito();
    } catch (err) {
      setErrorEnvio(
        err instanceof Error
          ? err.message
          : "No se pudo registrar la solicitud",
      );
    } finally {
      setEnviando(null);
    }
  };

  const confirmarWhatsappExitoso = async (exitoso: boolean) => {
    setConfirmandoWhatsapp(false);
    if (!exitoso) return; // "Probar de nuevo": se mantiene el carrito y los datos tal cual
    setEnviando("whatsapp");
    setErrorEnvio("");
    try {
      await guardarSolicitud("whatsapp");
      setEnviado("whatsapp");
      vaciarCarrito();
    } catch (err) {
      setErrorEnvio(
        err instanceof Error
          ? err.message
          : "No se pudo registrar la solicitud",
      );
    } finally {
      setEnviando(null);
    }
  };

  const handleEnviarPorPagina = async () => {
    if (!user) {
      openLogin();
      return;
    }
    if (items.length === 0) return;
    setEnviando("pagina");
    setErrorEnvio("");
    try {
      await guardarSolicitud("pagina");
      setEnviado("pagina");
      vaciarCarrito();
    } catch (err) {
      setErrorEnvio(
        err instanceof Error ? err.message : "No se pudo enviar la solicitud",
      );
    } finally {
      setEnviando(null);
    }
  };

  return (
    <>
      <div className="page-banner page-banner-cotizacion">
        <div className="page-banner-inner">
          <div className="breadcrumb">
            <Link to="/">Inicio</Link> / <span>Mi cotización</span>
          </div>
          <h1>
            Mi <span>Cotización</span>
          </h1>
          <p>
            Revisa los productos y equipos seleccionados y envíanos tu
            solicitud. Un asesor se comunicará contigo para confirmar precios y
            disponibilidad.
          </p>
        </div>
      </div>

      {confirmandoWhatsapp && (
        <div className="whatsapp-confirm-overlay">
          <div className="whatsapp-confirm-box">
            <h3>¿Se logró enviar la solicitud por WhatsApp con éxito?</h3>
            <p>
              Si el mensaje se envió correctamente en WhatsApp, confirma aquí
              para vaciar únicamente este grupo de cotización.
            </p>
            <div className="whatsapp-confirm-actions">
              <button
                className="submit-quote-btn"
                onClick={() => confirmarWhatsappExitoso(true)}
              >
                Sí, se envió
              </button>
              <button
                className="submit-quote-btn"
                style={{
                  background: "#fff",
                  color: "#121212",
                  border: "1.5px solid #121212",
                }}
                onClick={() => confirmarWhatsappExitoso(false)}
              >
                Probar de nuevo
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmandoCorreo && (
        <div className="whatsapp-confirm-overlay">
          <div className="whatsapp-confirm-box">
            <h3>¿Se abrió tu programa de correo correctamente?</h3>
            <p>
              Si tu correo se abrió con el mensaje ya redactado y lo enviaste,
              confirma aquí para vaciar únicamente este grupo de cotización.
            </p>
            <div className="whatsapp-confirm-actions">
              <button
                className="submit-quote-btn"
                onClick={() => confirmarCorreoExitoso(true)}
              >
                Sí, se envió
              </button>
              <button
                className="submit-quote-btn"
                style={{
                  background: "#fff",
                  color: "#121212",
                  border: "1.5px solid #121212",
                }}
                onClick={() => confirmarCorreoExitoso(false)}
              >
                Probar de nuevo
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-body">
        <div className="quote-group-tabs"><button disabled={enviando!==null||confirmandoWhatsapp||confirmandoCorreo} className={grupo==="repuesto"?"active":""} onClick={()=>{setGrupo("repuesto");setEnviado(null);setErrorEnvio("");}}><Package size={18}/> Repuestos y otros ({todosItems.filter(i=>i.tipo!=="maquinaria").length})</button><button disabled={enviando!==null||confirmandoWhatsapp||confirmandoCorreo} className={grupo==="maquinaria"?"active":""} onClick={()=>{setGrupo("maquinaria");setEnviado(null);setErrorEnvio("");}}><Truck size={18}/> Maquinaria ({todosItems.filter(i=>i.tipo==="maquinaria").length})</button></div>
        <p className="quote-routing-note">Las solicitudes se envían por separado. {grupo==="maquinaria"?"Maquinaria: WhatsApp secundario":"Repuestos y otros: WhatsApp primario"} · +{numeroDestino()}. Los productos del otro grupo se conservan.</p>
        <div className="cotizacion-layout">
          <div>
            {items.length === 0 ? (
              <div className="cart-table">
                <div className="cart-empty">
                  <ShoppingCart
                    size={40}
                    color="#ccc"
                    style={{ marginBottom: 12 }}
                  />
                  <p>
                    Aún no has agregado productos a tu cotización.
                    <br />
                    Explora el{" "}
                    <Link to="/repuestos">catálogo de repuestos</Link> o el{" "}
                    <Link to="/maquinaria">catálogo de maquinaria</Link>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="cart-table">
                <div className="cart-toolbar">
                  <strong>{items.length} producto(s) en tu cotización</strong>
                  <button className="cart-clear-btn" onClick={vaciarCarrito}>
                    Vaciar este grupo
                  </button>
                </div>

                {items.map((item) => (
                  <div className="cart-item-row" key={item.uid}>
                    <div className="cart-item-thumb">
                      {item.imagen ? (
                        <img
                          src={item.imagen}
                          alt={item.nombre}
                          className="cart-item-img"
                          onError={(e) => {
                            // Si la imagen falla, se oculta y queda el icono de respaldo.
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : item.tipo === "repuesto" ? (
                        <Package size={22} />
                      ) : (
                        <Truck size={22} />
                      )}
                    </div>
                    <div className="cart-item-info">
                      <strong>{item.nombre}</strong>
                      <span>
                        {item.codigo ? `Código: ${item.codigo} · ` : ""}
                        {item.marca}
                      </span>
                      <span className={`cart-item-badge ${item.tipo}`}>
                        {item.tipo === "repuesto" ? "Repuesto" : "Maquinaria"}
                      </span>
                    </div>
                    <div className="cart-qty">
                      <button
                        onClick={() =>
                          actualizarCantidad(item.uid, item.cantidad - 1)
                        }
                        aria-label="Restar unidad"
                      >
                        −
                      </button>
                      <QtyInput
                        cantidad={item.cantidad}
                        onCambiar={(valor) => actualizarCantidad(item.uid, valor)}
                      />
                      <button
                        onClick={() =>
                          actualizarCantidad(item.uid, item.cantidad + 1)
                        }
                        aria-label="Sumar unidad"
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="cart-remove"
                      onClick={() => quitarItem(item.uid)}
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="quote-form-box">
            <h3>Cotizar {grupo === "maquinaria" ? "maquinaria" : "repuestos"}</h3>
            <p>
              {user
                ? "Elige cómo quieres enviar tu solicitud y un asesor te contactará a la brevedad."
                : "Completa tus datos y elige cómo quieres enviar tu solicitud."}
            </p>

            {enviado ? (
              <div className="quote-success">
                <CheckCircle2 size={40} className="quote-success-icon" />
                <h4>
                  {enviado === "whatsapp"
                    ? "¡Solicitud enviada por WhatsApp!"
                    : enviado === "correo"
                      ? "¡Solicitud enviada por correo!"
                      : "¡Solicitud enviada con éxito!"}
                </h4>
                <p>
                  {enviado === "whatsapp"
                    ? "Nuestro equipo se pondrá en contacto contigo pronto por ese medio."
                    : enviado === "correo"
                      ? "Nuestro equipo revisará tu correo y te responderá a la brevedad."
                      : "Quedó registrada en nuestro sistema; un asesor te contactará pronto para confirmar precios y disponibilidad."}
                </p>
                <button
                  className="clear-filters"
                  onClick={() => setEnviado(null)}
                >
                  Enviar otra solicitud
                </button>
              </div>
            ) : (
              <div>
                {user ? (
                  <p
                    style={{ fontSize: 13.5, color: "#666", marginBottom: 16 }}
                  >
                    Enviando como <strong>{user.nombre}</strong> ({user.email})
                  </p>
                ) : (
                  <div className="quote-form-fields">
                    <div className="form-row">
                      <label>Nombre completo *</label>
                      <input
                        value={datos.nombre}
                        onChange={(e) =>
                          setDatos({ ...datos, nombre: e.target.value })
                        }
                        placeholder="Ej. Juan Pérez"
                      />
                    </div>
                    <div className="form-cols-2">
                      <div className="form-row">
                        <label>Teléfono / WhatsApp *</label>
                        <input
                          value={datos.telefono}
                          onChange={(e) =>
                            setDatos({ ...datos, telefono: e.target.value })
                          }
                          placeholder="+51 999 999 999"
                        />
                      </div>
                      <div className="form-row">
                        <label>Correo *</label>
                        <input
                          type="email"
                          value={datos.correo}
                          onChange={(e) =>
                            setDatos({ ...datos, correo: e.target.value })
                          }
                          placeholder="juan@tuempresa.com"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <label>Tipo de documento *</label>
                      <div style={{ display: "flex", gap: 18, marginTop: 6 }}>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontWeight: 400,
                          }}
                        >
                          <input
                            type="radio"
                            checked={datos.tipoDocumento === "dni"}
                            onChange={() =>
                              setDatos({ ...datos, tipoDocumento: "dni" })
                            }
                            style={{ width: "auto" }}
                          />
                          DNI
                        </label>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontWeight: 400,
                          }}
                        >
                          <input
                            type="radio"
                            checked={datos.tipoDocumento === "ruc"}
                            onChange={() =>
                              setDatos({ ...datos, tipoDocumento: "ruc" })
                            }
                            style={{ width: "auto" }}
                          />
                          RUC
                        </label>
                      </div>
                    </div>
                    {datos.tipoDocumento === "dni" ? (
                      <div className="form-row">
                        <label>N° de DNI *</label>
                        <input
                          value={datos.numeroDocumento}
                          onChange={(e) =>
                            setDatos({
                              ...datos,
                              numeroDocumento: e.target.value,
                            })
                          }
                          maxLength={8}
                        />
                      </div>
                    ) : (
                      <div className="form-cols-2">
                        <div className="form-row">
                          <label>N° de RUC *</label>
                          <input
                            value={datos.numeroDocumento}
                            onChange={(e) =>
                              setDatos({
                                ...datos,
                                numeroDocumento: e.target.value,
                              })
                            }
                            maxLength={11}
                          />
                        </div>
                        <div className="form-row">
                          <label>Razón social *</label>
                          <input
                            value={datos.razonSocial}
                            onChange={(e) =>
                              setDatos({
                                ...datos,
                                razonSocial: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
                    <p
                      className="form-note"
                      style={{ marginTop: -6, marginBottom: 12 }}
                    >
                      ¿Ya tienes cuenta?{" "}
                      <button
                        type="button"
                        className="link-btn"
                        onClick={openLogin}
                      >
                        Inicia sesión
                      </button>{" "}
                      para no volver a escribir tus datos.
                    </p>
                  </div>
                )}

                {errorEnvio && (
                  <div className="quote-error-banner">
                    <AlertCircle size={16} /> {errorEnvio}
                  </div>
                )}

                <button
                  type="button"
                  className="submit-quote-btn"
                  disabled={items.length === 0 || enviando !== null}
                  onClick={handleEnviarWhatsapp}
                >
                  <Send size={17} />{" "}
                  {enviando === "whatsapp"
                    ? "Enviando..."
                    : "Enviar solicitud por WhatsApp"}
                </button>

                <button
                  type="button"
                  className="submit-quote-btn"
                  style={{
                    background: "#fff",
                    color: "#121212",
                    border: "1.5px solid #121212",
                    marginTop: 10,
                  }}
                  disabled={items.length === 0 || enviando !== null}
                  onClick={handleEnviarPorPagina}
                >
                  {user ? <Globe size={17} /> : <Lock size={17} />}{" "}
                  {enviando === "pagina"
                    ? "Enviando..."
                    : user
                      ? "Enviar solicitud por la página"
                      : "Enviar por la página (inicia sesión)"}
                </button>

                <button
                  type="button"
                  className="submit-quote-btn"
                  style={{
                    background: "#fff",
                    color: "#121212",
                    border: "1.5px solid #121212",
                    marginTop: 10,
                  }}
                  disabled={items.length === 0 || enviando !== null}
                  onClick={handleEnviarCorreo}
                >
                  <Mail size={17} />{" "}
                  {enviando === "correo"
                    ? "Enviando..."
                    : "Enviar solicitud por correo"}
                </button>

                <p className="form-note">
                  Tus datos están seguros. Solo los usaremos para responder tu
                  solicitud comercial.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
