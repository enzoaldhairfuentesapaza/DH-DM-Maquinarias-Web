export default function ImageCredit({ image }: { image?: string | null }) {
  if (!image?.includes('/maquinaria/referencias/')) return null;
  return (
    <small style={{ display: 'block', marginTop: 8 }}>
      <a href="/creditos-imagenes.html">Fotografía referencial · créditos</a>
    </small>
  );
}
