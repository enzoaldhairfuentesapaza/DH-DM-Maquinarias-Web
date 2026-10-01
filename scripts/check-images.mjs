import { readFile, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

const publicDir = resolve('public');
const sources = ['blog.json', 'maquinaria.json', 'novedades.json', 'promociones.json', 'repuestos.json', 'maquinaria-imagenes-ejemplo.json'];
const paths = new Set();
let withoutPhoto = 0;
const errors = [];
for (const source of sources) {
  const rows = JSON.parse(await readFile(`backend-php/seed_data/${source}`, 'utf8'));
  for (const row of rows) {
    const image = row.imagen;
    if (!image) {
      if (source === 'repuestos.json') withoutPhoto++;
      else errors.push(`${source}: falta imagen para ${row.titulo ?? row.nombre}`);
      continue;
    }
    if (!image.startsWith('/') || image.startsWith('//')) {
      errors.push(`${source}: imagen no local ${image}`);
      continue;
    }
    paths.add(image);
  }
}
for (const image of paths) {
  const file = resolve(publicDir, image.slice(1));
  if (!file.startsWith(publicDir + sep)) {
    errors.push(`Ruta fuera de public/: ${image}`);
    continue;
  }
  try {
    if (!(await stat(file)).isFile()) errors.push(`No es un archivo: ${image}`);
  } catch {
    errors.push(`Archivo inexistente: ${image}`);
  }
}
if (errors.length) {
  throw new Error(`Imágenes iniciales inválidas:\n${errors.join('\n')}`);
}
console.log(`${paths.size} imágenes locales verificadas. ${withoutPhoto} repuestos sin fotografía original; conservan el estado sin foto.`);
