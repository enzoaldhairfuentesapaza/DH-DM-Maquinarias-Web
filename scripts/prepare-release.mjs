import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve('release');
await rm(root, { recursive: true, force: true });
await mkdir(`${root}/public_html/api`, { recursive: true });
await cp('dist', `${root}/public_html`, { recursive: true });
const runtime = ['index.php', 'helpers.php', 'crud.php', 'excel.php', 'bienvenida.php', 'cotizador.php', 'db.php', 'jwt.php', 'config.php', 'config.example.php', '.htaccess'];
for (const name of runtime) await cp(`backend-php/${name}`, `${root}/public_html/api/${name}`);
for (const name of ['private', 'uploads']) {
  await mkdir(`${root}/public_html/api/${name}`, { recursive: true });
  await cp(`backend-php/${name}/.htaccess`, `${root}/public_html/api/${name}/.htaccess`);
}
await mkdir(`${root}/mantenimiento/backend-php`, { recursive: true });
for (const name of await readdir('backend-php')) {
  if ((name.endsWith('.php') && name !== 'config.local.php') || name.endsWith('.sql')) await cp(`backend-php/${name}`, `${root}/mantenimiento/backend-php/${name}`);
}
await cp('backend-php/seed_data', `${root}/mantenimiento/backend-php/seed_data`, { recursive: true });
for (const name of ['DEPLOY-WEBUZO.md', 'REVISION-1.6.1.md', 'IMAGENES-LOCALES.md', 'VERSION-2.md', 'EXCEL.md']) await cp(name, `${root}/${name}`);
await writeFile(`${root}/LEEME.txt`, 'Lee DEPLOY-WEBUZO.md antes de subir. Solo public_html/ se publica. Configura api/config.local.php en el servidor. Conserva uploads/, private/ y config.local.php existentes al actualizar. mantenimiento/ se ejecuta por terminal fuera de la web.\n');
console.log('release/ generado: frontend y API, sin cuentas ni datos de desarrollo.');
