import "./pages.css";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useNovedades } from "../hooks/useApiData";

export default function Novedades() {
  const { data: novedades, loading, error } = useNovedades();

  return (
    <>
      <div className="page-banner">
        <div
          className="page-banner-img"
          style={{ backgroundImage: "url('/banners/novedades-banner.jpg')" }}
        />
        <div className="page-banner-overlay" />
        <div className="page-banner-inner">
          <div className="breadcrumb">
            <Link to="/">Inicio</Link> / <span>Novedades</span>
          </div>
          <h1>
            <span>Novedades</span> DH & DM Maquinarias
          </h1>
          <p>
            Conoce nuestros productos propios, mejoras y noticias sobre la
            empresa.
          </p>
        </div>
      </div>

      <div className="page-body">
        {loading && <p>Cargando novedades...</p>}
        {error && <p>No se pudieron cargar las novedades.</p>}
        {!loading && !error && novedades.length === 0 && (
          <p>No hay novedades publicadas todavía.</p>
        )}
        <div className="novedades-grid">
          {novedades.map((n) => (
            <div className="novedad-card" key={n.id}>
              <div
                className="novedad-media"
                style={
                  n.imagen
                    ? { backgroundImage: `url(${n.imagen})` }
                    : undefined
                }
              >
                {!n.imagen && (
                  <div className="novedad-media-fallback">
                    <Sparkles size={36} color="#f4c20d" />
                  </div>
                )}
              </div>
              <div className="novedad-body">
                <div className="novedad-meta">
                  <span className="novedad-tag-cat">{n.categoria}</span>
                  <span className="novedad-fecha">{n.fecha}</span>
                </div>
                <h3>{n.titulo}</h3>
                <p>{n.resumen}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}