import "./Hero.css";
import "./PromocionesDestacadas.css";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Truck, Wrench } from "lucide-react";
import { welcomeDefaults, type WelcomeData } from "./welcomeData";
import { resolveApiAsset } from "../api/client";

export default function Hero({ data = welcomeDefaults }: { data?: WelcomeData }) {
  return <section className="hero promotion-feature welcome-feature">
    <div className="promotion-image" style={data.imagen ? {backgroundImage:`url(${resolveApiAsset(data.imagen)})`} : undefined} />
    <div className="promotion-shade" />
    <div className="promotion-copy welcome-copy">
      <span className="promotion-eyebrow">Bienvenidos a DH & DM Maquinarias</span>
      <span className="promotion-label">{data.tag}</span>
      <h1>{data.titulo_antes} <span>{data.titulo_destacado}</span> {data.titulo_despues}</h1>
      <p>{data.descripcion}</p>
      <div className="promotion-actions welcome-actions">
        <Link to={data.boton_repuestos_url} className="promotion-cta">{data.boton_repuestos}<ArrowRight size={19}/></Link>
        <Link to={data.boton_maquinaria_url} className="welcome-secondary">{data.boton_maquinaria}<ArrowRight size={17}/></Link>
      </div>
      <div className="welcome-stats">
        {([{Icon:Truck,value:data.despachos_valor,label:data.despachos_label},{Icon:Wrench,value:data.stock_valor,label:data.stock_label},{Icon:ShieldCheck,value:data.garantia_valor,label:data.garantia_label}]).map(({Icon,value,label},i)=><div className="welcome-stat" key={i}><Icon size={23} aria-hidden="true"/><div><strong>{value}</strong><span>{label}</span></div></div>)}
      </div>
    </div>
  </section>;
}
