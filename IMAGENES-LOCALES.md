# Imágenes locales — corrección de 1.6.1

## Qué se corrigió

Los JSON iniciales de blog y maquinaria contenían imagen vacía. Las fotos del blog y de PC200-8 ya estaban en public/, pero se asignaban después con utilidades PHP. Otras fotos dependían de Wikimedia en el navegador.

Ahora las rutas están completas en seed_data/ y src/data/. Las fotos externas de referencia se incluyen como archivos locales de 1280 píxeles, con autores/licencias en public/creditos-imagenes.html y public/maquinaria/referencias/creditos.json. El sitio identifica esas fotos como referenciales. No se retocaron las fotografías.

## Aplicar a tu copia actual

Extrae el CONTENIDO del ZIP de esta corrección sobre la raíz del repositorio y acepta reemplazar archivos. El paquete no contiene .git, credenciales ni base de datos. Conserva backend-php/config.local.php, hdm.db y tus uploads.

Desde PowerShell, detén antes la API con Ctrl+C y ejecuta:

```powershell
Set-Location -LiteralPath 'D:\ENZO\TEC COMPANY\DH-DM-Maquinarias-Web'
if (Test-Path '.\backend-php\hdm.db') {
    $respaldoImagenes = Join-Path (Split-Path -Parent (Get-Location).Path) ('hdm-antes-imagenes-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.db')
    Copy-Item -LiteralPath '.\backend-php\hdm.db' -Destination $respaldoImagenes
}
php .\backend-php\repair_seed_images.php
if ($LASTEXITCODE -ne 0) { throw 'Falló la reparación de imágenes.' }
npm run check:images
if ($LASTEXITCODE -ne 0) { throw 'Hay archivos de imágenes faltantes.' }
npm run lint
if ($LASTEXITCODE -ne 0) { throw 'Lint encontró errores.' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación.' }
```

No cambiaron dependencias: no necesitas npm ci para esta corrección si ya las instalaste. Reinicia la API y React siguiendo LOCAL.md y recarga el navegador. Si usas una base configurada en otra ruta, respalda esa base en lugar del hdm.db predeterminado.

## Comportamiento de la reparación

- Solo reconoce registros de muestra por sus títulos/nombres originales.
- Completa NULL y cadenas vacías; conserva URLs personalizadas no vacías.
- Cambia únicamente los enlaces antiguos de Wikimedia identificados en los scripts originales por sus archivos locales.
- No inserta productos, no elimina registros y puede ejecutarse varias veces.
- load_seed_data.php la ejecuta automáticamente: una instalación nueva ya queda lista.
- add_blog_images.php y add_missing_images.php quedan como entradas de compatibilidad a la reparación segura.
- add_placeholder_maquinaria.php sigue siendo opcional; sus siete fotos también están incluidas y no descarga nada. No lo ejecutes solo para arreglar imágenes de tu inventario.

## Asignaciones del blog

| Artículo | Ruta |
|---|---|
| Cómo elegir el filtro hidráulico correcto para tu equipo | /blogs/blog5.jpg |
| Mantenimiento preventivo: ahorra en reparaciones | /blogs/blog4.jpg |
| Repuestos originales vs. alternativos: ventajas y diferencias | /blogs/blog3.jpg |
| Filtros HDM-Filter: nuestra línea propia de filtración | /blogs/blog3.jpg |
| Señales de que tu filtro de combustible necesita cambio | /blogs/blog2.jpg |
| Tren de rodaje: cómo alargar su vida útil | /blogs/blog1.jpg |

## Asignaciones de maquinaria

| Máquina de muestra | Ruta |
|---|---|
| Excavadora Hidráulica 320D | /maquinaria/referencias/cat-320d.jpg |
| Excavadora PC200-8 | /maquinaria/pc200-8.jpg |
| Excavadora ZX210 | /maquinaria/referencias/hitachi-referencial.jpg |

Si cambiaste el título/nombre de un registro de muestra, la reparación no lo identifica; asigna la foto desde el panel. Las fotos externas son referencias y no documentación del estado de tus unidades reales.

## Resultado de la revisión

- Blog: seis artículos con cinco fotos locales (dos artículos comparten la foto prevista por el script original).
- Maquinaria inicial: tres registros con foto local.
- Ejemplos opcionales: siete fotos locales adicionales.
- Novedades/promociones: sus rutas iniciales ya existían.
- Repuestos: 105 registros con foto y 4.697 sin fotografía original; todas las rutas no vacías existen. No se asignaron fotos ajenas a esos productos.
- npm run check:images comprueba las rutas iniciales y se ejecuta también al compilar.
- Las fotos y rutas se probaron en navegador bloqueando solicitudes externas.

## Subir el cambio a GitHub

Después de probar:

```powershell
git status --short
git add -A
git --no-pager diff --cached --stat
git commit -m "Incluye imágenes locales y repara las rutas iniciales"
git push origin main
```

Revisa lo que estás indexando antes del commit. Para actualizar el hosting, recompila con DEPLOY-WEBUZO.md y conserva tu base/archivos privados.
