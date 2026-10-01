import Hero from "../components/Hero";
import MarcasAsociadas from "../components/MarcasAsociadas";
import TablonAnuncios from "../components/TablonAnuncios";
import PromocionesDestacadas from "../components/PromocionesDestacadas";
import SedeHome from "../components/SedeHome";
import ProductosDestacados from "../components/ProductosDestacados";
import AlbumServicios from "../components/AlbumServicios";
import CardRepuestos from "../components/CardRepuestos";
import AlbumSectores from "../components/AlbumSectores";
import SobreNosotros from "../components/SobreNosotros";
import BlogDestacados from "../components/BlogDestacados";
import MaquinariaDestacada from "../components/MaquinariaDestacada";
import RepuestoDestacado from "../components/RepuestoDestacado";
import Reveal from "../components/Reveal";

export default function Home() {
  return (
    <>
      {/* El hero se muestra de entrada, sin esperar al scroll. */}
      <Hero />

      {/* Las promociones van casi de primero: son de lo primero que el
          cliente debe notar al entrar a la página. */}
      <Reveal>
        <PromocionesDestacadas />
      </Reveal>

      <Reveal>
        <MarcasAsociadas />
      </Reveal>

      <Reveal>
        <TablonAnuncios />
      </Reveal>

      <Reveal>
        <SedeHome />
      </Reveal>

      <Reveal>
        <ProductosDestacados />
      </Reveal>

      <Reveal>
        <CardRepuestos />
      </Reveal>

      <Reveal>
        <MaquinariaDestacada />
      </Reveal>

      <Reveal>
        <RepuestoDestacado />
      </Reveal>

      <Reveal>
        <AlbumSectores />
      </Reveal>

      <Reveal>
        <AlbumServicios />
      </Reveal>

      <Reveal>
        <BlogDestacados />
      </Reveal>

      <Reveal>
        <SobreNosotros />
      </Reveal>
    </>
  );
}
