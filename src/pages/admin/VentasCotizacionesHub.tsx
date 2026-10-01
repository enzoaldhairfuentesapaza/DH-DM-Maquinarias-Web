import { Link } from "react-router-dom";
import { Package, Truck, Receipt, BarChart3 } from "lucide-react";
import "./admin.css";

export default function VentasCotizacionesHub() {
  return (
    <div>
      <div className="admin-header-row">
        <div>
          <h1>Cotizaciones</h1>
          <p className="subtitle">
            Cotizaciones separadas por repuestos y maquinaria.
          </p>
        </div>
      </div>

      <div className="admin-cards">
        <Link to="/admin/cotizaciones?tipo=repuesto" className="admin-card"><div className="icon-badge"><Package size={20}/></div><h3>Cotizaciones de repuestos</h3><p>Repuestos y otros productos. Atención por el WhatsApp primario.</p></Link>
        <Link to="/admin/cotizaciones?tipo=maquinaria" className="admin-card"><div className="icon-badge"><Truck size={20}/></div><h3>Cotizaciones de maquinaria</h3><p>Maquinaria pesada. Atención por el WhatsApp secundario.</p></Link>

        <Link to="/admin/ventas" className="admin-card">
          <div className="icon-badge">
            <Receipt size={20} />
          </div>
          <h3>Ventas / Boletas</h3>
          <p>Registra y consulta las ventas concretadas, con el detalle de cada boleta.</p>
        </Link>

        <Link to="/admin/estadisticas" className="admin-card">
          <div className="icon-badge">
            <BarChart3 size={20} />
          </div>
          <h3>Estadísticas</h3>
          <p>Gráficos de ventas y cotizaciones por semana, mes o año.</p>
        </Link>
      </div>

      <p className="subtitle" style={{ marginTop: 18 }}>
        ¿Buscas el cotizador formal (precios, descuentos y ajustes por marca)?
        Está disponible como burbuja flotante en la esquina del panel.
      </p>
    </div>
  );
}
