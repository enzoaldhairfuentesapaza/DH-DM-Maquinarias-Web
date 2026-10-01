# Ejecutar localmente — Windows / PowerShell

Versión 1.6.1. Todos los bloques marcados powershell se ejecutan en PowerShell. Usa la copia del repositorio que ya clonaste; no hace falta volver a clonarlo. La instalación inicial crea SQLite y un owner local; no se conecta a la base del hosting.

## 1. Requisitos y carpeta

Necesitas Git, Node (serie 20 desde 20.19, o versión 22.12 o superior compatible con engines de package.json), npm y PHP 8.1+ en PATH. Python 3 es opcional para las pruebas de API.

Abre PowerShell y pega:

```powershell
Set-Location -LiteralPath 'D:\ENZO\TEC COMPANY\DH-DM-Maquinarias-Web'
Get-Command git, node, npm, php -ErrorAction Stop
git --version
node --version
npm --version
php --version
php --ini
php -r 'print_r(PDO::getAvailableDrivers());'
php -m
```

PDO debe incluir sqlite. PHP necesita fileinfo y ctype; ZIP se usa para comprobar Office detectado como ZIP. Si falta PHP, instala PHP para Windows o usa el PHP de una instalación existente de XAMPP. No necesitas arrancar Apache/MySQL de XAMPP para esta opción con SQLite y php -S.

Si ya tienes XAMPP en C:\xampp y PHP no está en PATH, habilítalo para esta terminal:

```powershell
$env:Path = 'C:\xampp\php;' + $env:Path
php --version
php --ini
```

Si faltan extensiones, abre el php.ini que indica php --ini, habilita las entradas de pdo_sqlite y fileinfo quitando el ; inicial y vuelve a comprobar. Para MySQL local también necesitarías pdo_mysql. No cambies un php.ini distinto del que usa la consola.

## 2. Dependencias y entorno del frontend

Desde la raíz:

```powershell
npm ci
if ($LASTEXITCODE -ne 0) { throw 'Falló npm ci; revisa el mensaje anterior.' }
if (-not (Test-Path '.env.development.local')) {
    Copy-Item '.env.example' '.env.development.local'
}
Get-Content '.env.development.local'
```

Debe contener VITE_API_URL=http://localhost:8000. .env.production conserva el dominio del hosting; no lo cambies para desarrollar. .env.example solo sirve de plantilla.

Si habías creado .env o .env.local con las instrucciones anteriores, puedes conservarlos aparte como respaldo y retirarlos de la raíz para mantener un único archivo local de Vite. No elimines valores privados que necesites. Usa ahora .env.development.local. Revisa también que no exista un .env.production.local antiguo.

Una variable VITE_API_URL definida en la terminal tiene prioridad sobre los archivos. Para usar la configuración local del proyecto:

```powershell
Remove-Item Env:VITE_API_URL -ErrorAction SilentlyContinue
```

## 3. Preparar la configuración y la base PHP

Primera instalación; el bloque no sobrescribe una configuración existente:

```powershell
if (-not (Test-Path '.\backend-php\config.local.php')) {
    php .\backend-php\setup-local.php
    if ($LASTEXITCODE -ne 0) { throw 'Falló la creación de la configuración local.' }
}
php .\backend-php\migrate.php
if ($LASTEXITCODE -ne 0) { throw 'Falló la migración local.' }
```

setup-local.php genera una clave JWT aleatoria. Por defecto config.example.php selecciona development + SQLite en backend-php/hdm.db. Antes de migrar una configuración que ya existía, verifica que config.local.php no apunte al MySQL real del hosting; respalda tu base local si contiene trabajo.

Si has configurado APP_ENV, DB_DRIVER o HDM_CONFIG_FILE en tu sistema, revisa esos valores porque pueden cambiar la selección del backend:

```powershell
Get-ChildItem Env: | Where-Object { $_.Name -match '^(APP_ENV|DB_|HDM_CONFIG_FILE|JWT_SECRET)' } | Select-Object Name
```

Ese comando muestra los nombres, no contraseñas. Corrige la configuración antes de continuar si corresponde a producción.

## 4. Crear el primer owner

El correo/contraseña se solicitan en consola. Usa los datos con los que luego iniciarás sesión localmente. La contraseña debe tener entre 8 y 72 bytes.

```powershell
$env:OWNER_EMAIL = Read-Host 'Correo del owner LOCAL'
$env:OWNER_NAME = Read-Host 'Nombre del owner LOCAL'
$claveOwner = Read-Host 'Contraseña del owner LOCAL (8 a 72 bytes)' -AsSecureString
$env:OWNER_PASSWORD = [System.Net.NetworkCredential]::new('', $claveOwner).Password
try {
    php .\backend-php\seed.php
    if ($LASTEXITCODE -ne 0) { throw 'Falló la creación del owner.' }
} finally {
    Remove-Item Env:OWNER_EMAIL, Env:OWNER_NAME, Env:OWNER_PASSWORD -ErrorAction SilentlyContinue
    Remove-Variable claveOwner -ErrorAction SilentlyContinue
}
```

