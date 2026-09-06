import "./pages.css";
import { Link, useParams, Navigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { sectores } from "../data/sectores";

export default function SectorDetalle() {
  const { slug } = useParams();
  const sector = sectores.find((s) => s.slug === slug);

  if (!sector) return <Navigate to="/nosotros" replace />;

  const otros = sectores.filter((s) => s.slug !== sector.slug);

  return (
    <>
      <div
        className="page-banner page-banner-nosotros"
        style={{ backgroundImage: `linear-gradient(90deg, #000 0%, rgba(0,0,0,0.92) 30%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.15) 100%), url(${sector.imagen})` }}
      >
        <div className="page-banner-inner">
          <div className="breadcrumb">
            <Link to="/">Inicio</Link> / <Link to="/nosotros">Nosotros</Link> /{" "}
            <span>{sector.nombre}</span>
          </div>
          <h1>
            Sector <span>{sector.nombre}</span>
          </h1>
          <p>{sector.resumen}</p>
        </div>
      </div>

      <div className="page-body">
        <div className="sector-detalle-puntos">
          {sector.puntos.map((p) => (
            <div className="sector-punto-card" key={p.titulo}>
              <CheckCircle2 size={26} />
              <h4>{p.titulo}</h4>
              <p>{p.descripcion}</p>
            </div>
          ))}
        </div>

        <div className="related-section">
          <h3>Otros sectores que atendemos</h3>
          <div className="sector-detalle-otros">
            {otros.map((s) => (
              <Link
                to={`/nosotros/sectores/${s.slug}`}
                key={s.slug}
                className="sector-card"
                style={{ backgroundImage: `url(${s.imagen})` }}
              >
                <div className="sector-card-overlay" />
                <div className="sector-card-content">
                  <h4>{s.nombre}</h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
