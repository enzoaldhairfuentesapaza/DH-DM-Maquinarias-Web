# Desplegar en Webuzo / Apache — 1.6.1

Dominio de esta entrega: https://dh-dm-maquinarias.com/. Frontend y API comparten dominio; la API se publica en public_html/api/. Los bloques powershell se ejecutan en Windows y los bloques bash solo en la terminal Linux del hosting.

Hay pasos que se hacen en Webuzo/phpMyAdmin (crear base, importar SQL y subir archivos). No existe un comando genérico para esos pasos sin conocer el acceso del proveedor. Los comandos de consola de esta guía sí están completos; los datos particulares se solicitan o se completan en la plantilla.

## 1. Comprobar el hosting y respaldar

Necesitas PHP 8.1+ con PDO MySQL, fileinfo y ctype; ZIP para Office detectado como ZIP. Apache 2.4 debe tener mod_rewrite y permitir .htaccess (AllowOverride). Activa HTTPS para el dominio y www. Si hay Nginx delante, confirma con el proveedor que /api y las rutas internas lleguen a Apache. Nginx solo necesita reglas propias; no interpreta .htaccess.

Antes de actualizar:

1. Exporta toda la base MySQL desde phpMyAdmin.
2. Descarga una copia del public_html actual, incluidas las imágenes subidas, adjuntos y configuración PHP.
3. Guarda esos respaldos fuera de public_html.
4. Identifica dónde están los adjuntos antiguos y si la base ya contiene un owner.

No uses las credenciales de tu configuración SQLite local en producción.

## 2. Generar el paquete — PowerShell en tu equipo

```powershell
Set-Location -LiteralPath 'D:\ENZO\TEC COMPANY\DH-DM-Maquinarias-Web'
npm ci
if ($LASTEXITCODE -ne 0) { throw 'Falló npm ci.' }
$env:VITE_API_URL = 'https://dh-dm-maquinarias.com'
try {
    npm run release
    if ($LASTEXITCODE -ne 0) { throw 'Falló la preparación de publicación; no subas el paquete.' }
} finally {
    Remove-Item Env:VITE_API_URL -ErrorAction SilentlyContinue
}
Get-Content '.\release\public_html\cotizador-app\runtime-config.js'
```

El archivo runtime-config.js debe mencionar https://dh-dm-maquinarias.com. La variable temporal asegura ese origen aunque existiera una configuración local de modo de producción. .env.production ya tiene ese mismo valor.

release/ se regenera cada vez: no guardes allí tu única copia de una configuración privada. La compilación no conecta con MySQL ni modifica el hosting.

| Ruta generada | Uso |
|---|---|
| release/public_html/ | Contenido que se sube al directorio público |
| release/public_html/api/ | API mínima y reglas de protección |
| release/mantenimiento/backend-php/ | Utilidades CLI y SQL, fuera de la web |
| release/DEPLOY-WEBUZO.md | Esta guía |

## 3. Configuración PHP de producción

En Webuzo crea la base y un usuario MySQL con permisos sobre ella si es una instalación nueva. Anota host, puerto, nombre de base, usuario y contraseña. Para una actualización usa la base existente.

La plantilla está en backend-php/config.production.example.php (fuentes) o mantenimiento/backend-php/config.production.example.php (paquete). En el hosting crea **public_html/api/config.local.php** con ese contenido, completando:

```php
<?php
return [
    'app_env' => 'production',
    'db' => [
        'driver' => 'mysql',
        'host' => 'HOST_MYSQL',
        'port' => 3306,
        'name' => 'NOMBRE_BASE',
        'user' => 'USUARIO_MYSQL',
        'pass' => 'CONTRASENA_MYSQL',
    ],
    'secret_key' => 'CLAVE_ALEATORIA_GENERADA',
    'owner_email' => 'CORREO_OWNER',
    'owner_password' => 'CONTRASENA_OWNER',
    'owner_nombre' => 'Administrador Principal',
    'cors_origins' => [
        'https://dh-dm-maquinarias.com',
        'https://www.dh-dm-maquinarias.com',
    ],
];
```

Son marcadores, no datos válidos para dejar en el servidor. Respeta las comillas PHP: si una contraseña contiene comilla simple o barra invertida, escápala como \' o \\ dentro de una cadena con comillas simples.

Genera el secret en PowerShell y pega el resultado en secret_key:

```powershell
php -r 'echo bin2hex(random_bytes(32));'
```

En una actualización conserva un secret seguro existente si quieres mantener las sesiones válidas. Si era una clave de ejemplo o la cambias, los usuarios tendrán que iniciar sesión nuevamente. PHP rechaza SQLite con app_env=production.

Si usas File Manager puedes crear/editar config.local.php directamente en el servidor. No subas este archivo a GitHub ni lo incluyas en un ZIP público. Después de crear el owner, retira owner_password de esa configuración si ya no vas a usar seed.php.

## 4. Preparar MySQL

### Instalación nueva

