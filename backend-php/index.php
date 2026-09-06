<?php
// No mostrar errores crudos de PHP al usuario (rutas del servidor, stack traces, etc.)
ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/crud.php';

// Cualquier excepcion no controlada (ej. error de base de datos) se responde
// como JSON limpio en vez de romper la pagina con un stack trace.
set_exception_handler(function (Throwable $e) {
    error_log('[HDM API] ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['detail' => 'Ocurrio un error interno. Intenta de nuevo en unos segundos.']);
    exit;
});

apply_cors();

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = rtrim($path, '/');
$method = $_SERVER['REQUEST_METHOD'];

// Quita el prefijo /api (todas las rutas del frontend llaman a /api/...)
if (str_starts_with($path, '/api')) {
    $path = substr($path, 4);
}
$segments = array_values(array_filter(explode('/', $path)));

// ---------- /health ----------
if ($segments === ['health']) {
    json_response(['status' => 'ok']);
}

// ---------- /auth/... ----------
if (($segments[0] ?? null) === 'auth') {
    $sub = $segments[1] ?? null;

    if ($sub === 'login' && $method === 'POST') {
        $body = get_json_body();
        $email = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';
        $stmt = db()->prepare('SELECT * FROM usuarios WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        if (!$user || !verify_password($password, $user['hashed_password'])) {
            json_error('Credenciales incorrectas', 401);
        }
        if (!$user['activo']) {
            json_error('Usuario inactivo', 403);
        }
        $token = jwt_encode(
            ['sub' => $user['id'], 'rol' => $user['rol']],
            config()['secret_key'],
            config()['token_expire_seconds']
        );
        json_response(['access_token' => $token, 'token_type' => 'bearer']);
    }

    if ($sub === 'me' && $method === 'GET') {
        json_response(sanitize_user(current_user()));
    }

    if ($sub === 'me' && $method === 'PUT') {
        $me = current_user();
        $body = get_json_body();
        $stmt = db()->prepare(
            'UPDATE usuarios SET nombre = ?, telefono = ?, tipo_documento = ?, numero_documento = ?, razon_social = ? WHERE id = ?'
        );
        $stmt->execute([
            $body['nombre'] ?? $me['nombre'],
            $body['telefono'] ?? null,
            $body['tipo_documento'] ?? null,
            $body['numero_documento'] ?? null,
            $body['razon_social'] ?? null,
            $me['id'],
        ]);
        $stmt = db()->prepare('SELECT * FROM usuarios WHERE id = ?');
        $stmt->execute([$me['id']]);
        json_response(sanitize_user($stmt->fetch()));
    }

    if ($sub === 'registro' && $method === 'POST') {
        $body = get_json_body();
        $email = trim($body['email'] ?? '');
        $newId = insert_or_conflict(
            'INSERT INTO usuarios (nombre, email, hashed_password, rol, telefono, tipo_documento, numero_documento, razon_social) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $body['nombre'] ?? '',
                $email,
                hash_password($body['password'] ?? ''),
                'cliente',
                $body['telefono'] ?? null,
                $body['tipo_documento'] ?? null,
                $body['numero_documento'] ?? null,
                $body['razon_social'] ?? null,
            ],
            'Ese email ya esta registrado'
        );
        $stmt = db()->prepare('SELECT * FROM usuarios WHERE id = ?');
        $stmt->execute([$newId]);
        json_response(sanitize_user($stmt->fetch()), 201);
    }

    json_error('Ruta no encontrada', 404);
}

// ---------- /novedades, /blog, /promociones, /maquinaria, /repuestos, /ventas ----------
if (in_array($segments[0] ?? null, ['novedades', 'blog', 'promociones', 'maquinaria', 'repuestos', 'ventas'], true)) {
    $entityKey = $segments[0];
    $id = $segments[1] ?? null;
    crud_handle($entityKey, $method, $id);
}

