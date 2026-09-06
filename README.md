# DH & DM Maquinarias SAC — Sitio Web

Sitio web de **DH & DM Maquinarias**, empresa de venta de repuestos y maquinaria pesada (minería y construcción), con panel administrativo propio.

🌐 **Producción:** https://www.dh-dm-maquinarias.com/

---

## Características de la página

### Sitio público
- **Home**: Hero principal, tablón de anuncios (carrusel), marcas asociadas, maquinaria y productos destacados, sección "Sobre nosotros".
- **Catálogo de Maquinaria y Repuestos**: listado con filtros por categoría (19 categorías, incluida "Réplicas a escala") y página de detalle por producto.
- **Novedades, Blog y Promociones**: contenido editable desde el panel admin, con página de detalle para blog.
- **Nosotros**: información institucional y páginas de detalle por sector especializado (Minería, Construcción).
- **Cotización**: formulario tipo carrito con selector DNI/RUC, envío por WhatsApp o correo; toda solicitud queda registrada en el panel.
- **Contacto**: formulario que registra la solicitud en la base de datos (antes era decorativo, ahora persiste).
- **Cotizador** (`/cotizador`): herramienta de cotización formal con catálogo real, descuentos, ajuste automático por marca (ej. CAT +18%), toggle de dólares, generación de PDF con membrete oficial e historial por usuario (`/cotizador/historial`).
- **Cuentas de usuario**: registro/login (`/registro`, `/login`), roles `visitante`, `cliente`, `admin`, `owner`.
- **Contactos flotantes**: WhatsApp, chatbot (mascota "DoMi") y teléfono.

### Panel administrativo (`/admin`)
- **Editar Página**: Novedades, Blog, Promociones.
- **Administrar Productos**: Maquinaria, Repuestos y Categorías (configurables).
- **Ventas y Cotizaciones**: cotizaciones recibidas (con estado pendiente/respondida/denegada y canal de origen) y registro manual de ventas/boletas.
- **Accesos** (solo `owner`): gestión de quién es admin/owner.

### Arquitectura
- **Frontend**: React 18 + TypeScript + Vite, React Router.
- **Backend**: PHP puro (sin frameworks/Composer) — compatible con hosting compartido. Base de datos SQLite en local, MySQL en producción.
- **Tablas**: usuarios, novedades, blog_posts, promociones, cotizaciones, cotizaciones_formales, maquinarias, repuestos, categorias_productos, ventas.

---

## Despliegue local

### 1. Backend (PHP)

Requisitos: PHP 8.1+ con extensión `pdo_sqlite`.

```bash
cd backend-php
cp config.example.php config.php     # opcional: edita OWNER_EMAIL / OWNER_PASSWORD
php init_sqlite.php                  # crea las tablas en SQLite (solo desarrollo local)
php seed.php                         # crea el primer usuario owner
php load_seed_data.php               # migra datos de ejemplo (novedades/blog/promociones/maquinaria/repuestos)
php add_stock_columns.php            # agrega columnas de stock
php add_placeholder_maquinaria.php   # rellena categorías sin productos con fichas de ejemplo (con foto)
php add_missing_images.php           # completa imagen en productos que no tenían ninguna
php add_blog_images.php              # asigna las fotos reales del blog
php update_pc200_8_image.php         # fuerza la foto real de la Excavadora PC200-8
php -S localhost:8000                # levanta el servidor de desarrollo
```

> Sin correr estos últimos scripts de imágenes, algunas secciones de maquinaria y blog se ven sin foto. Ver `DEPLOY-WEBUZO.md` para el detalle de cada uno y cómo correrlos en producción.

La API queda disponible en `http://localhost:8000` (prueba con `http://localhost:8000/api/health`).

### 2. Frontend

```bash
cp .env.example .env            # deja VITE_API_URL=http://localhost:8000
npm install
npm run dev
```

Abre `http://localhost:5173`. Para entrar al panel, usa `/login` con las credenciales de `config.php`, o directamente `/admin/login`.

---

## Dónde está desplegado

- **Sitio público:** https://www.dh-dm-maquinarias.com/
- **API/backend:** subdominio `api.dh-dm-maquinarias.com` (PHP + MySQL, hosting compartido tipo Webuzo/cPanel).

Para el detalle paso a paso de cómo subir cambios a este hosting (backend y frontend), revisa `DEPLOY-WEBUZO.md`.
