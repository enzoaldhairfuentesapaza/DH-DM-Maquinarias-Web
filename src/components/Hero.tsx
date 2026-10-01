import "./Hero.css";
import { Link } from "react-router-dom";
import { ShieldCheck, Truck, Wrench } from "lucide-react";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-overlay" />
      <div className="hero-content">
        <span className="hero-tag hero-anim hero-anim-1">Repuestos y maquinaria pesada</span>
        <h1 className="hero-anim hero-anim-2">
          Maquinaria pesada y <span>repuestos originales</span> en un solo lugar
        </h1>
        <p className="hero-anim hero-anim-3">
          Más de 10 años abasteciendo a la construcción, transporte e industria,
          vendiendo tanto maquinaria pesada como los repuestos que la mantienen
          funcionando, con stock permanente y atención técnica especializada.
        </p>

        <div className="hero-actions hero-anim hero-anim-4">
          <Link to="/repuestos" className="btn-primary">Ver catálogo de repuestos</Link>
          <Link to="/maquinaria" className="btn-secondary">Ver catálogo de maquinaria</Link>
        </div>

        <div className="hero-stats hero-anim hero-anim-5">
          <div className="stat">
            <Truck size={26} />
            <div>
              <strong>+2000</strong>
              <span>Despachos anuales</span>
            </div>
          </div>
          <div className="stat">
            <Wrench size={26} />
            <div>
              <strong>+5000</strong>
              <span>Repuestos en stock</span>
            </div>
          </div>
          <div className="stat">
            <ShieldCheck size={26} />
            <div>
              <strong>100%</strong>
              <span>Garantía de calidad</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
