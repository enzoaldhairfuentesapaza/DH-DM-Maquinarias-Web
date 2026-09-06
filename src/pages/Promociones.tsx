import "./pages.css";
import { Link } from "react-router-dom";
import { Tag } from "lucide-react";
import { usePromociones } from "../hooks/useApiData";

export default function Promociones() {
  const { data: promociones, loading, error } = usePromociones();

  return (
    <>
      <div className="page-banner">
        <div
          className="page-banner-img"
          style={{ backgroundImage: "url('/banners/promociones-banner.jpg')" }}
        />
        <div className="page-banner-overlay" />
        <div className="page-banner-inner">
          <div className="breadcrumb">
            <Link to="/">Inicio</Link> / <span>Promociones</span>
          </div>
          <h1>
            <span>Promociones</span> vigentes
          </h1>
          <p>Aprovecha nuestras ofertas en repuestos y servicios para tu maquinaria.</p>
        </div>
      </div>

      <div className="page-body">
        {loading && <p>Cargando promociones...</p>}
        {error && <p>No se pudieron cargar las promociones.</p>}
        {!loading && !error && promociones.length === 0 && (
          <p>No hay promociones vigentes por el momento.</p>
        )}
        {promociones.map((p) => (
          <div className={`promo-card ${p.destacado ? "featured" : ""}`} key={p.id}>
            {p.imagen && (
              <div
                className="promo-media"
                style={{ backgroundImage: `url(${p.imagen})` }}
              />
            )}
            <div className="promo-content">
              <Tag size={22} color="#f4c20d" style={{ marginBottom: 10 }} />
              <h3>{p.titulo}</h3>
              <p>{p.descripcion}</p>
              <span className="promo-vigencia">{p.vigencia}</span>
            </div>
            <Link to="/contacto" className="btn-primary" style={{ whiteSpace: "nowrap" }}>
              Consultar promoción
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}