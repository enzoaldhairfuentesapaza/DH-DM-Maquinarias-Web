import { useEffect, useState } from "react";
import { api, resolveApiAsset } from "../api/client";

export interface Novedad {
  id: number;
  titulo: string;
  categoria: string;
  fecha: string;
  resumen: string;
  imagen: string;
  destacado?: boolean;
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
  destacado?: boolean;
}

interface RawRecord {
  id: number; titulo: string; categoria: string; fecha: string; resumen: string;
  imagen: string | null; destacado: boolean; descripcion: string; vigencia: string;
  contenido: string[]; nombre: string; marca: string; anio: number; año?: number;
  condicion: Maquina['condicion']; potencia: string; peso: string; ubicacion: string;
  especificaciones: EspecificacionItem[] | string; stock_disponible?: boolean;
  stock_cantidad: number; codigo: string; marca_detalle: string; unidad: string;
  modelo_recomendado: string[]; codigo_original: string;
}

function useFetchList<T>(path: string, mapItem: (raw: RawRecord) => T) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api
      .get<RawRecord[]>(path)
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
    imagen: resolveApiAsset(n.imagen),
    destacado: !!n.destacado,
  }));
}

/**
 * Categorías creadas en el panel (Productos > Categorías) para "maquinaria" o
 * "repuesto". Se usa para que una categoría recién creada aparezca en los
 * filtros de /maquinaria o /repuestos aunque todavía no tenga productos.
 */
export function useCategorias(tipo: "maquinaria" | "repuesto") {
  const [nombres, setNombres] = useState<string[]>([]);

  useEffect(() => {
    let cancelado = false;
    api
      .get<{ nombre: string }[]>(`/api/categorias?tipo=${tipo}`)
      .then((data) => {
        if (!cancelado) setNombres(data.map((c) => c.nombre));
      })
      .catch(() => {
        if (!cancelado) setNombres([]);
      });
    return () => {
      cancelado = true;
    };
  }, [tipo]);

  return nombres;
}

/**
 * Configuración general del sitio (números de contacto, correo, etc.)
 * editable por admins/owners desde "Editar Página > Números y correo".
 */
export interface ConfiguracionSitio {
  whatsapp_primario: string;
  whatsapp_secundario: string;
  correo_contacto: string;
}

const CONFIG_POR_DEFECTO: ConfiguracionSitio = {
  whatsapp_primario: "51988341207",
  whatsapp_secundario: "51976215893",
  correo_contacto: "contacto@dh-dm-maquinarias.com",
};

export function useConfiguracionSitio() {
  const [data, setData] = useState<ConfiguracionSitio>(CONFIG_POR_DEFECTO);
  const [loading, setLoading] = useState(true);

  const recargar = () => {
    setLoading(true);
    api
      .get<Partial<ConfiguracionSitio>>("/api/configuracion")
      .then((raw) => setData({ ...CONFIG_POR_DEFECTO, ...raw }))
      .catch(() => setData(CONFIG_POR_DEFECTO))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    recargar();
  }, []);

  return { data, loading, recargar };
}

export function usePromociones() {
  return useFetchList<Promocion>("/api/promociones", (p) => ({
    id: p.id,
    titulo: p.titulo,
    descripcion: p.descripcion,
    vigencia: p.vigencia,
    imagen: resolveApiAsset(p.imagen),
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
    imagen: resolveApiAsset(b.imagen),
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
    imagen: resolveApiAsset(m.imagen),
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
    especificaciones: typeof r.especificaciones === "string" ? r.especificaciones : "",
    categoria: r.categoria,
    descripcion: r.descripcion,
    unidad: r.unidad ?? "UNIDADES",
    modeloRecomendado: Array.isArray(r.modelo_recomendado) ? r.modelo_recomendado : [],
    codigoOriginal: r.codigo_original ?? "",
    imagen: resolveApiAsset(r.imagen),
    stockDisponible: r.stock_disponible === undefined ? true : !!r.stock_disponible,
    stockCantidad: Number(r.stock_cantidad ?? 0),
    destacado: !!r.destacado,
  }));
}
