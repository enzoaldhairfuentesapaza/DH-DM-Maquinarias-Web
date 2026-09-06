import "./ChatBot.css";
import { useState } from "react";
import { Send, X } from "lucide-react";

type Mensaje = { autor: "bot" | "user"; texto: string };

const respuestasRapidas = [
  "¿Tienen repuestos para Caterpillar?",
  "¿Cuál es el tiempo de entrega?",
  "¿Hacen envíos a provincia?",
  "¿Tienen repuestos originales y alternativos?",
  "¿Cómo cotizo un repuesto?",
  "¿Qué marcas de maquinaria manejan?",
  "¿Ofrecen garantía en sus productos?",
  "¿Cuáles son sus formas de pago?",
  "Quiero hablar con un asesor",
];

const respuestasPredeterminadas: Record<string, string> = {
  "¿Tienen repuestos para Caterpillar?":
    "Sí, contamos con stock de repuestos originales y alternativos para Caterpillar. ¿Qué componente necesitas?",
  "¿Cuál es el tiempo de entrega?":
    "El despacho a nivel nacional toma entre 24 y 48 horas dependiendo de tu ubicación.",
  "¿Hacen envíos a provincia?":
    "Sí, despachamos a todo el Perú a través de agencias de transporte. El costo y tiempo depende del destino.",
  "¿Tienen repuestos originales y alternativos?":
    "Sí, manejamos ambas opciones para que elijas según tu presupuesto y necesidad técnica.",
  "¿Cómo cotizo un repuesto?":
    "Puedes agregar los repuestos a tu carrito de cotización desde el catálogo y enviarnos la solicitud, o escribirnos directamente por WhatsApp.",
  "¿Qué marcas de maquinaria manejan?":
    "Trabajamos con las principales marcas del sector: Caterpillar, Komatsu, Volvo, Hitachi, entre otras. Puedes verlas en la sección de marcas asociadas.",
  "¿Ofrecen garantía en sus productos?":
    "Sí, todos nuestros repuestos cuentan con garantía. Las condiciones varían según si es un producto original o alternativo.",
  "¿Cuáles son sus formas de pago?":
    "Aceptamos transferencia bancaria, depósito y pago con tarjeta. Para compras corporativas también manejamos crédito según evaluación.",
  "Quiero hablar con un asesor":
    "Perfecto, puedes escribirnos por WhatsApp o dejar tu número y un asesor te contactará.",
};

export default function ChatBot({ onClose }: { onClose: () => void }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { autor: "bot", texto: "¡Hola! 👋 Soy DoMi, el asistente virtual de HDM Maquinarias. ¿En qué puedo ayudarte?" },
  ]);
  const [input, setInput] = useState("");

  const enviar = (texto: string) => {
    if (!texto.trim()) return;
    const respuesta =
      respuestasPredeterminadas[texto] ||
      "Gracias por tu mensaje. Un asesor te responderá a la brevedad. Mientras tanto, puedes escribirnos por WhatsApp.";

    setMensajes((prev) => [
      ...prev,
      { autor: "user", texto },
      { autor: "bot", texto: respuesta },
    ]);
    setInput("");
  };

  return (
    <div className="chatbot-window">
      <div className="chatbot-header">
        <div className="chatbot-header-info">
          <span className="chatbot-avatar">
            <img src="/ia-mascota.png" alt="Asistente IA" />
          </span>
          <div>
            <strong>Asistente DoMi</strong>
            <span>En línea</span>
          </div>
        </div>
        <button onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="chatbot-body">
        {mensajes.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.autor}`}>
            {m.texto}
          </div>
        ))}

        <div className="chatbot-quick">
          {respuestasRapidas.map((r) => (
            <button key={r} onClick={() => enviar(r)}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <form
        className="chatbot-input"
        onSubmit={(e) => {
          e.preventDefault();
          enviar(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
        />
        <button type="submit">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
