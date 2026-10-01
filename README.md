# DH & DM Maquinarias

Sitio corporativo y sistema de gestión de maquinaria, repuestos y cotizaciones. Versión **2.0.0**. Desarrollado con React, TypeScript y Vite, con una API PHP. SQLite se usa para desarrollo; MySQL/MariaDB para producción.

Sitio de producción configurado: https://dh-dm-maquinarias.com/. La configuración del proyecto no confirma que esta versión esté publicada en el hosting.

## Documentación

| Archivo | Qué encontrarás |
|---|---|
| [VERSION-2.md](VERSION-2.md) | Cambios y actualización desde tu copia 1.6.1, con comandos PowerShell |
| [EXCEL.md](EXCEL.md) | Plantillas, importación, exportación, formatos y duplicados |
| [LOCAL.md](LOCAL.md) | Preparación de PHP, entorno local, base, owner, catálogo y arranque en Windows/PowerShell |
| [DEPLOY-WEBUZO.md](DEPLOY-WEBUZO.md) | Compilación, MySQL, instalación o actualización en Webuzo/Apache y reversión |
| [IMAGENES-LOCALES.md](IMAGENES-LOCALES.md) | Corrección de imágenes iniciales y actualización de bases ya creadas |
| [GIT-GITHUB.md](GIT-GITHUB.md) | Actualizar el repositorio y subir cambios pequeños |
| [REVISION-1.6.1.md](REVISION-1.6.1.md) | Correcciones técnicas, pruebas y límites de la revisión |

Empieza por LOCAL.md para trabajar en tu equipo. El README describe el proyecto; los comandos de instalación y publicación están en sus guías correspondientes.

## Funciones públicas

| Sección | Funciones |
|---|---|
| Inicio | Presentación de la empresa, maquinaria/repuestos destacados, marcas, sectores, promociones y noticias |
| Nosotros | Información de la empresa y páginas de sectores |
| Maquinaria | Catálogo y ficha de cada máquina |
| Repuestos | Catálogo, búsqueda por texto/código, filtros, paginación y fichas |
| Blog, novedades y promociones | Contenido publicado desde el panel |
| Cotización | Selección de productos y cantidades para enviar una solicitud |
| Contacto | Información comercial y envío de consultas |
| Cuenta | Registro, inicio de sesión, perfil e historial propio de solicitudes |
| Sugerencias y contactos flotantes | Formulario de sugerencias y accesos de contacto |

Una cuenta de cliente puede consultar las respuestas que el equipo marque como visibles y descargar sus adjuntos autorizados. El cotizador formal es una herramienta interna distinta del formulario público de cotización.

## Panel y roles

| Rol | Acceso principal |
|---|---|
| Visitante | Catálogos, contenido público y formularios públicos |
| Cliente | Perfil, historial propio y respuestas/adjuntos visibles |
| Cotizador | Ventas, solicitudes, estadísticas y cotizador formal |
| Admin | Lo anterior, productos, categorías, contenido, contactos y sugerencias |
| Owner | Lo anterior, gestión de cuentas/roles, auditoría y papelera |

El panel se abre en `/admin`; el acceso está en `/admin/login`. Los permisos se comprueban también en PHP, no solo en los menús.

