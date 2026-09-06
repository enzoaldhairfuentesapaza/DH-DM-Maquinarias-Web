import { Link } from "react-router-dom";
import { ClipboardList, Receipt } from "lucide-react";
import "./admin.css";

export default function VentasCotizacionesHub() {
  return (
    <div>
      <div className="admin-header-row">
        <div>
          <h1>Ventas y Cotizaciones</h1>
          <p className="subtitle">
            Solicitudes de cotización de clientes y registro de ventas realizadas.
          </p>
        </div>
      </div>

      <div className="admin-cards">
        <Link to="/admin/cotizaciones" className="admin-card">
          <div className="icon-badge">
            <ClipboardList size={20} />
          </div>
          <h3>Cotizaciones recibidas</h3>
          <p>Revisa las solicitudes de cotización de la web y responde, deniega o déjalas pendientes.</p>
        </Link>

        <Link to="/admin/ventas" className="admin-card">
          <div className="icon-badge">
            <Receipt size={20} />
          </div>
          <h3>Ventas / Boletas</h3>
          <p>Registra y consulta las ventas concretadas, con el detalle de cada boleta.</p>
        </Link>
      </div>

      <p className="subtitle" style={{ marginTop: 18 }}>
        ¿Buscas el cotizador formal (precios, descuentos y ajustes por marca)?
        Está disponible como burbuja flotante en la esquina del panel.
      </p>
    </div>
  );
}
