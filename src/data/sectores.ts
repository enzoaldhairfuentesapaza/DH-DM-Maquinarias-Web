export type Sector = {
  slug: string;
  nombre: string;
  imagen: string;
  resumen: string;
  puntos: { titulo: string; descripcion: string }[];
};

export const sectores: Sector[] = [
  {
    slug: "construccion",
    nombre: "Construcción",
    imagen: "/sectores/construccion.jpg",
    resumen:
      "La construcción transforma ciudades y conecta al país a través de infraestructura, vivienda y obras públicas. Cada proyecto depende de que la maquinaria esté operativa a tiempo.",
    puntos: [
      {
        titulo: "Desarrollo de infraestructura",
        descripcion:
          "Carreteras, edificios, puentes y viviendas dependen de maquinaria pesada funcionando de forma confiable durante todo el proyecto.",
      },
      {
        titulo: "Crecimiento urbano acelerado",
        descripcion:
          "Las ciudades del Perú siguen expandiéndose, lo que exige equipos disponibles y en buen estado para sostener el ritmo de las obras.",
      },
      {
        titulo: "Cumplimiento de plazos y presupuestos",
        descripcion:
          "Un retraso por falta de un repuesto puede significar penalidades contractuales. La disponibilidad inmediata de piezas evita sobrecostos y demoras.",
      },
    ],
  },
{
    slug: "mineria",
    nombre: "Minería",
    imagen: "/sectores/mineria.jpg",
    resumen:
      "La minería es uno de los principales motores de la economía peruana, y su operación depende de maquinaria pesada trabajando bajo condiciones extremas de altura, polvo y terreno.",
    puntos: [
      {
        titulo: "Motor económico del país",
        descripcion:
          "El sector minero genera una parte importante de las divisas, el empleo y la inversión del Perú. Su continuidad impacta directamente en la economía nacional y regional.",
      },
      {
        titulo: "Condiciones de operación exigentes",
        descripcion:
          "Los equipos trabajan en altura, con polvo, temperaturas extremas y terrenos difíciles. Necesitan repuestos y mantenimiento capaces de resistir ese desgaste acelerado.",
      },
      {
        titulo: "Cada hora de parada cuesta",
        descripcion:
          "Una máquina detenida en mina representa pérdidas económicas altas por hora. Contar con repuestos disponibles y soporte técnico rápido es clave para la continuidad operativa.",
      },
    ],
  },
  ];
