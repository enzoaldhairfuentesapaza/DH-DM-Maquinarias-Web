import "./Footer.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock10Icon } from "lucide-react";
import LegalModal from "../components/shared/LegalModal";

export default function Footer() {
  const [modal, setModal] = useState<"terms" | "privacy" | null>(null);
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-col">
          <img
            src="/Logo.jpg"
            className="footer-logo"
            alt="DH & DM Maquinarias"
          />
          <p>
            Especialistas en repuestos y maquinaria pesada. Calidad, respaldo y
            disponibilidad para tu operación.
          </p>
          <div className="footer-social">
            <a href="#" aria-label="Facebook">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
              >
                <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z" />
              </svg>
            </a>
            <a href="#" aria-label="Instagram">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
              >
                <path d="M12 2c2.72 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.22.6 1.77 1.16.55.55.9 1.11 1.16 1.77.25.64.42 1.37.47 2.43C22 8.94 22 9.28 22 12s-.01 3.06-.06 4.12c-.05 1.06-.22 1.79-.47 2.43a4.9 4.9 0 0 1-1.16 1.77c-.55.55-1.11.9-1.77 1.16-.64.25-1.37.42-2.43.47C15.06 21.99 14.72 22 12 22s-3.06-.01-4.12-.06c-1.06-.05-1.79-.22-2.43-.47a4.9 4.9 0 0 1-1.77-1.16 4.9 4.9 0 0 1-1.16-1.77c-.25-.64-.42-1.37-.47-2.43C2 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.06.22-1.79.47-2.43.26-.66.6-1.22 1.16-1.77A4.9 4.9 0 0 1 5.46.52C6.1.27 6.82.1 7.88.06 8.94 0 9.28 0 12 0zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.2-8.4a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4z" />
              </svg>
            </a>
            <a
              href="https://wa.me/51942203833"
              aria-label="WhatsApp"
              target="_blank"
              rel="noreferrer"
            >
              <svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor">
                <path d="M16.04 3C9.4 3 4 8.36 4 15c0 2.34.66 4.53 1.8 6.4L4 29l7.8-1.75A11.9 11.9 0 0 0 16.04 27C22.68 27 28 21.64 28 15S22.68 3 16.04 3zm0 21.6a9.5 9.5 0 0 1-4.85-1.33l-.35-.2-4.63 1.04 1.06-4.5-.23-.37A9.55 9.55 0 1 1 16.04 24.6zm5.4-7.1c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.93 1.16-.17.2-.34.22-.63.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.34.44-.5.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.66-1.6-.9-2.2-.24-.57-.48-.5-.66-.5h-.56c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35z"/>
              </svg>
            </a>
            <a href="#" aria-label="LinkedIn">
              in
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Enlaces</h4>
          <ul>
            <li>
              <Link to="/">Inicio</Link>
            </li>
            <li>
              <Link to="/nosotros">Nosotros</Link>
            </li>
            <li>
              <Link to="/maquinaria">Maquinaria</Link>
            </li>
            <li>
              <Link to="/repuestos">Repuestos</Link>
            </li>
            <li>
              <Link to="/novedades">Novedades</Link>
            </li>
            <li>
              <Link to="/blog">Blog</Link>
            </li>
            <li>
              <Link to="/promociones">Promociones</Link>
            </li>
            <li>
              <Link to="/contacto">Contacto</Link>
            </li>
            <li>
              <Link to="/contacto#sedes">Nuestras sedes</Link>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Sectores</h4>
          <ul>
            <li>
              <a href="#">Minería</a>
            </li>
            <li>
              <a href="#">Construcción</a>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Contacto</h4>
          <ul className="footer-contact">
            <li>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Jr.+Apurimac+1067%2C+Juliaca%2C+Puno%2C+Peru"
                target="_blank"
                rel="noreferrer"
              >
                <MapPin size={16} /> Sede Principal: Jr. Apurímac 1067, Juliaca,
                Puno
              </a>
            </li>
            <li>
              <Clock10Icon size={16} /> Atención: Lunes a Viernes 8am-7pm ·
              Sábados 8am-5pm
            </li>
            <li>
              <a href="tel:+51942203833" target="_blank" rel="noreferrer">
                <Phone size={16} /> +51 942 203 833
              </a>
              <a href="tel:+51942203833" target="_blank" rel="noreferrer">
                <Phone size={16} /> +51 977 272 747
              </a>
            </li>
            <li>
              <a
                href="mailto:info@dhdmmaquinarias.com"
                target="_blank"
                rel="noreferrer"
              >
                <Mail size={16} /> info@dhdmmaquinarias.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 DH & DM Maquinarias SAC. Todos los derechos reservados.</p>
        <div className="footer-legal">
          <button className="footer-link" onClick={() => setModal("terms")}>
            Términos
          </button>

          <button className="footer-link" onClick={() => setModal("privacy")}>
            Privacidad
          </button>
        </div>
      </div>
      <LegalModal type={modal} onClose={() => setModal(null)} />
    </footer>
  );
}
