export type FieldType = "text" | "textarea" | "image" | "paragraphs" | "checkbox" | "number" | "select" | "tabular" | "category-select";

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[]; // para "select"
  tabularColumns?: string[]; // para "tabular": nombres de columnas, ej. ["label","valor"]
  categoryTipo?: "maquinaria" | "repuesto"; // para "category-select"
  defaultChecked?: boolean; // para "checkbox" al crear un item nuevo
}

export interface EntityConfig {
  key: string; // usado en la URL: /admin/:key
  apiPath: string; // ej. /api/novedades
  singular: string;
  plural: string;
  parentHub: { to: string; label: string };
  listColumns: { name: string; label: string }[];
  fields: FieldConfig[];
}

export const entities: Record<string, EntityConfig> = {
  novedades: {
    key: "novedades",
    apiPath: "/api/novedades",
    parentHub: { to: "/admin", label: "Editar Página" },
    singular: "Novedad",
    plural: "Novedades",
    listColumns: [
      { name: "titulo", label: "Título" },
      { name: "categoria", label: "Categoría" },
      { name: "fecha", label: "Fecha" },
    ],
    fields: [
      { name: "titulo", label: "Título", type: "text", required: true },
      { name: "categoria", label: "Categoría", type: "text", required: true },
      { name: "fecha", label: "Fecha (ej. 10 jul. 2026)", type: "text", required: true },
      { name: "resumen", label: "Resumen", type: "textarea", required: true },
      { name: "imagen", label: "Imagen", type: "image" },
    ],
  },
  blog: {
    key: "blog",
    apiPath: "/api/blog",
    parentHub: { to: "/admin", label: "Editar Página" },
    singular: "Artículo de blog",
    plural: "Blog",
    listColumns: [
      { name: "titulo", label: "Título" },
      { name: "categoria", label: "Categoría" },
      { name: "fecha", label: "Fecha" },
      { name: "destacado", label: "Destacado" },
    ],
    fields: [
      { name: "titulo", label: "Título", type: "text", required: true },
      { name: "categoria", label: "Categoría", type: "text", required: true },
      { name: "fecha", label: "Fecha (ej. 02 Jul 2026)", type: "text", required: true },
      { name: "resumen", label: "Resumen", type: "textarea", required: true },
      {
        name: "contenido",
        label: "Contenido (un párrafo por línea)",
        type: "paragraphs",
      },
      { name: "imagen", label: "Imagen", type: "image" },
      { name: "destacado", label: "Destacado", type: "checkbox" },
    ],
  },
  promociones: {
    key: "promociones",
    apiPath: "/api/promociones",
    parentHub: { to: "/admin", label: "Editar Página" },
    singular: "Promoción",
    plural: "Promociones",
    listColumns: [
      { name: "titulo", label: "Título" },
      { name: "vigencia", label: "Vigencia" },
      { name: "destacado", label: "Destacado" },
    ],
    fields: [
      { name: "titulo", label: "Título", type: "text", required: true },
      { name: "descripcion", label: "Descripción", type: "textarea", required: true },
      { name: "vigencia", label: "Vigencia (ej. Válido hasta ...)", type: "text", required: true },
      { name: "imagen", label: "Imagen", type: "image" },
      { name: "destacado", label: "Destacado", type: "checkbox" },
    ],
  },
  maquinaria: {
    key: "maquinaria",
    apiPath: "/api/maquinaria",
    parentHub: { to: "/admin/productos", label: "Administrar Productos" },
    singular: "Máquina",
    plural: "Maquinaria",
    listColumns: [
      { name: "nombre", label: "Nombre" },
      { name: "marca", label: "Marca" },
      { name: "categoria", label: "Categoría" },
      { name: "condicion", label: "Condición" },
      { name: "stock_disponible", label: "En stock" },
      { name: "stock_cantidad", label: "Cantidad" },
    ],
    fields: [
      { name: "nombre", label: "Nombre", type: "text", required: true },
      { name: "marca", label: "Marca", type: "text", required: true },
      { name: "categoria", label: "Categoría", type: "category-select", categoryTipo: "maquinaria", required: true },
      { name: "anio", label: "Año", type: "number" },
      {
        name: "condicion",
        label: "Condición",
        type: "select",
        options: ["Nuevo", "Usado", "Reacondicionado"],
      },
      { name: "potencia", label: "Potencia", type: "text" },
      { name: "peso", label: "Peso", type: "text" },
      { name: "ubicacion", label: "Ubicación", type: "text" },
      { name: "descripcion", label: "Descripción", type: "textarea", required: true },
      {
        name: "especificaciones",
        label: "Especificaciones técnicas",
        type: "tabular",
        tabularColumns: ["label", "valor"],
      },
      { name: "imagen", label: "Imagen", type: "image" },
      { name: "destacado", label: "Destacado", type: "checkbox" },
      { name: "stock_disponible", label: "Disponible en stock", type: "checkbox", defaultChecked: true },
      { name: "stock_cantidad", label: "Cantidad disponible", type: "number" },
    ],
  },
  repuestos: {
    key: "repuestos",
    apiPath: "/api/repuestos",
    parentHub: { to: "/admin/productos", label: "Administrar Productos" },
    singular: "Repuesto",
    plural: "Repuestos",
    listColumns: [
      { name: "codigo", label: "Código" },
      { name: "nombre", label: "Nombre" },
      { name: "marca", label: "Marca" },
      { name: "categoria", label: "Categoría" },
      { name: "stock_disponible", label: "En stock" },
      { name: "stock_cantidad", label: "Cantidad" },
    ],
    fields: [
      { name: "codigo", label: "Código", type: "text", required: true },
      { name: "nombre", label: "Nombre", type: "text", required: true },
      { name: "marca", label: "Marca", type: "text", required: true },
      { name: "marca_detalle", label: "Detalle de marca/procedencia", type: "text" },
      { name: "categoria", label: "Categoría", type: "category-select", categoryTipo: "repuesto", required: true },
      { name: "especificaciones", label: "Especificaciones (texto libre)", type: "text" },
      { name: "descripcion", label: "Descripción", type: "textarea", required: true },
      { name: "unidad", label: "Unidad de venta", type: "text" },
      {
        name: "modelo_recomendado",
        label: "Modelos/equipos recomendados (uno por línea)",
        type: "paragraphs",
      },
      { name: "codigo_original", label: "Código original", type: "text" },
      { name: "imagen", label: "Imagen", type: "image" },
      { name: "stock_disponible", label: "Disponible en stock", type: "checkbox", defaultChecked: true },
      { name: "stock_cantidad", label: "Cantidad disponible", type: "number" },
    ],
  },
  ventas: {
    key: "ventas",
    apiPath: "/api/ventas",
    parentHub: { to: "/admin/ventas-cotizaciones", label: "Ventas y Cotizaciones" },
    singular: "Venta",
    plural: "Ventas / Boletas",
    listColumns: [
      { name: "numero_boleta", label: "N° Boleta" },
      { name: "cliente_nombre", label: "Cliente" },
      { name: "fecha", label: "Fecha" },
      { name: "total", label: "Total" },
      { name: "estado", label: "Estado" },
    ],
    fields: [
      { name: "numero_boleta", label: "N° de boleta/factura", type: "text", required: true },
      { name: "fecha", label: "Fecha (ej. 26/07/2026)", type: "text", required: true },
      { name: "cliente_nombre", label: "Nombre del cliente", type: "text", required: true },
      { name: "cliente_documento", label: "DNI / RUC", type: "text" },
      { name: "cliente_email", label: "Correo del cliente", type: "text" },
      { name: "cliente_telefono", label: "Teléfono del cliente", type: "text" },
      {
        name: "productos",
        label: "Productos vendidos",
        type: "tabular",
        tabularColumns: ["nombre", "cantidad", "precio"],
      },
      { name: "subtotal", label: "Subtotal (S/)", type: "number", required: true },
      { name: "igv", label: "IGV (S/)", type: "number", required: true },
      { name: "total", label: "Total (S/)", type: "number", required: true },
      { name: "metodo_pago", label: "Método de pago", type: "text" },
      {
        name: "estado",
        label: "Estado",
        type: "select",
        options: ["pagado", "pendiente", "anulado"],
      },
      { name: "notas", label: "Notas adicionales", type: "textarea" },
    ],
  },
};
