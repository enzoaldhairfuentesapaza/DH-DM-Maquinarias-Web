import "./Hero.css";
import { Link } from "react-router-dom";
import { ShieldCheck, Truck, Wrench } from "lucide-react";

import { welcomeDefaults, type WelcomeData } from "./welcomeData";
import { resolveApiAsset } from "../api/client";

export default function Hero({ data = welcomeDefaults }: { data?: WelcomeData }) {
  return (
    <section className="hero" style={{backgroundImage: data.imagen ? `url(${resolveApiAsset(data.imagen)})` : "none"}}>
      <div className="hero-overlay" />
      <div className="hero-content">
        <span className="hero-tag hero-anim hero-anim-1">{data.tag}</span>
        <h1 className="hero-anim hero-anim-2">
          {data.titulo_antes} <span>{data.titulo_destacado}</span> {data.titulo_despues}
        </h1>
        <p className="hero-anim hero-anim-3">
          {data.descripcion}
        </p>

        <div className="hero-actions hero-anim hero-anim-4">
          <Link to={data.boton_repuestos_url} className="btn-primary">{data.boton_repuestos}</Link>
          <Link to={data.boton_maquinaria_url} className="btn-secondary">{data.boton_maquinaria}</Link>
        </div>

        <div className="hero-stats hero-anim hero-anim-5">
          <div className="stat">
            <Truck size={26} />
            <div>
              <strong>{data.despachos_valor}</strong>
              <span>{data.despachos_label}</span>
            </div>
          </div>
          <div className="stat">
            <Wrench size={26} />
            <div>
              <strong>{data.stock_valor}</strong>
              <span>{data.stock_label}</span>
            </div>
          </div>
          <div className="stat">
            <ShieldCheck size={26} />
            <div>
              <strong>{data.garantia_valor}</strong>
              <span>{data.garantia_label}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
