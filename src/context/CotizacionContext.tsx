import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface ItemCotizacion {
  uid: string;
  tipo: "repuesto" | "maquinaria";
  id: number;
  nombre: string;
  codigo?: string;
  marca?: string;
  categoria?: string;
  cantidad: number;
  imagen?: string;
}

interface CotizacionContextType {
  items: ItemCotizacion[];
  agregarItem: (item: Omit<ItemCotizacion, "uid" | "cantidad">, cantidad?: number) => void;
  quitarItem: (uid: string) => void;
  actualizarCantidad: (uid: string, cantidad: number) => void;
  vaciarCarrito: () => void;
  totalItems: number;
}

const CotizacionContext = createContext<CotizacionContextType | undefined>(undefined);

const STORAGE_KEY = "hdm_cotizacion_cart";

export function CotizacionProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCotizacion[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const agregarItem: CotizacionContextType["agregarItem"] = (item, cantidad = 1) => {
    setItems((prev) => {
      const uid = `${item.tipo}-${item.id}`;
      const existente = prev.find((i) => i.uid === uid);
      if (existente) {
        return prev.map((i) =>
          i.uid === uid ? { ...i, cantidad: i.cantidad + cantidad } : i
        );
      }
      return [...prev, { ...item, uid, cantidad }];
    });
  };

  const quitarItem = (uid: string) => {
    setItems((prev) => prev.filter((i) => i.uid !== uid));
  };

  const actualizarCantidad = (uid: string, cantidad: number) => {
    setItems((prev) =>
      prev.map((i) => (i.uid === uid ? { ...i, cantidad: Math.max(1, cantidad) } : i))
    );
  };

  const vaciarCarrito = () => setItems([]);

  const totalItems = items.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <CotizacionContext.Provider
      value={{ items, agregarItem, quitarItem, actualizarCantidad, vaciarCarrito, totalItems }}
    >
      {children}
    </CotizacionContext.Provider>
  );
}

export function useCotizacion() {
  const ctx = useContext(CotizacionContext);
  if (!ctx) throw new Error("useCotizacion debe usarse dentro de CotizacionProvider");
  return ctx;
}
