import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api } from "../../api/client";
import "./admin.css";

interface EntradaAuditoria {
  id: number;
  usuario_id: number | null;
  usuario_nombre: string | null;
  usuario_rol: string | null;
  categoria: string;
  accion: string;
  descripcion: string;
  creado_en: string;
}

const CATEGORIA_LABELS: Record<string, string> = {
  todas: "Todas las categorías",
  cotizaciones: "Cotizaciones",
  accesos: "Accesos",
  novedades: "Novedades",
  blog: "Blog",
  promociones: "Promociones",
  maquinaria: "Maquinaria",
  repuestos: "Repuestos",
  ventas: "Ventas",
};

const ACCION_LABELS: Record<string, string> = {
  crear: "Creó",
  editar: "Editó",
  eliminar: "Eliminó",
  estado: "Cambió estado",
  restaurar: "Restauró",
};

export default function Auditoria() {
  const [items, setItems] = useState<EntradaAuditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria]);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoria !== "todas") params.set("categoria", categoria);
      const data = await api.get<EntradaAuditoria[]>(`/api/auditoria?${params.toString()}`);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el registro");
    } finally {
      setLoading(false);
    }
  }

  const categoriasDisponibles = useMemo(() => {
    const set = new Set(items.map((i) => i.categoria));
    Object.keys(CATEGORIA_LABELS)
      .filter((c) => c !== "todas")
      .forEach((c) => set.add(c));
    return ["todas", ...Array.from(set).sort()];
  }, [items]);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return items;
    return items.filter(
      (i) =>
        i.descripcion.toLowerCase().includes(texto) ||
        (i.usuario_nombre ?? "").toLowerCase().includes(texto),
    );
  }, [items, busqueda]);

  return (
    <div>
      <div className="admin-header-row">
        <div>
          <h1>Registro de actividad</h1>
          <p className="subtitle">
            Historial de cambios en el panel: quién hizo qué y cuándo. Solo visible para el owner.
          </p>
        </div>
      </div>

      <div className="admin-search-bar">
        <Search size={16} />
        <input
          type="text"
          placeholder="Buscar por descripción o quién hizo el cambio..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="admin-tabs">
        {categoriasDisponibles.map((c) => (
          <button key={c} className={categoria === c ? "active" : ""} onClick={() => setCategoria(c)}>
            {CATEGORIA_LABELS[c] ?? c}
          </button>
        ))}
      </div>

      {error && <div className="admin-error">{error}</div>}
      {loading ? (
        <p>Cargando...</p>
      ) : visibles.length === 0 ? (
        <p>No hay entradas registradas todavía.</p>
      ) : (
        visibles.map((e) => (
          <div className="auditoria-row" key={e.id}>
            <span className="auditoria-categoria-badge">{CATEGORIA_LABELS[e.categoria] ?? e.categoria}</span>
            <span style={{ fontWeight: 700 }}>{e.usuario_nombre || "Desconocido"}</span>
            {e.usuario_rol && <span className="meta"> ({e.usuario_rol})</span>}
            <p style={{ margin: "6px 0" }}>
              <strong>{ACCION_LABELS[e.accion] ?? e.accion}:</strong> {e.descripcion}
            </p>
            <p className="meta">{new Date(e.creado_en).toLocaleString("es-PE")}</p>
          </div>
        ))
      )}
    </div>
  );
}
