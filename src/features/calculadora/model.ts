export type Currency = "PEN" | "USD";
export interface CalculatorItem {
  code:string;unit:string;brand:string;qty:number;price:number;currency:Currency;desc:string;
  discounts:number[];brandAdjustments:number[];showDiscounts:boolean;tipo:"repuesto"|"maquinaria";product_id?:number;
}
export interface CalculatorQuote {
  id?:number;numero:string;cliente_nombre:string;cliente_documento:string;cliente_direccion:string;cliente_email:string;cliente_telefono:string;
  items:CalculatorItem[];tipo_cambio:number;moneda_mostrar:Currency;total:number;oficial:boolean;solicitud_id:number|null;cotizacion_id?:number|null;archivo_pdf?:string|null;creado_en?:string;registro_clave:string;
}
export function newQuote():CalculatorQuote {
  const key=crypto.randomUUID();
  return {numero:`COT-${key.slice(0,8).toUpperCase()}`,registro_clave:key,cliente_nombre:"",cliente_documento:"",cliente_direccion:"",cliente_email:"",cliente_telefono:"",items:[],tipo_cambio:0,moneda_mostrar:"PEN",total:0,oficial:false,solicitud_id:null};
}
export function newItem():CalculatorItem {return {code:"",unit:"UND",brand:"CAT",qty:1,price:0,currency:"USD",desc:"",discounts:[],brandAdjustments:[18],showDiscounts:true,tipo:"repuesto"};}
export function finalPrice(item:CalculatorItem,quote:Pick<CalculatorQuote,"tipo_cambio"|"moneda_mostrar">):number {
  let price=item.price;
  for(const a of item.brandAdjustments??[])price*=1+a/100;
  for(const d of item.discounts??[])price*=1-d/100;
  if(item.currency!==quote.moneda_mostrar){if(!(quote.tipo_cambio>0))return NaN;price=quote.moneda_mostrar==="PEN"?price*quote.tipo_cambio:price/quote.tipo_cambio;}
  return Math.round(price);
}
export function totalQuote(q:CalculatorQuote):number {return q.items.reduce((sum,item)=>sum+finalPrice(item,q)*item.qty,0);}
