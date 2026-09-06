import "./AvisoCompatibilidad.css";
import { AlertTriangle } from "lucide-react";

export default function AvisoCompatibilidad() {
  return (
    <div className="aviso-compat">
      <AlertTriangle size={22} className="aviso-compat-icon" />
      <p>
        <strong>Importante:</strong> Verifique que la pieza sea compatible con el modelo y número
        de serie de su maquinaria antes de solicitar la cotización. Ante cualquier duda técnica,
        comuníquese con uno de nuestros asesores especializados.
      </p>
    </div>
  );
}