Si ya existe un owner, la utilidad conserva esa cuenta. No cambia su contraseña; usa la cuenta existente. Si config.local.php define owner_email/owner_password explícitamente, estos valores tienen prioridad sobre el entorno: revisa ese archivo antes de ejecutar seed.php.

## 5. Cargar el catálogo inicial (opcional)

Para probar con el catálogo incluido:

```powershell
php .\backend-php\load_seed_data.php
if ($LASTEXITCODE -ne 0) { throw 'Falló la carga de datos de muestra.' }
php .\backend-php\migrate_categorias.php
if ($LASTEXITCODE -ne 0) { throw 'Falló la preparación de categorías.' }
```

La carga agrega datos en tablas vacías. No es un mecanismo para sincronizar inventarios comerciales. Omite este paso si prefieres crear tus datos desde el panel.

## 6. Arrancar la API — terminal 1

Desde la raíz del proyecto:

```powershell
Set-Location -LiteralPath 'D:\ENZO\TEC COMPANY\DH-DM-Maquinarias-Web'
php -S localhost:8000 -t backend-php backend-php/router.php
```

Deja esta terminal abierta. router.php dirige las peticiones a la API y bloquea archivos privados/scripts. No uses php -S sin el router.

## 7. Arrancar React — terminal 2

Abre otra ventana de PowerShell:

```powershell
Set-Location -LiteralPath 'D:\ENZO\TEC COMPANY\DH-DM-Maquinarias-Web'
Remove-Item Env:VITE_API_URL -ErrorAction SilentlyContinue
npm run dev -- --host localhost --port 5173 --strictPort
```

Deja esta terminal abierta. Abre http://localhost:5173/. strictPort evita que Vite cambie silenciosamente a un puerto no permitido por CORS. Ctrl+C detiene cada servidor.

## 8. Comprobar — terminal 3

```powershell
Set-Location -LiteralPath 'D:\ENZO\TEC COMPANY\DH-DM-Maquinarias-Web'
Invoke-RestMethod 'http://localhost:8000/api/health'
Start-Process 'http://localhost:5173/'
Start-Process 'http://localhost:5173/admin/login'
```

La API debe responder JSON con status ok. Entra con el owner local, abre el catálogo, edita un producto y prueba /cotizador. Comprueba también el registro de un cliente, su historial y las respuestas visibles.

## 9. Verificar cambios

Desde una terminal libre:

```powershell
npm run lint
if ($LASTEXITCODE -ne 0) { throw 'Lint encontró errores.' }
npm run typecheck
if ($LASTEXITCODE -ne 0) { throw 'TypeScript encontró errores.' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación.' }
php .\tests\jwt.php
if ($LASTEXITCODE -ne 0) { throw 'Fallaron las pruebas JWT.' }
```

Si tienes Python 3 con el lanzador py:

```powershell
py -3 .\tests\api-smoke.py
if ($LASTEXITCODE -ne 0) { throw 'Fallaron las pruebas de API.' }
```

Las pruebas de API crean una base temporal. No definas HDM_TEST_CONFIG para tu base de trabajo; esa opción es solo para una base dedicada con app_env=test. Si tu instalación usa python en lugar de py, ejecuta python .\tests\api-smoke.py.

npm run build usa la API de producción en el resultado. Para una previsualización compilada contra la API local:

```powershell
$env:VITE_API_URL = 'http://localhost:8000'
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación local.' }
} finally {
    Remove-Item Env:VITE_API_URL -ErrorAction SilentlyContinue
}
npm run preview -- --host localhost --port 5173 --strictPort
```

Detén antes Vite dev para liberar 5173 y conserva la API abierta. Antes de desplegar recompila con la guía de producción: no subas ese dist local.

## Problemas frecuentes

| Mensaje/síntoma | Revisión |
|---|---|
| php no se reconoce | PATH o ruta del PHP instalado |
| could not find driver | PDO SQLite no habilitado en el PHP de la consola |
| Clave JWT inválida | Crear config.local.php con setup-local.php o revisar el secret existente |
| Failed to fetch | API detenida o VITE_API_URL incorrecto; reiniciar Vite después de cambiar env |
| CORS | Usar localhost y puerto 5173 como en esta guía |
| Puerto ocupado | Detener la terminal que lo usa con Ctrl+C; no cambiar solo uno de los puertos |
| Lint menciona cotizador-app en la raíz | Retirar copia antigua; conservar public/cotizador-app |
| Login falla | Usuario/contraseña local, no la cuenta de producción; revisar salida de seed.php |
| Catálogo vacío | Cargar datos de muestra o crear productos desde el panel |

En cada sesión posterior basta con abrir las dos terminales de los pasos 6 y 7. Tras cambiar dependencias usa npm ci; tras cambiar el esquema ejecuta migrate.php con respaldo de datos.
