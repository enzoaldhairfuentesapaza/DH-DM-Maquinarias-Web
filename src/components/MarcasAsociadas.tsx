import "./MarcasAsociadas.css";

// Marcas reales con las que trabaja HDM, según el catálogo de productos.
const marcas = [
  "CTP",
  "CAT",
  "HDT",
  "SKF",
  "FAG",
  "NTN",
  "TIMKEN",
  "IPD",
  "NOK",
  "HANDOK",
  "DHDM",
];

// Logos disponibles para algunas marcas (deben existir en public/marcas/).
// Si una marca no tiene logo aquí, se muestra como texto (comportamiento anterior).
const marcaLogos: Record<string, string> = {
  CAT: "/marcas/CAT.jpg",
  CTP: "/marcas/CTP.jpg",
  IPD: "/marcas/IPD.png",
  FAG: "/marcas/FAG.jpg",
  HANDOK: "/marcas/HANDOK.jpg",
  TIMKEN: "/marcas/TIMKEN.png",
  NOK: "/marcas/NOK.png",
  NTN: "/marcas/NTN.png",
  SKF: "/marcas/SKF.png",
};

// Algunos logos vienen con mucho margen en blanco alrededor del isotipo
// (insignias circulares/diamante), así que se ven más chicos que uno como
// TIMKEN que ocupa todo el recuadro. Se compensa con una altura mayor.
const marcaLogoAltura: Record<string, number> = {
  CTP: 58,
  IPD: 58,
  HANDOK: 54,
  NOK: 46,
};

const ALTURA_LOGO_DEFECTO = 34;

export default function MarcasAsociadas() {
  // Duplicamos la lista para lograr un carrusel continuo (loop infinito)
  const marcasLoop = [...marcas, ...marcas];

  return (
    <section className="marcas">
      <div className="section-wrap marcas-wrap">
        <p className="marcas-label">
          Trabajamos con las mejores marcas del mercado
        </p>
        <div className="marcas-track-mask">
          <div className="marcas-track">
            {marcasLoop.map((m, i) => {
              const logo = marcaLogos[m];
              const altura = marcaLogoAltura[m] ?? ALTURA_LOGO_DEFECTO;
              return (
                <div className="marca-item" key={`${m}-${i}`}>
                  {logo ? (
                    <img
                      src={logo}
                      alt={m}
                      className="marca-logo"
                      style={{ height: altura }}
                    />
                  ) : (
                    m
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
