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

## Actualización 2.1

`workflows-2.1.py` comprueba bienvenida editable, preservación de la migración, permisos exclusivos del owner en contactos, separación de solicitudes y exportación/importación por bandeja. Ejecútalo con `py -3 .\tests\workflows-2.1.py` o `python tests/workflows-2.1.py` en la base temporal del test. Los resultados están en `resultados/workflows-2.1-*.json`. El recorrido de navegador incluye avance automático con el cursor encima, pausa, edición de bienvenida, filas de especificaciones, centrado de la vista previa, números de WhatsApp separados, conservación del otro carrito y botones de accesos accesibles.

`PHP_BIN=php python tests/calculadora-contactos-2.1.py` comprueba la separación de Contacto, canales, historial no oficial, PDF privado, registro presencial, vínculo a solicitudes, reintentos sin duplicados, permisos y preservación mediante migración. Usa una base SQLite temporal por defecto. Para MariaDB, `HDM_TEST_CONFIG` debe apuntar a una configuración con `app_env=test` y una base desechable.