Selecciona la base correcta en phpMyAdmin e importa backend-php/schema.mysql.sql. En el paquete compilado el archivo está en mantenimiento/backend-php/schema.mysql.sql.

Después crea el owner con una de las opciones del paso 5. El paquete no contiene cuentas ni una base SQLite para importar como producción.

### Actualización de una base existente

Con el respaldo hecho, importa **backend-php/migration.mysql.sql** en phpMyAdmin. En el paquete está en mantenimiento/backend-php/migration.mysql.sql. La migración crea tablas faltantes, agrega columnas y adapta roles/canales sin borrar registros.

No basta con volver a importar schema.mysql.sql: CREATE TABLE IF NOT EXISTS no actualiza columnas de tablas existentes. Ante un error de SQL, detente y revisa el mensaje antes de publicar.

Si tienes SSH, puedes ejecutar migrate.php como se explica más abajo en lugar de importar la migración SQL. No necesitas ejecutar las dos opciones.

## 5. Owner y mantenimiento

### Sin SSH: generar el SQL del owner en Windows

Solo para una instalación que aún no tiene owner. Desde la raíz de las fuentes:

```powershell
$env:OWNER_EMAIL = Read-Host 'Correo del owner de PRODUCCION'
$env:OWNER_NAME = Read-Host 'Nombre del owner de PRODUCCION'
$claveOwner = Read-Host 'Contraseña del owner de PRODUCCION (8 a 72 bytes)' -AsSecureString
$env:OWNER_PASSWORD = [System.Net.NetworkCredential]::new('', $claveOwner).Password
try {
    php .\backend-php\create-owner-sql.php | Out-File -FilePath '.\owner.sql' -Encoding ascii
    if ($LASTEXITCODE -ne 0) { throw 'Falló la generación del SQL; no lo importes.' }
} finally {
    Remove-Item Env:OWNER_EMAIL, Env:OWNER_NAME, Env:OWNER_PASSWORD -ErrorAction SilentlyContinue
    Remove-Variable claveOwner -ErrorAction SilentlyContinue
}
```

Importa owner.sql en la base seleccionada desde phpMyAdmin. La utilidad genera valores en hexadecimal y un hash de contraseña; ASCII evita el UTF-16 de la redirección por defecto en Windows PowerShell 5.1. No necesita conectarse a MySQL desde tu equipo.

Después de importar y comprobar el acceso:

```powershell
Remove-Item -LiteralPath '.\owner.sql'
```

Nunca subas owner.sql al directorio público. Si ya tienes un owner, usa esa cuenta y omite este paso.

### Con SSH: utilidades fuera de public_html

Sube el CONTENIDO de release/mantenimiento/ a una carpeta privada del usuario del hosting llamada hdm-mantenimiento-1.6.1, al lado de public_html. No publiques mantenimiento/ dentro de la web.

En la terminal Linux del hosting, con config.local.php de producción ya creado:

```bash
cd "$HOME/hdm-mantenimiento-1.6.1/backend-php"
php --version
php -m
read -r -p 'Ruta absoluta del public_html de este dominio: ' HDM_PUBLIC_HTML
export HDM_PUBLIC_HTML
if [ ! -f "$HDM_PUBLIC_HTML/api/config.local.php" ]; then
  echo 'No existe la configuración de producción en esa ruta.'
else
  cat > config.local.php <<'PHP'
<?php
$root = rtrim(getenv('HDM_PUBLIC_HTML'), '/');
if (!$root) { throw new RuntimeException('Define HDM_PUBLIC_HTML en esta terminal.'); }
$cfg = require $root . '/api/config.local.php';
$cfg['uploads_dir'] = $root . '/api/uploads';
$cfg['documents_dir'] = $root . '/api/private/documents';
return $cfg;
PHP
  chmod 600 config.local.php
fi
```

El bloque prepara la configuración de esa copia de mantenimiento y fija las rutas reales de archivos. No sobrescribe config.local.php del sitio. Cada nueva terminal debe definir/exportar HDM_PUBLIC_HTML antes de usar esa copia. Si el proveedor deja la web en otro directorio, introduce su ruta real.

Para crear/actualizar el esquema por PHP en vez de phpMyAdmin:

```bash
php migrate.php
```

Si falla, detente. Si terminó y necesitas crear el primer owner con los valores configurados en el sitio:

```bash
php seed.php
```

No ejecutes load_seed_data.php sobre el inventario de la empresa por rutina. Solo si has decidido usar los catálogos de muestra en una instalación vacía, ejecútalo y después migrate_categorias.php; revisa primero esos datos.

## 6. Adjuntos antiguos

Las nuevas respuestas usan api/private/documents/ y descargas autorizadas en /api/documentos/NOMBRE.

Si hay archivos de respuesta públicos en /uploads/... o /api/uploads/..., migra solo los referenciados en cotizaciones.archivo_respuesta. Con SSH, desde la copia de mantenimiento del paso 5 y con HDM_PUBLIC_HTML definido:

