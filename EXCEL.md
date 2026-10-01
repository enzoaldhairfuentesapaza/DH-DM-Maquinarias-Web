# Excel en el panel — versión 2.1.0

## Qué permite

Cada sección tiene **Descargar todo (.xlsx)**, **Plantilla** y **Subir Excel**. También puedes entrar en **Importar / exportar Excel** desde el menú del panel, en `/admin/excel`.

La descarga incluye todos los registros de la sección, incluso si tienes un filtro de búsqueda activo. El archivo tiene una hoja `Datos` y otra `Instrucciones`; conserva la hoja `Datos` para volver a importarlo.

| Secciones | Importar | Exportar | Permiso |
|---|---|---|---|
| Repuestos, maquinaria, categorías, promociones, blog y novedades | Sí, agregar registros | Sí | Admin / owner |
| Ventas, solicitudes y cotizaciones formales | Sí, agregar registros | Sí | Cotizador / admin / owner |
| Sugerencias y reclamos | Sí, agregar registros | Sí | Admin / owner |
| Contactos del sitio | Sí, actualizar por `clave` | Sí | Solo owner |
| Accesos | Sí, crear cuentas con contraseña nueva | Sí, sin contraseñas ni hashes | Owner |
| Auditoría y papelera | No, se generan con las operaciones del panel | Sí | Owner |
| Mis notificaciones | No, se generan con las respuestas | Sí, únicamente las propias | Admin / owner |
| Estadísticas | Se recalculan al importar ventas o solicitudes | Sí, desde Estadísticas | Cotizador / admin / owner |

El historial del cotizador formal tiene un enlace al Centro de Excel. Las cuentas inactivas también figuran en la exportación de accesos; la importación crea cuentas activas nuevas y nunca sustituye una contraseña existente.

## Subir un Excel paso a paso

1. Abre la sección del panel y pulsa **Plantilla**.
2. En Excel o LibreOffice, abre la hoja **Datos**. Conserva la primera fila con los nombres de las columnas.
3. Agrega una fila por registro. La hoja **Instrucciones** indica las columnas obligatorias y sus tipos.
4. Guarda como **.xlsx**. Si tu archivo es `.xls`, conviértelo a `.xlsx` desde Excel.
5. Pulsa **Subir Excel**, selecciona el archivo y revisa la asignación de columnas. Puedes adaptar un Excel existente asignando sus encabezados a las columnas del sistema.
6. Ignora `id`, fechas de creación y otros campos que no se puedan importar. No se modifican registros existentes a partir de su ID.
7. Pulsa **Revisar filas antes de guardar**. Mira los errores, avisos y filas que se omitirán. Abre **Ver datos** para comprobar las columnas de cada fila; las contraseñas quedan ocultas. En archivos grandes, usa **Filas anteriores / siguientes** para recorrer la revisión.
8. Corrige los errores en tu Excel y vuelve a subirlo. La confirmación queda deshabilitada mientras haya filas inválidas.
9. Pulsa **Confirmar importación** y espera el resumen de creados, actualizados y omitidos.

**Límites:** 10 MB por archivo, 20 000 filas de datos, 100 columnas y 50 MB de contenido descomprimido. Se rechazan fórmulas: copia sus resultados y pégalos como valores antes de subirlos. No importes varias veces con la opción de permitir duplicados activada si hubo un fallo a mitad de la carga.

El servidor procesa lotes de hasta 500 filas, ajustados para no superar el tamaño permitido de una solicitud. Un lote inválido no guarda ninguna de sus filas. Si falla un lote posterior, los anteriores permanecen guardados y se informa cuánto se alcanzó a importar. Revisa nuevamente el archivo; la omisión de claves existentes evita repetir los registros ya guardados.

## Formato de las celdas

