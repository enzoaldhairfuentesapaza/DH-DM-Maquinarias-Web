export interface BlogPost {
  id: number;
  titulo: string;
  categoria: string;
  fecha: string;
  resumen: string;
  contenido: string[];
  imagen: string;
  destacado?: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    titulo: "Cómo elegir el filtro hidráulico correcto para tu equipo",
    categoria: "Guías técnicas",
    fecha: "02 Jul 2026",
    resumen:
      "Guía práctica para identificar el filtro adecuado según tu equipo, evitando fallas por incompatibilidad.",
    contenido: [
      "Elegir un filtro hidráulico incorrecto puede derivar en pérdida de presión, contaminación del sistema y desgaste prematuro de componentes.",
      "Antes de comprar, verifica siempre el código OEM del fabricante y compáralo contra el modelo de tu máquina, no solo contra el diámetro de la carcasa.",
      "En DH & DM Maquinarias SAC. validamos cada equivalencia con nuestra base técnica antes de recomendar un reemplazo alternativo.",
    ],
    imagen: "",
    destacado: true,
  },
  {
    id: 2,
    titulo: "Mantenimiento preventivo: ahorra en reparaciones",
    categoria: "Mantenimiento",
    fecha: "24 Jun 2026",
    resumen:
      "Claves para reducir tiempos de inactividad de tu maquinaria con un plan de mantenimiento ordenado.",
    contenido: [
      "El mantenimiento preventivo reduce hasta en 30% los costos de reparación mayor en maquinaria pesada.",
      "Programar el cambio de filtros y lubricantes según las horas de uso del equipo, y no solo por calendario, es clave para evitar fallas.",
      "Contar con kits de mantenimiento por modelo de máquina agiliza la compra y evita errores de compatibilidad.",
    ],
    imagen: "",
    destacado: true,
  },
  {
    id: 3,
    titulo: "Repuestos originales vs. alternativos: ventajas y diferencias",
    categoria: "Repuestos",
    fecha: "10 Jun 2026",
    resumen:
      "Ventajas y diferencias entre repuestos originales y alternativos para tomar la mejor decisión de compra.",
    contenido: [
      "Los repuestos originales garantizan tolerancias exactas de fábrica, mientras que los alternativos de calidad certificada ofrecen un ahorro considerable sin sacrificar rendimiento.",
      "La clave está en trabajar con proveedores que validen la procedencia y calidad de cada pieza alternativa.",
      "En nuestro catálogo indicamos claramente la procedencia (original, reman o alternativo) de cada producto.",
    ],
    imagen: "",
    destacado: true,
  },
  {
    id: 4,
    titulo: "Filtros HDM-Filter: nuestra línea propia de filtración",
    categoria: "Producto propio",
    fecha: "10 Jul 2026",
    resumen:
      "Conoce nuestra línea propia de filtros de aceite, combustible y aire, fabricados bajo estándares internacionales.",
    contenido: [
      "HDM-Filter es nuestra línea propia de filtros, desarrollada para ofrecer una alternativa confiable a precios competitivos.",
      "Cada filtro es validado contra el código original del fabricante antes de incorporarse a nuestro catálogo.",
      "Disponemos de equivalencias para las principales marcas de maquinaria pesada que operan en el Perú.",
    ],
    imagen: "",
  },
  {
    id: 5,
    titulo: "Señales de que tu filtro de combustible necesita cambio",
    categoria: "Guías técnicas",
    fecha: "28 May 2026",
    resumen:
      "Aprende a identificar a tiempo los síntomas de un filtro de combustible saturado antes de que dañe el motor.",
    contenido: [
      "Pérdida de potencia, arranque irregular y mayor consumo de combustible son señales comunes de un filtro saturado.",
      "Revisar el indicador de restricción, cuando el equipo lo tiene, es la forma más precisa de saber cuándo cambiarlo.",
      "Postergar el cambio puede derivar en daños a la bomba de inyección, una reparación mucho más costosa.",
    ],
    imagen: "",
  },
  {
    id: 6,
    titulo: "Tren de rodaje: cómo alargar su vida útil",
    categoria: "Mantenimiento",
    fecha: "15 May 2026",
    resumen:
      "Recomendaciones prácticas para cuidar cadenas, zapatas y rodillos y postergar su reemplazo.",
    contenido: [
      "La tensión correcta de la cadena es el factor que más influye en la vida útil del tren de rodaje.",
      "Rotar los componentes cuando el desgaste lo permite ayuda a equilibrar el uso entre ambos lados de la máquina.",
      "Inspeccionar el terreno de trabajo y ajustar la operación reduce el desgaste acelerado por abrasión.",
    ],
    imagen: "",
  },
];

export const categoriasBlog = Array.from(
  new Set(blogPosts.map((p) => p.categoria)),
);
