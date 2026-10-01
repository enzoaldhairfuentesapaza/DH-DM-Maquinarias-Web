import "./LegalModal.css";
import { X } from "lucide-react";

interface Props {
  type: "terms" | "privacy" | null;
  onClose: () => void;
}

export default function LegalModal({ type, onClose }: Props) {
  if (!type) return null;

  const title =
    type === "terms" ? "Términos y Condiciones" : "Política de Privacidad";

  return (
    <div className="legal-overlay" onClick={onClose}>
      <div className="legal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="legal-header">
          <h2>{title}</h2>

          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="legal-body">
          {type === "terms" ? (
            <>
              <h3>1. Uso del sitio web</h3>

              <p>
                El presente sitio web pertenece a DH & DM Maquinarias SAC y
                tiene como finalidad brindar información sobre maquinaria
                pesada, repuestos, servicios y cotizaciones.
              </p>

              <h3>2. Cotizaciones</h3>

              <p>
                Las cotizaciones realizadas desde el sitio tienen carácter
                referencial y deberán ser confirmadas por un asesor comercial.
              </p>

              <h3>3. Disponibilidad</h3>

              <p>
                El stock de maquinaria, repuestos y accesorios puede variar sin
                previo aviso.
              </p>

              <h3>4. Garantías</h3>

              <p>
                Los productos cuentan con garantía según las condiciones del
                fabricante correspondiente.
              </p>

              <h3>5. Propiedad intelectual</h3>

              <p>
                Las imágenes, logotipos, textos y diseños del sitio pertenecen a
                DH & DM Maquinarias SAC o a sus respectivos propietarios.
              </p>

              <h3>6. Modificaciones</h3>

              <p>
                DH & DM Maquinarias SAC podrá actualizar estos términos cuando
                lo considere necesario.
              </p>
            </>
          ) : (
            <>
              <h3>1. Información recopilada</h3>

              <p>
                Podemos recopilar información proporcionada mediante formularios
                de contacto y solicitudes de cotización.
              </p>

              <h3>2. Uso de la información</h3>

              <p>
                Los datos serán utilizados únicamente para brindar atención
                comercial y responder consultas.
              </p>

              <h3>3. Seguridad</h3>

              <p>
                Aplicamos medidas de seguridad para proteger la información
                almacenada.
              </p>

              <h3>4. Cookies</h3>

              <p>
                Este sitio puede utilizar cookies para mejorar la experiencia de
                navegación.
              </p>

              <h3>5. Derechos del usuario</h3>

              <p>
                El usuario podrá solicitar la actualización o eliminación de sus
                datos personales mediante nuestros canales oficiales.
              </p>
            </>
          )}
        </div>

        <div className="legal-footer">
          <button onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
