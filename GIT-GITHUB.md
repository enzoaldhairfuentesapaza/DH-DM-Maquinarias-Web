# Trabajar con GitHub — versión 2.0.0

Si ya clonaste tu repositorio y reemplazaste la versión antigua, no necesitas repetir ese proceso. Para aplicar esta entrega conservando configuración, base local y archivos subidos, sigue **VERSION-2.md**; allí están los comandos de respaldo, copia y creación de la rama `version-2`.

## Revisar lo que se versiona

```powershell
Set-Location -LiteralPath 'D:\ENZO\TEC COMPANY\DH-DM-Maquinarias-Web'
git status --short
git ls-files -ci --exclude-standard
git remote -v
```

`git ls-files -ci --exclude-standard` debería no devolver nada. Si devuelve archivos, siguen rastreados aunque ahora estén en `.gitignore`; revísalos antes de subir. La guía no retira archivos automáticamente del índice.

Se suben código, imágenes públicas, `package.json`, `package-lock.json`, documentación, pruebas, `.env.example` y `.env.production` (contiene solo el dominio público). No se suben `node_modules`, `dist`, `release`, `.env.development.local`, `config.local.php`, bases SQLite ni los archivos privados/subidos por clientes. Si una contraseña se llegó a publicar antes, quitar el archivo del siguiente commit no la elimina del historial: cambia esa contraseña.

## Un cambio pequeño

Cambia el nombre de la rama para describir lo que estás haciendo. Este ejemplo sirve para ajustar el inicio:

```powershell
Set-Location -LiteralPath 'D:\ENZO\TEC COMPANY\DH-DM-Maquinarias-Web'
git switch -c mejora-inicio
if ($LASTEXITCODE -ne 0) { throw 'No se creó la rama.' }
```

Después de editar y probar localmente:

```powershell
npm run lint
if ($LASTEXITCODE -ne 0) { throw 'Lint encontró errores.' }
npm run typecheck
if ($LASTEXITCODE -ne 0) { throw 'TypeScript encontró errores.' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación.' }
git diff --stat
git diff
git add .
git diff --cached --stat
git commit -m "Mejora la presentación del inicio"
if ($LASTEXITCODE -ne 0) { throw 'No se creó el commit.' }
git push -u origin mejora-inicio
if ($LASTEXITCODE -ne 0) { throw 'No se subió la rama.' }
```

En GitHub, abre un pull request de esa rama a la rama principal de tu repositorio. Revisar los cambios antes de integrarlos facilita detectar errores. Para el flujo habitual usa push normal; un push forzado no hace falta para actualizar los archivos y puede sobrescribir trabajo remoto.

Cuando cambies dependencias conserva el lockfile y ejecuta `npm ci` en las demás copias. Cuando cambies PHP o permisos, ejecuta las pruebas de API que indica **LOCAL.md**. Los commits no publican el hosting: el despliegue se hace con **DEPLOY-WEBUZO.md**.