El cotizador formal permite agregar productos, aplicar ajustes por marca, trabajar con PEN/USD y tipo de cambio, generar PDF y consultar historial. `/cotizador` abre esa herramienta y `/cotizador/historial` abre su historial. Sus archivos están en **public/cotizador-app/**. Guardar una cotización recuperada del historial crea una copia. Los PDF mantienen el redondeo de precios a enteros de la regla comercial existente.

## Novedades de 2.0.0

Portada de promociones destacadas con rotación cada seis segundos, controles y pausa; se retira la promoción duplicada junto al tablón. Los globos de sugerencias y cotización ya no se superponen.

El panel incorpora vistas previas ampliadas a escala real en escritorio/móvil, avisos de nombres repetidos y un Centro de Excel: plantillas, importación con revisión y exportación completa de las tablas. Los registros de auditoría, papelera y notificaciones se exportan; las estadísticas se descargan desde su página. Los permisos existentes se mantienen también en la API.

Para actualizar una copia ya instalada, comienza por **VERSION-2.md**; para instalar desde cero, usa **LOCAL.md**. Marca varias promociones como destacadas en el panel para activar la rotación.

## Correcciones previas de 1.6.1

- Configuración PHP privada separada, migraciones aditivas y utilidades disponibles solo por terminal.
- Autenticación JWT más estricta y revocación de sesiones al restablecer contraseñas.
- Validación en el servidor, límites de frecuencia y permisos para el cotizador interno.
- Adjuntos de respuesta privados con descarga autorizada; se respeta la visibilidad del cliente.
- Actualizaciones parciales que conservan los campos omitidos.
- Catálogo completo accesible mediante paginación y búsqueda de códigos con/sin guiones.
- Correcciones de móvil, historial, monedas, generación de PDF e interpolaciones HTML.
- Reglas Apache para recargar rutas internas y separar la API de la navegación React.
- Carga diferida por página: JavaScript inicial de unos 847 KB a 272 KB en la compilación revisada.
- Paquete de publicación con frontend y API mínima separados de las utilidades de mantenimiento.

Validación de la revisión: 61 comprobaciones de API en SQLite y 61 en MariaDB, 16 en navegador, 8 de JWT y 10 de Apache; compilación/lint correctos. Los resultados conservados están en tests/resultados/. La auditoría de dependencias terminó con 0 vulnerabilidades conocidas en esa consulta; conviene repetirla al actualizar paquetes.

## Configuración de entornos

| Archivo | Uso | ¿Se sube a Git? |
|---|---|---|
| `.env.example` | Plantilla pública: API local en http://localhost:8000 | Sí |
| `.env.development.local` | Copia local de la plantilla, cargada al ejecutar npm run dev | No |
| `.env.production` | API pública en https://dh-dm-maquinarias.com al compilar | Sí |
| `backend-php/config.example.php` | Valores predeterminados y lectura de variables del servidor | Sí |
| `backend-php/config.production.example.php` | Plantilla PHP para el hosting | Sí |
| `backend-php/config.local.php` | Configuración privada del backend local | No |
| `public_html/api/config.local.php` | Configuración privada de producción creada en el hosting | No |

VITE_API_URL es el origen, sin `/api` ni barra final. React y el cotizador usan ese origen; el cliente agrega `/api` donde corresponde. Las variables VITE_ son públicas y se incorporan al compilar. PHP **no lee automáticamente** los archivos .env de Vite: MySQL, JWT y owner se configuran aparte.

npm run dev usa el modo development; npm run build y npm run release usan production. Para comprobar el sitio local completo usa el servidor de desarrollo y la API local. npm run preview sobre una compilación de producción consultaría la API configurada de producción.

## Estructura

| Ruta | Contenido |
|---|---|
| src/pages/ | Páginas públicas y panel administrativo |
| src/components/ | Componentes de interfaz |
| src/context/ | Autenticación, carrito y mensajes de interfaz |
| src/api/ | Cliente HTTP y resolución de archivos |
| src/types/, hooks/, utils/ | Tipos y utilidades compartidas |
| public/ | Imágenes, reglas Apache y cotizador estático |
| backend-php/ | API, esquemas, migraciones y utilidades CLI |
| backend-php/seed_data/ | Catálogos y contenido inicial de muestra |
| scripts/ | Preparación de vendor y paquete de publicación |
| tests/ | Pruebas de API/JWT y resultados de la revisión |
| dist/ | Frontend compilado; generado e ignorado |
| release/ | Paquete para publicación; generado e ignorado |

## Comandos del frontend

Desde la raíz del proyecto, con las dependencias instaladas:

```powershell
npm run dev
npm run lint
npm run typecheck
npm run check:images
npm run build
npm run release
```

Ejecuta el comando que corresponda a tu tarea. dev mantiene la terminal ocupada; Ctrl+C lo detiene. release ejecuta lint, build y la preparación del paquete. Las guías explican cómo ejecutar las pruebas PHP y qué configuración usar antes de cada comando.

## Criterios para mantenerlo limpio

- Mantener un único documento por tarea y retirar guías antiguas duplicadas.
- Conservar package-lock.json; instalar con npm ci y comprobar cada cambio antes de subirlo.
- Separar archivos generados, datos locales y credenciales mediante .gitignore.
- Mantener el cotizador en public/cotizador-app; no conservar otra copia activa en la raíz.
- Cambiar nombres y mover módulos solo después de revisar imports y usos.
- Hacer refactorizaciones pequeñas: componentes del panel grandes, utilidades compartidas y pruebas de los flujos afectados.

Pendientes para una etapa posterior: paginación/filtros desde la API, optimización de imágenes, posible sesión con cookies HttpOnly y revisión de datos estáticos frente a la base. Son cambios funcionales; esta reorganización de documentación no los implementa.

### Imágenes iniciales

El blog y la maquinaria de muestra ya tienen rutas locales; las fotos externas de referencia están incluidas y acreditadas en /creditos-imagenes.html. build comprueba que los archivos iniciales existan. Los repuestos sin foto original conservan su estado sin fotografía; no se les asignan fotos de otros productos.
