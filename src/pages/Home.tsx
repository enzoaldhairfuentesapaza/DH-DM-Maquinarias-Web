import Hero from "../components/Hero";
import MarcasAsociadas from "../components/MarcasAsociadas";
import TablonAnuncios from "../components/TablonAnuncios";
import ProductosDestacados from "../components/ProductosDestacados";
import AlbumServicios from "../components/AlbumServicios";
import CardRepuestos from "../components/CardRepuestos";
import AlbumSectores from "../components/AlbumSectores";
import SobreNosotros from "../components/SobreNosotros";
import BlogDestacados from "../components/BlogDestacados";
import MaquinariaDestacada from "../components/MaquinariaDestacada";

export default function Home() {
  return (
    <>
      <Hero />
      <MarcasAsociadas />
      <TablonAnuncios />

      <ProductosDestacados />
      <CardRepuestos />
      <MaquinariaDestacada />
      <AlbumSectores />
      <AlbumServicios />
      <BlogDestacados />
      <SobreNosotros />
    </>
  );
}
