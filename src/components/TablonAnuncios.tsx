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

export default function TablonAnuncios() {
  const [activo, setActivo] = useState(0);
  const { data: novedades, loading, error } = useNovedades();
  // El tablón publica únicamente las novedades marcadas como destacadas.
  const slides: Slide[] = novedades.filter(n => n.destacado)
    .map(n => ({imagen:n.imagen, titulo:n.titulo, texto:n.resumen, link:"/novedades"}));

  const siguiente = useCallback(() => {
    setActivo((a) => slides.length ? (a + 1) % slides.length : 0);
  }, [slides.length]);

  const anterior = () => {
    setActivo((a) => slides.length ? (a - 1 + slides.length) % slides.length : 0);
  };

  // Si cambia la cantidad de slides (ej. se cargan las novedades), evitamos
  // quedar apuntando a un índice que ya no existe.
  useEffect(() => {
    if (activo >= slides.length) setActivo(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(siguiente, 5000);
    return () => clearInterval(id);
  }, [siguiente, slides.length]);

  if (loading || error || !slides.length) return <section className="tablon tablon-status" aria-label="Tablón de novedades"><p role={error ? "alert" : "status"}>{loading ? "Cargando novedades…" : error ? "No se pudieron cargar las novedades. Intenta recargar la página." : "Todavía no hay novedades destacadas."}</p></section>;

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
              tabIndex={i === activo ? 0 : -1}
              aria-hidden={i !== activo}
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

      {slides.length > 1 && <>
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
      </>}
    </section>
  );
}