# DH & DM Maquinarias — versión 2.0.0

## Cambios de esta versión

- El globo de sugerencias/reclamos está encima del de Mi cotización, sin superponerse, también en móvil.
- Las promociones destacadas son la portada del inicio: imagen grande, título, vigencia, botones y selector de promociones.
- La portada cambia cada **6 segundos** cuando hay al menos dos promociones destacadas. Tiene controles anterior/siguiente y pausa; se detiene al pasar el cursor o usar el teclado dentro del carrusel. Respeta la preferencia de movimiento reducido del dispositivo.
- Se retiró la promoción secundaria que acompañaba al tablón de anuncios.
- La edición de contenidos tiene **Ampliar · tamaño real**, con vistas de escritorio (1200 px) y móvil (390 px), sin guardar el borrador. Usa los estilos públicos a escala 1:1; omite encabezado, pie y elementos relacionados. En promociones usa el mismo componente de la portada.
- Importación, plantillas y exportación **.xlsx** para las tablas editables, con vista previa, asignación de columnas, validación y omisión de duplicados. Auditoría, papelera y notificaciones tienen exportación. Estadísticas permite descargar el informe calculado.
- Tags privados de nombres repetidos en las listas y formularios del panel. Dos repuestos con distinto código pueden conservar el mismo nombre.
- Versión del panel y del paquete: **2.0.0**.

Esta entrega modifica los archivos del proyecto. No publica automáticamente el dominio ni modifica tu repositorio remoto.

## Actualizar tu copia local — PowerShell

Detén las terminales de Vite y PHP con **Ctrl+C**. Descarga `DH-DM-fuentes-2.0.0.zip` a Descargas. Los archivos del ZIP están en la raíz, sin carpeta adicional.

### 1. Respaldar

El respaldo incluye tus entornos, base SQLite, configuración PHP y archivos subidos. No copia dependencias ni resultados de compilación.

```powershell
Set-Location -LiteralPath 'D:\ENZO\TEC COMPANY\DH-DM-Maquinarias-Web'
$proyectoV2 = (Get-Location).Path
$respaldoV2 = Join-Path (Split-Path $proyectoV2 -Parent) ('DH-DM-respaldo-antes-v2-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $respaldoV2 -ErrorAction Stop | Out-Null
Get-ChildItem -LiteralPath $proyectoV2 -Force |
    Where-Object { $_.Name -notin @('.git', 'node_modules', 'dist', 'release') } |
    Copy-Item -Destination $respaldoV2 -Recurse -Force -ErrorAction Stop
Write-Host ('Respaldo guardado en: ' + $respaldoV2)
git status --short
git switch -c version-2
if ($LASTEXITCODE -ne 0) { throw 'No se creó la rama. Revisa si version-2 ya existe antes de continuar.' }
```

### 2. Extraer y copiar fuentes

El paquete excluye `.git`, entornos privados, `config.local.php`, bases de datos, archivos de clientes y dependencias. Copiarlo sobre el proyecto conserva esos datos existentes. No borres la carpeta del proyecto ni el backend para hacer la actualización.

```powershell
$zipV2 = Join-Path $env:USERPROFILE 'Downloads\DH-DM-fuentes-2.0.0.zip'
if (-not (Test-Path -LiteralPath $zipV2)) { throw ('No se encontró: ' + $zipV2) }
$extraccionV2 = Join-Path $env:TEMP ('DH-DM-v2-' + [guid]::NewGuid().ToString('N'))
Expand-Archive -LiteralPath $zipV2 -DestinationPath $extraccionV2 -ErrorAction Stop
if (-not (Test-Path -LiteralPath (Join-Path $extraccionV2 'package.json'))) { throw 'El ZIP no tiene la estructura esperada.' }
Get-ChildItem -LiteralPath $extraccionV2 -Force |
    Copy-Item -Destination $proyectoV2 -Recurse -Force -ErrorAction Stop
Set-Location -LiteralPath $proyectoV2
npm ci
if ($LASTEXITCODE -ne 0) { throw 'Falló la instalación de dependencias.' }
npm run lint
if ($LASTEXITCODE -ne 0) { throw 'Lint encontró errores.' }
npm run typecheck
if ($LASTEXITCODE -ne 0) { throw 'TypeScript encontró errores.' }
```

La versión 2 no añade tablas ni necesita borrar o volver a sembrar tu base. Si vienes de la instalación 1.6.1 ya preparada, conserva la base y el owner actuales. Para instalar desde cero, sigue **LOCAL.md**.

### 3. Arrancar localmente

Primera terminal PowerShell:

```powershell
Set-Location -LiteralPath 'D:\ENZO\TEC COMPANY\DH-DM-Maquinarias-Web'
php -S localhost:8000 -t .\backend-php .\backend-php\router.php
```

Segunda terminal PowerShell:

```powershell
Set-Location -LiteralPath 'D:\ENZO\TEC COMPANY\DH-DM-Maquinarias-Web'
npm run dev -- --host localhost --port 5173 --strictPort
```

Abre **http://localhost:5173/**. El archivo `.env.development.local` debe indicar `VITE_API_URL=http://localhost:8000`; la configuración pública de producción sigue apuntando a **https://dh-dm-maquinarias.com**.

### 4. Comprobar y subir a GitHub

En el panel, marca al menos **dos promociones como destacadas** para ver la rotación. Si no hay ninguna destacada, el inicio utiliza la presentación de la empresa. No se cambia automáticamente el estado de tus promociones existentes.

Prueba la vista ampliada y la carga de un Excel pequeño con la plantilla de Repuestos. Revisa **EXCEL.md** para el resto de las tablas.

```powershell
Set-Location -LiteralPath 'D:\ENZO\TEC COMPANY\DH-DM-Maquinarias-Web'
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación.' }
git diff --stat
git status --short
git add .
git diff --cached --stat
git commit -m "Version 2: portada de promociones, Excel y vistas previas"
if ($LASTEXITCODE -ne 0) { throw 'No se creó el commit.' }
git push -u origin version-2
if ($LASTEXITCODE -ne 0) { throw 'No se subió la rama.' }
```

El push normal conserva el historial. Cuando revises la versión localmente, puedes integrar la rama desde GitHub y continuar con cambios pequeños.

## Desplegar

Sigue **DEPLOY-WEBUZO.md**. `npm run release` genera la API y el frontend juntos en `release/public_html/`; ahora la API incluye `excel.php`. Conserva `api/config.local.php`, `api/uploads/`, `api/private/` y la base MySQL del hosting. No basta con subir únicamente el frontend: Excel necesita la API de la versión 2.

## Validación de la entrega

Los resultados de las pruebas están en `tests/resultados/`. Se verificaron permisos e importaciones con SQLite y MariaDB, además del recorrido en navegador de portada, globos, borradores y Excel. La comprobación del hosting real queda pendiente de tu despliegue.
