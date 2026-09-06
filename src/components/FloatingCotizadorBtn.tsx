import "./FloatingCotizadorBtn.css";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCotizacion } from "../context/CotizacionContext";

export default function FloatingCotizadorBtn() {
  const { totalItems } = useCotizacion();

  return (
    <Link to="/cotizacion" className="floating-cotizador-btn" title="Mi cotización">
      <ShoppingCart size={18} />
      <span>Mi cotización</span>
      {totalItems > 0 && <span className="floating-cotizador-badge">{totalItems}</span>}
    </Link>
  );
}
