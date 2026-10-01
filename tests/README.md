# Comprobaciones

Las pruebas Python usan una base SQLite temporal y la eliminan al terminar. No apuntes `HDM_TEST_CONFIG` a tu base local de trabajo o de producción; esa opción solo admite una base dedicada con `app_env=test`.

PowerShell, desde la carpeta del proyecto:

```powershell
npm run lint
if ($LASTEXITCODE -ne 0) { throw 'Falló lint.' }
npm run typecheck
if ($LASTEXITCODE -ne 0) { throw 'Falló TypeScript.' }
php .\tests\jwt.php
if ($LASTEXITCODE -ne 0) { throw 'Falló JWT.' }
py -3 .\tests\api-smoke.py
if ($LASTEXITCODE -ne 0) { throw 'Falló la API.' }
py -3 .\tests\excel-smoke.py
if ($LASTEXITCODE -ne 0) { throw 'Falló Excel.' }
py -3 .\tests\seed-images.py
if ($LASTEXITCODE -ne 0) { throw 'Fallaron los datos/imágenes.' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación.' }
```

`PHP_BIN` permite seleccionar otra ruta de PHP. `api-smoke.py` cubre 61 comprobaciones de autenticación, permisos, archivos, cotizaciones y configuración. `excel-smoke.py` cubre 71 comprobaciones del Centro de Excel, tipos, duplicados, atomicidad y exportación segura. Se ejecutó también contra MariaDB en una base desechable; los resultados están en `resultados/excel-mariadb.json`.

`resultados/version-2-navegador.json` registra el recorrido de desarrollo de la nueva portada, controles, globos, borradores a tamaño real, exportación de los 4802 repuestos de muestra, importación de dos filas, ceros iniciales, tags privados y rechazo de fórmulas/stock negativo. `resultados/version-2-apache-navegador.json` registra el recorrido sobre la aplicación compilada, servida por Apache/PHP, incluyendo descarga de estadísticas. Estos recorridos se ejecutaron con Chromium automatizado durante la preparación de la entrega; no requieren instalar un navegador de pruebas para ejecutar las pruebas Python.

Los demás resultados corresponden a la revisión anterior y se conservan como referencia. Los datos de los tests son ficticios y las cuentas de prueba se crean solamente en sus bases desechables.
