export interface ExcelField { name: string; required: boolean; type: "text" | "number" | "boolean" | "json"; }
export interface ExcelSchema { key: string; fields: ExcelField[]; importable: boolean; identity: string[]; updates: boolean; }
export type ExcelRow = Record<string, unknown>;
export const sectionNames: Record<string,string> = { estadisticas:"Estadísticas",novedades:"Novedades",blog:"Blog",promociones:"Promociones",maquinaria:"Maquinaria",repuestos:"Repuestos",ventas:"Ventas",categorias:"Categorías",accesos:"Accesos",cotizaciones:"Solicitudes de cotización",cotizador:"Cotizaciones formales",sugerencias:"Sugerencias y reclamos",configuracion:"Configuración",auditoria:"Registro de actividad",papelera:"Papelera",notificaciones:"Mis notificaciones" };
export function normalize(value: unknown) { return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g," ").toLowerCase(); }

export async function saveWorkbook(schema: ExcelSchema, rows: ExcelRow[], template = false) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "DH & DM Maquinarias";
  const sheet = workbook.addWorksheet("Datos");
  const keys = template ? schema.fields.map(f => f.name) : [...new Set(rows.flatMap(r => Object.keys(r)))];
  // Write-only passwords never appear in exports.
  const columns = keys.filter(k => !["password", "hashed_password", "token_version"].includes(k) || (template && k === "password"));
  if (!columns.length) columns.push(...schema.fields.filter(f=>f.name!=="password").map(f=>f.name));
  sheet.columns = columns.map(key => ({ header:key, key, width:Math.min(45,Math.max(20,key.length+3)) }));
  for (const row of rows) {
    const values: ExcelRow = {};
    for (const key of columns) {
      const value = row[key];
      // Explicit strings prevent Excel formulas and preserve codes and leading zeros.
      values[key] = value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : value;
    }
    sheet.addRow(values);
  }
  sheet.views = [{ state:"frozen", ySplit:1 }];
  sheet.autoFilter = { from:{row:1,column:1}, to:{row:Math.max(1,sheet.rowCount),column:columns.length} };
  sheet.getRow(1).height = 28;
  sheet.getRow(1).eachCell(c=>{ c.font={bold:true,color:{argb:"FFFFFFFF"}}; c.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF1C2529"}}; c.alignment={vertical:"middle"}; });
  columns.forEach((key,i)=>{ if (schema.fields.find(f=>f.name===key)?.type === "text" || !schema.fields.some(f=>f.name===key)) sheet.getColumn(i+1).numFmt="@"; });
  const help = workbook.addWorksheet("Instrucciones");
  help.columns=[{width:32},{width:100}];
  help.addRows([["Sección",sectionNames[schema.key]??schema.key],["Operación",schema.updates?"Actualizar contactos por clave":"Agregar registros; no modifica ni elimina registros existentes"],["Archivo","Importar solo la hoja Datos. No usar fórmulas. Máximo 20 000 filas y 10 MB."],["Clave para omitir duplicados",schema.identity.join(", ")],["Imágenes","Usar rutas /... o URL https://...; el Excel no sube imágenes incrustadas."],["Listas y tablas","Las columnas JSON usan listas u objetos JSON. Ver EXCEL.md."],["Contraseñas","No se exportan. Para crear accesos, introducir contraseñas nuevas."],["Columnas obligatorias",schema.fields.filter(f=>f.required).map(f=>f.name).join(", ")],[],["Columna","Tipo / obligatoriedad"],...schema.fields.map(f=>[f.name,`${f.type}${f.required?" · obligatoria":" · opcional"}`])]);
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer as BlobPart], {type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));
  const a=document.createElement("a"); a.href=url; a.download=`DH-DM-${schema.key}-${template?"plantilla":new Date().toISOString().slice(0,10)}.xlsx`; a.click();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export async function readWorkbook(file: File): Promise<{ headers:string[]; rows:unknown[][]; rowNumbers:number[] }> {
  if (!file.name.toLowerCase().endsWith(".xlsx")) throw new Error("Usa un archivo .xlsx. Convierte los archivos .xls desde Excel antes de subirlos.");
  if (file.size>10*1024*1024) throw new Error("El archivo supera los 10 MB.");
  const buffer=await file.arrayBuffer();
  // Inspect ZIP directory before decompression to reject oversized workbooks.
  const view=new DataView(buffer); let total=0, entries=0;
  for(let i=buffer.byteLength-22;i>=Math.max(0,buffer.byteLength-65557);i--) if(view.getUint32(i,true)===0x06054b50) {
    const count=view.getUint16(i+10,true); let offset=view.getUint32(i+16,true);
    for(let n=0;n<count;n++) {
      if(offset+46>view.byteLength || view.getUint32(offset,true)!==0x02014b50) throw new Error("Archivo Excel inválido.");
      total+=view.getUint32(offset+24,true); entries++;
      offset+=46+view.getUint16(offset+28,true)+view.getUint16(offset+30,true)+view.getUint16(offset+32,true);
    }
    break;
  }
  if(!entries || total>50*1024*1024 || entries>2000) throw new Error("Archivo inválido o demasiado grande al descomprimir.");
  const { default: ExcelJS } = await import("exceljs");
  const workbook=new ExcelJS.Workbook(); await workbook.xlsx.load(buffer);
  const sheet=workbook.getWorksheet("Datos")??workbook.worksheets[0];
  if(!sheet || sheet.rowCount>20001 || sheet.columnCount>100) throw new Error("La hoja debe tener hasta 20 000 filas y 100 columnas.");
  const convert=(cell: import("exceljs").Cell):unknown=> {
    const v=cell.value;
    if (v && typeof v === "object") {
      if (v instanceof Date) return v.toISOString().slice(0,10);
      if ("formula" in v || "sharedFormula" in v) throw new Error(`Celda ${cell.address}: reemplaza la fórmula por su valor.`);
      if ("richText" in v) return v.richText.map(p=>p.text).join("");
      if ("hyperlink" in v) return v.text;
      throw new Error(`Celda ${cell.address}: valor no compatible.`);
    }
    return v??"";
  };
  const headers=Array.from({length:sheet.columnCount},(_,i)=>String(convert(sheet.getRow(1).getCell(i+1))).trim());
  const rows:unknown[][]=[]; const rowNumbers:number[]=[];
  for(let n=2;n<=sheet.rowCount;n++) {
    const row=Array.from({length:headers.length},(_,i)=>convert(sheet.getRow(n).getCell(i+1)));
    if(row.some(v=>v!=="")) { rows.push(row); rowNumbers.push(n); }
  }
  if(!rows.length) throw new Error("El Excel no contiene filas de datos.");
  return {headers,rows,rowNumbers};
}
export function mapRows(rows:unknown[][], mapping:string[], schema:ExcelSchema, rowNumbers?:number[]):ExcelRow[] {
  const fields=new Map(schema.fields.map(f=>[f.name,f]));
  const selected=mapping.filter(Boolean);
  if(new Set(selected).size!==selected.length) throw new Error("Cada columna de destino solo puede asignarse una vez.");
  for(const f of schema.fields) if(f.required && !selected.includes(f.name)) throw new Error(`Asigna la columna obligatoria ${f.name}.`);
  return rows.map((cells,index)=>{
    const row:ExcelRow={};
    mapping.forEach((name,i)=>{
      if(!name) return;
      const field=fields.get(name)!; const value=cells[i];
      if(value==="" || value===null || value===undefined) return;
      try {
        if(field.type==="boolean") {
          const v=normalize(value); if(!["si","no","true","false","1","0"].includes(v)) throw new Error("usa Sí o No");
          row[name]=["si","true","1"].includes(v);
        } else if(field.type==="number") {
          const v=typeof value==="number"?value:Number(String(value).replace(",","."));
          if(!Number.isFinite(v)) throw new Error("usa una celda numérica"); row[name]=v;
        } else if(field.type==="json") row[name]=JSON.parse(String(value));
        else row[name]=String(value).trim();
      } catch { throw new Error(`Fila ${rowNumbers?.[index]??index+2}, ${name}: ${field.type==="json"?"JSON inválido":field.type==="boolean"?"usa Sí o No":"valor inválido"}.`); }
    });
    return row;
  });
}
export function batches(rows:ExcelRow[]):ExcelRow[][] {
  const result:ExcelRow[][]=[]; let batch:ExcelRow[]=[]; let size=0;
  for(const row of rows) {
    const bytes=new TextEncoder().encode(JSON.stringify(row)).length+1;
    if(bytes>700000) throw new Error("Una fila es demasiado grande. Reduce su contenido.");
    if(batch.length>=500 || size+bytes>700000) { result.push(batch); batch=[]; size=0; }
    batch.push(row); size+=bytes;
  }
  if(batch.length) result.push(batch); return result;
}