// ---------- /accesos (solo owner) ----------
if (($segments[0] ?? null) === 'accesos') {
    $userIdParam = $segments[1] ?? null;
    $subAction = $segments[2] ?? null; // ej. "rol"

    if ($method === 'GET' && $userIdParam === null) {
        require_owner();
        $rows = db()->query(
            "SELECT * FROM usuarios
             ORDER BY CASE rol WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, id ASC"
        )->fetchAll();
        json_response(array_map('sanitize_user', $rows));
    }

    if ($method === 'POST' && $userIdParam === null) {
        require_owner();
        $body = get_json_body();
        $rol = $body['rol'] ?? 'admin';
        if (!in_array($rol, ['admin', 'owner'], true)) {
            json_error('Rol invalido, usa el endpoint de registro para clientes', 400);
        }
        $email = trim($body['email'] ?? '');
        $newId = insert_or_conflict(
            'INSERT INTO usuarios (nombre, email, hashed_password, rol) VALUES (?, ?, ?, ?)',
            [$body['nombre'] ?? '', $email, hash_password($body['password'] ?? ''), $rol],
            'Ese email ya esta registrado'
        );
        $stmt = db()->prepare('SELECT * FROM usuarios WHERE id = ?');
        $stmt->execute([$newId]);
        json_response(sanitize_user($stmt->fetch()), 201);
    }

    if ($method === 'PUT' && $userIdParam !== null && $subAction === 'rol') {
        $current = require_owner();
        if ((int) $userIdParam === (int) $current['id']) {
            json_error('No puedes cambiar tu propio rol', 400);
        }
        $body = get_json_body();
        $stmt = db()->prepare('UPDATE usuarios SET rol = ? WHERE id = ?');
        $stmt->execute([$body['rol'] ?? 'cliente', $userIdParam]);
        $stmt = db()->prepare('SELECT * FROM usuarios WHERE id = ?');
        $stmt->execute([$userIdParam]);
        $row = $stmt->fetch();
        if (!$row) json_error('Usuario no encontrado', 404);
        json_response(sanitize_user($row));
    }

    if ($method === 'DELETE' && $userIdParam !== null) {
        $current = require_owner();
        if ((int) $userIdParam === (int) $current['id']) {
            json_error('No puedes revocarte tu propio acceso', 400);
        }
        $stmt = db()->prepare('SELECT id FROM usuarios WHERE id = ?');
        $stmt->execute([$userIdParam]);
        if (!$stmt->fetch()) json_error('Usuario no encontrado', 404);
        db()->prepare("UPDATE usuarios SET rol = 'cliente' WHERE id = ?")->execute([$userIdParam]);
        json_response(['ok' => true]);
    }

    json_error('Ruta no encontrada', 404);
}

