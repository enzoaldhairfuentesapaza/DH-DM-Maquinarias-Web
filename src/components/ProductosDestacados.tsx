import "./ProductosDestacados.css";
import { Link } from "react-router-dom";
import { Cog, Filter, Droplets, Link2 } from "lucide-react";

const productos = [
  {
    icon: Cog,
    nombre: "Rodamientos y engranajes",
    desc: "Componentes de alta resistencia para transmisión de potencia.",
  },
  {
    icon: Filter,
    nombre: "Filtros hidráulicos y de aire",
    desc: "Filtración certificada para motores y sistemas hidráulicos.",
  },
  {
    icon: Droplets,
    nombre: "Mangueras y sistemas hidráulicos",
    desc: "Mangueras de alta presión fabricadas a medida.",
  },
  {
    icon: Link2,
    nombre: "Cadenas y tren de rodaje",
    desc: "Repuestos para tren de rodaje de excavadoras y tractores.",
  },
];

export default function ProductosDestacados() {
  return (
    <section className="productos">
      <div className="section-wrap">
        <div className="section-title">
          <span className="tag">Catálogo</span>
          <h2>
            Productos <span>destacados</span>
          </h2>
          <p>Repuestos originales y alternativos para las principales marcas de maquinaria pesada.</p>
        </div>

        <div className="productos-grid">
          {productos.map((p) => (
            <div className="producto-card" key={p.nombre}>
              <div className="producto-icon">
                <p.icon size={28} />
              </div>
              <h3>{p.nombre}</h3>
              <p>{p.desc}</p>
              <Link to="/repuestos" className="producto-link">
                Ver más →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