```bash
php migrate_documents.php
```

Si tus archivos antiguos están en otro directorio, ajusta uploads_dir en la configuración de mantenimiento antes de ejecutar. La utilidad copia, actualiza referencias y retira el archivo público; conserva el respaldo y comprueba las descargas.

Sin SSH:

1. Crea api/private/documents/ y conserva api/private/.htaccess.
2. Desde File Manager mueve los archivos referenciados en cotizaciones.archivo_respuesta a ese directorio privado.
3. En phpMyAdmin cambia cada referencia comprobada a /api/documentos/NOMBRE, manteniendo el nombre exacto.
4. Verifica la descarga con el cliente autorizado y el rechazo sin sesión.

No muevas imágenes de maquinaria/repuestos al directorio privado. Si un nombre antiguo no cumple el formato aceptado por la API (32 caracteres hexadecimales y extensión permitida), revisa/renombra ese archivo y su referencia antes de finalizar; no inventes una URL sin comprobarlo.

## 7. Subir el sitio

Desde File Manager de Webuzo o tu cliente de transferencia, sube **el CONTENIDO de release/public_html/** al public_html del dominio. Activa mostrar archivos ocultos e incluye todos los .htaccess.

En una actualización conserva api/config.local.php, api/uploads/ y api/private/documents/. Reemplaza los archivos de aplicación y reglas del paquete sin borrar esos datos. No uses una sincronización que elimine archivos remotos ausentes en el paquete. Retira los archivos de aplicación antiguos fuera del paquete solo tras revisar qué son; no dejes utilidades viejas accesibles desde la web.

No subas src/, node_modules/, mantenimiento/, una SQLite ni scripts seed/migrate/add/update al directorio público. No publiques todo el repositorio: el paquete distingue el código público de las herramientas privadas.

El usuario PHP del hosting necesita escribir en api/uploads/ y api/private/documents/. Usa los permisos/propietario apropiados que indique el proveedor, no permisos 777 por defecto.

## 8. Verificación desde PowerShell

```powershell
Invoke-RestMethod 'https://dh-dm-maquinarias.com/api/health'
Start-Process 'https://dh-dm-maquinarias.com/repuestos'
Start-Process 'https://dh-dm-maquinarias.com/admin/login'
```

Health debe responder JSON con status ok y acceso a la base. Comprueba además:

- Recargar /repuestos, una ficha y /admin sin 403/404 de Apache.
- Buscar códigos y navegar hasta la última página del catálogo.
- Iniciar sesión, editar un producto y comprobar su imagen pública.
- Enviar una consulta/cotización con un cliente de prueba.
- Responder con un PDF; el cliente autorizado lo descarga, otra cuenta y una ventana sin sesión no.
- Desmarcar Mostrar en la página y comprobar que desaparecen respuesta y adjunto para el cliente.
- Comprobar diferencias entre owner/admin/cotizador y abrir /cotizador e historial.
- Generar PDF de varias páginas; revisar PEN/USD, tipo de cambio y redondeos.
- Confirmar contactos reales desde Admin > Configuración.

Comprueba los bloqueos HTTP (403 o 404, nunca contenido ni ejecución):

```powershell
$rutasPrivadas = @('/api/seed.php', '/api/config.local.php', '/api/hdm.db', '/api/seed_data/repuestos.json', '/api/private/')
foreach ($ruta in $rutasPrivadas) {
    try {
        $respuesta = Invoke-WebRequest -Uri ('https://dh-dm-maquinarias.com' + $ruta) -UseBasicParsing
        Write-Host ($ruta + ' -> ' + [int]$respuesta.StatusCode + ' REVISAR: no debería ser accesible')
    } catch {
        if ($_.Exception.Response) {
            Write-Host ($ruta + ' -> ' + [int]$_.Exception.Response.StatusCode)
        } else {
            Write-Host ($ruta + ' -> Error de conexión: ' + $_.Exception.Message)
        }
    }
}
```

Si .htaccess no se aplica, corrige la configuración del proveedor antes de dejar público el sitio. Un 500 requiere revisar logs PHP; no actives display_errors en producción. HTML en /api/health indica que la petición está entrando a React en vez de a PHP.

## 9. Volver atrás

Repón los archivos y configuración del respaldo. Para revertir también la base, restaura la exportación MySQL y los adjuntos del mismo respaldo. Hazlo en una ventana de mantenimiento para evitar perder solicitudes nuevas. Las migraciones son aditivas, pero restaurar una base antigua después de recibir datos nuevos perdería esos datos.

## 10. Actualizaciones posteriores

Prueba primero en local, guarda el cambio en GitHub y genera de nuevo el paquete del paso 2. Si cambia el esquema, respalda/migra la base; si solo cambian estilos o React, no hay que sembrar datos ni recrear cuentas. Subir un commit a GitHub no publica automáticamente en este hosting.

Referencias técnicas: https://vite.dev/guide/env-and-mode.html y https://www.php.net/manual/en/pdo.installation.php.
