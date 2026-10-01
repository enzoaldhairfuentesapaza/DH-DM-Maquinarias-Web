# Despliegue en Webuzo / Apache — versión 1.6.1

Esta entrega está preparada para tu hosting PHP actual. No publica ni cambia tu servidor automáticamente.

En el ZIP de fuentes, las utilidades están en `backend-php/`. En el ZIP compilado están en `mantenimiento/backend-php/`: usa esa carpeta para localizar los ejemplos de configuración y archivos SQL mencionados aquí.

## 1. Respaldo y configuración

Antes de actualizar, exporta tu base MySQL desde phpMyAdmin y guarda una copia de `public_html/`, incluidos `api/uploads/`, los adjuntos y la configuración. Conserva el respaldo fuera de la web.

En el hosting confirma PHP 8.1+, PDO MySQL, fileinfo y ctype (también ZIP si se adjuntan documentos Office detectados como ZIP), Apache con mod_rewrite y AllowOverride y HTTPS. Si Webuzo usa Nginx delante de Apache, comprueba que las solicitudes /api y las rutas internas lleguen a Apache. Un servidor Nginx sin Apache no interpreta .htaccess y necesita reglas equivalentes del proveedor.

Crea `public_html/api/config.local.php` a partir de `backend-php/config.production.example.php` y completa:

- `app_env = production`, MySQL host/puerto/nombre/usuario/contraseña.
- `secret_key`: genera una clave con `php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"`.
- Correo, nombre y contraseña inicial del owner para una instalación nueva.
- Los orígenes HTTPS del sitio, con y sin www, en cors_origins.

No reutilices el secret de ejemplo ni las credenciales incluidas en versiones anteriores. Al cambiar el secret, todas las sesiones antiguas deberán iniciar sesión de nuevo. Tras crear el owner puedes retirar owner_password de la configuración; la cuenta queda en MySQL con hash de contraseña.

## 2. Base de datos

### Instalación nueva

Crea la base y usuario MySQL en Webuzo. Selecciona esa base en phpMyAdmin e importa `backend-php/schema.mysql.sql`.

Si dispones de terminal, coloca las utilidades de mantenimiento **fuera de public_html**, configura su config.local.php para la misma base y ejecuta `php seed.php`. `load_seed_data.php` es opcional y carga datos de muestra solo en tablas vacías; revisa el catálogo antes de usarlo como inventario comercial. `migrate_categorias.php` registra las categorías ya existentes.

Si el hosting no tiene terminal, en tu equipo local define OWNER_EMAIL y OWNER_PASSWORD y ejecuta:

```bash
php backend-php/create-owner-sql.php > owner.sql
```

Importa owner.sql en phpMyAdmin y elimínalo después. Contiene el hash necesario para crear la cuenta inicial y solo la crea si aún no existe un owner. Nunca lo subas a public_html. Si no tienes PHP local, puedes usar XAMPP para ejecutar esa utilidad. No hace falta conectarse a MySQL desde tu equipo para generar el archivo.

### Base existente

Importa `backend-php/migration.mysql.sql` en phpMyAdmin, o ejecuta `php migrate.php` por terminal usando una copia de mantenimiento que apunte a tu base. La migración crea tablas faltantes, agrega columnas y amplía los roles/canales. No borra tablas ni registros. Está comprobada con MariaDB; ante un error detente y revisa el mensaje antes de continuar.

**Volver a importar solo schema.mysql.sql no agrega columnas a tablas existentes.** CREATE TABLE IF NOT EXISTS sirve para tablas nuevas, no para migrar columnas.

### Adjuntos existentes

Las respuestas nuevas se guardan en `api/private/documents/` y se sirven por `/api/documentos/...` con autorización.

