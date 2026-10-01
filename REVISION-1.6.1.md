# Revisión técnica y preparación de despliegue — 1.6.1

Proyecto revisado: README-BACKEND-v1.6.zip. Los cambios se hicieron sobre una copia. La base del ZIP original conserva sus cuentas y registros; no se usó como base de producción ni se incluyó en el paquete de publicación.

## Correcciones realizadas

| Área | Problema encontrado | Cambio |
|---|---|---|
| Apache | Faltaba RewriteEngine y las carpetas de imágenes /repuestos, /maquinaria, /nosotros chocaban con las páginas | .htaccess incluido automáticamente, prioridad para rutas React y exclusión de API |
| Configuración | Guías contradictorias, URL con /api duplicado y secretos de ejemplo | Origen único de API, configuración privada separada, comprobación del secret y de MySQL en producción |
| Mantenimiento | Scripts capaces de modificar datos eran ejecutables por navegador | Guardia CLI en utilidades y bloqueo HTTP; publicación con lista mínima de archivos PHP |
| Autenticación | JWT aceptaba ausencia de expiración, cabecera sin validar y sesiones sobrevivían al cambio de contraseña | HS256 estricto, validación de base64/expiración y versión de token revocable |
| Datos | Registro y formularios confiaban en validación de navegador | Validación de texto, correo, contraseña, documentos, cantidades, stock, estados y formato JSON en PHP |
| Abuso | Login y formularios públicos sin límite | Ventanas por IP: login 20/15 min, registro 10/h, sugerencias y solicitudes 30/h; respuesta 429 y Retry-After |
| CRUD | Actualizar pocos campos podía vaciar los restantes | Actualizaciones conservan campos omitidos; altas usan valores predeterminados de la BD |
| Adjuntos | Respuestas y archivos internos eran visibles sin respetar Mostrar en la página | Directorio privado, descarga con token y comprobación del cliente/rol; ocultación en historial y notificaciones |
| Imágenes | Subidas validadas solo por extensión y URLs inconsistentes | Comprobación de MIME y de imagen real; resolución compartida en catálogo y panel |
| Permisos | Cotizador formal permitía cualquier cuenta desde la API, pero la interfaz excluía cotizadores | API e interfaz admiten solo owner/admin/cotizador; se mantienen restricciones de cada panel |
| Catálogo | Solo se podía acceder a 10 páginas para 4.802 repuestos | Primera/anterior/siguiente/última, estado de página, búsqueda con y sin guiones y acentos |
| Móvil | Pie de página y columnas podían ensanchar la página | Columnas con ancho limitado y pie en una columna en pantallas pequeñas |
| Cotizador | Historial todavía llamaba Supabase; faltaban funciones globales para botones | Historial en PHP, funciones conectadas y retirada de un modal sin implementación |
| HTML | Nombres y productos del cotizador entraban como HTML | Escape de texto y eliminación de JSON interpolado en onclick |
| PDF | Dependencia CDN antigua, riesgo de mezcla PEN/USD y filas fuera de la página | jsPDF local, moneda y tipo de cambio consistentes, comprobación de cantidades y salto de página |
| Estadísticas | Papelera y ventas anuladas inflaban los resultados | Se excluyen de solicitudes activas e ingresos |
| Compilación | Panel, gráficas y páginas se cargaban en un único archivo de 847 KB | Importación diferida por página; archivo inicial de unos 272 KB (88 KB gzip) |
| Calidad | 20 errores y 5 avisos de lint; 10 avisos de dependencias | Tipos explícitos, configuración ESLint actualizada y dependencias corregidas; auditoría final sin avisos |
| Documentación | Varias instrucciones obsoletas y esquema insuficiente para actualizaciones | Guía única, migración aditiva PHP y SQL para phpMyAdmin, alternativa de creación del owner sin SSH |

## Validación