// ---------- /cotizaciones (preparado para el futuro) ----------
if (($segments[0] ?? null) === 'cotizaciones') {
    if ($method === 'POST') {
        $user = optional_user();
        $body = get_json_body();

        $nombreCliente = trim($body['nombre_cliente'] ?? '');
        $emailCliente = trim($body['email_cliente'] ?? '');
        // Siempre exigimos saber quien hizo la solicitud, sea cliente
        // registrado o visitante que lleno el formulario de invitado.
        if ($nombreCliente === '' || $emailCliente === '') {
            json_error('Falta informacion del cliente (nombre y correo son obligatorios)', 400);
        }

        $stmt = db()->prepare(
            'INSERT INTO cotizaciones
             (nombre_cliente, email_cliente, telefono_cliente, empresa, detalle, origen, usuario_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $nombreCliente,
            $emailCliente,
            $body['telefono_cliente'] ?? null,
            $body['empresa'] ?? null,
            json_encode($body['detalle'] ?? [], JSON_UNESCAPED_UNICODE),
            $body['origen'] ?? 'web',
            $user['id'] ?? null,
        ]);
        $newId = db()->lastInsertId();
        $stmt = db()->prepare('SELECT * FROM cotizaciones WHERE id = ?');
        $stmt->execute([$newId]);
        $row = $stmt->fetch();
        $row['detalle'] = json_decode($row['detalle'], true) ?? [];
        json_response($row, 201);
    }

    if ($method === 'GET' && ($segments[1] ?? null) === null) {
        require_admin_or_owner();
        $rows = db()->query('SELECT * FROM cotizaciones ORDER BY id DESC')->fetchAll();
        foreach ($rows as &$r) {
            $r['detalle'] = json_decode($r['detalle'], true) ?? [];
        }
        json_response($rows);
    }

    // /cotizaciones/{id} -> detalle individual
    if ($method === 'GET' && ($segments[1] ?? null) !== null && ($segments[2] ?? null) === null) {
        require_admin_or_owner();
        $stmt = db()->prepare('SELECT * FROM cotizaciones WHERE id = ?');
        $stmt->execute([$segments[1]]);
        $row = $stmt->fetch();
        if (!$row) json_error('No encontrada', 404);
        $row['detalle'] = json_decode($row['detalle'], true) ?? [];
        json_response($row);
    }

    // /cotizaciones/{id}/estado -> actualizar estado (pendiente/respondida/denegada)
    if ($method === 'PUT' && ($segments[1] ?? null) !== null && ($segments[2] ?? null) === 'estado') {
        require_admin_or_owner();
        $id = $segments[1];
        $body = get_json_body();
        $estado = $body['estado'] ?? null;
        if (!in_array($estado, ['pendiente', 'respondida', 'denegada'], true)) {
            json_error('Estado invalido', 400);
        }
        $stmt = db()->prepare('SELECT id FROM cotizaciones WHERE id = ?');
        $stmt->execute([$id]);
        if (!$stmt->fetch()) json_error('No encontrada', 404);

        $stmt = db()->prepare(
            'UPDATE cotizaciones SET estado = ?, respuesta = ?, motivo_denegacion = ? WHERE id = ?'
        );
        $stmt->execute([
            $estado,
            $body['respuesta'] ?? null,
            $body['motivo_denegacion'] ?? null,
            $id,
        ]);

        $stmt = db()->prepare('SELECT * FROM cotizaciones WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        $row['detalle'] = json_decode($row['detalle'], true) ?? [];
        json_response($row);
    }

    // /cotizaciones/{id} -> eliminar (ej. spam)
    if ($method === 'DELETE' && ($segments[1] ?? null) !== null) {
        require_admin_or_owner();
        $id = $segments[1];
        $stmt = db()->prepare('SELECT id FROM cotizaciones WHERE id = ?');
        $stmt->execute([$id]);
        if (!$stmt->fetch()) json_error('No encontrada', 404);
        db()->prepare('DELETE FROM cotizaciones WHERE id = ?')->execute([$id]);
        json_response(['ok' => true]);
    }

    json_error('Ruta no encontrada', 404);
}

// ---------- /uploads (subir imagenes, solo admin/owner) ----------
if (($segments[0] ?? null) === 'uploads' && $method === 'POST') {
    require_admin_or_owner();

    if (!isset($_FILES['file'])) {
        json_error('No se envio ningun archivo', 400);
    }
    $file = $_FILES['file'];
    $allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $allowedExt, true)) {
        json_error('Formato de imagen no permitido', 400);
    }
    $maxBytes = 5 * 1024 * 1024;
    if ($file['size'] > $maxBytes) {
        json_error('La imagen supera los 5MB', 400);
    }

    $uploadsDir = config()['uploads_dir'];
    if (!is_dir($uploadsDir)) {
        mkdir($uploadsDir, 0755, true);
    }
    $filename = bin2hex(random_bytes(16)) . '.' . $ext;
    $destination = $uploadsDir . '/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        json_error('No se pudo guardar la imagen', 500);
    }

    json_response(['url' => config()['uploads_url_prefix'] . '/' . $filename]);
}

// ---------- /categorias (secciones de maquinaria y repuestos) ----------
if (($segments[0] ?? null) === 'categorias') {
    $catId = $segments[1] ?? null;

    if ($method === 'GET' && $catId === null) {
        $tipo = $_GET['tipo'] ?? null;
        if ($tipo && !in_array($tipo, ['maquinaria', 'repuesto'], true)) {
            json_error('Tipo invalido', 400);
        }
        if ($tipo) {
            $stmt = db()->prepare('SELECT * FROM categorias_productos WHERE tipo = ? ORDER BY nombre ASC');
            $stmt->execute([$tipo]);
        } else {
            $stmt = db()->query('SELECT * FROM categorias_productos ORDER BY tipo ASC, nombre ASC');
        }
        json_response($stmt->fetchAll());
    }

    if ($method === 'POST' && $catId === null) {
        require_admin_or_owner();
        $body = get_json_body();
        $tipo = $body['tipo'] ?? '';
        $nombre = trim($body['nombre'] ?? '');
        if (!in_array($tipo, ['maquinaria', 'repuesto'], true) || $nombre === '') {
            json_error('Datos invalidos', 400);
        }
        $newId = insert_or_conflict(
            'INSERT INTO categorias_productos (tipo, nombre) VALUES (?, ?)',
            [$tipo, $nombre],
            'Esa categoria ya existe'
        );
        $stmt = db()->prepare('SELECT * FROM categorias_productos WHERE id = ?');
        $stmt->execute([$newId]);
        json_response($stmt->fetch(), 201);
    }

    if ($method === 'PUT' && $catId !== null) {
        require_admin_or_owner();
        $body = get_json_body();
        $nombre = trim($body['nombre'] ?? '');
        if ($nombre === '') json_error('El nombre no puede estar vacio', 400);
        $stmt = db()->prepare('SELECT id FROM categorias_productos WHERE id = ?');
        $stmt->execute([$catId]);
        if (!$stmt->fetch()) json_error('No encontrada', 404);
        db()->prepare('UPDATE categorias_productos SET nombre = ? WHERE id = ?')->execute([$nombre, $catId]);
        $stmt = db()->prepare('SELECT * FROM categorias_productos WHERE id = ?');
        $stmt->execute([$catId]);
        json_response($stmt->fetch());
    }

    if ($method === 'DELETE' && $catId !== null) {
        require_admin_or_owner();
        $stmt = db()->prepare('SELECT id FROM categorias_productos WHERE id = ?');
        $stmt->execute([$catId]);
        if (!$stmt->fetch()) json_error('No encontrada', 404);
        db()->prepare('DELETE FROM categorias_productos WHERE id = ?')->execute([$catId]);
        json_response(['ok' => true]);
    }

    json_error('Ruta no encontrada', 404);
}

