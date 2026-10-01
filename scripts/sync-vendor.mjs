import { copyFile, mkdir } from 'node:fs/promises';
await mkdir('public/vendor', { recursive: true });
await copyFile('node_modules/jspdf/dist/jspdf.umd.min.js', 'public/vendor/jspdf.umd.min.js');
await copyFile('node_modules/jspdf/LICENSE', 'public/vendor/jspdf-LICENSE.txt');
