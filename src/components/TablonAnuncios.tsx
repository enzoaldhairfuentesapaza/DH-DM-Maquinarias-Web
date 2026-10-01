import "./TablonAnuncios.css";
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNovedades } from "../hooks/useApiData";

type Slide = {
  imagen: string;
  titulo: string;
  texto: string;
  link?: string;
};

// Anuncios de respaldo: solo se usan si todavía no hay ninguna novedad
// marcada como "destacada" en el panel (Editar Página > Novedades), para que
// el tablón nunca se vea vacío.
const slidesRespaldo: Slide[] = [
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
  const { data: novedades } = useNovedades();

  // Las novedades marcadas como destacadas en el panel reemplazan los
  // anuncios fijos; si todavía no hay ninguna, se usan los de respaldo.
  const destacadas = novedades.filter((n) => n.destacado);
  const slides: Slide[] =
    destacadas.length > 0
      ? destacadas.map((n) => ({
          imagen: n.imagen || "/anuncios/slide-1.jpg",
          titulo: n.titulo,
          texto: n.resumen,
          link: "/novedades",
        }))
      : slidesRespaldo;

  const siguiente = useCallback(() => {
    setActivo((a) => (a + 1) % slides.length);
  }, [slides.length]);

  const anterior = () => {
    setActivo((a) => (a - 1 + slides.length) % slides.length);
  };

  // Si cambia la cantidad de slides (ej. se cargan las novedades), evitamos
  // quedar apuntando a un índice que ya no existe.
  useEffect(() => {
    if (activo >= slides.length) setActivo(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  useEffect(() => {
    const id = setInterval(siguiente, 5000);
    return () => clearInterval(id);
  }, [siguiente]);

  return (
    <section className="tablon">
      <div className="tablon-track">
        {slides.map((s, i) => {
          const contenido = (
            <>
              <div className="tablon-slide-overlay" />
              <div className="tablon-slide-content">
                <h3>{s.titulo}</h3>
                <p>{s.texto}</p>
              </div>
            </>
          );
          return s.link ? (
            <Link
              key={`${s.titulo}-${i}`}
              to={s.link}
              className={`tablon-slide ${i === activo ? "active" : ""}`}
              style={{ backgroundImage: `url(${s.imagen})` }}
            >
              {contenido}
            </Link>
          ) : (
            <div
              key={`${s.titulo}-${i}`}
              className={`tablon-slide ${i === activo ? "active" : ""}`}
              style={{ backgroundImage: `url(${s.imagen})` }}
            >
              {contenido}
            </div>
          );
        })}
      </div>

      <button className="tablon-arrow left" onClick={anterior} aria-label="Anterior">
        <ChevronLeft size={22} />
      </button>
      <button className="tablon-arrow right" onClick={siguiente} aria-label="Siguiente">
        <ChevronRight size={22} />
      </button>

      <div className="tablon-dots">
        {slides.map((s, i) => (
          <button
            key={`${s.titulo}-${i}`}
            className={i === activo ? "active" : ""}
            onClick={() => setActivo(i)}
            aria-label={`Ir al anuncio ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}