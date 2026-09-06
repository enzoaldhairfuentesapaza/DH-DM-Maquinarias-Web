import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Pencil, Check, X, Search } from "lucide-react";
import { api } from "../../api/client";
import "./admin.css";

interface Categoria {
  id: number;
  tipo: "maquinaria" | "repuesto";
  nombre: string;
}

export default function CategoriasAdmin() {
  const [tab, setTab] = useState<"maquinaria" | "repuesto">("maquinaria");
  const [items, setItems] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nuevo, setNuevo] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<Categoria[]>(`/api/categorias?tipo=${tab}`);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  async function handleAgregar(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevo.trim()) return;
    try {
      await api.post("/api/categorias", { tipo: tab, nombre: nuevo.trim() });
      setNuevo("");
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al agregar");
    }
  }

  async function handleEliminar(id: number) {
    if (!confirm("¿Eliminar esta categoría? Los productos que ya la usan no se verán afectados, pero dejará de aparecer como opción.")) return;
    try {
      await api.delete(`/api/categorias/${id}`);
      setItems((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  function empezarEdicion(c: Categoria) {
    setEditId(c.id);
    setEditNombre(c.nombre);
  }

  async function guardarEdicion(id: number) {
    if (!editNombre.trim()) return;
    try {
      await api.put(`/api/categorias/${id}`, { nombre: editNombre.trim() });
      setEditId(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al editar");
    }
  }

  const itemsFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => c.nombre.toLowerCase().includes(q));
  }, [items, busqueda]);

  return (
    <div>
      <div className="admin-header-row">
        <div>
          <p className="subtitle" style={{ marginBottom: 4 }}>
            <Link to="/admin/productos" style={{ color: "#999" }}>
              Administrar Productos
            </Link>{" "}
            / Categorías
          </p>
          <h1>Categorías de productos</h1>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={tab === "maquinaria" ? "active" : ""} onClick={() => setTab("maquinaria")}>
          Maquinaria
        </button>
        <button className={tab === "repuesto" ? "active" : ""} onClick={() => setTab("repuesto")}>
          Repuestos
        </button>
      </div>

      <form onSubmit={handleAgregar} style={{ display: "flex", gap: 10, marginBottom: 20, maxWidth: 460 }}>
        <input
          type="text"
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          placeholder={`Nueva categoría de ${tab === "maquinaria" ? "maquinaria" : "repuestos"}`}
          style={{
            flex: 1,
            padding: "10px 13px",
            border: "1.5px solid #e4e4e4",
            borderRadius: 8,
            fontSize: 14,
          }}
        />
        <button type="submit" className="btn-admin yellow">
          <Plus size={16} /> Agregar
        </button>
      </form>

      <div className="admin-filters-bar" style={{ maxWidth: 460 }}>
        <div className="admin-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar categoría..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        {busqueda && (
          <button className="btn-admin small outline" onClick={() => setBusqueda("")}>
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
            ? `No hay categorías de ${tab === "maquinaria" ? "maquinaria" : "repuestos"} todavía.`
            : "No se encontraron categorías con ese nombre."}
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th style={{ width: 140 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {itemsFiltrados.map((c) => (
                <tr key={c.id}>
                  <td>
                    {editId === c.id ? (
                      <input
                        type="text"
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        autoFocus
                        style={{
                          padding: "6px 10px",
                          border: "1.5px solid #e4e4e4",
                          borderRadius: 6,
                          fontSize: 13.5,
                          width: "100%",
                        }}
                      />
                    ) : (
                      c.nombre
                    )}
                  </td>
                  <td>
                    {editId === c.id ? (
                      <>
                        <button className="btn-admin small" onClick={() => guardarEdicion(c.id)}>
                          <Check size={14} />
                        </button>
                        <button className="btn-admin small outline" onClick={() => setEditId(null)}>
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn-admin small" onClick={() => empezarEdicion(c)}>
                          <Pencil size={14} />
                        </button>
                        <button className="btn-admin small danger" onClick={() => handleEliminar(c.id)}>
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link to="/admin/productos" className="btn-admin outline" style={{ marginTop: 20, display: "inline-flex" }}>
        <ArrowLeft size={16} /> Volver
      </Link>
    </div>
  );
}
