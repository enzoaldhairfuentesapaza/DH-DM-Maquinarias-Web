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
  section?: string; // agrupa visualmente los campos del formulario (opcional)
  hint?: string; // texto de ayuda corto debajo del campo (opcional)
}

export type PreviewType = "maquinaria" | "repuestos" | "blog" | "novedades" | "promociones";

export interface EntityConfig {
  key: string; // usado en la URL: /admin/:key
  apiPath: string; // ej. /api/novedades
  singular: string;
  plural: string;
  parentHub: { to: string; label: string };
  listColumns: { name: string; label: string }[];
  fields: FieldConfig[];
  previewType?: PreviewType; // si se define, ContentForm muestra vista previa en vivo
}

export const entities: Record<string, EntityConfig> = {
  novedades: {
    key: "novedades",
    apiPath: "/api/novedades",
    parentHub: { to: "/admin", label: "Editar Página" },
    singular: "Novedad",
    plural: "Novedades",
    previewType: "novedades",
    listColumns: [
      { name: "titulo", label: "Título" },
      { name: "categoria", label: "Categoría" },
      { name: "fecha", label: "Fecha" },
      { name: "destacado", label: "En Tablón de Anuncios" },
    ],
    fields: [
      { name: "titulo", label: "Título", type: "text", required: true },
      { name: "categoria", label: "Categoría", type: "text", required: true },
      { name: "fecha", label: "Fecha (ej. 10 jul. 2026)", type: "text", required: true },
      { name: "resumen", label: "Resumen", type: "textarea", required: true },
      { name: "imagen", label: "Imagen", type: "image" },
      {
        name: "destacado",
        label: "Destacado (se verá en el Tablón de Anuncios del inicio)",
        type: "checkbox",
      },
    ],
  },
  blog: {
    key: "blog",
    apiPath: "/api/blog",
    parentHub: { to: "/admin", label: "Editar Página" },
    singular: "Artículo de blog",
    plural: "Blog",
    previewType: "blog",
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
      {
        name: "destacado",
        label: "Destacado (se verá en \"Blog destacados\" del inicio)",
        type: "checkbox",
      },
    ],
  },
  promociones: {
    key: "promociones",
    apiPath: "/api/promociones",
    parentHub: { to: "/admin", label: "Editar Página" },
    singular: "Promoción",
    plural: "Promociones",
    previewType: "promociones",
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
      {
        name: "destacado",
        label: "Destacado (aparece resaltada en el inicio, no solo en la página de Promociones)",
        type: "checkbox",
      },
    ],
  },
  maquinaria: {
    key: "maquinaria",
    apiPath: "/api/maquinaria",
    parentHub: { to: "/admin/productos", label: "Administrar Productos" },
    singular: "Máquina",
    plural: "Maquinaria",
    previewType: "maquinaria",
    listColumns: [
      { name: "nombre", label: "Nombre" },
      { name: "marca", label: "Marca" },
      { name: "categoria", label: "Categoría" },
      { name: "condicion", label: "Condición" },
      { name: "stock_disponible", label: "En stock" },
      { name: "stock_cantidad", label: "Cantidad" },
    ],
    fields: [
      { name: "nombre", label: "Nombre", type: "text", required: true, section: "Datos básicos" },
      { name: "marca", label: "Marca", type: "text", required: true, section: "Datos básicos" },
      {
        name: "categoria",
        label: "Categoría",
        type: "category-select",
        categoryTipo: "maquinaria",
        required: true,
        section: "Datos básicos",
      },
      { name: "anio", label: "Año", type: "number", section: "Datos básicos" },
      {
        name: "condicion",
        label: "Condición",
        type: "select",
        options: ["Nuevo", "Usado", "Reacondicionado"],
        section: "Datos básicos",
      },
      { name: "potencia", label: "Potencia", type: "text", section: "Detalles técnicos" },
      { name: "peso", label: "Peso", type: "text", section: "Detalles técnicos" },
      { name: "ubicacion", label: "Ubicación", type: "text", section: "Detalles técnicos" },
      { name: "descripcion", label: "Descripción", type: "textarea", required: true, section: "Detalles técnicos" },
      {
        name: "especificaciones",
        label: "Especificaciones técnicas",
        type: "tabular",
        tabularColumns: ["label", "valor"],
        section: "Detalles técnicos",
      },
      { name: "imagen", label: "Imagen", type: "image", section: "Imagen y visibilidad" },
      {
        name: "destacado",
        label: "Destacado (aparece en \"Maquinaria destacada\" del inicio)",
        type: "checkbox",
        section: "Imagen y visibilidad",
      },
      {
        name: "stock_disponible",
        label: "Disponible en stock",
        type: "checkbox",
        defaultChecked: true,
        section: "Imagen y visibilidad",
      },
      { name: "stock_cantidad", label: "Cantidad disponible", type: "number", section: "Imagen y visibilidad" },
    ],
  },
  repuestos: {
    key: "repuestos",
    apiPath: "/api/repuestos",
    parentHub: { to: "/admin/productos", label: "Administrar Productos" },
    singular: "Repuesto",
    plural: "Repuestos",
    previewType: "repuestos",
    listColumns: [
      { name: "codigo", label: "Código" },
      { name: "nombre", label: "Nombre" },
      { name: "marca", label: "Marca" },
      { name: "categoria", label: "Categoría" },
      { name: "stock_disponible", label: "En stock" },
      { name: "stock_cantidad", label: "Cantidad" },
      { name: "destacado", label: "Destacado" },
    ],
    fields: [
      { name: "codigo", label: "Código", type: "text", required: true, section: "Datos básicos" },
      { name: "nombre", label: "Nombre", type: "text", required: true, section: "Datos básicos" },
      { name: "marca", label: "Marca", type: "text", required: true, section: "Datos básicos" },
      { name: "marca_detalle", label: "Detalle de marca/procedencia", type: "text", section: "Datos básicos" },
      {
        name: "categoria",
        label: "Categoría",
        type: "category-select",
        categoryTipo: "repuesto",
        required: true,
        section: "Datos básicos",
      },
      { name: "especificaciones", label: "Especificaciones (texto libre)", type: "text", section: "Detalles técnicos" },
      { name: "descripcion", label: "Descripción", type: "textarea", required: true, section: "Detalles técnicos" },
      { name: "unidad", label: "Unidad de venta", type: "text", section: "Detalles técnicos" },
      {
        name: "modelo_recomendado",
        label: "Modelos/equipos recomendados (uno por línea)",
        type: "paragraphs",
        section: "Detalles técnicos",
      },
      { name: "codigo_original", label: "Código original", type: "text", section: "Detalles técnicos" },
      { name: "imagen", label: "Imagen", type: "image", section: "Imagen y visibilidad" },
      {
        name: "destacado",
        label: "Destacado (aparece en \"Repuestos destacados\" del inicio)",
        type: "checkbox",
        section: "Imagen y visibilidad",
      },
      {
        name: "stock_disponible",
        label: "Disponible en stock",
        type: "checkbox",
        defaultChecked: true,
        section: "Imagen y visibilidad",
      },
      { name: "stock_cantidad", label: "Cantidad disponible", type: "number", section: "Imagen y visibilidad" },
    ],
  },
  ventas: {
    key: "ventas",
    apiPath: "/api/ventas",
    parentHub: { to: "/admin/ventas-cotizaciones", label: "Cotizaciones" },
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
      { name: "numero_boleta", label: "N° de boleta/factura", type: "text", required: true, section: "Datos del comprobante" },
      { name: "fecha", label: "Fecha (ej. 26/07/2026)", type: "text", required: true, section: "Datos del comprobante" },
      { name: "cliente_nombre", label: "Nombre del cliente", type: "text", required: true, section: "Datos del cliente" },
      { name: "cliente_documento", label: "DNI / RUC", type: "text", section: "Datos del cliente" },
      { name: "cliente_email", label: "Correo del cliente", type: "text", section: "Datos del cliente" },
      { name: "cliente_telefono", label: "Teléfono del cliente", type: "text", section: "Datos del cliente" },
      {
        name: "productos",
        label: "Productos vendidos",
        type: "tabular",
        tabularColumns: ["nombre", "cantidad", "precio"],
        section: "Productos y montos",
      },
      { name: "subtotal", label: "Subtotal (S/)", type: "number", required: true, section: "Productos y montos" },
      { name: "igv", label: "IGV (S/)", type: "number", required: true, section: "Productos y montos" },
      { name: "total", label: "Total (S/)", type: "number", required: true, section: "Productos y montos" },
      { name: "metodo_pago", label: "Método de pago", type: "text", section: "Productos y montos" },
      {
        name: "estado",
        label: "Estado",
        type: "select",
        options: ["pagado", "pendiente", "anulado"],
        section: "Productos y montos",
      },
      { name: "notas", label: "Notas adicionales", type: "textarea", section: "Productos y montos" },
    ],
  },
};
