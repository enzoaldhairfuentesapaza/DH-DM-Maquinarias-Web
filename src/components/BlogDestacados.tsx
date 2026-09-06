import "./BlogDestacados.css";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import { useBlogPosts } from "../hooks/useApiData";

export default function BlogDestacados() {
  const { data: posts, loading } = useBlogPosts();
  const destacados = [...posts]
    .sort((a, b) => b.id - a.id)
    .slice(0, 3);

  if (loading || destacados.length === 0) return null;

  return (
    <section className="blog">
      <div className="section-wrap">
        <div className="blog-header">
          <div className="section-title blog-title">
            <span className="tag">Blog & Actualidad</span>
            <h2>
              Blog <span>destacados</span>
            </h2>
          </div>

          <Link to="/blog" className="blog-more-btn">
            Ver más novedades <ArrowRight size={16} />
          </Link>
        </div>

        <div className="blog-grid">
          {destacados.map((p) => (
            <article className="blog-card" key={p.id}>
              <div
                className="blog-thumb"
                style={p.imagen ? { backgroundImage: `url(${p.imagen})` } : undefined}
              />
              <div className="blog-body">
                <span className="blog-fecha">
                  <Calendar size={14} /> {p.fecha}
                </span>
                <h4>{p.titulo}</h4>
                <p>{p.resumen}</p>
                <Link to={`/blog/${p.id}`}>
                  Leer más <ArrowRight size={15} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
