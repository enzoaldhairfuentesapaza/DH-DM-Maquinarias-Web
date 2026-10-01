import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, Receipt, ClipboardList, Clock, Package, Truck } from "lucide-react";
import { api } from "../../api/client";
import "./admin.css";

interface PuntoDato {
  periodo: string;
  cantidad: number;
  total?: number;
}

interface RankingItem {
  tipo: "repuesto" | "maquinaria";
  nombre: string;
  unidades: number;
  solicitudes: number;
}

interface EstadisticasResponse {
  ventas: { semana: PuntoDato[]; mes: PuntoDato[]; anio: PuntoDato[] };
  cotizaciones: { semana: PuntoDato[]; mes: PuntoDato[]; anio: PuntoDato[] };
  resumen: {
    total_ventas: number;
    monto_total_ventas: number;
    total_cotizaciones: number;
    cotizaciones_pendientes: number;
    cotizaciones_respondidas: number;
    cotizaciones_denegadas: number;
  };
  top_repuestos: RankingItem[];
  top_maquinarias: RankingItem[];
}

type Agrupacion = "semana" | "mes" | "anio";

const TABS: { key: Agrupacion; label: string }[] = [
  { key: "semana", label: "Por semana" },
  { key: "mes", label: "Por mes" },
  { key: "anio", label: "Por año" },
];

export default function Estadisticas() {
  const [data, setData] = useState<EstadisticasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [agrupacion, setAgrupacion] = useState<Agrupacion>("mes");

  useEffect(() => {
    api
      .get<EstadisticasResponse>("/api/estadisticas")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando estadísticas...</p>;
  if (error) return <div className="admin-error">{error}</div>;
  if (!data) return null;

  const ventasData = data.ventas[agrupacion];
  const cotizacionesData = data.cotizaciones[agrupacion];

  return (
    <div>
      <div className="admin-header-row">
        <div>
          <h1>Estadísticas</h1>
          <p className="subtitle">
            Ventas y cotizaciones realizadas, por semana, mes o año.
          </p>
        </div>
      </div>

      <div className="admin-cards" style={{ marginBottom: 24 }}>
        <div className="admin-card" style={{ cursor: "default" }}>
          <div className="icon-badge">
            <Receipt size={20} />
          </div>
          <h3>{data.resumen.total_ventas}</h3>
          <p>Ventas registradas · S/ {data.resumen.monto_total_ventas.toFixed(2)}</p>
        </div>
        <div className="admin-card" style={{ cursor: "default" }}>
          <div className="icon-badge">
            <ClipboardList size={20} />
          </div>
          <h3>{data.resumen.total_cotizaciones}</h3>
          <p>Cotizaciones recibidas en total</p>
        </div>
        <div className="admin-card" style={{ cursor: "default" }}>
          <div className="icon-badge">
            <Clock size={20} />
          </div>
          <h3>{data.resumen.cotizaciones_pendientes}</h3>
          <p>En espera de respuesta</p>
        </div>
        <div className="admin-card" style={{ cursor: "default" }}>
          <div className="icon-badge">
            <TrendingUp size={20} />
          </div>
          <h3>{data.resumen.cotizaciones_respondidas}</h3>
          <p>Respondidas · {data.resumen.cotizaciones_denegadas} rechazadas</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setAgrupacion(t.key)}
            className={`btn-admin ${agrupacion === t.key ? "yellow" : "outline"} small`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="admin-form" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 14, fontSize: 16 }}>Ventas (S/)</h3>
        {ventasData.length === 0 ? (
          <p>No hay ventas registradas en este período.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ventasData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(value) => [`S/ ${Number(value ?? 0).toFixed(2)}`, "Total"]} />
              <Legend />
              <Bar dataKey="total" name="Monto vendido (S/)" fill="#f4c20d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="admin-form">
        <h3 style={{ marginBottom: 14, fontSize: 16 }}>Cotizaciones recibidas</h3>
        {cotizacionesData.length === 0 ? (
          <p>No hay cotizaciones registradas en este período.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={cotizacionesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="cantidad"
                name="Cotizaciones"
                stroke="#121212"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="admin-cards" style={{ marginTop: 24, alignItems: "stretch" }}>
        <div className="admin-form" style={{ flex: 1, minWidth: 280 }}>
          <h3 style={{ marginBottom: 4, fontSize: 16 }}>
            <Package size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />
            Repuestos más cotizados
          </h3>
          <p className="subtitle" style={{ marginBottom: 14 }}>
            Por unidades pedidas en todas las cotizaciones recibidas.
          </p>
          {data.top_repuestos.length === 0 ? (
            <p>Todavía no hay suficientes datos.</p>
          ) : (
            <RankingList items={data.top_repuestos} />
          )}
        </div>

        <div className="admin-form" style={{ flex: 1, minWidth: 280 }}>
          <h3 style={{ marginBottom: 4, fontSize: 16 }}>
            <Truck size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />
            Maquinaria más cotizada
          </h3>
          <p className="subtitle" style={{ marginBottom: 14 }}>
            Por unidades pedidas en todas las cotizaciones recibidas.
          </p>
          {data.top_maquinarias.length === 0 ? (
            <p>Todavía no hay suficientes datos.</p>
          ) : (
            <RankingList items={data.top_maquinarias} />
          )}
        </div>
      </div>
    </div>
  );
}

function RankingList({ items }: { items: RankingItem[] }) {
  const max = Math.max(...items.map((i) => i.unidades), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => (
        <div key={`${item.tipo}-${item.nombre}`}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              marginBottom: 4,
            }}
          >
            <span>
              <strong style={{ color: "#8a6d00" }}>#{i + 1}</strong> {item.nombre}
            </span>
            <span className="meta">
              {item.unidades} unid. · {item.solicitudes} solicitud(es)
            </span>
          </div>
          <div style={{ background: "#f2f2f0", borderRadius: 999, height: 8, overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.max(6, (item.unidades / max) * 100)}%`,
                height: "100%",
                background: "var(--yellow, #f4c20d)",
                borderRadius: 999,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
