export interface Maquina {
  id: number;
  nombre: string;
  marca: string;
  categoria: string;
  año: number;
  condicion: "Nuevo" | "Usado" | "Reacondicionado";
  potencia: string;
  peso: string;
  ubicacion: string;
  descripcion: string;
  especificaciones: { label: string; valor: string }[];
  imagen: string;
  destacado?: boolean;
}

export const categoriasMaquinaria = ["Excavadoras"];

export const marcasMaquinaria = ["Caterpillar", "Komatsu", "Hitachi"];

export const maquinarias: Maquina[] = [
  {
    id: 1,
    nombre: "Excavadora Hidráulica 320D",
    marca: "Caterpillar",
    categoria: "Excavadoras",
    año: 2019,
    condicion: "Usado",
    potencia: "121 kW (162 HP)",
    peso: "20 300 kg",
    ubicacion: "Juliaca, Puno",
    descripcion:
      "Excavadora de cadenas ideal para obras civiles y minería de mediana escala. Motor eficiente en consumo de combustible y sistema hidráulico de alta precisión.",
    especificaciones: [
      { label: "Motor", valor: "Cat C6.6 ACERT" },
      { label: "Capacidad de cucharón", valor: "1.19 m³" },
      { label: "Profundidad de excavación", valor: "6.62 m" },
      { label: "Horas de uso", valor: "8 200 h" },
    ],
    imagen: "",
    destacado: true,
  },
  {
    id: 4,
    nombre: "Excavadora PC200-8",
    marca: "Komatsu",
    categoria: "Excavadoras",
    año: 2020,
    condicion: "Usado",
    potencia: "110 kW (148 HP)",
    peso: "20 700 kg",
    ubicacion: "Juliaca, Puno",
    descripcion:
      "Excavadora hidráulica versátil, con cabina ergonómica y sistema de control de combustible inteligente para reducir costos operativos.",
    especificaciones: [
      { label: "Motor", valor: "Komatsu SAA6D107E-1" },
      { label: "Capacidad de cucharón", valor: "0.8 - 1.0 m³" },
      { label: "Profundidad de excavación", valor: "6.62 m" },
      { label: "Horas de uso", valor: "7 100 h" },
    ],
    imagen: "",
    destacado: true,
  },
  {
    id: 8,
    nombre: "Excavadora ZX210",
    marca: "Hitachi",
    categoria: "Excavadoras",
    año: 2018,
    condicion: "Usado",
    potencia: "123 kW (165 HP)",
    peso: "21 200 kg",
    ubicacion: "Juliaca, Puno",
    descripcion:
      "Excavadora de alto rendimiento para minería y construcción pesada, con sistema hidráulico HIOS IV de última generación.",
    especificaciones: [
      { label: "Motor", valor: "Isuzu AA-6HK1X" },
      { label: "Capacidad de cucharón", valor: "0.93 m³" },
      { label: "Profundidad de excavación", valor: "6.83 m" },
      { label: "Horas de uso", valor: "8 900 h" },
    ],
    imagen: "",
    destacado: true,
  },
];