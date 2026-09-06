import "./SobreNosotros.css";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

const puntos = [
  "Más de 8 años de experiencia en el rubro",
  "Repuestos originales y alternativos certificados",
  "Stock permanente y despacho a nivel nacional",
  "Asesoría a la compra del producto",
  "Garantía en todos nuestros productos",
];

export default function SobreNosotros() {
  return (
    <section className="nosotros">
      <div className="section-wrap nosotros-wrap">
        <div className="nosotros-img">
          <div
            className="nosotros-img-box"
            style={{ backgroundImage: 'url("/novedades/almacen-la-victoria.jpg")' }}
          />
          <div className="nosotros-badge">
            <strong>8+</strong>
            <span>Años de experiencia</span>
          </div>
        </div>

        <div className="nosotros-info">
          <span className="tag">Quiénes somos</span>
          <h2>
            Sobre <span>nosotros</span>
          </h2>
          <p>
            Somos una empresa especializada en la comercialización de repuestos
            y maquinaria pesada, comprometidos con la calidad, el servicio y
            la continuidad operativa de nuestros clientes.
          </p>

          <ul className="nosotros-list">
            {puntos.map((p) => (
              <li key={p}>
                <CheckCircle2 size={20} />
                {p}
              </li>
            ))}
          </ul>

          <Link to="/nosotros" className="btn-primary">Conócenos más</Link>
        </div>
      </div>
    </section>
  );
}
