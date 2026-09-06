import { useEffect, useState } from "react";
import { api } from "../api/client";

export interface Novedad {
  id: number;
  titulo: string;
  categoria: string;
  fecha: string;
  resumen: string;
  imagen: string;
}

export interface Promocion {
  id: number;
  titulo: string;
  descripcion: string;
  vigencia: string;
  imagen: string;
  destacado?: boolean;
}

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

export interface EspecificacionItem {
  label: string;
  valor: string;
}

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
  especificaciones: EspecificacionItem[];
  imagen: string;
  destacado?: boolean;
  stockDisponible: boolean;
  stockCantidad: number;
}

export interface Repuesto {
  id: number;
  codigo: string;
  marca: string;
  marcaDetalle: string;
  nombre: string;
  especificaciones: string;
  categoria: string;
  descripcion: string;
  unidad: string;
  modeloRecomendado: string[];
  codigoOriginal: string;
  imagen: string;
  stockDisponible: boolean;
  stockCantidad: number;
}

function useFetchList<T>(path: string, mapItem: (raw: any) => T) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<any[]>(path)
      .then((raw) => {
        if (!cancelled) setData(raw.map(mapItem));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return { data, loading, error };
}

export function useNovedades() {
  return useFetchList<Novedad>("/api/novedades", (n) => ({
    id: n.id,
    titulo: n.titulo,
    categoria: n.categoria,
    fecha: n.fecha,
    resumen: n.resumen,
    imagen: n.imagen ?? "",
  }));
}

export function usePromociones() {
  return useFetchList<Promocion>("/api/promociones", (p) => ({
    id: p.id,
    titulo: p.titulo,
    descripcion: p.descripcion,
    vigencia: p.vigencia,
    imagen: p.imagen ?? "",
    destacado: !!p.destacado,
  }));
}

export function useBlogPosts() {
  return useFetchList<BlogPost>("/api/blog", (b) => ({
    id: b.id,
    titulo: b.titulo,
    categoria: b.categoria,
    fecha: b.fecha,
    resumen: b.resumen,
    contenido: Array.isArray(b.contenido) ? b.contenido : [],
    imagen: b.imagen ?? "",
    destacado: !!b.destacado,
  }));
}

export function useMaquinarias() {
  return useFetchList<Maquina>("/api/maquinaria", (m) => ({
    id: m.id,
    nombre: m.nombre,
    marca: m.marca,
    categoria: m.categoria,
    año: m.anio ?? m.año ?? 0,
    condicion: m.condicion ?? "Usado",
    potencia: m.potencia ?? "",
    peso: m.peso ?? "",
    ubicacion: m.ubicacion ?? "",
    descripcion: m.descripcion,
    especificaciones: Array.isArray(m.especificaciones) ? m.especificaciones : [],
    imagen: m.imagen ?? "",
    destacado: !!m.destacado,
    stockDisponible: m.stock_disponible === undefined ? true : !!m.stock_disponible,
    stockCantidad: Number(m.stock_cantidad ?? 0),
  }));
}

export function useRepuestos() {
  return useFetchList<Repuesto>("/api/repuestos", (r) => ({
    id: r.id,
    codigo: r.codigo,
    marca: r.marca,
    marcaDetalle: r.marca_detalle ?? "",
    nombre: r.nombre,
    especificaciones: r.especificaciones ?? "",
    categoria: r.categoria,
    descripcion: r.descripcion,
    unidad: r.unidad ?? "UNIDADES",
    modeloRecomendado: Array.isArray(r.modelo_recomendado) ? r.modelo_recomendado : [],
    codigoOriginal: r.codigo_original ?? "",
    imagen: r.imagen ?? "",
    stockDisponible: r.stock_disponible === undefined ? true : !!r.stock_disponible,
    stockCantidad: Number(r.stock_cantidad ?? 0),
  }));
}
