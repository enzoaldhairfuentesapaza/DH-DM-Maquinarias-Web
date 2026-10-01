import { useEffect, useRef, useState } from "react";
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
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [width, setWidth] = useState(1200);
  const send = () => frame.current?.contentWindow?.postMessage({kind:"hdm-preview",draft:{type,form}},window.location.origin);
  useEffect(() => {
    const receive = (event: MessageEvent) => { if(event.origin === window.location.origin && event.source === frame.current?.contentWindow && event.data?.kind === "hdm-preview-ready") frame.current?.contentWindow?.postMessage({kind:"hdm-preview",draft:{type,form}},window.location.origin); };
    window.addEventListener("message",receive);
    frame.current?.contentWindow?.postMessage({kind:"hdm-preview",draft:{type,form}},window.location.origin);
    return () => window.removeEventListener("message",receive);
  }, [type,form]);
  return (
    <div className="preview-panel">
      <div className="preview-panel-header">
        <Eye size={15} />
        <span>Así se verá en la página</span>
      </div>
      <button type="button" className="btn-admin outline" style={{width:"100%",marginBottom:14}} onClick={() => {dialog.current?.showModal();send();}}>Ampliar · tamaño real</button>
      <dialog ref={dialog} className="content-preview-dialog" aria-label="Vista previa del contenido a tamaño real">
        <div className="content-preview-controls"><strong>Vista previa · sin guardar</strong><button type="button" aria-pressed={width===1200} className="btn-admin small outline" onClick={() => setWidth(1200)}>Escritorio · 1200 px</button><button type="button" aria-pressed={width===390} className="btn-admin small outline" onClick={() => setWidth(390)}>Móvil · 390 px</button><button type="button" className="btn-admin small outline" onClick={() => dialog.current?.close()}>Cerrar vista previa</button></div>
        <p>Contenido a escala 1:1 con los estilos públicos. Desplázate para ver toda la página; encabezado, pie y elementos relacionados se omiten.</p>
        <div className="content-preview-scroll"><iframe ref={frame} title="Contenido en vista previa" src="/admin/vista-previa" onLoad={send} style={{width,height:"70dvh"}} /></div>
      </dialog>
      <div className="preview-stage">
        {type === "maquinaria" && <PreviewMaquinaria form={form} />}
        {type === "repuestos" && <PreviewRepuesto form={form} />}
        {type === "blog" && <PreviewBlog form={form} />}
        {type === "novedades" && <PreviewNovedad form={form} />}
        {type === "promociones" && <PreviewPromocion form={form} />}
      </div>
      <p className="preview-note">
        Abre la vista ampliada para comprobar el contenido y sus tamaños en escritorio y móvil.
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
