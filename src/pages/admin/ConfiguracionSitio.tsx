import ExcelTools from "./ExcelTools";
import { useEffect, useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, Save, HelpCircle } from "lucide-react";
import { api } from "../../api/client";
import { useConfiguracionSitio } from "../../hooks/useApiData";
import { useFeedback } from "../../context/FeedbackContext";
import "./admin.css";

export default function ConfiguracionSitio() {
  const { data, loading, recargar } = useConfiguracionSitio();
  const feedback = useFeedback();
  const [primario, setPrimario] = useState("");
  const [secundario, setSecundario] = useState("");
  const [correo, setCorreo] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!loading) {
      setPrimario(data.whatsapp_primario);
      setSecundario(data.whatsapp_secundario);
      setCorreo(data.correo_contacto);
    }
  }, [loading, data]);

  async function handleGuardar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    try {
      await api.put("/api/configuracion", {
        whatsapp_primario: primario.replace(/\D/g, ""),
        whatsapp_secundario: secundario.replace(/\D/g, ""),
        correo_contacto: correo.trim(),
      });
      recargar();
      feedback.success("Los datos de contacto se actualizaron en todo el sitio.");
    } catch (err) {
      feedback.error(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <ExcelTools entity="configuracion" onImported={() => window.location.reload()} />
      <div className="admin-header-row">
        <div>
          <h1>Números y correo de contacto</h1>
          <p className="subtitle">
            Estos datos se usan en toda la página: WhatsApp flotante, pie de
            página, formulario de contacto y el carrito de cotización.
          </p>
        </div>
        <Link to="/admin" className="btn-admin outline">
          <ArrowLeft size={16} /> Volver
        </Link>
      </div>

      <div className="ayuda-evaluar-box" style={{ maxWidth: 640 }}>
        <div className="ayuda-evaluar-titulo">
          <HelpCircle size={17} /> ¿Cómo se usan el primario y el secundario?
        </div>
        <p style={{ margin: 0, fontSize: 12.5, color: "#6b6b6b", lineHeight: 1.5 }}>
          Cuando un cliente cotiza <strong>solo repuestos</strong>, su mensaje de
          WhatsApp se envía al <strong>número primario</strong>. Cuando cotiza{" "}
          <strong>solo maquinaria</strong>, se envía al{" "}
          <strong>número secundario</strong>. Si su carrito tiene{" "}
          <strong>ambos</strong>, se envía al primario.
        </p>
      </div>

      <form onSubmit={handleGuardar} className="admin-form" style={{ maxWidth: 480 }}>
        <label>
          <Phone size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
          WhatsApp primario (repuestos, o repuestos + maquinaria)
          <input
            type="text"
            value={primario}
            placeholder="Ej. 51988341207"
            onChange={(e) => setPrimario(e.target.value)}
            required
          />
        </label>

        <label>
          <Phone size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
          WhatsApp secundario (solo maquinaria)
          <input
            type="text"
            value={secundario}
            placeholder="Ej. 51976215893"
            onChange={(e) => setSecundario(e.target.value)}
            required
          />
        </label>

        <label>
          <Mail size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
          Correo de contacto
          <input
            type="email"
            value={correo}
            placeholder="contacto@dh-dm-maquinarias.com"
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </label>

        <button
          type="submit"
          className="btn-admin yellow"
          disabled={guardando}
          data-tooltip="Actualiza estos datos en todo el sitio al instante"
        >
          <Save size={15} /> {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
