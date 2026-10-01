import { useEffect, useRef, useState } from "react";

/**
 * Input de cantidad editable a mano (ej. escribir "100" directamente) además
 * de los botones +/-. Mantiene un texto local mientras el usuario escribe
 * para no forzar el mínimo en cada tecla, y solo confirma/normaliza el valor
 * final al salir del campo.
 */
export default function QtyInput({
  cantidad,
  onCambiar,
  className = "cart-qty-input",
  min = 1,
  maxDigitos = 4,
}: {
  cantidad: number;
  onCambiar: (valor: number) => void;
  className?: string;
  min?: number;
  maxDigitos?: number;
}) {
  const [texto, setTexto] = useState(String(cantidad));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setTexto(String(cantidad));
    }
  }, [cantidad]);

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      className={className}
      value={texto}
      aria-label="Cantidad"
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const soloNumeros = e.target.value.replace(/\D/g, "").slice(0, maxDigitos);
        setTexto(soloNumeros);
        if (soloNumeros !== "") {
          onCambiar(Math.max(min, parseInt(soloNumeros, 10)));
        }
      }}
      onBlur={() => {
        const valor = texto === "" ? min : Math.max(min, parseInt(texto, 10));
        setTexto(String(valor));
        onCambiar(valor);
      }}
    />
  );
}
