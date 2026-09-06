import "./pages.css";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Truck, Search, CalendarDays, Gauge } from "lucide-react";
import { useMaquinarias } from "../hooks/useApiData";
import { useCotizacion } from "../context/CotizacionContext";

export default function Maquinaria() {
  const [categoriasSel, setCategoriasSel] = useState<string[]>([]);
  const [condicion, setCondicion] = useState("Todas");
  const [orden, setOrden] = useState("relevancia");
  const [busqueda, setBusqueda] = useState("");
  const { agregarItem, items } = useCotizacion();
  const { data: maquinarias, loading, error } = useMaquinarias();

  const categoriasMaquinaria = useMemo(
    () => Array.from(new Set(maquinarias.map((m) => m.categoria))),
    [maquinarias]
  );

  const toggle = (val: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(val) ? list.filter((v) => v !== val) : [...list, val]);
  };

  const resultado = useMemo(() => {
    let r = maquinarias.filter((m) => {
      const okCat = categoriasSel.length === 0 || categoriasSel.includes(m.categoria);
      const okCond = condicion === "Todas" || m.condicion === condicion;
      const okBusqueda =
        !busqueda ||
        m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        m.marca.toLowerCase().includes(busqueda.toLowerCase());
      return okCat && okCond && okBusqueda;
    });

    if (orden === "año-desc") r = [...r].sort((a, b) => b.año - a.año);
    if (orden === "año-asc") r = [...r].sort((a, b) => a.año - b.año);
    if (orden === "nombre") r = [...r].sort((a, b) => a.nombre.localeCompare(b.nombre));

    return r;
  }, [categoriasSel, condicion, orden, busqueda, maquinarias]);

  const limpiar = () => {
    setCategoriasSel([]);
    setCondicion("Todas");
    setBusqueda("");
  };

  return (
    <>
      <div className="page-banner page-banner-maquinarias">
        <div className="page-banner-inner">
          <div className="breadcrumb">
            <Link to="/">Inicio</Link> / <span>Maquinaria</span>
          </div>
          <h1>
            Catálogo de <span>Maquinaria</span>
          </h1>
          <p>
            Equipos nuevos, usados y reacondicionados para construcción,
            transporte e infraestructura. Solicita tu cotización sin compromiso.
          </p>
        </div>
      </div>

      <div className="page-body">
        <div className="catalog-layout">
          <aside className="catalog-sidebar">
            <h4>Filtrar por</h4>

            <div className="filter-group">
              <strong style={{ fontSize: 13, color: "#333" }}>Categoría</strong>
              {categoriasMaquinaria.map((c) => (
                <label key={c}>
                  <input
                    type="checkbox"
                    checked={categoriasSel.includes(c)}
                    onChange={() => toggle(c, categoriasSel, setCategoriasSel)}
                  />
                  {c}
                </label>
              ))}
            </div>

            <div className="filter-group">
              <strong style={{ fontSize: 13, color: "#333" }}>Condición</strong>
              <select value={condicion} onChange={(e) => setCondicion(e.target.value)}>
                <option>Todas</option>
                <option>Nuevo</option>
                <option>Usado</option>
                <option>Reacondicionado</option>
              </select>
            </div>

            <button className="clear-filters" onClick={limpiar}>
              Limpiar filtros
            </button>
          </aside>

          <div>
            <div className="catalog-main-top">
              <span className="catalog-count">
                <strong>{resultado.length}</strong> equipos encontrados
              </span>

              <div className="catalog-search-inline">
                <Search size={16} color="#999" />
                <input
                  placeholder="Buscar maquinaria..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>

              <select
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd" }}
              >
                <option value="relevancia">Ordenar: Relevancia</option>
                <option value="año-desc">Año: más reciente</option>
                <option value="año-asc">Año: más antiguo</option>
                <option value="nombre">Nombre: A-Z</option>
              </select>
            </div>

            {loading && <p>Cargando maquinaria...</p>}
            {error && <p>No se pudo cargar el catálogo de maquinaria.</p>}
            {!loading && !error && resultado.length === 0 ? (
              <div className="empty-state">No se encontraron equipos con los filtros seleccionados.</div>
            ) : !loading && !error && (
              <div className="catalog-grid">
                {resultado.map((m) => {
                  const yaAgregado = items.some((i) => i.uid === `maquinaria-${m.id}`);
                  return (
                    <div className="cat-card" key={m.id}>
                      <Link to={`/maquinaria/${m.id}`} className="cat-card-media">
                        {m.imagen ? (
                          <img src={m.imagen} alt={m.nombre} className="cat-card-img" />
                        ) : (
                          <Truck size={40} />
                        )}
                        <span className="cat-card-partnum">{m.condicion}</span>
                        <span className="cat-card-brand-tag">{m.marca}</span>
                        <span className={`stock-badge card-stock-badge ${m.stockDisponible ? "in-stock" : "out-of-stock"}`}>
                          {m.stockDisponible ? "En stock" : "Agotado"}
                        </span>
                      </Link>
                      <div className="cat-card-body">
                        <span className="cat-card-cat">{m.categoria}</span>
                        <Link to={`/maquinaria/${m.id}`}>
                          <h3>{m.nombre}</h3>
                        </Link>
                        <div className="cat-card-meta">
                          <span><CalendarDays size={13} /> {m.año}</span>
                          <span><Gauge size={13} /> {m.potencia}</span>
                        </div>
                        <div className="cat-card-actions">
                          <Link to={`/maquinaria/${m.id}`} className="btn-outline-sm">
                            Ver detalle
                          </Link>
                          <button
                            className={`btn-add-quote ${yaAgregado ? "added" : ""}`}
                            onClick={() =>
                              agregarItem({
                                tipo: "maquinaria",
                                id: m.id,
                                nombre: m.nombre,
                                marca: m.marca,
                                categoria: m.categoria,
                              })
                            }
                          >
                            {yaAgregado ? "Agregado ✓" : "Cotizar"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
