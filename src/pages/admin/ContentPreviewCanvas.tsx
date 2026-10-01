import { useEffect, useState } from "react";
import { Truck, Package, BookOpen } from "lucide-react";
import type { ContentRecord } from "../../types/content";
import type { PreviewType } from "./entityConfig";
import { resolveApiAsset } from "../../api/client";
import { PromotionFeature } from "../../components/PromocionesDestacadas";
import "../pages.css";
import "../Blog.css";
import "../../components/TablonAnuncios.css";

interface Draft { type:PreviewType; form:ContentRecord; }
export default function ContentPreviewCanvas() {
  const [draft,setDraft]=useState<Draft|null>(null);
  useEffect(()=>{
    const receive=(event:MessageEvent)=>{
      if(event.origin!==window.location.origin || event.source!==window.parent || event.data?.kind!=="hdm-preview") return;
      const data=event.data.draft;
      if(data && ["maquinaria","repuestos","promociones","blog","novedades"].includes(data.type) && data.form && typeof data.form==="object") setDraft(data);
    };
    window.addEventListener("message",receive); window.parent.postMessage({kind:"hdm-preview-ready"},window.location.origin);
    return ()=>window.removeEventListener("message",receive);
  },[]);
  if(!draft) return <p style={{padding:32}}>Preparando vista previa…</p>;
  const {type,form}=draft;const image=resolveApiAsset(form.imagen);const title=String(form.nombre??form.titulo??"")||"Título del contenido";
  if(type==="promociones") return <div className="draft-canvas" onClickCapture={e=>{if((e.target as HTMLElement).closest("a")) e.preventDefault();}}><PromotionFeature promo={{titulo:title,descripcion:String(form.descripcion??""),vigencia:String(form.vigencia??""),imagen:image}} /></div>;
  const paragraphs=(value:unknown):string[]=>Array.isArray(value)?value.map(String):String(value??"").split("\n").filter(Boolean);
  if(type==="novedades") return <div className="draft-canvas" onClickCapture={e=>{if((e.target as HTMLElement).closest("a")) e.preventDefault();}}><section className="tablon"><div className="tablon-track"><div className="tablon-slide active" style={{backgroundImage:image?`url(${image})`:undefined}}><div className="tablon-slide-overlay"/><div className="tablon-slide-content"><h3>{title}</h3><p>{form.resumen}</p></div></div></div></section><div className="page-body"><span className="tag">{form.categoria}</span><p>{form.fecha}</p><h1>{title}</h1><p>{form.resumen}</p></div></div>;
  const stock=form.stock_disponible!==false;
  const specs=type==="maquinaria"?[["Año",form.anio],["Condición",form.condicion],["Potencia",form.potencia],["Peso operativo",form.peso],["Ubicación",form.ubicacion]]:[["Código",form.codigo],["Marca / procedencia",form.marca_detalle||form.marca],["Especificaciones",form.especificaciones],["Unidad de medida",form.unidad],["Categoría",form.categoria],["Stock",stock?"Disponible":"Agotado"]];
  if(type==="maquinaria") {
    const extra=Array.isArray(form.especificaciones)?form.especificaciones:String(form.especificaciones??"").split("\n").filter(Boolean).map(line=>{const [label,valor]=line.split("|");return {label,valor};});
    extra.forEach(item=>{if(typeof item==="object") specs.push([item.label,item.valor]);});
  }
  return <div className="draft-canvas" onClickCapture={e=>{if((e.target as HTMLElement).closest("a")) e.preventDefault();}}><div className="page-banner"><div className="page-banner-inner"><div className="breadcrumb">Inicio / {type==="blog"?"Blog":type==="maquinaria"?"Maquinaria":"Repuestos"} / {title}</div><h1>{title}</h1></div></div><div className="page-body">
    {type==="blog"?<div className="blog-detalle-wrap"><div className="blog-detalle-media" style={image?{backgroundImage:`url(${image})`,backgroundSize:"cover",backgroundPosition:"center"}:undefined}>{!image&&<BookOpen size={48}/>}</div><div className="blog-detalle-meta"><span className="blog-hero-tag">{form.categoria}</span><span className="blog-list-fecha">{form.fecha}</span></div><p className="blog-detalle-resumen">{form.resumen}</p><div className="blog-detalle-cuerpo">{paragraphs(form.contenido).map((p,i)=><p key={i}>{p}</p>)}</div></div>:
    <div className="detail-wrap"><div className="detail-media">{image?<img src={image} alt={title} className="detail-media-img"/>:type==="maquinaria"?<Truck size={64}/>:<><Package size={48}/><span className="detail-code-box">{form.codigo||"—"}</span></>}</div><div className="detail-info"><span className="tag">{form.categoria}</span><h1>{title}</h1><span className={`stock-badge ${stock?"in-stock":"out-of-stock"}`}>{stock?Number(form.stock_cantidad)>0?`En stock (${form.stock_cantidad} disponibles)`:"En stock":"Agotado"}</span><p>{form.descripcion}</p><div className="detail-specs">{specs.filter(([,v])=>v!==undefined&&v!=="").map(([label,value],i)=><div className="spec-row" key={i}><span>{String(label??"")}</span><span>{String(value??"")}</span></div>)}</div>{type==="repuestos"&&<div className="detail-models">{paragraphs(form.modelo_recomendado).map((m,i)=><span className="model-chip" key={i}>{m}</span>)}</div>}<div className="detail-qty-row"><div className="qty-selector"><button disabled>−</button><span style={{padding:12}}>1</span><button disabled>+</button></div><button className="detail-add-btn" disabled>Agregar a cotización</button></div></div></div>}
  </div></div>;
}
