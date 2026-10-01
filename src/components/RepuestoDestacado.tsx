import "./MaquinariaDestacada.css";
import { Link } from "react-router-dom";
import { Package, ArrowRight } from "lucide-react";
import { useRepuestos } from "../hooks/useApiData";

export default function RepuestoDestacado() {
  const { data: repuestos, loading } = useRepuestos();
  const destacados = repuestos.filter((r) => r.destacado).slice(0, 3);

  if (loading || destacados.length === 0) return null;

  return (
    <section className="maq-destacada">
      <div className="section-wrap">
        <div className="section-title">
          <span className="tag">Catálogo</span>
          <h2>
            Repuestos <span>destacados</span>
          </h2>
          <p>Los repuestos que más solicitan nuestros clientes.</p>
        </div>

        <div className="maq-destacada-grid">
          {destacados.map((r) => (
            <Link to={`/repuestos/${r.id}`} className="maq-destacada-card" key={r.id}>
              <div
                className="maq-destacada-media"
                style={
                  r.imagen
                    ? { backgroundImage: `url(${r.imagen})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : undefined
                }
              >
                {!r.imagen && <Package size={40} />}
                <span className="maq-condicion">{r.marca}</span>
              </div>
              <div className="maq-destacada-body">
                <span className="cat-card-cat">{r.categoria}</span>
                <h3>{r.nombre}</h3>
                <div className="maq-destacada-meta">
                  <span>Código: {r.codigo}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="maq-destacada-cta">
          <Link to="/repuestos" className="btn-secondary-dark">
            Ver catálogo completo de repuestos <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
