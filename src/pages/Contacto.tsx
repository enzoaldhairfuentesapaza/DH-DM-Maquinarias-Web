import "./pages.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  Send,
  Globe,
  Lock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";

const WHATSAPP_NUMERO = "51942203833";

const ASUNTOS = [
  "Consulta general",
  "Soporte técnico / postventa",
  "Reclamo o queja",
  "Trabaja con nosotros",
  "Alianzas / proveedores",
  "Otro",
];

export default function Contacto() {
  const { user } = useAuth();
  const { openLogin } = useAuthModal();

  const [datos, setDatos] = useState({
    nombre: "",
    telefono: "",
    correo: "",
    asunto: ASUNTOS[0],
    mensaje: "",
  });

  const [enviado, setEnviado] = useState<null | "whatsapp" | "pagina">(null);
  const [enviando, setEnviando] = useState<null | "whatsapp" | "pagina">(null);
  const [errorEnvio, setErrorEnvio] = useState("");
  const [confirmandoWhatsapp, setConfirmandoWhatsapp] = useState(false);

  const datosCompletos = () => {
    if (!datos.mensaje.trim()) return false;
    if (user) return true;
    return !!(datos.nombre && datos.correo);
  };

  const guardarSolicitud = async (canal: "whatsapp" | "pagina") => {
    await api.post("/api/cotizaciones", {
      nombre_cliente: user ? user.nombre : datos.nombre,
      email_cliente: user ? user.email : datos.correo,
      telefono_cliente: user ? (user.telefono ?? "") : datos.telefono,
      detalle: {
        canal,
        tipo: "contacto_general",
        asunto: datos.asunto,
        mensaje: datos.mensaje,
      },
      origen: "contacto",
    });
  };

  const construirMensajeWhatsapp = () => {
    const nombre = user ? user.nombre : datos.nombre;
    const correo = user ? user.email : datos.correo;
    let msg = `*Contacto - DH & DM Maquinarias SAC.*%0A%0A`;
    msg += `*Nombre:* ${nombre}%0A`;
    msg += `*Correo:* ${correo}%0A`;
    if (!user && datos.telefono) msg += `*Teléfono:* ${datos.telefono}%0A`;
    msg += `*Asunto:* ${datos.asunto}%0A%0A`;
    msg += `*Mensaje:*%0A${encodeURIComponent(datos.mensaje)}`;
    return msg;
  };

  const handleEnviarWhatsapp = () => {
    if (!datosCompletos()) {
      setErrorEnvio(
        "Completa tu nombre, correo y el mensaje (marcados con *) antes de enviar.",
      );
      return;
    }
    setErrorEnvio("");
    const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${construirMensajeWhatsapp()}`;
    window.open(url, "_blank");
    setConfirmandoWhatsapp(true);
  };

  const confirmarWhatsappExitoso = async (exitoso: boolean) => {
    setConfirmandoWhatsapp(false);
    if (!exitoso) return; // se mantiene el formulario tal cual para reintentar
    setEnviando("whatsapp");
    setErrorEnvio("");
    try {
      await guardarSolicitud("whatsapp");
      setEnviado("whatsapp");
    } catch (err) {
      setErrorEnvio(
        err instanceof Error
          ? err.message
          : "No se pudo registrar tu solicitud",
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
    if (!datosCompletos()) return;
    setEnviando("pagina");
    setErrorEnvio("");
    try {
      await guardarSolicitud("pagina");
      setEnviado("pagina");
    } catch (err) {
      setErrorEnvio(
        err instanceof Error ? err.message : "No se pudo enviar tu solicitud",
      );
    } finally {
      setEnviando(null);
    }
  };

  return (
    <>
      <div className="page-banner page-banner-contactanos">
        <div className="page-banner-inner">
          <div className="breadcrumb">
            <Link to="/">Inicio</Link> / <span>Contacto</span>
          </div>
          <h1>
            Hablemos de tu <span>próximo proyecto</span>
          </h1>
          <p>Nuestro equipo comercial y técnico está listo para ayudarte.</p>
        </div>
      </div>

      {confirmandoWhatsapp && (
        <div className="whatsapp-confirm-overlay">
          <div className="whatsapp-confirm-box">
            <h3>¿Se logró enviar el mensaje por WhatsApp con éxito?</h3>
            <p>Confirma si el mensaje se envió correctamente en WhatsApp.</p>
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

      <div className="page-body">
        <div className="contacto-layout">
          <div className="contacto-left">
            <h2>
              Hablemos de tu <span>Próximo Proyecto</span>
            </h2>
            <p>
              ¿Tienes una consulta, un reclamo, quieres trabajar con nosotros o
              necesitas soporte postventa? Escríbenos y nuestro equipo te
              responderá a la brevedad.
            </p>
            <p style={{ fontSize: 13.5, color: "#888" }}>
              ¿Buscas cotizar un producto específico? Usa mejor{" "}
              <Link
                to="/cotizacion"
                style={{ fontWeight: 700, color: "var(--black, #121212)" }}
              >
                Mi cotización
              </Link>
              , el carrito de productos.
            </p>

            <div className="contacto-info-item">
              <Phone size={20} />
              <div>
                <strong>Líneas directas / WhatsApp</strong>
                <span>+51 942 203 833</span>
                <br></br>
                <span>+51 977 272 747</span>
              </div>
            </div>
            <div className="contacto-info-item">
              <Mail size={20} />
              <div>
                <strong>Correo corporativo</strong>
                <span>info@dhdmmaquinarias.com</span>
              </div>
            </div>
            <div className="contacto-info-item">
              <MapPin size={20} />
              <div>
                <strong>Sede operativa</strong>
                <span>Juliaca (Sede Principal), Puno</span>
              </div>
            </div>
          </div>

          <div className="contacto-right">
            <h2>Contáctanos</h2>
            <p>
              Cuéntanos en qué podemos ayudarte y elige cómo prefieres enviarnos
              tu mensaje.
            </p>

            {enviado ? (
              <div className="quote-success">
                <CheckCircle2 size={40} className="quote-success-icon" />
                <h4>
                  {enviado === "whatsapp"
                    ? "¡Mensaje enviado por WhatsApp!"
                    : "¡Mensaje enviado con éxito!"}
                </h4>
                <p>
                  {enviado === "whatsapp"
                    ? "Nuestro equipo se pondrá en contacto contigo pronto por ese medio."
                    : "Quedó registrado en nuestro sistema; un asesor te contactará pronto."}
                </p>
                <button
                  className="clear-filters"
                  onClick={() => {
                    setEnviado(null);
                    setDatos({
                      nombre: "",
                      telefono: "",
                      correo: "",
                      asunto: ASUNTOS[0],
                      mensaje: "",
                    });
                  }}
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <div>
                {user && (
                  <p
                    style={{ fontSize: 13.5, color: "#666", marginBottom: 16 }}
                  >
                    Enviando como <strong>{user.nombre}</strong> ({user.email})
                  </p>
                )}

                {!user && (
                  <div className="form-cols-2">
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
                )}

                {!user && (
                  <div className="form-row">
                    <label>Teléfono / WhatsApp (opcional)</label>
                    <input
                      value={datos.telefono}
                      onChange={(e) =>
                        setDatos({ ...datos, telefono: e.target.value })
                      }
                      placeholder="+51 999 999 999"
                    />
                  </div>
                )}

                <div className="form-row">
                  <label>Asunto *</label>
                  <div className="asunto-select-wrap">
                    <select
                      className="asunto-select"
                      value={datos.asunto}
                      onChange={(e) =>
                        setDatos({ ...datos, asunto: e.target.value })
                      }
                    >
                      {ASUNTOS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <label>Mensaje *</label>
                  <textarea
                    rows={4}
                    value={datos.mensaje}
                    onChange={(e) =>
                      setDatos({ ...datos, mensaje: e.target.value })
                    }
                    placeholder="Cuéntanos en qué podemos ayudarte..."
                  />
                </div>

                {!user && (
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
                )}

                {errorEnvio && (
                  <div className="quote-error-banner">
                    <AlertCircle size={16} /> {errorEnvio}
                  </div>
                )}

                <button
                  type="button"
                  className="submit-quote-btn"
                  disabled={enviando !== null}
                  onClick={handleEnviarWhatsapp}
                >
                  <Send size={17} />{" "}
                  {enviando === "whatsapp"
                    ? "Enviando..."
                    : "Enviar mensaje por WhatsApp"}
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
                  disabled={enviando !== null || (!!user && !datosCompletos())}
                  onClick={handleEnviarPorPagina}
                >
                  {user ? <Globe size={17} /> : <Lock size={17} />}{" "}
                  {enviando === "pagina"
                    ? "Enviando..."
                    : user
                      ? "Enviar mensaje por la página"
                      : "Enviar por la página (inicia sesión)"}
                </button>

                <p className="form-note">
                  Tus datos están seguros. Solo los usaremos para responder tu
                  mensaje.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <section id="sedes" className="sedes-section">
        <div className="page-body">
          <div className="section-title">
            <span className="tag">Encuéntranos</span>
            <h2>
              Nuestra <span>sede</span>
            </h2>
            <p>Visítanos en nuestro punto de atención.</p>
          </div>

          <div className="sedes-grid">
            <div className="sede-card">
              <MapPin size={22} />
              <h4>Nuestra Sede — Juliaca</h4>
              <p>Jr. Apurímac 1067, Juliaca, Puno</p>
              <span>
                Lun. a Vie. 8:00 am – 7:00 pm · Sáb. 8:00 am – 5:00 pm
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
