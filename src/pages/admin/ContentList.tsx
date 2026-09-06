import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { api } from "../../api/client";
import { entities } from "./entityConfig";
import "./admin.css";

type Row = Record<string, any>;
type OrdenCampo = "nombre" | "fecha";
type OrdenDireccion = "asc" | "desc";

// Prioridad de campos "nombre" segun la entidad (nombre, titulo, codigo...)
const CAMPOS_NOMBRE = ["nombre", "titulo", "codigo"];
const CAMPOS_FECHA = ["creado_en", "fecha"];

function getCampoNombre(item: Row): string {
  for (const c of CAMPOS_NOMBRE) {
    if (item[c] != null) return String(item[c]);
  }
  return "";
}

function getCampoFecha(item: Row): string {
  for (const c of CAMPOS_FECHA) {
    if (item[c] != null) return String(item[c]);
  }
  return "";
}

export default function ContentList() {
  const { entityKey } = useParams<{ entityKey: string }>();
  const config = entityKey ? entities[entityKey] : undefined;
  const navigate = useNavigate();

  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [ordenCampo, setOrdenCampo] = useState<OrdenCampo>("nombre");
  const [ordenDireccion, setOrdenDireccion] = useState<OrdenDireccion>("asc");

  useEffect(() => {
    if (!config) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityKey]);

  async function load() {
    if (!config) return;
    setLoading(true);
    try {
      const data = await api.get<Row[]>(`${config.apiPath}/`);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!config) return;
    if (!confirm(`¿Seguro que quieres eliminar este ${config.singular.toLowerCase()}?`)) {
      return;
    }
    try {
      await api.delete(`${config.apiPath}/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  const hayFiltrosActivos = busqueda.trim() !== "" || ordenCampo !== "nombre" || ordenDireccion !== "asc";

  function limpiarFiltros() {
    setBusqueda("");
    setOrdenCampo("nombre");
    setOrdenDireccion("asc");
  }

  const itemsFiltrados = useMemo(() => {
    let resultado = items;

    const q = busqueda.trim().toLowerCase();
    if (q) {
      resultado = resultado.filter((item) =>
        config?.listColumns.some((c) => String(item[c.name] ?? "").toLowerCase().includes(q))
      );
    }

    resultado = [...resultado].sort((a, b) => {
      const va = ordenCampo === "nombre" ? getCampoNombre(a) : getCampoFecha(a);
      const vb = ordenCampo === "nombre" ? getCampoNombre(b) : getCampoFecha(b);
      const cmp = va.localeCompare(vb, "es", { numeric: true });
      return ordenDireccion === "asc" ? cmp : -cmp;
    });

    return resultado;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, busqueda, ordenCampo, ordenDireccion]);

  if (!config) {
    return <p>Sección no encontrada.</p>;
  }

  return (
    <div>
      <div className="admin-header-row">
        <div>
          <p className="subtitle" style={{ marginBottom: 4 }}>
            <Link to={config.parentHub.to} style={{ color: "#999" }}>
              {config.parentHub.label}
            </Link>{" "}
            / {config.plural}
          </p>
          <h1>{config.plural}</h1>
        </div>
        <button
          className="btn-admin yellow"
          onClick={() => navigate(`/admin/${entityKey}/nuevo`)}
        >
          + Agregar {config.singular.toLowerCase()}
        </button>
      </div>

      <div className="admin-filters-bar">
        <div className="admin-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder={`Buscar ${config.plural.toLowerCase()}...`}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <select
          value={ordenCampo}
          onChange={(e) => setOrdenCampo(e.target.value as OrdenCampo)}
          className="admin-filter-select"
        >
          <option value="nombre">Ordenar por nombre</option>
          <option value="fecha">Ordenar por fecha de creación</option>
        </select>

        <select
          value={ordenDireccion}
          onChange={(e) => setOrdenDireccion(e.target.value as OrdenDireccion)}
          className="admin-filter-select"
        >
          <option value="asc">Ascendente</option>
          <option value="desc">Descendente</option>
        </select>

        {hayFiltrosActivos && (
          <button className="btn-admin small outline" onClick={limpiarFiltros}>
            <X size={14} /> Quitar filtros
          </button>
        )}
      </div>

      {error && <div className="admin-error">{error}</div>}
      {loading ? (
        <p>Cargando...</p>
      ) : itemsFiltrados.length === 0 ? (
        <p>
          {items.length === 0
            ? `No hay ${config.plural.toLowerCase()} todavía.`
            : "No se encontraron resultados con esos filtros."}
        </p>
      ) : (
        <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {config.listColumns.map((c) => (
                <th key={c.name}>{c.label}</th>
              ))}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {itemsFiltrados.map((item) => (
              <tr key={item.id}>
                {config.listColumns.map((c) => (
                  <td key={c.name}>
                    {typeof item[c.name] === "boolean"
                      ? item[c.name]
                        ? "Sí"
                        : "No"
                      : String(item[c.name] ?? "")}
                  </td>
                ))}
                <td>
                  <button
                    className="btn-admin small outline"
                    onClick={() => navigate(`/admin/${entityKey}/${item.id}`)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-admin small danger"
                    onClick={() => handleDelete(item.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
