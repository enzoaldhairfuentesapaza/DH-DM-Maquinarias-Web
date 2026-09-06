import "./pages.css";
import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Package, Search } from "lucide-react";
import { useRepuestos } from "../hooks/useApiData";
import { useCotizacion } from "../context/CotizacionContext";
import { toast } from "react-toastify";

const PAGE_SIZE = 24;

export default function Repuestos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categoriasSel, setCategoriasSel] = useState<string[]>(
    searchParams.get("categoria") ? [searchParams.get("categoria")!] : []
  );
  const [marcasSel, setMarcasSel] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState(searchParams.get("buscar") || "");
  const [pagina, setPagina] = useState(1);
  const { agregarItem, items } = useCotizacion();
  const { data: repuestos, loading, error } = useRepuestos();

  const categorias = useMemo(
    () => Array.from(new Set(repuestos.map((r) => r.categoria))).sort(),
    [repuestos]
  );
  const marcas = useMemo(
    () => Array.from(new Set(repuestos.map((r) => r.marca))).sort(),
    [repuestos]
  );

  useEffect(() => {
    const cat = searchParams.get("categoria");
    const buscar = searchParams.get("buscar");
    if (cat) setCategoriasSel([cat]);
    if (buscar) setBusqueda(buscar);
  }, [searchParams]);

  const toggle = (val: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(val) ? list.filter((v) => v !== val) : [...list, val]);
    setPagina(1);
  };

  const resultado = useMemo(() => {
    return repuestos.filter((r) => {
      const okCat = categoriasSel.length === 0 || categoriasSel.includes(r.categoria);
      const okMarca = marcasSel.length === 0 || marcasSel.includes(r.marca);
      const okBusqueda =
        !busqueda ||
        r.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.categoria.toLowerCase().includes(busqueda.toLowerCase());
      return okCat && okMarca && okBusqueda;
    });
  }, [categoriasSel, marcasSel, busqueda, repuestos]);

  const totalPaginas = Math.max(1, Math.ceil(resultado.length / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const paginaItems = resultado.slice(
    (paginaSegura - 1) * PAGE_SIZE,
    paginaSegura * PAGE_SIZE
  );

  const limpiar = () => {
    setCategoriasSel([]);
    setMarcasSel([]);
    setBusqueda("");
    setPagina(1);
    setSearchParams({});
  };

  return (
    <>
      <div className="page-banner page-banner-repuestos">
        <div className="page-banner-inner">
          <div className="breadcrumb">
            <Link to="/">Inicio</Link> / <span>Repuestos</span>
          </div>
          <h1>
            Catálogo de <span>Repuestos</span>
          </h1>
          <p>
            Repuestos originales y alternativos para maquinaria pesada, organizados por
            categoría, marca y compatibilidad de modelo.
          </p>
        </div>
      </div>

      <div className="page-body">
        <div className="catalog-layout">
          <aside className="catalog-sidebar">
            <h4>Filtrar por</h4>

            <div className="filter-group" style={{ maxHeight: 320, overflowY: "auto" }}>
              <strong style={{ fontSize: 13, color: "#333" }}>Categoría</strong>
              {categorias.map((c) => (
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

            <div className="filter-group" style={{ maxHeight: 200, overflowY: "auto" }}>
              <strong style={{ fontSize: 13, color: "#333" }}>Marca</strong>
              {marcas.map((m) => (
                <label key={m}>
                  <input
                    type="checkbox"
                    checked={marcasSel.includes(m)}
                    onChange={() => toggle(m, marcasSel, setMarcasSel)}
                  />
                  {m}
                </label>
              ))}
            </div>

            <button className="clear-filters" onClick={limpiar}>
              Limpiar filtros
            </button>
          </aside>

          <div>
            <div className="catalog-main-top">
              <span className="catalog-count">
                <strong>{resultado.length}</strong> repuestos encontrados
              </span>

              <div className="catalog-search-inline">
                <Search size={16} color="#999" />
                <input
                  placeholder="Buscar por nombre o código..."
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setPagina(1);
                  }}
                />
              </div>
            </div>

            {loading && <p>Cargando repuestos...</p>}
            {error && <p>No se pudo cargar el catálogo de repuestos.</p>}
            {!loading && !error && paginaItems.length === 0 ? (
              <div className="empty-state">No se encontraron repuestos con los filtros seleccionados.</div>
            ) : !loading && !error && (
              <div className="catalog-grid">
                {paginaItems.map((r) => {
                  const yaAgregado = items.some((i) => i.uid === `repuesto-${r.id}`);
                  return (
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
                        <span className={`stock-badge card-stock-badge ${r.stockDisponible ? "in-stock" : "out-of-stock"}`}>
                          {r.stockDisponible ? "En stock" : "Agotado"}
                        </span>
                      </Link>
                      <div className="cat-card-body">
                        <span className="cat-card-cat">{r.categoria}</span>
                        <Link to={`/repuestos/${r.id}`}>
                          <h3>{r.nombre}</h3>
                        </Link>
                        <div className="cat-card-meta">
                          <span>Marca: <strong>{r.marca}</strong></span>
                          <span>Stock: <strong>Disponible</strong></span>
                        </div>
                        <div className="cat-card-actions">
                          <Link to={`/repuestos/${r.id}`} className="btn-outline-sm">
                            Ver más
                          </Link>
                          <button
                            className="btn-add-quote"
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
                            <Package size={14} /> Cotizar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {totalPaginas > 1 && (
              <div className="pagination">
                {Array.from({ length: totalPaginas }).slice(0, 10).map((_, i) => (
                  <button
                    key={i}
                    className={paginaSegura === i + 1 ? "active" : ""}
                    onClick={() => setPagina(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
