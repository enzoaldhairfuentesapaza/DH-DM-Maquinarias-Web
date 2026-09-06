import "./FloatingContacts.css";
import { Phone, X } from "lucide-react";
import ChatBot from "./ChatBot";
import { useState } from "react";

type ActiveFab = "chat" | "whatsapp" | "phone" | null;

export default function FloatingContacts() {
  const [active, setActive] = useState<ActiveFab>(null);

  const toggle = (fab: ActiveFab) => {
    setActive((current) => (current === fab ? null : fab));
  };

  return (
    <>
      {active === "chat" && <ChatBot onClose={() => setActive(null)} />}

      <div className="floating-contacts">
        <div className="fab-row">
          {active === "chat" && (
            <div className="fab-popover">
              <p>Chatea con nosotros</p>
              <span>DoMi, tu asistente virtual</span>
            </div>
          )}
          <button
            className={`fab fab-chat ${active === "chat" ? "is-active" : ""}`}
            onClick={() => toggle("chat")}
            title="Chat bot"
          >
            {active === "chat" ? (
              <X size={24} />
            ) : (
              <img
                src="/ia-mascota.png"
                alt="Asistente IA"
                className="fab-chat-icon"
              />
            )}
          </button>
        </div>

        <div className="fab-row">
          {active === "whatsapp" && (
            <div className="fab-popover">
              <p>Escríbenos por WhatsApp</p>
              <a
                href="https://wa.me/51942203833"
                target="_blank"
                rel="noreferrer"
                onClick={() => setActive(null)}
              >
                +51 942 203 833 +51 977 272 747
              </a>
            </div>
          )}
          <button
            className={`fab fab-whatsapp ${active === "whatsapp" ? "is-active" : ""}`}
            onClick={() => toggle("whatsapp")}
            title="WhatsApp"
          >
            <svg viewBox="0 0 32 32" width="26" height="26" fill="currentColor">
              <path d="M16.04 3C9.4 3 4 8.36 4 15c0 2.34.66 4.53 1.8 6.4L4 29l7.8-1.75A11.9 11.9 0 0 0 16.04 27C22.68 27 28 21.64 28 15S22.68 3 16.04 3zm0 21.6a9.5 9.5 0 0 1-4.85-1.33l-.35-.2-4.63 1.04 1.06-4.5-.23-.37A9.55 9.55 0 1 1 16.04 24.6zm5.4-7.1c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.93 1.16-.17.2-.34.22-.63.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.34.44-.5.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.66-1.6-.9-2.2-.24-.57-.48-.5-.66-.5h-.56c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35z" />
            </svg>
          </button>
        </div>

        <div className="fab-row">
          {active === "phone" && (
            <div className="fab-popover">
              <p>Llámanos</p>
              <a href="tel:+51942203833">+51 942 203 833</a>
            </div>
          )}
          <button
            className={`fab fab-phone ${active === "phone" ? "is-active" : ""}`}
            onClick={() => toggle("phone")}
            title="Llamar"
          >
            <Phone size={22} />
          </button>
        </div>
      </div>
    </>
  );
}
