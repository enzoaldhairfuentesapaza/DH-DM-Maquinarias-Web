import { jsPDF } from "jspdf";
import { api } from "../../api/client";
import { finalPrice, type CalculatorQuote } from "./model";
let templatePromise:Promise<HTMLImageElement>|undefined;
function template(){return templatePromise??=new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>{templatePromise=undefined;reject(new Error("No se pudo cargar la plantilla PDF."));};img.src="/cotizador-app/plantillahdm.png";});}
export async function buildQuotePdf(q:CalculatorQuote) {
  const doc=new jsPDF({orientation:"p",unit:"mm",format:"a4",compress:true});const [image,contacts]=await Promise.all([template(),api.get<{whatsapp_primario:string;whatsapp_secundario:string;correo_contacto:string}>("/api/configuracion")]);
  const header=()=>{
    doc.addImage(image,"PNG",0,0,210,297,undefined,"MEDIUM");doc.setFont("helvetica","normal");doc.setFontSize(9);
    doc.text(q.cliente_documento||"-",40,59.6);doc.text(doc.splitTextToSize(q.cliente_nombre||"-",64).slice(0,1),40,66.3);doc.text(doc.splitTextToSize(q.cliente_direccion||"-",64).slice(0,1),40,73);doc.text(new Date(q.creado_en??Date.now()).toLocaleDateString("es-PE"),40,80);
    doc.setFillColor(255,255,255);doc.rect(111,79,98,6,"F");doc.setFontSize(7);
    const phone=q.items[0]?.tipo==="maquinaria"?contacts.whatsapp_secundario:contacts.whatsapp_primario;
    doc.text(`Tel: +${phone} | ${contacts.correo_contacto}`,112,82.5);
    doc.setFontSize(10);doc.text(q.numero,205,28,{align:"right"});
    doc.setFillColor(255,255,255);doc.rect(1.5,277.5,182.5,5.4,"F");doc.setFont("helvetica","bold");doc.text(`PRECIO TOTAL EN ${q.moneda_mostrar==="USD"?"DOLARES":"SOLES"} (Incluye IGV)`,92,282,{align:"center"});doc.setFont("helvetica","normal");
  };
  header();let y=100;let total=0;
  for(const [index,p] of q.items.entries()){
    const price=finalPrice(p,q);if(!Number.isFinite(price))throw new Error("Ingresa un tipo de cambio válido para generar el PDF.");total+=price*p.qty;
    doc.setFontSize(8);const description=p.showDiscounts&&p.discounts?.length?`${p.desc} (Desc: ${p.discounts.join("%, ")}%)`:p.desc;
    const code=doc.splitTextToSize(p.code||"-",27) as string[];const desc=doc.splitTextToSize(description,72) as string[];const brand=doc.splitTextToSize(p.brand,14) as string[];
    const lines=Math.max(code.length,desc.length,brand.length);let offset=0;
    while(offset<lines){if(y>252){doc.addPage();header();y=100;}doc.setFontSize(8);const room=Math.floor((258-y)/4);const count=Math.max(1,Math.min(lines-offset,room));
      if(offset===0){doc.text(String(index+1),5.7,y);doc.text(/^(UNIDADES?|UND)$/i.test(p.unit)?"UND":p.unit.slice(0,5),137,y);doc.text(String(p.qty),153,y);doc.text(price.toFixed(2),184.4,y,{align:"right"});doc.text((price*p.qty).toFixed(2),208,y,{align:"right"});}
      doc.text(code.slice(offset,offset+count),14,y);doc.text(brand.slice(offset,offset+count),44,y);doc.text(desc.slice(offset,offset+count),60,y);y+=count*4+2;offset+=count;
    }
  }
  doc.setFillColor(255,255,255);doc.rect(1.5,277.5,182.5,5.4,"F");doc.setFont("helvetica","bold");doc.setFontSize(10);
  doc.text(`PRECIO TOTAL EN ${q.moneda_mostrar==="USD"?"DOLARES":"SOLES"} (Incluye IGV)`,92,282,{align:"center"});
  doc.setFont("helvetica","normal");doc.setFontSize(10);const amount=`${q.moneda_mostrar} ${total.toFixed(2)}`;if(doc.getTextWidth(amount)>22)doc.setFontSize(10*22/doc.getTextWidth(amount));doc.text(amount,207,282,{align:"right"});return doc;
}
