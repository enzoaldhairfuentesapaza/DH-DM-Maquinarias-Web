import { Link } from "react-router-dom";
import { Truck, Wrench, Tags } from "lucide-react";
import "./admin.css";

const secciones = [
  {
    to: "/admin/maquinaria",
    titulo: "Maquinaria",
    desc: "Editar, eliminar o agregar maquinaria pesada del catálogo.",
    icon: <Truck size={20} />,
  },
  {
    to: "/admin/repuestos",
    titulo: "Repuestos",
    desc: "Editar, eliminar o agregar repuestos del catálogo.",
    icon: <Wrench size={20} />,
  },
  {
    to: "/admin/productos/categorias",
    titulo: "Categorías",
    desc: "Agrega, edita o quita las secciones/categorías de maquinaria y repuestos.",
    icon: <Tags size={20} />,
  },
];

export default function ProductosHub() {
  return (
    <div>
      <div className="admin-header-row">
        <div>
          <h1>Administrar Productos</h1>
          <p className="subtitle">Catálogo de maquinaria y repuestos de la empresa.</p>
        </div>
      </div>

      <div className="admin-cards">
        {secciones.map((s) => (
          <Link to={s.to} key={s.to} className="admin-card">
            <div className="icon-badge">{s.icon}</div>
            <h3>{s.titulo}</h3>
            <p>{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
