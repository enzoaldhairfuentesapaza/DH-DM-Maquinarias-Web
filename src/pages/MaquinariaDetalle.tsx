import "./pages.css";
import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Truck, MapPin, CalendarDays, Gauge, Weight } from "lucide-react";
import { useMaquinarias } from "../hooks/useApiData";
import { useCotizacion } from "../context/CotizacionContext";
import AvisoCompatibilidad from "../components/shared/AvisoCompatibilidad";

export default function MaquinariaDetalle() {
  const { id } = useParams();
  const { data: maquinarias, loading } = useMaquinarias();
  const maquina = maquinarias.find((m) => m.id === Number(id));
  const { agregarItem, items } = useCotizacion();
  const [cantidad, setCantidad] = useState(1);

  if (loading) return <div className="page-body"><p>Cargando...</p></div>;
  if (!maquina) return <Navigate to="/maquinaria" replace />;

  const yaAgregado = items.some((i) => i.uid === `maquinaria-${maquina.id}`);
  const relacionadas = maquinarias
    .filter((m) => m.categoria === maquina.categoria && m.id !== maquina.id)
    .slice(0, 3);

  return (
    <>
      <div className="page-banner">
        <div className="page-banner-inner">
          <div className="breadcrumb">
            <Link to="/">Inicio</Link> / <Link to="/maquinaria">Maquinaria</Link> /{" "}
            <span>{maquina.nombre}</span>
          </div>
          <h1>{maquina.nombre}</h1>
        </div>
      </div>

      <div className="page-body">
        <div className="detail-wrap">
          <div className="detail-media">
            <Truck size={64} />
            <span className="detail-code-box">{maquina.marca}</span>
          </div>

          <div className="detail-info">
            <span className="tag">{maquina.categoria}</span>
            <h1>{maquina.nombre}</h1>
            <span className={`stock-badge ${maquina.stockDisponible ? "in-stock" : "out-of-stock"}`}>
              {maquina.stockDisponible
                ? maquina.stockCantidad > 0
                  ? `En stock (${maquina.stockCantidad} disponible${maquina.stockCantidad === 1 ? "" : "s"})`
                  : "En stock"
                : "Agotado"}
            </span>
            <p>{maquina.descripcion}</p>

            <div className="detail-specs">
              <div className="spec-row">
                <span><CalendarDays size={14} style={{ verticalAlign: "-2px" }} /> Año</span>
                <span>{maquina.año}</span>
              </div>
              <div className="spec-row">
                <span>Condición</span>
                <span>{maquina.condicion}</span>
              </div>
              <div className="spec-row">
                <span><Gauge size={14} style={{ verticalAlign: "-2px" }} /> Potencia</span>
                <span>{maquina.potencia}</span>
              </div>
              <div className="spec-row">
                <span><Weight size={14} style={{ verticalAlign: "-2px" }} /> Peso operativo</span>
                <span>{maquina.peso}</span>
              </div>
              <div className="spec-row">
                <span><MapPin size={14} style={{ verticalAlign: "-2px" }} /> Ubicación</span>
                <span>{maquina.ubicacion}</span>
              </div>
              {maquina.especificaciones.map((e) => (
                <div className="spec-row" key={e.label}>
                  <span>{e.label}</span>
                  <span>{e.valor}</span>
                </div>
              ))}
            </div>

            <div className="detail-qty-row">
              <div className="qty-selector">
                <button onClick={() => setCantidad((c) => Math.max(1, c - 1))}>−</button>
                <span>{cantidad}</span>
                <button onClick={() => setCantidad((c) => c + 1)}>+</button>
              </div>

              <button
                className={`detail-add-btn ${yaAgregado ? "added" : ""}`}
                disabled={!maquina.stockDisponible}
                onClick={() =>
                  agregarItem(
                    {
                      tipo: "maquinaria",
                      id: maquina.id,
                      nombre: maquina.nombre,
                      marca: maquina.marca,
                      categoria: maquina.categoria,
                    },
                    cantidad
                  )
                }
              >
                {!maquina.stockDisponible
                  ? "No disponible"
                  : yaAgregado
                  ? "Agregado a la cotización ✓"
                  : "Agregar a cotización"}
              </button>
            </div>

            <AvisoCompatibilidad />
          </div>
        </div>

        {relacionadas.length > 0 && (
          <div className="related-section">
            <h3>Equipos relacionados</h3>
            <div className="catalog-grid">
              {relacionadas.map((m) => (
                <div className="cat-card" key={m.id}>
                  <Link to={`/maquinaria/${m.id}`} className="cat-card-media">
                    <Truck size={36} />
                    <span className="cat-card-brand-tag">{m.marca}</span>
                  </Link>
                  <div className="cat-card-body">
                    <span className="cat-card-cat">{m.categoria}</span>
                    <Link to={`/maquinaria/${m.id}`}>
                      <h3>{m.nombre}</h3>
                    </Link>
                    <div className="cat-card-actions">
                      <Link to={`/maquinaria/${m.id}`} className="btn-outline-sm">
                        Ver detalle
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
