import "./TablonAnuncios.css";
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePromociones } from "../hooks/useApiData";

type Slide = {
  imagen: string;
  titulo: string;
  texto: string;
};

const slides: Slide[] = [
  {
    imagen: "/anuncios/slide-1.jpg",
    titulo: "Excavadoras Caterpillar",
    texto: "Equipos de excavación de alto rendimiento para tu operación.",
  },
  {
    imagen: "/anuncios/slide-2.jpg",
    titulo: "Descuentos del mes",
    texto: "Filtros y mangueras hidráulicas con precios especiales.",
  },
  {
    imagen: "/anuncios/slide-3.jpg",
    titulo: "Repuestos para todo tipo de obra",
    texto: "Desde movimiento de tierras hasta demolición.",
  },
  {
    imagen: "/anuncios/slide-4.jpg",
    titulo: "Atención Personalizada",
    texto: "Asesoría Comercial.",
  },
];

export default function TablonAnuncios() {
  const [activo, setActivo] = useState(0);
  const [promoIndex, setPromoIndex] = useState(0);
  const { data: promociones } = usePromociones();

  const siguiente = useCallback(() => {
    setActivo((a) => (a + 1) % slides.length);
  }, []);

  const anterior = () => {
    setActivo((a) => (a - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const id = setInterval(siguiente, 5000);
    return () => clearInterval(id);
  }, [siguiente]);

  useEffect(() => {
    if (promociones.length === 0) return;
    const id = setInterval(() => {
      setPromoIndex((i) => (i + 1) % promociones.length);
    }, 4000);
    return () => clearInterval(id);
  }, [promociones]);

  const promoActual = promociones[promoIndex];

  return (
    <section className="tablon">
      <div className="tablon-track">
        {slides.map((s, i) => (
          <div
            key={s.titulo}
            className={`tablon-slide ${i === activo ? "active" : ""}`}
            style={{ backgroundImage: `url(${s.imagen})` }}
          >
            <div className="tablon-slide-overlay" />
            <div className="tablon-slide-content">
              <h3>{s.titulo}</h3>
              <p>{s.texto}</p>
            </div>
          </div>
        ))}
      </div>

      <Link to="/promociones" className="tablon-more-btn">
        Ver promociones <ChevronRight size={16} />
      </Link>

      {promoActual && (
        <div className="tablon-promo-mini">
          <span className="tablon-promo-mini-tag">Promo</span>
          <p key={promoActual.id} className="tablon-promo-mini-text">
            {promoActual.titulo}
          </p>
          <span className="tablon-promo-mini-vigencia">{promoActual.vigencia}</span>
        </div>
      )}

      <button className="tablon-arrow left" onClick={anterior} aria-label="Anterior">
        <ChevronLeft size={22} />
      </button>
      <button className="tablon-arrow right" onClick={siguiente} aria-label="Siguiente">
        <ChevronRight size={22} />
      </button>

      <div className="tablon-dots">
        {slides.map((s, i) => (
          <button
            key={s.titulo}
            className={i === activo ? "active" : ""}
            onClick={() => setActivo(i)}
            aria-label={`Ir al anuncio ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}