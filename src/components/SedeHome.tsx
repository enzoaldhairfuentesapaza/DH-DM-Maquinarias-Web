import "./SedeHome.css";
import { MapPin, Clock, Navigation } from "lucide-react";
import { Link } from "react-router-dom";

const MAPS_QUERY_URL =
  "https://www.google.com/maps/search/?api=1&query=Jr.+Apurimac+1067%2C+Juliaca%2C+Puno%2C+Peru";
const MAPS_EMBED_URL =
  "https://www.google.com/maps?q=Jr.+Apurimac+1067,+Juliaca,+Puno,+Peru&output=embed";

export default function SedeHome() {
  return (
    <section className="sede-home">
      <div className="sede-home-inner">
        <div className="sede-home-text">
          <span className="tag">Encuéntranos</span>
          <h2>
            Nuestra <span>sede principal</span>
          </h2>
          <p>
            Visítanos y conoce de cerca nuestra maquinaria y repuestos, o
            coordina tu próxima compra directamente con nuestro equipo.
          </p>

          <div className="sede-home-item">
            <MapPin size={20} />
            <div>
              <strong>Dirección</strong>
              <span>Jr. Apurímac 1067, Juliaca, Puno</span>
            </div>
          </div>

          <div className="sede-home-item">
            <Clock size={20} />
            <div>
              <strong>Horario de atención</strong>
              <span>Lun. a Vie. 8:00 am – 7:00 pm · Sáb. 8:00 am – 5:00 pm</span>
            </div>
          </div>

          <div className="sede-home-actions">
            <a
              className="btn-primary"
              href={MAPS_QUERY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation size={16} /> Cómo llegar
            </a>
            <Link className="btn-secondary-dark" to="/contacto#sedes">
              Ver más en Contacto
            </Link>
          </div>
        </div>

        <div className="sede-home-map">
          <iframe
            title="Ubicación de nuestra sede en Juliaca"
            src={MAPS_EMBED_URL}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}
