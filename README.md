# DH & DM Maquinarias — versión 1.6.1

React + TypeScript + Vite, API PHP y MySQL/MariaDB en producción. SQLite sirve para desarrollo local.

## Requisitos

- Node 20.19+ o 22.12+; recomendado Node 22 LTS. Usa `npm ci` con el lockfile incluido.
- PHP 8.1+ con PDO, pdo_sqlite en local o pdo_mysql en producción, fileinfo y ctype. ZIP se necesita para validar documentos Office cuyo MIME se detecta como ZIP.
- Apache 2.4 con mod_rewrite y AllowOverride habilitado; HTTPS en producción.

## Desarrollo

```bash
npm ci
cp .env.example .env
cd backend-php
php setup-local.php
php migrate.php
```

Define `owner_email` y `owner_password` en `backend-php/config.local.php` antes de ejecutar `php seed.php`. Usa un correo real y una contraseña de entre 8 y 72 bytes. Alternativamente usa las variables OWNER_EMAIL y OWNER_PASSWORD de tu terminal. No publiques ni compartas ese archivo.

```bash
php seed.php
php load_seed_data.php       # opcional: carga el catálogo y contenido de muestra en tablas vacías
php migrate_categorias.php   # registra las categorías del catálogo
php -S localhost:8000 router.php
```

En otra terminal, desde la raíz del proyecto:

```bash
npm run dev
```

El sitio abre en http://localhost:5173 y la API en http://localhost:8000/api/health. Si empleas 127.0.0.1, usa esa dirección en ambos procesos para no tener orígenes mezclados.

## Verificación y entrega

```bash
npm run lint
npm run typecheck
npm run build
php tests/jwt.php
python tests/api-smoke.py
npm run release
```

Las pruebas de API necesitan Python 3 y PHP en PATH. Crean una base temporal; no usan tu base de trabajo. `PHP_BIN` permite señalar otro ejecutable PHP. La opción HDM_TEST_CONFIG se reserva a una base MariaDB dedicada de pruebas con `app_env = test`.

`release/public_html/` contiene el frontend compilado y la API mínima. `release/mantenimiento/` contiene las utilidades para ejecutar fuera de la web. Nunca subas esta última carpeta al directorio público. La guía completa es [DEPLOY-WEBUZO.md](DEPLOY-WEBUZO.md); los cambios y límites de la revisión están en [REVISION-1.6.1.md](REVISION-1.6.1.md).

## Configuración

La configuración PHP combina `config.example.php`, variables de entorno y `config.local.php`. Este último contiene únicamente tus valores particulares. En producción usa como referencia `config.production.example.php`. El backend rechaza una clave JWT vacía, corta o de ejemplo y rechaza SQLite si app_env es production.

VITE_API_URL es el **origen** de la API, sin `/api` ni barra final. Vacío en producción significa el mismo dominio. React y el cotizador estático usan ese mismo valor al compilar. No pongas contraseñas en variables VITE_: se incluyen en el JavaScript público.

## Roles

| Rol | Acceso |
|---|---|
| Visitante | Catálogo, contenido público, envío de solicitudes y sugerencias |
| Cliente | Lo anterior, perfil e historial propio con respuestas visibles |
| Cotizador | Ventas, solicitudes, estadísticas y cotizador formal |
| Admin | Contenido, productos, categorías, configuración, sugerencias y funciones del cotizador |
| Owner | Todo lo anterior, accesos, auditoría y papelera |

Los permisos se comprueban en PHP además de la interfaz. Los archivos de respuesta se descargan con token y autorización. Las imágenes de catálogo son públicas.

## GitHub

Para reemplazar la versión antigua, conservar el historial y subir cambios pequeños, sigue [GIT-GITHUB.md](GIT-GITHUB.md). El .gitignore incluido excluye credenciales, bases locales, dependencias y archivos generados.
