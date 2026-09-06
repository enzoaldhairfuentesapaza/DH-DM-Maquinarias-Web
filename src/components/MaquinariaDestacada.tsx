import "./MaquinariaDestacada.css";
import { Link } from "react-router-dom";
import { Truck, Gauge, CalendarDays, ArrowRight } from "lucide-react";
import { useMaquinarias } from "../hooks/useApiData";

export default function MaquinariaDestacada() {
  const { data: maquinarias, loading } = useMaquinarias();
  const destacadas = maquinarias.filter((m) => m.destacado).slice(0, 3);

  if (loading || destacadas.length === 0) return null;

  return (
    <section className="maq-destacada">
      <div className="section-wrap">
        <div className="section-title">
          <span className="tag">Catálogo</span>
          <h2>
            Maquinaria <span>destacada</span>
          </h2>
          <p>Equipos seleccionados, listos para operar en tus proyectos.</p>
        </div>

        <div className="maq-destacada-grid">
          {destacadas.map((m) => (
            <Link to={`/maquinaria/${m.id}`} className="maq-destacada-card" key={m.id}>
              <div
                className="maq-destacada-media"
                style={m.imagen ? { backgroundImage: `url(${m.imagen})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
              >
                {!m.imagen && <Truck size={40} />}
                <span className={`maq-condicion ${m.condicion.toLowerCase()}`}>{m.condicion}</span>
              </div>
              <div className="maq-destacada-body">
                <span className="cat-card-cat">{m.categoria}</span>
                <h3>{m.nombre}</h3>
                <div className="maq-destacada-meta">
                  <span><CalendarDays size={14} /> {m.año}</span>
                  <span><Gauge size={14} /> {m.potencia}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="maq-destacada-cta">
          <Link to="/maquinaria" className="btn-secondary-dark">
            Ver catálogo completo de maquinaria <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
