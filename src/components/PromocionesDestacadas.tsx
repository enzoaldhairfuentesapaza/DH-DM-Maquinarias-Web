import "./PromocionesDestacadas.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { usePromociones } from "../hooks/useApiData";
import Hero from "./Hero";

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
  const { data: promociones, loading } = usePromociones();
  const destacadas = promociones.filter(p => p.destacado);
  const [activo, setActivo] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (destacadas.length < 2 || paused || hovered || reduced) return;
    const timer = window.setInterval(() => setActivo(a => (a + 1) % destacadas.length), 6000);
    return () => window.clearInterval(timer);
  }, [destacadas.length, activo, paused, hovered, reduced]);
  const index = activo % Math.max(1, destacadas.length);
  if (loading || !destacadas.length) return <Hero />;
  return <section className="promotion-hero" aria-label="Promociones destacadas" aria-roledescription="carrusel"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setHovered(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) setHovered(false); }}>
    <PromotionFeature key={destacadas[index].id} promo={destacadas[index]} />
    <div className="promotion-bottom">
      <span className="promotion-counter">{String(index + 1).padStart(2, "0")} <span>/ {String(destacadas.length).padStart(2, "0")}</span></span>
      <div className="promotion-tabs">{destacadas.map((p, i) => <button key={p.id} type="button" aria-label={`Ver promoción: ${p.titulo}`} aria-pressed={i === index} className={i === index ? "active" : ""} onClick={() => setActivo(i)}><span>{String(i + 1).padStart(2, "0")}</span>{p.titulo}</button>)}</div>
      {destacadas.length > 1 && <div className="promotion-controls"><button aria-label="Promoción anterior" onClick={() => setActivo((index - 1 + destacadas.length) % destacadas.length)}><ChevronLeft /></button><button aria-label={paused ? "Reanudar promociones" : "Pausar promociones"} aria-pressed={paused} onClick={() => setPaused(p => !p)}>{paused || reduced ? <Play size={17} /> : <Pause size={17} />}</button><button aria-label="Siguiente promoción" onClick={() => setActivo((index + 1) % destacadas.length)}><ChevronRight /></button></div>}
    </div>
  </section>;
}
