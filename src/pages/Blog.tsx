import "./pages.css";
import "./Blog.css";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, BookOpen } from "lucide-react";
import { useBlogPosts } from "../hooks/useApiData";

export default function Blog() {
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const { data: blogPosts, loading, error } = useBlogPosts();

  const categoriasBlog = useMemo(
    () => Array.from(new Set(blogPosts.map((p) => p.categoria))),
    [blogPosts]
  );

  const destacado = blogPosts.find((p) => p.destacado) ?? blogPosts[0];

  const filtrados = useMemo(() => {
    if (!destacado) return [];
    const base = blogPosts.filter((p) => p.id !== destacado.id);
    if (categoriaActiva === "Todos") return base;
    return base.filter((p) => p.categoria === categoriaActiva);
  }, [categoriaActiva, destacado, blogPosts]);

  return (
    <>
      <div className="page-banner page-banner-blog">
        <div className="page-banner-inner">
          <div className="breadcrumb">
            <Link to="/">Inicio</Link> / <span>Blog</span>
          </div>
          <h1>
            Blog <span>DH & DM Maquinarias SAC.</span>
          </h1>
          <p>
            Guías técnicas, consejos de mantenimiento y novedades sobre
            repuestos y maquinaria pesada.
          </p>
        </div>
      </div>

      <div className="page-body">
        {loading && <p>Cargando artículos...</p>}
        {error && <p>No se pudieron cargar los artículos.</p>}
        {!loading && !error && !destacado && (
          <p>No hay artículos publicados todavía.</p>
        )}

        {destacado && (
          <>
            <Link to={`/blog/${destacado.id}`} className="blog-hero-card">
              <div
                className="blog-hero-media"
                style={destacado.imagen ? { backgroundImage: `url(${destacado.imagen})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
              >
                {!destacado.imagen && <BookOpen size={40} />}
              </div>
              <div className="blog-hero-body">
                <span className="blog-hero-tag">{destacado.categoria}</span>
                <h2>{destacado.titulo}</h2>
                <p>{destacado.resumen}</p>
                <span className="blog-hero-fecha">
                  <Calendar size={14} /> {destacado.fecha}
                </span>
                <span className="blog-hero-link">
                  Leer artículo <ArrowRight size={16} />
                </span>
              </div>
            </Link>

            <div className="blog-cat-filtros">
              <button
                className={`blog-cat-btn ${categoriaActiva === "Todos" ? "active" : ""}`}
                onClick={() => setCategoriaActiva("Todos")}
              >
                Todos
              </button>
              {categoriasBlog.map((c) => (
                <button
                  key={c}
                  className={`blog-cat-btn ${categoriaActiva === c ? "active" : ""}`}
                  onClick={() => setCategoriaActiva(c)}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="blog-list-grid">
              {filtrados.map((p) => (
                <article className="blog-list-card" key={p.id}>
                  <Link
                    to={`/blog/${p.id}`}
                    className="blog-list-media"
                    style={p.imagen ? { backgroundImage: `url(${p.imagen})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                  >
                    {!p.imagen && <BookOpen size={28} />}
                  </Link>
                  <div className="blog-list-body">
                    <span className="blog-list-tag">{p.categoria}</span>
                    <Link to={`/blog/${p.id}`}>
                      <h3>{p.titulo}</h3>
                    </Link>
                    <p>{p.resumen}</p>
                    <div className="blog-list-footer">
                      <span className="blog-list-fecha">
                        <Calendar size={13} /> {p.fecha}
                      </span>
                      <Link to={`/blog/${p.id}`} className="blog-list-leer">
                        Leer más <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filtrados.length === 0 && (
              <div className="empty-state">
                No hay artículos en esta categoría todavía.
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
