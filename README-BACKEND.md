# HDM Maquinarias — Web + Panel Administrativo

## Qué se agregó

- **Backend en PHP puro** (`/backend-php`), sin frameworks ni Composer: 100% compatible con hosting compartido (Webuzo/cPanel) como el de hosting.com.pe. Se sube por FTP y ya funciona, no requiere SSH ni instalar nada en el servidor.
- Antes todo era estático (`src/data/*.ts`); ahora novedades, blog, promociones, **maquinaria y repuestos** viven en base de datos MySQL y se editan desde un panel.
- **Roles**: `visitante` (sin cuenta), `cliente` (registrado), `admin`, `owner`.
- **Panel admin rediseñado** en `/admin` con los colores de la marca (amarillo/negro), accesible solo a admin/owner desde el botón "Panel de administración" en la barra superior del sitio:
  - `/admin` → **Editar Página**: hub con Novedades, Blog, Promociones, y el botón "Ver sitio público".
  - `/admin/productos` → hub **Administrar Productos**: Maquinaria y Repuestos, cada uno con listas Editar/Eliminar + botón Agregar.
  - `/admin/ventas-cotizaciones` → hub con dos secciones:
    - **Cotizaciones recibidas**: todas las solicitudes de cotización de la web, con estado `pendiente / respondida / denegada` (con motivo opcional) y filtros.
    - **Ventas / Boletas**: registro manual de ventas concretadas (cliente, productos, montos, método de pago, estado).
  - `/admin/accesos` → solo owner, gestiona quién es admin/owner.
- **Sitio público**: nuevos botones de **Iniciar sesión / Registrarme** en la barra superior (páginas `/login` y `/registro`) para que los clientes creen cuenta. Si el usuari-8 logueado es admin/owner, en su lugar aparece el botón **"Panel de administración"**.

## Cómo correrlo en local

### 1. Backend (PHP)

Requisitos: PHP 8.1+ con extensión `pdo_sqlite` (para probar local) — la mayoría de instalaciones de PHP ya la traen.

```bash
cd backend-php
cp config.example.php config.php     # y edita ahi OWNER_EMAIL / OWNER_PASSWORD si quieres
php init_sqlite.php                  # crea las tablas en SQLite (solo para desarrollo local)
php seed.php                         # crea el primer usuario owner
php load_seed_data.php               # migra tus novedades/blog/promociones/maquinaria/repuestos actuales a la BD
php -S localhost:8000                # levanta el servidor de desarrollo
```

La API queda en `http://localhost:8000` (ej. `http://localhost:8000/api/health`).

### 2. Frontend

```bash
cp .env.example .env            # deja VITE_API_URL apuntando a http://localhost:8000
npm install
npm run dev
```

Entra a `http://localhost:5173/admin/login` con el email/password que pusiste en `config.php`, o desde el sitio público usa el botón "Panel de administración" en la barra superior tras iniciar sesión en `/login`.

## Cómo desplegar en hosting.com.pe (producción, MySQL)

1. **Crea la base de datos MySQL** desde tu panel Webuzo/cPanel (ahí te darán host, nombre de BD, usuario y password).
2. **Corre `schema.mysql.sql`** una vez, pegándolo en phpMyAdmin sobre esa base de datos vacía (crea las 7 tablas: usuarios, novedades, blog_posts, promociones, cotizaciones, maquinarias, repuestos, ventas).
3. **Sube por FTP** todo el contenido de `backend-php/` a una carpeta del hosting, por ejemplo `public_html/api/`.
4. En esa carpeta, **crea `config.php`** (copia de `config.example.php`) con:
   - El bloque `'db'` apuntando a MySQL (host/nombre/usuario/password reales que te dio hosting.com.pe), comentando el bloque SQLite.
   - Un `secret_key` largo y aleatorio distinto al de ejemplo.
   - Tu email/password reales de owner.
   - En `cors_origins`, agrega tu dominio real (ej. `https://tudominio.com`).
5. Visita una vez `https://tudominio.com/api/seed.php` desde el navegador (crea el owner), y luego `https://tudominio.com/api/load_seed_data.php` (migra novedades/blog/promociones/maquinaria/repuestos). **Después borra o renombra ambos archivos** por seguridad, para que nadie más los pueda ejecutar.
6. Compila el frontend (`npm run build`, genera la carpeta `dist/`) y sube ese contenido a `public_html/` (la raíz de tu dominio).
7. En el `.env` de producción del frontend, `VITE_API_URL` debe apuntar a `https://tudominio.com/api` (o el subdominio que hayas usado), y vuelve a correr `npm run build` con ese valor antes de subir.

Con esto, **todo queda en un solo hosting**, sin depender de ningún servicio externo.

## Próximos pasos (fase futura, aún no implementada)

1. Conectar con el cotizador (`sage-swan-19bb56.netlify.app`), probablemente compartiendo el login vía token.
2. Módulo de gestión de clientes (más allá del registro básico ya implementado).
3. Reportes/estadísticas de ventas y cotizaciones.
