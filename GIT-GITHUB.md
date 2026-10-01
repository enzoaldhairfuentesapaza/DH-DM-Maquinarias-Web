# Actualizar el repositorio antiguo y trabajar con GitHub

Esta guía usa PowerShell en Windows. Sustituye URL_DEL_REPOSITORIO y CARPETA_DEL_REPO por los valores reales. Los ejemplos usan la rama main; si tu repositorio usa master u otra rama, reemplaza main por ese nombre.

## 1. Clonar y guardar un punto de retorno

```powershell
git clone URL_DEL_REPOSITORIO
cd CARPETA_DEL_REPO
git branch --show-current
git status
git branch respaldo-antes-1.6.1
```

La rama de respaldo conserva el estado antiguo en tu equipo. Si también quieres guardarla en GitHub:

```powershell
git push origin respaldo-antes-1.6.1
```

## 2. Reemplazar los archivos con las fuentes nuevas

Extrae DH-DM-fuentes-1.6.1-github.zip en una carpeta aparte. Abre su carpeta DH-DM-1.6.1: debes ver package.json, src/, public/, backend-php/ y .gitignore.

Dentro de la carpeta clonada, activa Ver > Mostrar > Elementos ocultos en el Explorador y conserva la carpeta .git. Esa carpeta contiene el historial y la conexión con GitHub: no la borres ni la reemplaces.

Si ya habías configurado esa copia, guarda aparte .env, backend-php/config.local.php, bases locales y archivos de backend-php/uploads/ y backend-php/private/. No están incluidos en las fuentes nuevas.

Retira los demás archivos de la versión antigua y copia el CONTENIDO de DH-DM-1.6.1 dentro de la carpeta clonada. No copies esa carpeta como un nivel adicional. Retirar los archivos viejos evita dejar módulos que ya no existen en la versión nueva. Conserva o revisa cualquier archivo específico de tu repositorio que necesites, como workflows de .github/ o una licencia.

## 3. Revisar los cambios y archivos ignorados

```powershell
git status --short
git diff --stat
git ls-files -ci --exclude-standard
```

El último comando lista archivos que Git ya seguía pero ahora están ignorados. .gitignore no deja de seguir archivos que ya se subieron. Si la lista contiene bases, configuraciones privadas, node_modules u otros archivos que deben quedar fuera, revisa la lista y después retíralos del índice:

```powershell
$ignorados = @(git ls-files -ci --exclude-standard)
$ignorados | ForEach-Object { git rm --cached -- "$_" }
```

Esto conserva los archivos locales; el siguiente commit elimina su seguimiento. Si alguna credencial real estaba en el repositorio antiguo, cambia esa credencial: este procedimiento no la borra del historial.

El .gitignore conserva package-lock.json, las imágenes públicas y los SQL de esquema/migración. .env.production está versionado porque en esta entrega contiene únicamente VITE_API_URL vacío; nunca añadas secretos a ese archivo ni a otras variables VITE_.

## 4. Probar y subir la actualización

```powershell
npm ci
npm run lint
npm run build
git add -A
git diff --cached --stat
git status
git commit -m "Actualiza DH & DM a 1.6.1: correcciones y preparación de despliegue"
git push origin main
```

Revisa que el commit no incluya credenciales ni bases personales. git add -A incluye también la eliminación de archivos antiguos. Para configurar y probar PHP localmente, sigue la sección Desarrollo de README.md.

Clonar y reemplazar los archivos no requiere un push forzado: el commit nuevo parte del historial antiguo y actualiza todo el contenido. Si GitHub tiene commits nuevos desde tu clonación y rechaza el push, primero revisa esos cambios y usa git pull --rebase origin main; resuelve conflictos y repite el push normal.

Solo si decides reemplazar deliberadamente el historial de la rama remota, y ya revisaste qué commits se perderían, usa:

```powershell
git push --force-with-lease origin main
```

--force-with-lease rechaza la operación si la rama remota cambió respecto al estado que tu copia conoce. Evita --force, que puede sobrescribir cambios ajenos sin esa comprobación. En el flujo de esta guía no hay necesidad de reescribir el historial.

## 5. Cambios pequeños a partir de ahora

Antes de empezar, con la carpeta de trabajo limpia:

```powershell
git pull --ff-only
```

Haz un cambio concreto, compruébalo y súbelo:

```powershell
npm run lint
npm run build
git add -A
git diff --cached --stat
git commit -m "Describe el cambio concreto"
git push
```

Usa un commit por conjunto de cambios relacionado. Publicar en GitHub guarda el código; el despliegue al hosting sigue los pasos de DEPLOY-WEBUZO.md.
