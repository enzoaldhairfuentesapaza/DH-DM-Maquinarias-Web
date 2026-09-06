# HDM Maquinarias — Actualización grande (v6)

## Qué se agregó/corrigió en esta ronda

### Contenido y textos
- 8 años de experiencia (antes decía 15) en Hero y "Sobre nosotros".
- Teléfono unificado a **+51 942 203 833** en todos lados (Footer, Contacto, WhatsApp flotante, Cotización, Cotizador).
- "Asesoría a la compra del producto" en vez de "asesoría técnica especializada".
- Sectores especializados: ahora solo Minería y Construcción, con páginas de detalle reales (`/nosotros/sectores/mineria` y `/nosotros/sectores/construccion`) con fotos y contenido redactado.
- Card de "Sobre nosotros" corregida (tenía un título de relleno sin terminar y una imagen vacía).

### Bug importante corregido: contenido no se actualizaba
Las páginas públicas (Novedades, Blog, Promociones, Maquinaria, Repuestos y sus detalles) **no estaban conectadas a la base de datos** — seguían leyendo archivos estáticos viejos. Por eso borrar/editar algo en el panel no se reflejaba en el sitio. Ya está resuelto: las 8 páginas ahora leen en tiempo real desde tu API.

### Panel administrativo
- Botón **"Ver sitio público"** ahora es una burbuja flotante visible en todas las pestañas del panel.
- Nueva sección **Categorías** (dentro de "Administrar Productos"): agrega, edita o quita categorías de maquinaria y repuestos — incluye **"Réplicas a escala"**.
- Los formularios de Maquinaria/Repuestos ahora usan esas categorías (selector) en vez de texto libre.
- Sección **Ventas y Cotizaciones → Cotizaciones recibidas**: ahora también muestra el **canal de origen** (`whatsapp`, `correo`, `contacto`) de cada solicitud.

### Formularios del sitio (Cotización y Contacto)
- Selector **DNI / RUC**: si eliges DNI pide solo el número; si eliges RUC pide también la razón social.
- El formulario de **Contacto** antes no guardaba nada (era decorativo) — ahora sí registra la solicitud en tu base de datos.
- El formulario de **Cotización** (carrito) ahora tiene 2 botones: **enviar por WhatsApp** o **enviar por correo**, y ambos quedan guardados en el panel con su canal de origen.

### Cotizador (nuevo, en `/cotizador`)
Se portó la herramienta completa (antes standalone en Netlify + Supabase) a React + PHP, conectada a tu base de datos:
- Requiere **iniciar sesión** (cualquier rol). Si entras sin sesión, se abre el modal de login sin sacarte de la página.
- El buscador de productos usa tu **catálogo real** (maquinaria + repuestos), ya no la lista propia y desactualizada.
- **Descuentos sin botón "+"**: escribe un número y se aplica al instante; el "+" es solo para agregar descuentos adicionales acumulados. Igual para ajustes por marca (CAT +18% automático se mantiene).
- Toggle **"Mostrar en dólares"** que omite la conversión por tipo de cambio.
- Genera **PDF con tu membrete oficial** (mismo diseño que ya usaban).
- **Historial** en `/cotizador/historial`, guardado en tu MySQL — cada usuario ve las suyas, admin/owner ven todas.
- Navegación cruzada: desde el cotizador puedes ir al panel admin o al sitio público.

### Diseño (fusionado con la versión de tus compañeros)
- Iconos SVG reales de redes sociales en el Footer + links clicables de mapa/teléfono/correo.
- Sectores con fotos reales y páginas de detalle (en vez de solo iconos).
- Mascota "DoMi" en el chatbot y el botón flotante de chat.
- Se revisó el resto de componentes compartidos (anuncios, cards de repuestos, blog destacado, modal legal) — no tenían cambios relevantes que fusionar.

## Nuevas tablas en la base de datos

Si ya tenías la base de datos de la ronda anterior, necesitas agregar las tablas nuevas:
- `cotizaciones_formales` (el cotizador)
- `categorias_productos` (categorías configurables)
- Columnas nuevas en `cotizaciones`: `respuesta`, `motivo_denegacion` (si no las tenías ya de la ronda pasada)

### Cómo actualizar tu base de datos en producción sin perder datos

Como `CREATE TABLE IF NOT EXISTS` no toca tablas que ya existen, es seguro volver a correr todo `schema.mysql.sql` en phpMyAdmin — solo creará las tablas nuevas, no dañará las existentes. Después, sube `load_seed_data.php` de nuevo (ya lo habías borrado por seguridad la vez pasada) a `public_html/api/`, visita `https://api.dh-dm-maquinarias.com/api/load_seed_data.php` una vez (es seguro, no duplica lo que ya existe), y bórralo de nuevo.

## Cómo subir esta actualización a tu hosting

### 1. Backend

Sube (reemplazando) estos archivos a `public_html/api/`:
- `index.php`
- `crud.php`
- `helpers.php`
- `schema.mysql.sql` (referencia)

Corre el `schema.mysql.sql` actualizado en phpMyAdmin, luego sube temporalmente `load_seed_data.php`, visítalo una vez, y bórralo de nuevo.

### 2. Frontend

```powershell
npm install
npm run build
```

Recuerda copiar tu `.htaccess` dentro de la nueva carpeta `dist` (el build la borra cada vez). Comprime el contenido de `dist`, súbelo a `public_html` reemplazando lo anterior (sin tocar la carpeta `api`), igual que las veces anteriores.

### 3. Verifica

- Entra a `/cotizador` y confirma que te pida iniciar sesión.
- Borra una promoción desde el panel y confirma que desaparece del sitio público.
- Revisa que el teléfono nuevo aparezca en el footer.

## Pendiente para el futuro (no incluido en esta ronda)

- Números de cotización secuenciales visibles antes de guardar.
- Reportes/estadísticas de ventas y cotizaciones.
- Gestión de clientes más allá del registro básico.