- Compilación TypeScript/Vite y ESLint sin errores ni avisos del proyecto.
- Sintaxis de los PHP y JavaScript del cotizador comprobada.
- 61 comprobaciones de API sobre SQLite y otras 61 sobre MariaDB 10.11: autenticación, roles, CRUD, permisos de adjuntos, visibilidad de respuestas, papelera, validación y límites de frecuencia. El detalle de los resultados está en tests/resultados/.
- Ocho pruebas de JWT: firma, formato, algoritmo y expiración.
- Migración de una copia de la base incluida, conservando 2 usuarios, 4.802 repuestos, 10 máquinas y 2 solicitudes. No se modificó la base original.
- Migración SQL ejecutada dos veces en una base MariaDB de pruebas con columnas retiradas para simular una versión anterior; registro de usuario conservado.
- 10 comprobaciones en Apache 2.4: páginas internas devolvieron frontend, /api/health devolvió JSON, rutas inexistentes de API devolvieron 404 JSON y scripts/bases/directorios privados devolvieron 403.
- 16 comprobaciones en navegador Chromium: catálogo completo hasta la última página, búsqueda, móvil, página no encontrada, panel, alta de producto, cotizador, historial, cálculo de precio y escape de HTML. Sin errores de ejecución en las pruebas completadas.
- npm audit: 0 avisos en la consulta final. Es una comprobación de dependencias conocidas en esa fecha, no una garantía permanente.

## Qué falta en tu hosting

La entrega requiere configurar MySQL, secret y owner en config.local.php, respaldar/importar la migración y trasladar adjuntos antiguos si existen. Después hay que comprobar HTTPS, reglas del proveedor y los flujos descritos en DEPLOY-WEBUZO.md. No se accedió ni se publicó en el hosting real.

Confirma teléfonos y correo de la empresa desde el panel. Conservé los valores existentes de ejemplo para no sustituir datos comerciales sin tu indicación. Las imágenes y datos de muestra permanecen disponibles en las fuentes; no ejecutes los scripts de productos de ejemplo sobre un inventario comercial sin revisarlos.

El catálogo sigue descargándose completo para los filtros del navegador. El siguiente paso de rendimiento sería paginar/filtrar desde MySQL y cachear catálogos públicos. Las imágenes originales suman cerca de 71 MB; no se recomprimieron en esta revisión. Los cambios reducen el JavaScript inicial y añaden carga diferida a imágenes del catálogo de repuestos.

Los tokens aún se guardan en localStorage: se protegieron las interpolaciones HTML detectadas y se añadió revocación al cambiar contraseñas, pero una migración a cookies HttpOnly requiere un cambio independiente en sesión/CSRF. Los PDF mantienen la regla comercial existente de redondear precios a enteros; confirma esa regla antes de usar la herramienta como comprobante de cobro. Guardar desde una cotización del historial crea una copia nueva, no reemplaza la anterior.

No hubo un rediseño visual general ni una prueba manual exhaustiva de cada combinación posible de contenido. Se revisó el código, se corrigieron problemas concretos y se comprobaron los flujos principales; las pruebas finales del hosting siguen siendo necesarias.

## Entrega

- Fuentes completas sin node_modules, dist, credenciales ni SQLite con cuentas.
- Paquete de despliegue con public_html/ y mantenimiento/ separados.
- Tests de API y JWT, y resultados de la verificación.
- DEPLOY-WEBUZO.md con instrucciones para instalación nueva, actualización y reversión.

## Organización posterior de documentación

README.md describe funciones y novedades; LOCAL.md contiene el arranque en Windows; DEPLOY-WEBUZO.md contiene la publicación. La plantilla local se copia a .env.development.local y .env.production declara https://dh-dm-maquinarias.com. Se retiraron README-BACKEND.md y README-V6.md, que repetían enlaces. Esta etapa cambia documentación y configuración pública de Vite; no modifica la lógica de la aplicación.

## Corrección posterior de imágenes iniciales

La carga inicial dejaba vacías seis rutas del blog y tres de maquinaria. Se incorporaron las asignaciones al JSON y a los datos estáticos. Las fotos del blog y de PC200-8 ya estaban incluidas; se añadieron nueve miniaturas locales de Wikimedia para las dos máquinas restantes y los siete ejemplos optativos, con autores/licencias y etiquetas de referencia.

load_seed_data.php ejecuta una reparación repetible que conserva fotos personalizadas y no inserta inventario adicional. Las utilidades antiguas del blog/maquinaria apuntan a esa reparación. build ahora verifica las rutas iniciales mediante npm run check:images.

Validación adicional: 17 comprobaciones de carga/reparación en SQLite; 20 comprobaciones de navegador, incluidas decodificación con solicitudes externas bloqueadas, tarjetas y créditos; 107 archivos de imágenes iniciales verificados. No se detectaron referencias estáticas a imágenes inexistentes en el código revisado. Los 4.697 repuestos sin fotografía original siguen sin foto; requieren material propio. Resultados en tests/resultados/imagenes-*.json.
