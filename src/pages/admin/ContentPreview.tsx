import type { ContentRecord } from "../../types/content";
import { Package, Truck, Tag, Megaphone, FileText, Eye } from "lucide-react";
import { resolveApiAsset } from "../../api/client";
import type { PreviewType } from "./entityConfig";
import "./ContentPreview.css";

function resolverImagen(valor: unknown): string {
  return resolveApiAsset(valor);
}

function Placeholder({ icon }: { icon: React.ReactNode }) {
  return <div className="preview-placeholder">{icon}</div>;
}

export default function ContentPreview({ type, form }: { type: PreviewType; form: ContentRecord }) {
  return (
    <div className="preview-panel">
      <div className="preview-panel-header">
        <Eye size={15} />
        <span>Así se verá en la página</span>
      </div>
      <div className="preview-stage">
        {type === "maquinaria" && <PreviewMaquinaria form={form} />}
        {type === "repuestos" && <PreviewRepuesto form={form} />}
        {type === "blog" && <PreviewBlog form={form} />}
        {type === "novedades" && <PreviewNovedad form={form} />}
        {type === "promociones" && <PreviewPromocion form={form} />}
      </div>
      <p className="preview-note">
        Vista previa aproximada: el tamaño y la posición exactos pueden variar un poco según la pantalla.
      </p>
    </div>
  );
}

function PreviewMaquinaria({ form }: { form: ContentRecord }) {
  const img = resolverImagen(form.imagen);
  return (
    <div className="preview-card">
      <div className="preview-media">
        {img ? <img src={img} alt="" /> : <Placeholder icon={<Truck size={34} />} />}
        {form.condicion && <span className="preview-pill">{form.condicion}</span>}
      </div>
      <div className="preview-body">
        <span className="preview-cat">{form.categoria || "Sin categoría"}</span>
        <h4>{form.nombre || "Nombre de la máquina"}</h4>
        <p className="preview-meta">
          {form.marca || "Marca"} {form.anio ? `· ${form.anio}` : ""}
        </p>
        {(form.potencia || form.ubicacion) && (
          <p className="preview-meta-small">
            {[form.potencia, form.ubicacion].filter(Boolean).join(" · ")}
          </p>
        )}
        {form.destacado && <span className="preview-badge-destacado">★ Destacada en el inicio</span>}
      </div>
    </div>
  );
}

function PreviewRepuesto({ form }: { form: ContentRecord }) {
  const img = resolverImagen(form.imagen);
  return (
    <div className="preview-card">
      <div className="preview-media">
        {img ? <img src={img} alt="" /> : <Placeholder icon={<Package size={34} />} />}
      </div>
      <div className="preview-body">
        <span className="preview-cat">{form.categoria || "Sin categoría"}</span>
        <h4>{form.nombre || "Nombre del repuesto"}</h4>
        <p className="preview-meta">Código: {form.codigo || "—"}</p>
        <p className="preview-meta-small">
          {form.marca ? `Marca: ${form.marca}` : ""}{" "}
          {form.stock_disponible === false ? "· Sin stock" : ""}
        </p>
        {form.destacado && <span className="preview-badge-destacado">★ Destacado en el inicio</span>}
      </div>
    </div>
  );
}

function PreviewBlog({ form }: { form: ContentRecord }) {
  const img = resolverImagen(form.imagen);
  return (
    <div className="preview-card preview-card-wide">
      <div className="preview-media preview-media-wide">
        {img ? <img src={img} alt="" /> : <Placeholder icon={<FileText size={34} />} />}
      </div>
      <div className="preview-body">
        <span className="preview-cat">{form.categoria || "Categoría"}</span>
        <h4>{form.titulo || "Título del artículo"}</h4>
        <p className="preview-meta-small">{form.fecha || "Fecha"}</p>
        <p className="preview-resumen">{form.resumen || "Aquí aparecerá el resumen del artículo..."}</p>
        {form.destacado && <span className="preview-badge-destacado">★ En "Blog destacados" del inicio</span>}
      </div>
    </div>
  );
}

function PreviewNovedad({ form }: { form: ContentRecord }) {
  const img = resolverImagen(form.imagen);
  return (
    <div className="preview-card preview-card-wide preview-tablon">
      <div
        className="preview-media preview-media-wide"
        style={img ? { backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        {!img && <Placeholder icon={<Megaphone size={34} />} />}
        <div className="preview-tablon-overlay" />
        <div className="preview-tablon-text">
          <h4>{form.titulo || "Título de la novedad"}</h4>
          <p>{form.resumen || "Resumen breve que se mostrará encima de la imagen..."}</p>
        </div>
      </div>
      {form.destacado ? (
        <span className="preview-badge-destacado">★ Se muestra en el Tablón de Anuncios</span>
      ) : (
        <p className="preview-meta-small" style={{ padding: "8px 2px 0" }}>
          Sin marcar como destacada, solo aparecerá en la lista de Novedades, no en el Tablón de Anuncios.
        </p>
      )}
    </div>
  );
}

function PreviewPromocion({ form }: { form: ContentRecord }) {
  const img = resolverImagen(form.imagen);
  return (
    <div className="preview-promo-card">
      <div
        className="preview-promo-media"
        style={img ? { backgroundImage: `url(${img})` } : undefined}
      >
        {!img && <Placeholder icon={<Tag size={30} />} />}
        <span className="preview-promo-badge">
          <Tag size={12} /> Promo
        </span>
      </div>
      <div className="preview-promo-body">
        <h4>{form.titulo || "Título de la promoción"}</h4>
        <p>{form.descripcion || "Aquí aparecerá la descripción de la promoción..."}</p>
        <span className="preview-promo-vigencia">{form.vigencia || "Vigencia"}</span>
      </div>
      {form.destacado && (
        <span className="preview-badge-destacado" style={{ margin: "8px 14px 0" }}>
          ★ Aparece en el carrusel grande del inicio
        </span>
      )}
    </div>
  );
}
