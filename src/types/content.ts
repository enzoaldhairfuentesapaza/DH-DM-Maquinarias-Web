export type ContentField = string | number | boolean | null | undefined | string[] | Record<string, string>[];
export type ContentRecord = Record<string, ContentField> & {
  imagen?: string; condicion?: string; categoria?: string; nombre?: string; marca?: string;
  anio?: number | string; potencia?: string; ubicacion?: string; destacado?: boolean;
  stock_disponible?: boolean; codigo?: string; titulo?: string; fecha?: string;
  resumen?: string; descripcion?: string; vigencia?: string;
};
export interface QuoteProduct { tipo?: string; nombre: string; codigo?: string; cantidad?: number; imagen?: string; }
export interface QuoteDetail { productos?: QuoteProduct[]; razon_social?: string; tipo_documento?: string; numero_documento?: string; asunto?: string; mensaje?: string; }
