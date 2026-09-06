import "./CardRepuestos.css";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { useRepuestos } from "../hooks/useApiData";
import { useCotizacion } from "../context/CotizacionContext";
import { toast } from "react-toastify";

export default function CardRepuestos() {
  const [activa, setActiva] = useState("Todos");
  const { agregarItem, items } = useCotizacion();
  const { data: repuestos, loading } = useRepuestos();

  const categorias = useMemo(() => {
    const unicas = Array.from(new Set(repuestos.map((r) => r.categoria))).sort();
    return ["Todos", ...unicas.slice(0, 5)];
  }, [repuestos]);

  const destacados = useMemo(() => {
    const base = activa === "Todos" ? repuestos : repuestos.filter((r) => r.categoria === activa);
    return base.slice(0, 6);
  }, [activa, repuestos]);

  if (loading || repuestos.length === 0) return null;

  return (
    <section className="repuestos">
      <div className="section-wrap">
        <div className="section-title">
          <span className="tag">Inventario</span>
          <h2>
            Repuestos <span>destacados</span>
          </h2>
        </div>

        <div className="repuestos-filtros">
          {categorias.map((c) => (
            <button
              key={c}
              className={`filtro-btn ${activa === c ? "active" : ""}`}
              onClick={() => setActiva(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="repuestos-grid">
          {destacados.map((r) => {
            const yaAgregado = items.some((i) => i.uid === `repuesto-${r.id}`);
            return (
              <div className="repuesto-card" key={r.id}>
                <Link to={`/repuestos/${r.id}`} className="repuesto-thumb">
                  {r.imagen ? (
                    <img src={r.imagen} alt={r.nombre} />
                  ) : (
                    <Package size={34} />
                  )}
                </Link>
                <span className="repuesto-cat">{r.categoria}</span>
                <Link to={`/repuestos/${r.id}`}>
                  <h4>{r.nombre}</h4>
                </Link>
                <p>Código: {r.codigo || "—"}</p>
                <button
                  className="btn-primary small"
                  disabled={!r.stockDisponible}
                  onClick={() => {
                    if (!yaAgregado) {
                      agregarItem({
                        tipo: "repuesto",
                        id: r.id,
                        nombre: r.nombre,
                        codigo: r.codigo,
                        marca: r.marca,
                        categoria: r.categoria,
                      });

                      toast.success("¡Repuesto agregado correctamente!");
                    } else {
                      toast.success("¡Repuesto agregado correctamente!");
                    }
                  }}
                >
                  <Package size={14} /> {r.stockDisponible ? "Cotizar" : "Agotado"}
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: 34 }}>
          <Link to="/repuestos" className="btn-secondary-dark-inline">
            Ver catálogo completo de repuestos
          </Link>
        </div>
      </div>
    </section>
  );
}
