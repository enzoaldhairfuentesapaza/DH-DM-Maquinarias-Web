import { Link } from "react-router-dom";
import { Megaphone, FileText, Tag } from "lucide-react";
import "./admin.css";

const secciones = [
  {
    to: "/admin/novedades",
    titulo: "Novedades",
    desc: "Editar, eliminar o agregar novedades de la empresa.",
    icon: <Megaphone size={20} />,
  },
  {
    to: "/admin/blog",
    titulo: "Blog",
    desc: "Editar, eliminar o agregar artículos del blog.",
    icon: <FileText size={20} />,
  },
  {
    to: "/admin/promociones",
    titulo: "Promociones",
    desc: "Editar, eliminar o agregar promociones vigentes.",
    icon: <Tag size={20} />,
  },
];

export default function EditarPagina() {
  return (
    <div>
      <div className="admin-header-row">
        <div>
          <h1>Editar Página</h1>
          <p className="subtitle">Administra el contenido visible del sitio público.</p>
        </div>
      </div>

      <p className="admin-section-title">Contenido del sitio</p>
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
