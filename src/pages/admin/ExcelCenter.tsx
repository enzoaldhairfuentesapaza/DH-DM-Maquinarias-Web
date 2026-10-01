import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import ExcelTools from "./ExcelTools";
import { sectionNames, type ExcelSchema } from "./excelFiles";
export default function ExcelCenter() {
 const {isCotizador}=useAuth();
  const [schemas,setSchemas]=useState<ExcelSchema[]>([]);const [error,setError]=useState("");
  const [params,setParams]=useSearchParams();
  useEffect(()=>{api.get<ExcelSchema[]>("/api/excel").then(setSchemas).catch(e=>setError(e.message));},[]);
  const selected=schemas.some(s=>s.key===params.get("seccion"))?params.get("seccion")!:schemas[0]?.key;
  return <div><h1>Centro de Excel</h1><p>{isCotizador?"Descarga los registros de tus secciones en Excel. La importación está reservada a roles autorizados.":"Descarga todos los registros, prepara una plantilla o importa un archivo después de revisar sus filas."}</p>{error&&<p className="admin-error">{error}</p>}<label>Sección <select className="admin-filter-select" value={selected??""} onChange={e=>setParams({seccion:e.target.value})}>{schemas.map(s=><option key={s.key} value={s.key}>{sectionNames[s.key]??s.key}{s.importable?"":" · solo exportación"}</option>)}</select></label>{selected&&<ExcelTools key={selected} entity={selected} />}</div>;
}
