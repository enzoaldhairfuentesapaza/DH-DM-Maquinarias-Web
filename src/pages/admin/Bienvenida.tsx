import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../api/client";
import Hero from "../../components/Hero";
import { welcomeDefaults, type WelcomeData } from "../../components/welcomeData";
import { useFeedback } from "../../context/FeedbackContext";
import "./admin.css";
const labels: Record<keyof WelcomeData,string> = {tag:"Etiqueta superior",titulo_antes:"Inicio del título",titulo_destacado:"Texto destacado del título",titulo_despues:"Final del título",descripcion:"Mensaje de bienvenida",imagen:"Imagen de fondo (ruta o URL)",boton_repuestos:"Botón del catálogo de repuestos",boton_repuestos_url:"Enlace del botón de repuestos (ej. /repuestos)",boton_maquinaria:"Botón del catálogo de maquinaria",boton_maquinaria_url:"Enlace del botón de maquinaria (ej. /maquinaria)",despachos_valor:"Cantidad de despachos",despachos_label:"Texto de despachos",stock_valor:"Cantidad de repuestos",stock_label:"Texto de repuestos",garantia_valor:"Porcentaje de garantía",garantia_label:"Texto de garantía"};
export default function Bienvenida() {
  const [form,setForm]=useState(welcomeDefaults);const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [loading,setLoading]=useState(true);const feedback=useFeedback();
  useEffect(()=>{api.get<WelcomeData>("/api/bienvenida").then(setForm).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
  async function save(e:FormEvent) {e.preventDefault();setBusy(true);setError("");try{setForm(await api.put<WelcomeData>("/api/bienvenida",form));feedback.success("Bienvenida guardada. Será la primera tarjeta al abrir el inicio.");}catch(e){setError(e instanceof Error?e.message:"No se pudo guardar.");}finally{setBusy(false);}}
  async function upload(file:File) {
    setBusy(true);setError("");
    try {const body=new FormData();body.append("file",file);const result=await api.post<{url:string}>("/api/uploads",body);setForm(f=>({...f,imagen:result.url}));}
    catch(e){setError(e instanceof Error?e.message:"No se pudo subir la imagen.");}
    finally{setBusy(false);}
  }
  const field = (key: keyof WelcomeData, hint?: string) => <label key={key}>{labels[key]}{hint && <span className="hint">{hint}</span>}{key === "descripcion" ? <textarea aria-label={labels[key]} value={form[key]} required rows={4} maxLength={3000} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}/> : <input type="text" aria-label={labels[key]} value={form[key]} required={key!=="imagen"} maxLength={key==="imagen"?500:200} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}/>}</label>;
  if(loading) return <p>Cargando bienvenida…</p>;
  return <div className="welcome-editor">
    <h1>Bienvenida del inicio</h1>
    <p className="subtitle">Edita la primera tarjeta del inicio. La vista previa se actualiza mientras escribes; los cambios se publican al guardar.</p>
    {error&&<p className="admin-error" role="alert">{error}</p>}
    <form className="admin-form welcome-editor-form" onSubmit={save}>
      <fieldset><legend>1. Mensaje principal</legend>
        {field("tag", "Una frase corta que aparece encima del título.")}
        <p className="welcome-help">El título se compone de tres partes. La parte central se muestra en amarillo.</p>
        <div className="welcome-title-fields">{field("titulo_antes")}{field("titulo_destacado")}{field("titulo_despues")}</div>
        {field("descripcion")}
      </fieldset>
      <fieldset><legend>2. Imagen de fondo</legend>
        <p className="welcome-help">Sube una imagen horizontal. También puedes indicar una imagen existente en las opciones avanzadas.</p>
        <label className="welcome-upload">Seleccionar imagen<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label="Subir imagen de bienvenida" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);}}/></label>
        <details><summary>Usar una ruta o URL de imagen</summary>{field("imagen")}</details>
      </fieldset>
      <fieldset><legend>3. Botones del catálogo</legend><div className="admin-form-grid">
        <div>{field("boton_repuestos")}<label>Destino del botón de repuestos<select aria-label="Destino del botón de repuestos" value={form.boton_repuestos_url} onChange={e=>setForm(f=>({...f,boton_repuestos_url:e.target.value}))}>{[...new Set(["/repuestos","/maquinaria","/contacto","/cotizacion",form.boton_repuestos_url])].map(url=><option key={url} value={url}>{url}</option>)}</select></label></div>
        <div>{field("boton_maquinaria")}<label>Destino del botón de maquinaria<select aria-label="Destino del botón de maquinaria" value={form.boton_maquinaria_url} onChange={e=>setForm(f=>({...f,boton_maquinaria_url:e.target.value}))}>{[...new Set(["/maquinaria","/repuestos","/contacto","/cotizacion",form.boton_maquinaria_url])].map(url=><option key={url} value={url}>{url}</option>)}</select></label></div>
      </div></fieldset>
      <fieldset><legend>4. Cifras de confianza</legend><p className="welcome-help">Escribe el valor tal como deseas mostrarlo, por ejemplo +2000 o 100%.</p><div className="welcome-stats-fields">
        <div>{field("despachos_valor")}{field("despachos_label")}</div><div>{field("stock_valor")}{field("stock_label")}</div><div>{field("garantia_valor")}{field("garantia_label")}</div>
      </div></fieldset>
      <div className="welcome-save"><span>Esta bienvenida siempre aparece primero; luego rota con las promociones destacadas.</span><button className="btn-admin yellow" disabled={busy}>{busy?"Guardando…":"Guardar bienvenida"}</button></div>
    </form>
    <h2 className="welcome-preview-heading">Así se verá en el inicio</h2><p className="subtitle">Vista previa con tus cambios. Los botones están desactivados aquí para que puedas seguir editando.</p>
    <div className="welcome-admin-preview" onClickCapture={e=>{if((e.target as HTMLElement).closest("a"))e.preventDefault();}}><Hero data={form}/></div>
  </div>;
}
