import { useAuth } from "../../context/AuthContext";
import { useRef, useState } from "react";
import { api } from "../../api/client";
import { entities } from "./entityConfig";
import { batches, mapRows, normalize, readWorkbook, saveWorkbook, sectionNames, type ExcelRow, type ExcelSchema } from "./excelFiles";
import "./ExcelTools.css";
interface Review { row:number; errors:string[]; warnings:string[]; skip:boolean; }
export default function ExcelTools({ entity, onImported, scope }: {entity:string;onImported?:()=>void;scope?:"maquinaria"|"repuesto"}) {
  const {can,isCotizador}=useAuth();
  const query = entity === "cotizaciones" && scope ? `?tipo=${scope}` : "";
  const [opened,setOpened]=useState(false);
  const [preparedRows,setPreparedRows]=useState<ExcelRow[]>([]);
  const [reviewPage,setReviewPage]=useState(0);
  const [schema,setSchema]=useState<ExcelSchema|null>(null);
  const [file,setFile]=useState<{headers:string[];rows:unknown[][];rowNumbers:number[]}|null>(null);
  const [mapping,setMapping]=useState<string[]>([]);
  const [review,setReview]=useState<Review[]|null>(null);
  const [duplicates,setDuplicates]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const input=useRef<HTMLInputElement>(null);
  const dialog=useRef<HTMLDialogElement>(null);
  async function getSchema() { const result=await api.get<ExcelSchema>(`/api/excel/${entity}/schema${query}`); setSchema(result); return result; }
  async function download(template=false) {
    setBusy(true); setError(""); setMessage("");
    try {
      if(template) await saveWorkbook(await getSchema(),[],true);
      else { const result=await api.get<{schema:ExcelSchema;rows:ExcelRow[]}>(`/api/excel/${entity}/export${query}`); await saveWorkbook(result.schema,result.rows); }
      setMessage(template?"Plantilla descargada.":"Excel descargado con todos los registros de la sección.");
    } catch(e) { setError(e instanceof Error?e.message:"No se pudo descargar."); } finally {setBusy(false);}
  }
  async function upload(selected:File) {
    setBusy(true); setError("");setMessage("");setReview(null);setDuplicates(false);
    try {
      const s=await getSchema(); if(!s.importable) throw new Error("Esta tabla es de solo lectura.");
      const parsed=await readWorkbook(selected); setFile(parsed);
      const aliases=new Map(s.fields.flatMap(f=>[[normalize(f.name),f.name],[normalize(f.name.replace(/_/g," ")),f.name]]));
      entities[entity]?.fields.forEach(f=>aliases.set(normalize(f.label),f.name));
      setMapping(parsed.headers.map(h=>aliases.get(normalize(h))??""));
      dialog.current?.showModal();setOpened(true);
    } catch(e) {setError(e instanceof Error?e.message:"No se pudo leer el archivo.");} finally {setBusy(false);if(input.current) input.current.value="";}
  }
  async function validate() {
    if(!file || !schema) return;
    setBusy(true);setError("");setReview(null);
    try {
      const data=mapRows(file.rows,mapping,schema,file.rowNumbers); setPreparedRows(data); const chunks=batches(data); const checks:Review[]=[];let offset=0;
      for(const chunk of chunks) {
        setMessage(`Revisando ${offset+1}–${offset+chunk.length} de ${data.length} filas…`);
        const r=await api.post<{rows:Review[]}>(`/api/excel/${entity}/preview${query}`,{rows:chunk,allow_duplicates:duplicates});
        checks.push(...r.rows.map((row,i)=>({...row,row:file.rowNumbers[offset+i]})));offset+=chunk.length;
      }
      // Duplicates inside the file can span server batches.
      const identities=new Set<string>();
      data.forEach((row,i)=>{
        const key=JSON.stringify(schema.identity.map(f=>normalize(typeof row[f]==="object"?JSON.stringify(row[f]):row[f])));
        if(identities.has(key) && !schema.updates) {checks[i].warnings.push("Clave repetida dentro del Excel"); if(!duplicates || ["accesos","categorias"].includes(entity)) checks[i].skip=true;}
        identities.add(key);
      });
      setReview(checks);setReviewPage(0);setMessage("");
    } catch(e) {setError(e instanceof Error?e.message:"Error al revisar.");setMessage("");} finally {setBusy(false);}
  }
  async function commit() {
    if(!schema || !file || !review || review.some(r=>r.errors.length)) return;
    setBusy(true);setError(""); let created=0,updated=0,skipped=0;
    try {
      const data=mapRows(file.rows,mapping,schema,file.rowNumbers);const chunks=batches(data);let done=0;
      for(const chunk of chunks) {
        setMessage(`Importando ${done+1}–${done+chunk.length} de ${data.length} filas…`);
        const r=await api.post<{inserted:number;updated:number;skipped:number}>(`/api/excel/${entity}/import${query}`,{rows:chunk,allow_duplicates:duplicates});
        created+=r.inserted;updated+=r.updated;skipped+=r.skipped;done+=chunk.length;
      }
      setMessage(`Importación completada: ${created} creados, ${updated} actualizados, ${skipped} omitidos.`);
      setReview(null);setFile(null);dialog.current?.close();onImported?.();
    } catch(e) { setReview(null);setError(`${e instanceof Error?e.message:"Error de importación."} Se guardaron ${created} registros y ${updated} actualizaciones en los lotes anteriores. Revisa nuevamente; las claves ya existentes se omiten por defecto.`);setMessage("");onImported?.(); }
    finally {setBusy(false);}
  }
  const readOnly=isCotizador||["auditoria","papelera","notificaciones","contactos"].includes(entity);
  if(!can("excel"))return null;
  return <div className="excel-tools">
    <div className="excel-toolbar"><span>Excel · {sectionNames[entity]??entity}</span><button type="button" className="btn-admin small outline" disabled={busy} onClick={()=>download()}>Descargar todo (.xlsx)</button>{!readOnly && <><button type="button" className="btn-admin small outline" disabled={busy} onClick={()=>download(true)}>Plantilla</button><button type="button" className="btn-admin small yellow" disabled={busy} onClick={()=>input.current?.click()}>Subir Excel</button></>}<input ref={input} type="file" accept=".xlsx" hidden onChange={e=>{const f=e.target.files?.[0];if(f) void upload(f);}} /></div>
    {readOnly && <p className="excel-help">{isCotizador?"Tu rol puede descargar estos registros. No tiene permiso para importar archivos.":"Solo exportación: estos registros se generan desde sus operaciones del panel."}</p>}
    {message && <p role="status" className="excel-status">{message}</p>}{error && !opened && <p role="alert" className="admin-error">{error}</p>}
    <dialog ref={dialog} className="excel-dialog" style={{colorScheme:"light"}} aria-labelledby={`excel-title-${entity}`} onCancel={e=>{if(busy)e.preventDefault();}} onClose={()=>setOpened(false)}>
      <div className="excel-dialog-head"><h2 id={`excel-title-${entity}`}>Importar {sectionNames[entity]??entity}</h2><button type="button" className="btn-admin small outline" disabled={busy} onClick={()=>dialog.current?.close()}>Cerrar</button></div>
      <p>{schema?.updates?"Se actualizarán los contactos que coincidan por clave.":"Se agregarán registros nuevos. No se reemplaza ni elimina el contenido actual."} Máximo 20 000 filas por archivo.</p>
      {file && <><p><strong>{file.rows.length} filas detectadas.</strong> Asigna las columnas del Excel; puedes ignorar ID, fechas de creación y otras columnas de exportación.</p><div className="excel-mapping">{file.headers.map((h,i)=><label key={i}>{h||`Columna ${i+1}`}<select value={mapping[i]??""} disabled={busy} onChange={e=>{setMapping(m=>m.map((v,n)=>n===i?e.target.value:v));setReview(null);}}><option value="">Ignorar columna</option>{schema?.fields.map(f=><option key={f.name} value={f.name}>{f.name}{f.required?" *":""} · {f.type}</option>)}</select></label>)}</div>
      {!schema?.updates && !["categorias","accesos"].includes(entity) && <label className="excel-duplicate-option"><input type="checkbox" checked={duplicates} disabled={busy} onChange={e=>{setDuplicates(e.target.checked);setReview(null);}} />Permitir claves repetidas (por defecto se omiten)</label>}
      <button type="button" className="btn-admin outline" disabled={busy} onClick={()=>void validate()}>Revisar filas antes de guardar</button>
      {review && <><p role="status"><strong>{review.filter(r=>!r.errors.length&&!r.skip).length} para guardar</strong> · {review.filter(r=>r.skip).length} para omitir · {review.filter(r=>r.errors.length).length} con errores.</p><div className="excel-review"><table className="admin-table"><thead><tr><th>Fila</th><th>Nombre / clave</th><th>Resultado</th></tr></thead><tbody>{review.map((entry,index)=>({entry,index})).slice(reviewPage*200,(reviewPage+1)*200).map(({entry:r,index:i})=><tr key={i}><td>{r.row}</td><td>{String(file.rows[i][mapping.findIndex(m=>["nombre","titulo","codigo","numero","numero_boleta","clave","email","nombre_cliente"].includes(m))]??"")}<details className="excel-row-details"><summary>Ver datos</summary><dl>{Object.entries(preparedRows[i]??{}).map(([key,value])=><div key={key}><dt>{key}</dt><dd>{key==="password"?"••••••••":typeof value==="boolean"?value?"Sí":"No":typeof value==="object"?JSON.stringify(value):String(value)}</dd></div>)}</dl></details></td><td>{r.errors.length?r.errors.join("; "):r.skip?"Se omitirá":"Lista para guardar"}{r.warnings.map((w,j)=><span key={j} className="duplicate-tag">{w}</span>)}</td></tr>)}</tbody></table></div>{review.length>200&&<div className="excel-pages"><button type="button" className="btn-admin small outline" disabled={reviewPage===0||busy} onClick={()=>setReviewPage(p=>p-1)}>Filas anteriores</button><span>Página {reviewPage+1} de {Math.ceil(review.length/200)} · el resumen incluye todas las filas</span><button type="button" className="btn-admin small outline" disabled={(reviewPage+1)*200>=review.length||busy} onClick={()=>setReviewPage(p=>p+1)}>Filas siguientes</button></div>}<button type="button" className="btn-admin yellow" disabled={busy||review.some(r=>r.errors.length>0)||!review.some(r=>!r.skip)} onClick={()=>void commit()}>Confirmar importación de {review.filter(r=>!r.skip).length} filas</button></>}
      </>}
      {busy && <p role="status">{message||"Procesando archivo…"}</p>}{error && <p className="admin-error" role="alert">{error}</p>}
    </dialog>
  </div>;
}
