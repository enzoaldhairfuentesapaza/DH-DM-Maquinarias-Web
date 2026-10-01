import "./PromocionesDestacadas.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { usePromociones } from "../hooks/useApiData";

export default function PromocionesDestacadas() {
  const { data: promociones, loading } = usePromociones();
  const navigate = useNavigate();
  const destacadas = promociones.filter((p) => p.destacado);
  const [activo, setActivo] = useState(0);

  useEffect(() => {
    if (activo >= destacadas.length) setActivo(0);
  }, [destacadas.length, activo]);

  useEffect(() => {
    if (destacadas.length < 2) return;
    const id = setInterval(() => {
      setActivo((a) => (a + 1) % destacadas.length);
    }, 4500);
    return () => clearInterval(id);
  }, [destacadas.length]);

  if (loading || destacadas.length === 0) return null;

  const promo = destacadas[activo];

  return (
    <section className="promos-destacadas">
      <div className="section-wrap">
        <div
          className="promo-carrusel-card"
          onClick={() => navigate("/promociones")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate("/promociones")}
        >
          <div
            className="promo-carrusel-media"
            style={promo.imagen ? { backgroundImage: `url(${promo.imagen})` } : undefined}
          >
            <span className="promo-carrusel-badge">
              <Tag size={13} /> Promoción activa
            </span>
          </div>

          <div className="promo-carrusel-body">
            <h3 key={promo.id}>{promo.titulo}</h3>
            <p>{promo.descripcion}</p>
            <span className="promo-destacada-vigencia">{promo.vigencia}</span>
            <span className="promo-carrusel-cta">
              Ver todas las promociones <ArrowRight size={16} />
            </span>
          </div>

          {destacadas.length > 1 && (
            <>
              <button
                type="button"
                className="promo-carrusel-arrow left"
                aria-label="Promoción anterior"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivo((a) => (a - 1 + destacadas.length) % destacadas.length);
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className="promo-carrusel-arrow right"
                aria-label="Siguiente promoción"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivo((a) => (a + 1) % destacadas.length);
                }}
              >
                <ChevronRight size={20} />
              </button>

              <div className="promo-carrusel-dots" onClick={(e) => e.stopPropagation()}>
                {destacadas.map((p, i) => (
                  <button
                    key={p.id}
                    className={i === activo ? "active" : ""}
                    aria-label={`Ir a la promoción ${i + 1}`}
                    onClick={() => setActivo(i)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

