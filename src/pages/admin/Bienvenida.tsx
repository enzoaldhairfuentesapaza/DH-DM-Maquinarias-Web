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
  if(loading) return <p>Cargando bienvenida…</p>;
  return <div><h1>Bienvenida del inicio</h1><p>Siempre aparece primero. Después rota entre las promociones destacadas cada seis segundos; no se registra como promoción.</p>{error&&<p className="admin-error">{error}</p>}<form className="admin-form" onSubmit={save}>{(Object.keys(labels) as (keyof WelcomeData)[]).map(key=><label key={key}>{labels[key]}{key==="descripcion"?<textarea aria-label={labels[key]} value={form[key]} required maxLength={3000} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}/>:<input aria-label={labels[key]} value={form[key]} required={key!=="imagen"} maxLength={key==="imagen"?500:200} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}/>} {key==="imagen"&&<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label="Subir imagen de bienvenida" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);}}/>}</label>)}<button className="btn-admin yellow" disabled={busy}>{busy?"Guardando…":"Guardar bienvenida"}</button></form><h2 style={{marginTop:30}}>Vista previa de la bienvenida</h2><div className="welcome-admin-preview" onClickCapture={e=>{if((e.target as HTMLElement).closest("a"))e.preventDefault();}}><Hero data={form}/></div></div>;
}