Si ya hay respuestas en `/uploads/...` o `/api/uploads/...`, ejecuta `php migrate_documents.php` con el config de producción y las rutas `uploads_dir` y `documents_dir` apuntando a los directorios reales del servidor. La utilidad copia cada archivo, actualiza la referencia y retira el archivo público. Si no tienes terminal, usa el administrador de archivos para mover **los archivos referenciados en cotizaciones.archivo_respuesta** a `api/private/documents/`, verifica cada nombre y después actualiza esas referencias en phpMyAdmin a `/api/documentos/NOMBRE`. Conserva el respaldo hasta comprobar las descargas. No muevas las imágenes del catálogo.

## 3. Compilar y subir

La entrega incluye un paquete compilado. Para generar uno nuevo desde las fuentes:

```bash
npm ci
npm run release
```

`.env.production` deja VITE_API_URL vacío para usar el mismo dominio. Si eliges un subdominio, usa por ejemplo `VITE_API_URL=https://api.dh-dm-maquinarias.com`, sin `/api`, y añade el origen del frontend a CORS. El subdominio debe dirigir `/api/...` hacia index.php y conservar `/api/uploads/...`; el esquema recomendado en esta entrega es `public_html/api/` en el mismo dominio.

Sube **el contenido** de `release/public_html/` a public_html. Debes incluir todos los .htaccess aunque el administrador de archivos los oculte. No subas la carpeta mantenimiento/, las fuentes src/, node_modules/, una base SQLite, ni los scripts seed/migrate/add/update.

Al actualizar conserva `api/config.local.php`, `api/uploads/` y `api/private/documents/` existentes. Sustituye únicamente los archivos del paquete y sus reglas .htaccess. No elimines esas carpetas ni reemplaces MySQL con una base de ejemplo. Los paquetes generados no llevan credenciales ni archivos del usuario.

El .htaccess del frontend ya va incluido en el build. Contiene RewriteEngine On, excluye /api de la navegación React, prioriza las rutas públicas sobre las carpetas de imágenes con el mismo nombre y resuelve las rutas internas al recargar. Las reglas de API bloquean acceso a scripts auxiliares, bases, seed_data y private. Si las reglas del proveedor no se aplican, no continúes publicando hasta corregir esa configuración.

Después del cambio verifica los teléfonos y el correo en Admin > Configuración. Los números de muestra no sustituyen la confirmación de los contactos reales de la empresa.

## 4. Comprobación en el hosting

- Abre `/api/health`: debe devolver JSON con status ok y poder conectar con MySQL.
- Abre `/repuestos`, navega a la última página y recarga una ficha de producto.
- Inicia sesión como owner, edita un producto y comprueba su imagen desde el catálogo.
- Envía una solicitud de contacto y una cotización con una cuenta de cliente de prueba.
- Responde con un PDF y descarga desde esa cuenta; otra cuenta y una ventana sin sesión deben tener el acceso denegado.
- Desmarca Mostrar en la página: la respuesta y el adjunto dejan de aparecer para el cliente.
- Comprueba los permisos de cotizador, admin y owner, incluido `/cotizador` y `/cotizador/historial`.
- `/api/seed.php`, `/api/config.local.php`, `/api/hdm.db`, `/api/seed_data/repuestos.json` y `/api/private/` deben responder 403/404. Nunca deben mostrar contenido, ejecutar scripts o descargar archivos.
- Prueba el PDF con suficientes productos para generar varias páginas y confirma PEN/USD y el tipo de cambio.

Si aparece un 500, consulta el registro PHP del hosting. No habilites display_errors en el sitio público. Si /api devuelve HTML, verifica el directorio de la API y las reglas de Apache; no debe pasar por index.html.

## 5. Reversión

Si surge un problema, repón la copia de los archivos anteriores y su configuración. Las migraciones son aditivas, pero para una reversión total restaura la exportación MySQL previa y los adjuntos juntos. Hazlo en una ventana de mantenimiento para no perder solicitudes nuevas. No ejecutes scripts de limpieza o de datos de muestra en producción como parte de una actualización habitual.