// ---------- /cotizador (cotizador formal: calculadora de precios) ----------
if (($segments[0] ?? null) === 'cotizador') {
    $cotId = $segments[1] ?? null;
    $user = current_user(); // requiere estar logueado (cualquier rol)

    if ($method === 'GET' && $cotId === null) {
        $esAdmin = in_array($user['rol'], ['admin', 'owner'], true);
        if ($esAdmin) {
            $rows = db()->query('SELECT * FROM cotizaciones_formales ORDER BY id DESC')->fetchAll();
        } else {
            $stmt = db()->prepare('SELECT * FROM cotizaciones_formales WHERE usuario_id = ? ORDER BY id DESC');
            $stmt->execute([$user['id']]);
            $rows = $stmt->fetchAll();
        }
        foreach ($rows as &$r) {
            $r['items'] = json_decode($r['items'], true) ?? [];
        }
        json_response($rows);
    }

    if ($method === 'GET' && $cotId !== null) {
        $stmt = db()->prepare('SELECT * FROM cotizaciones_formales WHERE id = ?');
        $stmt->execute([$cotId]);
        $row = $stmt->fetch();
        if (!$row) json_error('No encontrada', 404);
        $esAdmin = in_array($user['rol'], ['admin', 'owner'], true);
        if (!$esAdmin && (int) $row['usuario_id'] !== (int) $user['id']) {
            json_error('No tienes permiso para ver esta cotizacion', 403);
        }
        $row['items'] = json_decode($row['items'], true) ?? [];
        json_response($row);
    }

    if ($method === 'POST') {
        $body = get_json_body();
        $stmt = db()->prepare(
            'INSERT INTO cotizaciones_formales
             (numero, cliente_nombre, cliente_documento, cliente_direccion, items, tipo_cambio, moneda_mostrar, total, usuario_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $body['numero'] ?? '',
            $body['cliente_nombre'] ?? '',
            $body['cliente_documento'] ?? null,
            $body['cliente_direccion'] ?? null,
            json_encode($body['items'] ?? [], JSON_UNESCAPED_UNICODE),
            $body['tipo_cambio'] ?? null,
            $body['moneda_mostrar'] ?? 'PEN',
            $body['total'] ?? 0,
            $user['id'],
        ]);
        $newId = db()->lastInsertId();
        $stmt = db()->prepare('SELECT * FROM cotizaciones_formales WHERE id = ?');
        $stmt->execute([$newId]);
        $row = $stmt->fetch();
        $row['items'] = json_decode($row['items'], true) ?? [];
        json_response($row, 201);
    }

    if ($method === 'DELETE' && $cotId !== null) {
        $stmt = db()->prepare('SELECT * FROM cotizaciones_formales WHERE id = ?');
        $stmt->execute([$cotId]);
        $row = $stmt->fetch();
        if (!$row) json_error('No encontrada', 404);
        $esAdmin = in_array($user['rol'], ['admin', 'owner'], true);
        if (!$esAdmin && (int) $row['usuario_id'] !== (int) $user['id']) {
            json_error('No tienes permiso para eliminar esta cotizacion', 403);
        }
        db()->prepare('DELETE FROM cotizaciones_formales WHERE id = ?')->execute([$cotId]);
        json_response(['ok' => true]);
    }

    json_error('Ruta no encontrada', 404);
}

json_error('Ruta no encontrada', 404);
