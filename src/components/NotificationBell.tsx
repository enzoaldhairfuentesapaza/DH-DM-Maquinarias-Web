import "./NotificationBell.css";
import { useEffect, useRef, useState } from "react";
import { Bell, Paperclip } from "lucide-react";
import { api, downloadApiFile } from "../api/client";

interface Notificacion {
  id: number;
  cotizacion_id: number | null;
  tipo: string;
  mensaje: string;
  leida: boolean;
  creado_en: string;
  archivo_respuesta?: string | null;
  cotizacion_estado?: string | null;
}

export default function NotificationBell() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  async function cargar() {
    try {
      const data = await api.get<Notificacion[]>("/api/notificaciones");
      setNotificaciones(data);
    } catch {
      // Si falla (ej. token vencido) simplemente no mostramos nada.
    }
  }

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  async function marcarLeida(id: number) {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
    try {
      await api.put(`/api/notificaciones/${id}/leer`, {});
    } catch {
      /* no bloqueamos la UI si falla */
    }
  }

  return (
    <div className="notif-bell-wrap" ref={wrapRef}>
      <button
        className="notif-bell-btn"
        onClick={() => setOpen((o) => !o)}
        title="Buzón de notificaciones"
      >
        <Bell size={18} />
        {noLeidas > 0 && <span className="notif-bell-badge">{noLeidas}</span>}
      </button>

      {open && (
        <div className="notif-bell-dropdown">
          <div className="notif-bell-header">Buzón</div>
          {notificaciones.length === 0 ? (
            <p className="notif-bell-empty">No tienes notificaciones.</p>
          ) : (
            <ul className="notif-bell-list">
              {notificaciones.map((n) => (
                <li
                  key={n.id}
                  className={`notif-bell-item ${n.leida ? "" : "no-leida"}`}
                  onClick={() => marcarLeida(n.id)}
                >
                  <p>{n.mensaje}</p>
                  {n.archivo_respuesta && (
                    <a href="#" onClick={(event) => { event.preventDefault(); event.stopPropagation(); void downloadApiFile(n.archivo_respuesta!).catch((error: unknown) => window.alert(error instanceof Error ? error.message : "No se pudo descargar.")); }}
                      className="notif-bell-archivo"
                    >
                      <Paperclip size={12} /> Descargar archivo
                    </a>
                  )}
                  <span className="notif-bell-fecha">
                    {new Date(n.creado_en).toLocaleString("es-PE")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
