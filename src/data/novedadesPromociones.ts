export interface Novedad {
  id: number;
  titulo: string;
  categoria: string;
  fecha: string;
  resumen: string;
  imagen: string;
}

export const novedades: Novedad[] = [
  {
    id: 1,
    titulo:
      "DH & DM Maquinarias SAC. lanza su línea propia de filtros HDM-Filter",
    categoria: "Producto propio",
    fecha: "10 jul. 2026",
    resumen:
      "Nueva línea de filtros de aceite y combustible fabricados bajo estándares internacionales, compatibles con las principales marcas de maquinaria pesada.",
    imagen: "/novedades/excavadora-carguio-camion.jpg",
  },
  {
    id: 2,
    titulo: "Ampliamos nuestros almacenes en la ciudad de Juliaca",
    categoria: "Empresa",
    fecha: "02 jul. 2026",
    resumen:
      "Duplicamos la capacidad de nuestro almacén de repuestos para brindar una mejor disponibilidad de productos y reducir los tiempos de atención para nuestros clientes.",

    imagen: "/novedades/almacen-la-victoria.jpg",
  },
  {
    id: 3,
    titulo: "Nueva línea de zapatas y cadenas reforzadas HDM-Track",
    categoria: "Producto propio",
    fecha: "20 jun. 2026",
    resumen:
      "Desarrollamos una línea propia de tren de rodaje reforzado, con mayor vida útil frente a las piezas estándar del mercado.",
    imagen: "/novedades/tren-rodaje-detalle.jpg",
  },
  {
    id: 4,
    titulo: "Certificación ISO 9001 para nuestros procesos de calidad",
    categoria: "Empresa",
    fecha: "05 jun. 2026",
    resumen:
      "Nuestro sistema de gestión de calidad fue certificado bajo la norma ISO 9001, reafirmando nuestro compromiso con la excelencia.",
    imagen: "/novedades/operacion-subterranea-seguridad.jpg",
  },
  {
    id: 5,
    titulo: "Nuevo módulo de rastreo de pedidos en línea",
    categoria: "Empresa",
    fecha: "28 may. 2026",
    resumen:
      "Ahora puedes seguir el estado de tu pedido desde la web, desde la confirmación hasta la entrega en obra o almacén.",
    imagen: "/novedades/tajo-vista-aerea.jpg",
  },
  {
    id: 6,
    titulo: "Mayor disponibilidad de repuestos en Juliaca",
    categoria: "Empresa",
    fecha: "15 may. 2026",
    resumen:
      "Ampliamos nuestro inventario para mantener un mayor stock de repuestos y atender los pedidos de nuestros clientes de forma más rápida y eficiente, con envíos a nivel nacional.",

    imagen: "/novedades/camion-minero-cat-797f.jpg",
  },
];

export interface Promocion {
  id: number;
  titulo: string;
  descripcion: string;
  vigencia: string;
  imagen: string;
  destacado?: boolean;
}

export const promociones: Promocion[] = [
  {
    id: 1,
    titulo: "20% de descuento en filtros para mantenimiento preventivo",
    descripcion:
      "Válido en la compra de kits de filtros de aceite, combustible y aire para las principales marcas de maquinaria pesada.",
    vigencia: "Válido hasta el 31 de julio de 2026",
    imagen: "/novedades/excavadora-atardecer-cargando.jpg",
    destacado: true,
  },
  {
    id: 2,
    titulo: "Cotiza tu tren de rodaje y obtén revisión técnica gratuita",
    descripcion:
      "Al solicitar la cotización de cadenas, zapatas o rodillos, incluimos una inspección técnica sin costo en nuestras sedes.",
    vigencia: "Válido hasta el 15 de agosto de 2026",
    imagen: "/novedades/tren-rodaje-detalle.jpg",
  },
  {
    id: 3,
    titulo: "Compra 3 y paga 2 en empaquetaduras seleccionadas",
    descripcion:
      "Promoción aplicable a kits de empaquetaduras de motor de las marcas Caterpillar y Komatsu.",
    vigencia: "Válido hasta el 10 de agosto de 2026",
    imagen: "/novedades/excavadora-lluvia.jpg",
  },
  {
    id: 4,
    titulo: "Envío gratis en pedidos mayores a S/ 1500",
    descripcion:
      "Aplicable a despachos dentro de Lima Metropolitana en compras de repuestos para excavadoras, cargadores y tractores.",
    vigencia: "Válido hasta el 20 de agosto de 2026",
    imagen: "/novedades/camion-minero-cat-797f.jpg",
  },
  {
    id: 5,
    titulo: "Descuento por la compra de más de 10 baldes de aceite de motor (15W-40)",
    descripcion:
      "Aprovecha descuentos especiales en compras por volumen y reduce los costos de mantenimiento de tu maquinaria.",

    vigencia: "Válido hasta el 30 de agosto de 2026",
    imagen: "/novedades/excavadora-cat-6060.jpg",
  },
];