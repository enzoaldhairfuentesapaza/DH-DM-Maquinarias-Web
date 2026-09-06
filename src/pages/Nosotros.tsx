import "./pages.css";
import { Link } from "react-router-dom";
import AlbumSectores from "../components/AlbumSectores";
import {
  ShieldCheck,
  Users,
  FileCheck2,
  Leaf,
  HeartHandshake,
  Target,
  Eye,
  Award,
  Handshake,
  Recycle,
  BadgeCheck,
} from "lucide-react";

export default function Nosotros() {
  return (
    <>
      <div className="page-banner page-banner-nosotros">
        <div className="page-banner-inner">
          <div className="breadcrumb">
            <Link to="/">Inicio</Link> / <span>Nosotros</span>
          </div>
          <h1>
            Conoce <span>DH & DM Maquinarias</span>
          </h1>
          <p>
            Más de 8 años abasteciendo al mundo de las maquinarias, con
            soluciones en repuestos y equipos para los sectores de
            construcción, transporte e industria, con atención personalizada
            y compromiso con nuestros clientes.
          </p>
        </div>
      </div>

      <section id="acerca" className="nosotros-section">
        <div className="nosotros-section-inner">
          <span className="tag">Acerca de DH & DM Maquinarias</span>
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: "10px 0 16px" }}>
            Quiénes somos
          </h2>
          <p
            style={{
              color: "#555",
              maxWidth: 780,
              lineHeight: 1.7,
              marginBottom: 10,
            }}
          >
            DH & DM Maquinarias S.A.C. es una empresa peruana especializada en
            la comercialización de maquinaria pesada y repuestos para los
            sectores de construcción, transporte e industria. Ofrecemos
            productos de calidad, atención personalizada y asesoría comercial
            para ayudar a nuestros clientes a encontrar la mejor solución
            para sus proyectos. Además, gestionamos la importación de
            repuestos originales bajo pedido para satisfacer necesidades
            específicas. Contamos con amplio stock en nuestros almacenes para
            garantizar la disponibilidad inmediata.
          </p>

          <div className="nosotros-grid-3">
            <div className="info-card">
              <Target size={26} color="#b8860b" />
              <h4 style={{ marginTop: 12 }}>Misión</h4>
              <p>
                Brindar maquinaria pesada y repuestos de calidad, ofreciendo una
                atención confiable, soluciones confiables y entregas oportunas que
                contribuyan al éxito y continuidad de las operaciones de nuestros
                clientes.
              </p>
            </div>
            <div className="info-card">
              <Eye size={26} color="#b8860b" />
              <h4 style={{ marginTop: 12 }}>Visión</h4>
              <p>
                Ser una empresa reconocida a nivel nacional por la calidad de
                nuestros productos, la confianza de nuestros clientes y nuestro
                compromiso con la excelencia en la comercialización de maquinaria
                pesada y repuestos.
              </p>
            </div>
            <div className="info-card">
              <Award size={26} color="#b8860b" />
              <h4 style={{ marginTop: 12 }}>Compromiso</h4>
              <p>
                Nos esforzamos por brindar una atención de calidad, ofreciendo
                maquinaria y repuestos confiables, con responsabilidad y
                puntualidad en cada pedido.
              </p>
            </div>
          </div>

          <div className="valores-grid">
            <div className="valor-item">
              <div className="valor-icon">
                <BadgeCheck size={24} />
              </div>
              <h5>Calidad</h5>
              <p>Productos certificados y garantizados</p>
            </div>
            <div className="valor-item">
              <div className="valor-icon">
                <Handshake size={24} />
              </div>
              <h5>Confianza</h5>
              <p>Relaciones a largo plazo con nuestros clientes</p>
            </div>
            <div className="valor-item">
              <div className="valor-icon">
                <HeartHandshake size={24} />
              </div>
              <h5>Compromiso</h5>
              <p>Respuesta rápida ante cada requerimiento</p>
            </div>
            <div className="valor-item">
              <div className="valor-icon">
                <ShieldCheck size={24} />
              </div>
              <h5>Seguridad</h5>
              <p>Cumplimiento de normativas y protocolos</p>
            </div>
          </div>
        </div>
      </section>

      <div id="sectores">
        <AlbumSectores />
      </div>

      <section id="responsabilidad" className="nosotros-section">
        <div className="nosotros-section-inner">
          <span className="tag">Compromiso social</span>
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: "10px 0 16px" }}>
            Responsabilidad social
          </h2>
          <p
            style={{
              color: "#555",
              maxWidth: 780,
              lineHeight: 1.7,
              marginBottom: 26,
            }}
          >
            Impulsamos iniciativas que generan valor para nuestros
            colaboradores, la comunidad y el medio ambiente.{" "}
            <em>(Contenido de referencia — a completar.)</em>
          </p>
          <div className="nosotros-grid-3">
            <div className="info-card">
              <Leaf size={24} color="#3a8f5f" />
              <h4 style={{ marginTop: 12 }}>Cuidado ambiental</h4>
              <p>
                Programas de disposición responsable de residuos y aceites
                usados.
              </p>
            </div>
            <div className="info-card">
              <Users size={24} color="#3a8f5f" />
              <h4 style={{ marginTop: 12 }}>Desarrollo local</h4>
              <p>
                Generación de empleo y capacitación técnica para jóvenes de la
                comunidad.
              </p>
            </div>
            <div className="info-card">
              <Recycle size={24} color="#3a8f5f" />
              <h4 style={{ marginTop: 12 }}>Economía circular</h4>
              <p>
                Reacondicionamiento de maquinaria y componentes para extender su
                vida útil.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="trabaje" className="nosotros-section">
        <div className="nosotros-section-inner">
          <span className="tag">Únete al equipo</span>
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: "10px 0 16px" }}>
            Trabaje con nosotros
          </h2>
          <p
            style={{
              color: "#555",
              maxWidth: 780,
              lineHeight: 1.7,
              marginBottom: 20,
            }}
          >
            ¿Te apasiona el sector de la maquinaria pesada y buscas crecer
            profesionalmente? En DH & DM Maquinarias S.A.C. estamos en constante
            búsqueda de personas comprometidas, responsables y con ganas de
            aportar a nuestro equipo. Si deseas formar parte de nuestra empresa,
            envíanos tu CV y estaremos encantados de conocerte.
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link
              to="/contacto"
              className="btn-primary"
              style={{ display: "inline-block" }}
            >
              Enviar mi CV
            </Link>
            <Link
              to="/contacto"
              className="btn-outline-sm"
              style={{ display: "inline-block" }}
            >
              Contáctanos
            </Link>
          </div>
        </div>
      </section>

      <section id="politicas" className="nosotros-section">
        <div className="nosotros-section-inner">
          <span className="tag">Gestión de calidad</span>
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: "10px 0 16px" }}>
            Políticas integrales
          </h2>
          <p
            style={{
              color: "#555",
              maxWidth: 780,
              lineHeight: 1.7,
              marginBottom: 20,
            }}
          >
            Nuestras políticas de calidad, seguridad y medio ambiente guían cada
            una de nuestras operaciones.{" "}
            <em>(Contenido de referencia — a completar.)</em>
          </p>
          <div className="nosotros-grid-3">
            <div className="info-card">
              <FileCheck2 size={24} color="#b8860b" />
              <h4 style={{ marginTop: 12 }}>Política de calidad</h4>
              <p>
                Procesos certificados que garantizan la trazabilidad de cada
                producto.
              </p>
            </div>
            <div className="info-card">
              <ShieldCheck size={24} color="#b8860b" />
              <h4 style={{ marginTop: 12 }}>Seguridad y salud</h4>
              <p>
                Protocolos de prevención de riesgos en todas nuestras sedes.
              </p>
            </div>
            <div className="info-card">
              <Leaf size={24} color="#b8860b" />
              <h4 style={{ marginTop: 12 }}>Medio ambiente</h4>
              <p>Gestión responsable de residuos y consumo de recursos.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="cumplimiento" className="nosotros-section">
        <div className="nosotros-section-inner">
          <span className="tag">Ética empresarial</span>
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: "10px 0 16px" }}>
            Sistema de cumplimiento
          </h2>
          <p style={{ color: "#555", maxWidth: 780, lineHeight: 1.7 }}>
            Contamos con un sistema de cumplimiento normativo que promueve la
            transparencia, la prevención del fraude y el respeto a la
            legislación vigente en todas nuestras operaciones.{" "}
            <em>(Contenido de referencia — a completar.)</em>
          </p>
        </div>
      </section>
    </>
  );
}