import "./pages.css";
import "./Blog.css";
import { Link, useParams, Navigate } from "react-router-dom";
import { Calendar, ArrowRight, BookOpen } from "lucide-react";
import { useBlogPosts } from "../hooks/useApiData";

export default function BlogDetalle() {
  const { id } = useParams();
  const { data: blogPosts, loading } = useBlogPosts();
  const post = blogPosts.find((p) => p.id === Number(id));

  if (loading) return <div className="page-body"><p>Cargando artículo...</p></div>;
  if (!post) return <Navigate to="/blog" replace />;

  const relacionados = blogPosts
    .filter((p) => p.categoria === post.categoria && p.id !== post.id)
    .slice(0, 3);

  return (
    <>
      <div className="page-banner">
        <div className="page-banner-inner">
          <div className="breadcrumb">
            <Link to="/">Inicio</Link> / <Link to="/blog">Blog</Link> /{" "}
            <span>{post.titulo}</span>
          </div>
          <h1>{post.titulo}</h1>
        </div>
      </div>

      <div className="page-body">
        <div className="blog-detalle-wrap">
          <div
            className="blog-detalle-media"
            style={post.imagen ? { backgroundImage: `url(${post.imagen})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
          >
            {!post.imagen && <BookOpen size={48} />}
          </div>

          <div className="blog-detalle-meta">
            <span className="blog-hero-tag">{post.categoria}</span>
            <span className="blog-list-fecha">
              <Calendar size={14} /> {post.fecha}
            </span>
          </div>

          <p className="blog-detalle-resumen">{post.resumen}</p>

          <div className="blog-detalle-cuerpo">
            {post.contenido.map((parrafo, i) => (
              <p key={i}>{parrafo}</p>
            ))}
          </div>
        </div>

        {relacionados.length > 0 && (
          <div className="related-section">
            <h3>Artículos relacionados</h3>
            <div className="blog-list-grid">
              {relacionados.map((p) => (
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
          </div>
        )}
      </div>
    </>
  );
}
