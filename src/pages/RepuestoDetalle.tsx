import "./pages.css";
import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Package } from "lucide-react";
import { useRepuestos } from "../hooks/useApiData";
import { useCotizacion } from "../context/CotizacionContext";
import AvisoCompatibilidad from "../components/shared/AvisoCompatibilidad";
import { toast } from "react-toastify";

export default function RepuestoDetalle() {
  const { id } = useParams();
  const { data: repuestos, loading } = useRepuestos();
  const repuesto = repuestos.find((r) => r.id === Number(id));
  const { agregarItem, items } = useCotizacion();
  const [cantidad, setCantidad] = useState(1);

  if (loading) return <div className="page-body"><p>Cargando...</p></div>;
  if (!repuesto) return <Navigate to="/repuestos" replace />;

  const yaAgregado = items.some((i) => i.uid === `repuesto-${repuesto.id}`);
  const relacionados = repuestos
    .filter((r) => r.categoria === repuesto.categoria && r.id !== repuesto.id)
    .slice(0, 3);

  return (
    <>
      <div className="page-banner">
        <div
          className="page-banner-img"
          style={{ backgroundImage: "url('/repuestos/repuestos-imagen-fondo.jpg')" }}
        />
        <div className="page-banner-inner">
          <div className="breadcrumb">
            <Link to="/">Inicio</Link> / <Link to="/repuestos">Repuestos</Link>{" "}
            / <span>{repuesto.nombre}</span>
          </div>
          <h1>{repuesto.nombre}</h1>
        </div>
      </div>

      <div className="page-body">
        <div className="detail-wrap">
          <div className="detail-media">
            {repuesto.imagen ? (
              <img
                src={repuesto.imagen}
                alt={repuesto.nombre}
                className="detail-media-img"
              />
            ) : (
              <>
                <span
                  style={{
                    fontSize: 11,
                    letterSpacing: 1,
                    color: "#bbb",
                    textTransform: "uppercase",
                  }}
                >
                  Part Number
                </span>
                <span className="detail-code-box">{repuesto.codigo || "—"}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#888" }}>
                  {repuesto.marca}
                </span>
              </>
            )}
          </div>

          <div className="detail-info">
            <span className="tag">{repuesto.categoria}</span>
            <h1>{repuesto.nombre}</h1>
            <span className={`stock-badge ${repuesto.stockDisponible ? "in-stock" : "out-of-stock"}`}>
              {repuesto.stockDisponible
                ? repuesto.stockCantidad > 0
                  ? `En stock (${repuesto.stockCantidad} disponible${repuesto.stockCantidad === 1 ? "" : "s"})`
                  : "En stock"
                : "Agotado"}
            </span>
            <p>
              {repuesto.descripcion ||
                "Consulte compatibilidad técnica para su equipo."}
            </p>

            <div className="detail-specs">
              <div className="spec-row">
                <span>Código</span>
                <span>{repuesto.codigo || "—"}</span>
              </div>
              <div className="spec-row">
                <span>Marca / procedencia</span>
                <span>{repuesto.marcaDetalle || repuesto.marca}</span>
              </div>
              {repuesto.especificaciones && (
                <div className="spec-row">
                  <span>Especificaciones</span>
                  <span>{repuesto.especificaciones}</span>
                </div>
              )}
              <div className="spec-row">
                <span>Unidad de medida</span>
                <span>{repuesto.unidad}</span>
              </div>
              <div className="spec-row">
                <span>Categoría</span>
                <span>{repuesto.categoria}</span>
              </div>
              <div className="spec-row">
                <span>Stock</span>
                <span>Disponible</span>
              </div>
            </div>

            {repuesto.modeloRecomendado?.length > 0 && (
              <>
                <strong
                  style={{
                    fontSize: 13,
                    color: "#333",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Modelos recomendados
                </strong>
                <div className="detail-models">
                  {repuesto.modeloRecomendado.map((m) => (
                    <span className="model-chip" key={m}>
                      {m}
                    </span>
                  ))}
                </div>
              </>
            )}

            <div className="detail-qty-row">
              <div className="qty-selector">
                <button onClick={() => setCantidad((c) => Math.max(1, c - 1))}>
                  −
                </button>
                <span>{cantidad}</span>
                <button onClick={() => setCantidad((c) => c + 1)}>+</button>
              </div>

              <button
                className={`detail-add-btn ${yaAgregado ? "added" : ""}`}
                disabled={!repuesto.stockDisponible}
                onClick={() => {
                  if (!yaAgregado) {
                    agregarItem(
                      {
                        tipo: "repuesto",
                        id: repuesto.id,
                        nombre: repuesto.nombre,
                        codigo: repuesto.codigo,
                        marca: repuesto.marca,
                        categoria: repuesto.categoria,
                      },
                      cantidad,
                    );

                    toast.success("¡Repuesto agregado correctamente!");
                  } else {
                    toast.success("¡Repuesto agregado correctamente!");
                  }
                }}
              >
                <Package size={17} />{" "}
                {!repuesto.stockDisponible ? "No disponible" : "Agregar a cotización"}
              </button>
            </div>

            <AvisoCompatibilidad />
          </div>
        </div>

        {relacionados.length > 0 && (
          <div className="related-section">
            <h3>Repuestos relacionados</h3>
            <div className="catalog-grid">
              {relacionados.map((r) => (
                <div className="cat-card" key={r.id}>
                  <Link to={`/repuestos/${r.id}`} className="cat-card-media">
                    {r.imagen ? (
                      <img src={r.imagen} alt={r.nombre} className="cat-card-img" />
                    ) : (
                      <>
                        <span className="cat-card-partnum">Part Number</span>
                        <span className="cat-card-code">{r.codigo || "—"}</span>
                        <span className="cat-card-brand-tag">{r.marca}</span>
                      </>
                    )}
                  </Link>
                  <div className="cat-card-body">
                    <span className="cat-card-cat">{r.categoria}</span>
                    <Link to={`/repuestos/${r.id}`}>
                      <h3>{r.nombre}</h3>
                    </Link>
                    <div className="cat-card-actions">
                      <Link
                        to={`/repuestos/${r.id}`}
                        className="btn-outline-sm"
                      >
                        Ver más
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
