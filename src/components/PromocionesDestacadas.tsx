import "./PromocionesDestacadas.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { usePromociones } from "../hooks/useApiData";
import Hero from "./Hero";
import { api } from "../api/client";
import { welcomeDefaults, type WelcomeData } from "./welcomeData";

export interface PromotionSlide { titulo: string; descripcion: string; vigencia: string; imagen?: string; }
export function PromotionFeature({ promo }: { promo: PromotionSlide }) {
  return <div className="promotion-feature">
    <div className="promotion-image" style={promo.imagen ? { backgroundImage: `url(${promo.imagen})` } : undefined} />
    <div className="promotion-shade" />
    <div className="promotion-copy">
      <span className="promotion-eyebrow">DH & DM / Oportunidades para tu operación</span>
      <span className="promotion-label">Promoción destacada</span>
      <h1>{promo.titulo}</h1>
      <p>{promo.descripcion}</p>
      <span className="promotion-validity">{promo.vigencia}</span>
      <div className="promotion-actions"><Link to="/promociones" className="promotion-cta">Descubrir promociones <ArrowRight size={19} /></Link><Link to="/repuestos">Explorar repuestos ↗</Link></div>
    </div>
    <div className="promotion-stamp" aria-hidden="true">EQUIPA<br />TU PRÓXIMA<br /><strong>OBRA.</strong></div>
  </div>;
}
export default function PromocionesDestacadas() {
  const { data: promociones } = usePromociones();
  const destacadas = promociones.filter(p => p.destacado);
  const [welcome,setWelcome] = useState(welcomeDefaults);
  const [activo, setActivo] = useState(0);
  const [paused, setPaused] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const total = destacadas.length + 1;
  useEffect(() => { let live = true; api.get<WelcomeData>("/api/bienvenida").then(data => {if(live)setWelcome(data);}).catch(()=>{});return ()=>{live=false;}; }, []);
  useEffect(() => {
    if (total < 2 || paused) return;
    const timer = window.setInterval(() => setActivo(a => (a + 1) % total), 6000);
    return () => window.clearInterval(timer);
  }, [total, activo, paused]);
  const index = activo % total;
  return <section className="promotion-hero" aria-label="Bienvenida y promociones" aria-roledescription="carrusel">
    {index === 0 ? <Hero data={welcome} /> : <PromotionFeature key={destacadas[index-1].id} promo={destacadas[index-1]} />}
    <div className="promotion-bottom">
      <span className="promotion-counter">{String(index + 1).padStart(2, "0")} <span>/ {String(total).padStart(2, "0")}</span></span>
      <div className="promotion-tabs"><button type="button" aria-label="Ver bienvenida" aria-pressed={index===0} className={index===0?"active":""} onClick={()=>setActivo(0)}><span>01</span>Bienvenidos a DH & DM</button>{destacadas.map((p, i) => <button key={p.id} type="button" aria-label={`Ver promoción: ${p.titulo}`} aria-pressed={i+1 === index} className={i+1 === index ? "active" : ""} onClick={() => setActivo(i+1)}><span>{String(i + 2).padStart(2, "0")}</span>{p.titulo}</button>)}</div>
      {total > 1 && <div className="promotion-controls"><button type="button" aria-label="Tarjeta anterior" onClick={() => setActivo((index - 1 + total) % total)}><ChevronLeft /></button><button type="button" aria-label={paused ? "Reanudar carrusel" : "Pausar carrusel"} aria-pressed={paused} onClick={() => setPaused(p => !p)}>{paused ? <Play size={17} /> : <Pause size={17} />}</button><button type="button" aria-label="Siguiente tarjeta" onClick={() => setActivo((index + 1) % total)}><ChevronRight /></button></div>}
    </div>
  </section>;
}