| Tipo | Ejemplo | Recomendación |
|---|---|---|
| Texto / códigos | `00123-A`, `00012345` | Formatea la columna como Texto antes de escribir. Si Excel ya eliminó ceros iniciales, el importador no puede reconstruirlos. |
| Número | `5`, `125.50` | Usa una celda numérica, sin símbolo monetario escrito dentro del valor. El stock debe ser un entero no negativo. |
| Booleano | `Sí`, `No`, `true`, `false`, `1`, `0` | Se convierten a verdadero/falso; otros textos producen error. |
| Fecha del contenido | `01 oct. 2026` o `2026-10-01` | Las fechas de blog/novedades/ventas son texto; una fecha real de Excel se convierte a `AAAA-MM-DD`. |
| Imagen | `/maquinaria/referencias/cat-320d.jpg` | Ruta local existente o URL HTTP/HTTPS. |
| Párrafos / modelos (JSON) | `["Primer párrafo","Segundo párrafo"]` | Una lista JSON dentro de una celda. |
| Especificaciones de maquinaria (JSON) | `[{"label":"Potencia","valor":"100 HP"}]` | Lista de objetos con `label` y `valor`. |
| Productos de venta (JSON) | `[{"nombre":"Filtro","cantidad":"2","precio":"15"}]` | Lista de productos. |
| Solicitud de cotización (JSON) | `{"productos":[{"tipo":"repuesto","nombre":"Filtro","cantidad":2}],"mensaje":"Consultar stock"}` | Objeto en `detalle`. Tipos de producto: `repuesto` o `maquinaria`. |
| Cotización formal (JSON) | `[{"code":"001-A","brand":"CAT","desc":"Filtro","unit":"UND","qty":2,"price":15,"currency":"PEN","discounts":[],"brandAdjustments":[]}]` | Lista en `items`, con `qty` positiva y `price` no negativo. Conserva la estructura de un Excel exportado del cotizador. |

Las imágenes incrustadas dentro del Excel no se suben. Para una imagen nueva, súbela desde la edición del producto y utiliza su ruta; para muchas filas que comparten una imagen, copia esa ruta en la columna `imagen`.

Las columnas JSON se exportan con el formato correcto y se pueden volver a importar sin convertirlas. Los archivos privados, adjuntos de respuestas, propiedad de cuentas y fechas internas no se reasignan desde Excel.

## Duplicados

Por defecto se omiten las claves existentes tanto en la base como dentro del archivo:

| Sección | Clave de comparación |
|---|---|
| Repuestos | `codigo` |
| Maquinaria | `nombre` |
| Blog, novedades, promociones | `titulo` |
| Ventas | `numero_boleta` |
| Categorías | `tipo` + `nombre` |
| Accesos | `email` |
| Cotizaciones formales | `numero` |
| Solicitudes | Nombre del cliente + correo + detalle |
| Sugerencias | Tipo + nombre + correo + mensaje |
| Configuración | `clave`; actualiza el valor en vez de omitirlo |

La comparación ignora mayúsculas, espacios repetidos y tildes habituales. Puedes permitir claves repetidas en tablas que lo admiten; correos y categorías únicas siempre se omiten.

**Mismo nombre no equivale necesariamente a mismo repuesto.** Dos repuestos con nombres iguales y códigos diferentes se importan. En el panel aparece un tag de aviso. Los tags también aparecen en las listas y formularios de maquinaria, promociones, blog, novedades, categorías y usuarios; no se muestran en la web pública ni bloquean por sí solos una edición.

## Cotizaciones separadas desde 2.1

En las bandejas de repuestos o maquinaria, Descargar todo exporta únicamente el grupo de esa bandeja. El Centro de Excel puede exportar todas las solicitudes. No se importan solicitudes mixtas: usa dos filas, una con productos de tipo `repuesto` y otra con productos de tipo `maquinaria`. Importar en una bandeja también comprueba que la fila corresponda a ese grupo. La configuración de teléfonos y correo ahora es exclusiva del owner.

Contacto se exporta desde su propia sección (solo admin/owner) y queda excluido de los Excel de cotizaciones. El historial de la calculadora identifica las oficiales y sus vínculos. Importar filas al historial no registra cotizaciones oficiales ni PDFs: el registro oficial requiere el switch y el guardado desde la calculadora.
