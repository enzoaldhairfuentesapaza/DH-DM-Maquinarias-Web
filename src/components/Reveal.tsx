import { useEffect, useRef, useState, ReactNode } from "react";
import "./Reveal.css";

interface RevealProps {
  children: ReactNode;
  /** Retraso en ms antes de animar, util para escalonar varios elementos. */
  delay?: number;
  /** Clase extra para el contenedor. */
  className?: string;
  /** Elemento HTML a usar como contenedor (por defecto un div). */
  as?: "div" | "section";
}

/**
 * Envuelve cualquier bloque de la página y lo anima con un clásico
 * "fade + slide up" apenas entra en el viewport al hacer scroll,
 * dando la sensación de que la página "se va construyendo" conforme
 * el usuario baja.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Si el usuario prefiere menos movimiento, mostramos todo directo.
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = as;

  return (
    <Tag
      ref={ref as never}
      className={`reveal-block ${visible ? "reveal-visible" : ""} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </Tag>
  );
}
