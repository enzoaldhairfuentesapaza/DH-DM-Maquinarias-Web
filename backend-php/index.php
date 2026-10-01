<?php
// No mostrar errores crudos de PHP al usuario (rutas del servidor, stack traces, etc.)
ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/crud.php';
require_once __DIR__ . '/excel.php';
require_once __DIR__ . '/bienvenida.php';

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

// ---------------------------------------------------------------------
// Algunos hostings compartidos bloquean por seguridad los metodos PUT y
// DELETE a nivel de servidor (firewall/ModSecurity), devolviendo un 403
// ANTES de que este script llegue a ejecutarse. Para evitarlo, el
// frontend manda esas peticiones como POST con un header
// "X-HTTP-Method-Override" indicando el metodo real; aqui lo traducimos.
// ---------------------------------------------------------------------
if ($method === 'POST') {
    $override = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? null;
    if ($override && in_array(strtoupper($override), ['PUT', 'DELETE', 'PATCH'], true)) {
        $method = strtoupper($override);
    }
}

// Quita el prefijo /api (todas las rutas del frontend llaman a /api/...)
if ($path === '/api' || str_starts_with($path, '/api/')) {
    $path = substr($path, 4);
}
$segments = array_values(array_filter(explode('/', $path)));

if ($segments === ['bienvenida']) bienvenida_handle($method);

if (($segments[0] ?? null) === 'excel') excel_handle($segments, $method);

// ---------- /health ----------
if ($segments === ['health'] && $method === 'GET') {
    db()->query('SELECT 1');
    json_response(['status' => 'ok']);
}

// ---------- /auth/... ----------
if (($segments[0] ?? null) === 'auth') {
    $sub = $segments[1] ?? null;

    if ($sub === 'login' && $method === 'POST') {
        $body = get_json_body();
        rate_limit('login', 20, 900);
        $email = strtolower(email_field($body, 'email'));
        $password = $body['password'] ?? null;
        if (!is_string($password) || $password === '' || strlen($password) > 256) json_error('Contraseña invalida', 422);
        $stmt = db()->prepare('SELECT * FROM usuarios WHERE LOWER(email) = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        if (!verify_password($password, $user['hashed_password'] ?? '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi') || !$user) {
            json_error('Credenciales incorrectas', 401);
        }
        if (!$user['activo']) {
            json_error('Usuario inactivo', 403);
        }
        $token = jwt_encode(
            ['sub' => $user['id'], 'rol' => $user['rol'], 'ver' => (int) $user['token_version']],
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
        validate_account($body, false);
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
        rate_limit('registro', 10, 3600);
        $body = get_json_body();
        validate_account($body);
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
    if (count($segments) > 2) json_error('Ruta no encontrada', 404);
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
        $current = require_owner();
        $body = get_json_body();
        validate_account($body);
        $rol = $body['rol'] ?? 'admin';
        if (!in_array($rol, ['admin', 'owner', 'cotizador'], true)) {
            json_error('Rol invalido, usa el endpoint de registro para clientes', 400);
        }
        $email = trim($body['email'] ?? '');
        $newId = insert_or_conflict(
            'INSERT INTO usuarios (nombre, email, hashed_password, rol) VALUES (?, ?, ?, ?)',
            [$body['nombre'] ?? '', $email, hash_password($body['password'] ?? ''), $rol],
            'Ese email ya esta registrado'
        );
        registrar_auditoria($current, 'accesos', 'crear', "Creó el acceso \"{$email}\" con rol {$rol}.");
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
        $rol = $body['rol'] ?? 'cliente';
        if (!in_array($rol, ['cliente', 'admin', 'owner', 'cotizador'], true)) {
            json_error('Rol invalido', 400);
        }
        $stmt = db()->prepare('UPDATE usuarios SET rol = ? WHERE id = ?');
        $stmt->execute([$rol, $userIdParam]);
        $stmt = db()->prepare('SELECT * FROM usuarios WHERE id = ?');
        $stmt->execute([$userIdParam]);
        $row = $stmt->fetch();
        if (!$row) json_error('Usuario no encontrado', 404);
        registrar_auditoria($current, 'accesos', 'editar', "Cambió el rol de \"{$row['email']}\" a {$rol}.");
        json_response(sanitize_user($row));
    }

    // ---- Activar / desactivar acceso (quitar o agregar accesos sin borrar la cuenta) ----
    if ($method === 'PUT' && $userIdParam !== null && $subAction === 'activo') {
        $current = require_owner();
        if ((int) $userIdParam === (int) $current['id']) {
            json_error('No puedes quitarte tu propio acceso', 400);
        }
        $body = get_json_body();
        $activo = to_bool($body['activo'] ?? false) ? 1 : 0;
        $stmt = db()->prepare('SELECT id FROM usuarios WHERE id = ?');
        $stmt->execute([$userIdParam]);
        if (!$stmt->fetch()) json_error('Usuario no encontrado', 404);
        db()->prepare('UPDATE usuarios SET activo = ? WHERE id = ?')->execute([$activo, $userIdParam]);
        $stmt = db()->prepare('SELECT * FROM usuarios WHERE id = ?');
        $stmt->execute([$userIdParam]);
        $rowActivo = $stmt->fetch();
        registrar_auditoria(
            $current,
            'accesos',
            'editar',
            ($activo ? 'Restauró' : 'Quitó') . " el acceso de \"{$rowActivo['email']}\"."
        );
        json_response(sanitize_user($rowActivo));
    }

    // ---- Editar los datos de cualquier usuario (cliente, admin u owner) ----
    if ($method === 'PUT' && $userIdParam !== null && $subAction === null) {
        $current = require_owner();
        $body = get_json_body();
        $stmt = db()->prepare('SELECT id, rol FROM usuarios WHERE id = ?');
        $stmt->execute([$userIdParam]);
        $objetivo = $stmt->fetch();
        if (!$objetivo) json_error('Usuario no encontrado', 404);
        if ($objetivo['rol'] === 'cliente') {
            json_error('No puedes editar una cuenta de cliente registrada por el propio cliente. Solo puedes quitarle o restaurarle el acceso.', 403);
        }

        validate_account($body, false);
        $campos = [];
        $valores = [];
        foreach ([
            'nombre', 'email', 'telefono', 'tipo_documento',
            'numero_documento', 'razon_social',
        ] as $campo) {
            if (array_key_exists($campo, $body)) {
                $campos[] = "$campo = ?";
                $valores[] = $body[$campo] === '' ? null : $body[$campo];
            }
        }
        // Cambio de contrasena opcional desde el panel de accesos.
        if (!empty($body['password'])) {
            $campos[] = 'token_version = token_version + 1';
            $campos[] = 'hashed_password = ?';
            $valores[] = hash_password($body['password']);
        }
        if (empty($campos)) {
            json_error('No se enviaron campos para actualizar', 400);
        }
        $valores[] = $userIdParam;
        try {
            db()->prepare('UPDATE usuarios SET ' . implode(', ', $campos) . ' WHERE id = ?')
                ->execute($valores);
        } catch (\PDOException $e) {
            if ((int) $e->getCode() === 23000 || str_contains($e->getMessage(), 'UNIQUE')) {
                json_error('Ese email ya esta registrado por otro usuario', 409);
            }
            throw $e;
        }
        $stmt = db()->prepare('SELECT * FROM usuarios WHERE id = ?');
        $stmt->execute([$userIdParam]);
        $rowEditado = $stmt->fetch();
        registrar_auditoria($current, 'accesos', 'editar', "Editó los datos de \"{$rowEditado['email']}\".");
        json_response(sanitize_user($rowEditado));
    }

    // ---- Revocar solo el rol (dejar como cliente) sin borrar la cuenta ----
    if ($method === 'DELETE' && $userIdParam !== null && $subAction === 'rol') {
        $current = require_owner();
        if ((int) $userIdParam === (int) $current['id']) {
            json_error('No puedes revocarte tu propio acceso', 400);
        }
        $stmt = db()->prepare('SELECT id FROM usuarios WHERE id = ?');
        $stmt->execute([$userIdParam]);
        if (!$stmt->fetch()) json_error('Usuario no encontrado', 404);
        db()->prepare("UPDATE usuarios SET rol = 'cliente' WHERE id = ?")->execute([$userIdParam]);
        registrar_auditoria($current, 'accesos', 'editar', "Revocó el rol administrativo del usuario #{$userIdParam}.");
        json_response(['ok' => true]);
    }

    // ---- Eliminar la cuenta por completo ----
    if ($method === 'DELETE' && $userIdParam !== null) {
        $current = require_owner();
        if ((int) $userIdParam === (int) $current['id']) {
            json_error('No puedes eliminar tu propia cuenta', 400);
        }
        $stmt = db()->prepare('SELECT id, rol FROM usuarios WHERE id = ?');
        $stmt->execute([$userIdParam]);
        $objetivo = $stmt->fetch();
        if (!$objetivo) json_error('Usuario no encontrado', 404);
        if ($objetivo['rol'] === 'cliente') {
            json_error('No puedes eliminar una cuenta de cliente registrada por el propio cliente. Solo puedes quitarle el acceso.', 403);
        }
        // Desvincula sus cotizaciones/notificaciones en vez de arrastrarlas al borrado.
        db()->prepare('UPDATE cotizaciones SET usuario_id = NULL WHERE usuario_id = ?')->execute([$userIdParam]);
        db()->prepare('DELETE FROM notificaciones WHERE usuario_id = ?')->execute([$userIdParam]);
        db()->prepare('DELETE FROM usuarios WHERE id = ?')->execute([$userIdParam]);
        registrar_auditoria($current, 'accesos', 'eliminar', "Eliminó permanentemente al usuario #{$userIdParam}.");
        json_response(['ok' => true]);
    }

    json_error('Ruta no encontrada', 404);
}

// ---------- /cotizaciones (preparado para el futuro) ----------
if (in_array($segments[0] ?? null, ['cotizaciones','contactos'], true)) {
    $esContacto = $segments[0] === 'contactos';
    $condicionOrigen = $esContacto ? "origen = 'contacto'" : "origen <> 'contacto'";
    if (($segments[1] ?? null) !== null && ctype_digit((string)$segments[1])) {
        require_ventas_access();
        if($esContacto)require_admin_or_owner();
        $check=db()->prepare('SELECT id FROM cotizaciones WHERE id = ? AND ' . $condicionOrigen);$check->execute([$segments[1]]);if(!$check->fetch())json_error('Registro no encontrado',404);
    }
    // /cotizaciones/mias -> historial de cotizaciones del cliente logueado
    if ($method === 'GET' && ($segments[1] ?? null) === 'mias') {
        $user = current_user();
        $stmt = db()->prepare('SELECT * FROM cotizaciones WHERE usuario_id = ? AND eliminado_en IS NULL AND ' . $condicionOrigen . ' ORDER BY id DESC');
        $stmt->execute([$user['id']]);
        json_response(array_map('quote_for_client', $stmt->fetchAll()));
    }

    if ($method === 'POST' && ($segments[1] ?? null) === null) {
        $user = optional_user();
        $body = get_json_body();

        rate_limit('cotizaciones', 30, 3600);
        if ($esContacto) {
            $body['origen']='contacto';
            if (!in_array($body['detalle']['canal'] ?? null, ['pagina','whatsapp','correo'],true))json_error('Canal invalido',422);
            $body['detalle']['mensaje']=text_field($body['detalle'],'mensaje',20000,true);
            $body['detalle']['asunto']=text_field($body['detalle'],'asunto',200,true);
        }
        $nombreCliente = text_field($body, 'nombre_cliente', 150, true);
        $emailCliente = email_field($body, 'email_cliente');
        $body['telefono_cliente'] = text_field($body, 'telefono_cliente', 50);
        $body['empresa'] = text_field($body, 'empresa', 150);
        if (!in_array($body['origen'] ?? 'web', ['web', 'contacto', 'pagina', 'correo', 'whatsapp'], true)) json_error('Origen invalido', 422);
        if (!isset($body['detalle']) || !is_array($body['detalle'])) json_error('Detalle invalido', 422);
        if (isset($body['detalle']['productos'])) {
            if (!is_array($body['detalle']['productos']) || count($body['detalle']['productos']) > 200) json_error('Lista de productos invalida', 422);
            foreach ($body['detalle']['productos'] as $product) {
                if (!is_array($product) || !is_string($product['nombre'] ?? null) || !in_array($product['tipo'] ?? null, ['maquinaria', 'repuesto'], true) || !is_numeric($product['cantidad'] ?? null) || $product['cantidad'] < 1 || $product['cantidad'] > 100000 || floor((float) $product['cantidad']) != $product['cantidad']) json_error('Producto o cantidad invalida', 422);
            }
        }
        // Siempre exigimos saber quien hizo la solicitud, sea cliente
        // registrado o visitante que lleno el formulario de invitado.
        if ($nombreCliente === '' || $emailCliente === '') {
            json_error('Falta informacion del cliente (nombre y correo son obligatorios)', 400);
        }

        $pdo=db();$saved=[];$pdo->beginTransaction();
        try {
            $stmt=$pdo->prepare('INSERT INTO cotizaciones (nombre_cliente,email_cliente,telefono_cliente,empresa,detalle,origen,usuario_id) VALUES (?,?,?,?,?,?,?)');
            foreach ((($body['origen'] ?? 'web') === 'contacto' ? [$body['detalle']] : quote_detail_groups($body['detalle'])) as $detail) {
                $stmt->execute([$nombreCliente,$emailCliente,$body['telefono_cliente']??null,$body['empresa']??null,json_encode($detail,JSON_UNESCAPED_UNICODE),$body['origen']??'web',$user['id']??null]);
                $select=$pdo->prepare('SELECT * FROM cotizaciones WHERE id = ?');$select->execute([$pdo->lastInsertId()]);$row=$select->fetch();$row['detalle']=$detail;$saved[]=$row;
            }
            $pdo->commit();
        } catch (Throwable $e) {if($pdo->inTransaction())$pdo->rollBack();throw $e;}
        json_response(count($saved)===1?$saved[0]:['solicitudes'=>$saved],201);
    }

    if ($method === 'GET' && ($segments[1] ?? null) === null) {
        require_ventas_access();
        if ($esContacto) require_admin_or_owner();
        $rows = db()->query('SELECT * FROM cotizaciones WHERE eliminado_en IS NULL AND ' . $condicionOrigen . ' ORDER BY id DESC')->fetchAll();
        foreach ($rows as &$r) {
            $r['detalle'] = json_decode($r['detalle'], true) ?? [];
        }
        json_response($rows);
    }

    // /cotizaciones/{id} -> detalle individual
    if ($method === 'GET' && ($segments[1] ?? null) !== null && ($segments[1] ?? null) !== 'papelera' && ($segments[2] ?? null) === null) {
        require_ventas_access();
        $stmt = db()->prepare('SELECT * FROM cotizaciones WHERE id = ?');
        $stmt->execute([$segments[1]]);
        $row = $stmt->fetch();
        if (!$row) json_error('No encontrada', 404);
        if($row['origen']==='contacto')require_admin_or_owner();
        $row['detalle'] = json_decode($row['detalle'], true) ?? [];
        json_response($row);
    }

    // /cotizaciones/{id}/estado -> actualizar estado (pendiente/respondida/denegada), sin archivo
    if ($method === 'PUT' && ($segments[1] ?? null) !== null && ($segments[2] ?? null) === 'estado') {
        $user = require_ventas_access();
        $id = $segments[1];
        $body = get_json_body();
        $body['respuesta'] = text_field($body, 'respuesta', 20000);
        $body['motivo_denegacion'] = text_field($body, 'motivo_denegacion', 20000);
        $estado = $body['estado'] ?? null;
        if (!in_array($estado, ['pendiente', 'respondida', 'denegada'], true)) {
            json_error('Estado invalido', 400);
        }
        $stmt = db()->prepare('SELECT * FROM cotizaciones WHERE id = ? AND eliminado_en IS NULL');
        $stmt->execute([$id]);
        $existente = $stmt->fetch();
        if (!$existente) json_error('No encontrada', 404);

        $mostrarEnPagina = (bool)$existente['usuario_id'];

        $stmt = db()->prepare(
            'UPDATE cotizaciones SET estado = ?, respuesta = ?, motivo_denegacion = ?, mostrar_en_pagina = ? WHERE id = ?'
        );
        $stmt->execute([
            $estado,
            $body['respuesta'] ?? null,
            $body['motivo_denegacion'] ?? null,
            $mostrarEnPagina ? 1 : 0,
            $id,
        ]);

        if (in_array($estado, ['respondida', 'denegada'], true)) {
            crear_notificacion_cotizacion($existente, $estado, $body['canal'] ?? null, $mostrarEnPagina);
        }
        registrar_auditoria(
            $user,
            'cotizaciones',
            'estado',
            "Cambió la cotización #{$id} ({$existente['nombre_cliente']}) a estado \"{$estado}\"."
        );

        $stmt = db()->prepare('SELECT * FROM cotizaciones WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        $row['detalle'] = json_decode($row['detalle'], true) ?? [];
        json_response($row);
    }

    // /cotizaciones/{id}/responder -> igual que /estado pero admite adjuntar un
    // archivo (multipart/form-data: estado, respuesta, motivo_denegacion, canal, archivo, mostrar_en_pagina)
    if ($method === 'POST' && ($segments[1] ?? null) !== null && ($segments[2] ?? null) === 'responder') {
        $user = require_ventas_access();
        $id = $segments[1];
        $_POST['respuesta'] = text_field($_POST, 'respuesta', 20000);
        $_POST['motivo_denegacion'] = text_field($_POST, 'motivo_denegacion', 20000);
        $estado = $_POST['estado'] ?? null;
        if (!in_array($estado, ['pendiente', 'respondida', 'denegada'], true)) {
            json_error('Estado invalido', 400);
        }
        $stmt = db()->prepare('SELECT * FROM cotizaciones WHERE id = ? AND eliminado_en IS NULL');
        $stmt->execute([$id]);
        $existente = $stmt->fetch();
        if (!$existente) json_error('No encontrada', 404);

        $archivoUrl = $existente['archivo_respuesta'];
        if (isset($_FILES['archivo']) && $_FILES['archivo']['error'] !== UPLOAD_ERR_NO_FILE) {
            $archivoUrl = save_upload($_FILES['archivo'], false);
        }

        // Canal(es) usados para responder: puede venir como "whatsapp,correo,pagina"
        $canalesEnviados = $_POST['canal'] ?? '';
        $canalesValidos = array_values(array_intersect(
            array_map('trim', explode(',', (string) $canalesEnviados)),
            ['whatsapp', 'correo', 'pagina']
        ));
        $canal = implode(',',array_values(array_unique([...$canalesValidos,...($existente['usuario_id'] ? ['pagina'] : [])]))) ?: null;

        $mostrarEnPagina = (bool)$existente['usuario_id'];

        $stmt = db()->prepare(
            'UPDATE cotizaciones
             SET estado = ?, respuesta = ?, motivo_denegacion = ?, archivo_respuesta = ?, canal_respuesta = ?, mostrar_en_pagina = ?
             WHERE id = ?'
        );
        $stmt->execute([
            $estado,
            $_POST['respuesta'] ?? null,
            $_POST['motivo_denegacion'] ?? null,
            $archivoUrl,
            $canal,
            $mostrarEnPagina ? 1 : 0,
            $id,
        ]);

        if (in_array($estado, ['respondida', 'denegada'], true)) {
            crear_notificacion_cotizacion($existente, $estado, $canal, $mostrarEnPagina);
        }
        registrar_auditoria(
            $user,
            'cotizaciones',
            'estado',
            "Respondió la cotización #{$id} ({$existente['nombre_cliente']}) → \"{$estado}\"" .
                ($canal ? " por {$canal}" : '') . ($mostrarEnPagina ? ', visible en la página' : '') . '.'
        );

        $stmt = db()->prepare('SELECT * FROM cotizaciones WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        $row['detalle'] = json_decode($row['detalle'], true) ?? [];
        json_response($row);
    }

    // /cotizaciones/{id}/restaurar -> saca de la papelera (solo owner)
    if ($method === 'PUT' && ($segments[1] ?? null) !== null && ($segments[2] ?? null) === 'restaurar') {
        $user = require_owner();
        $id = $segments[1];
        $stmt = db()->prepare('SELECT * FROM cotizaciones WHERE id = ? AND eliminado_en IS NOT NULL');
        $stmt->execute([$id]);
        $existente = $stmt->fetch();
        if (!$existente) json_error('No encontrada en la papelera', 404);
        db()->prepare(
            'UPDATE cotizaciones SET eliminado_en = NULL, eliminado_por = NULL, eliminado_por_nombre = NULL, motivo_eliminacion = NULL WHERE id = ?'
        )->execute([$id]);
        registrar_auditoria(
            $user,
            'cotizaciones',
            'restaurar',
            "Restauró la cotización #{$id} ({$existente['nombre_cliente']}) desde la papelera."
        );
        json_response(['ok' => true]);
    }

    // /cotizaciones/papelera -> lista de eliminadas (solo owner)
    if ($method === 'GET' && ($segments[1] ?? null) === 'papelera') {
        require_owner();
        $rows = db()->query(
            'SELECT * FROM cotizaciones WHERE eliminado_en IS NOT NULL AND ' . $condicionOrigen . ' ORDER BY eliminado_en DESC'
        )->fetchAll();
        foreach ($rows as &$r) {
            $r['detalle'] = json_decode($r['detalle'], true) ?? [];
        }
        json_response($rows);
    }

    // /cotizaciones/{id} -> eliminar (mueve a la papelera, no borra de verdad)
    if ($method === 'DELETE' && ($segments[1] ?? null) !== null && ($segments[1] ?? null) !== 'papelera') {
        $user = require_ventas_access();
        $id = $segments[1];
        $body = get_json_body();
        $motivo = trim((string) ($body['motivo'] ?? ''));
        if ($motivo === '') {
            json_error('Debes indicar el motivo de la eliminación', 400);
        }
        $stmt = db()->prepare('SELECT * FROM cotizaciones WHERE id = ? AND eliminado_en IS NULL');
        $stmt->execute([$id]);
        $existente = $stmt->fetch();
        if (!$existente) json_error('No encontrada', 404);

        $stmt = db()->prepare(
            'UPDATE cotizaciones
             SET eliminado_en = CURRENT_TIMESTAMP, eliminado_por = ?, eliminado_por_nombre = ?, motivo_eliminacion = ?
             WHERE id = ?'
        );
        $stmt->execute([$user['id'], $user['nombre'], $motivo, $id]);

        registrar_auditoria(
            $user,
            'cotizaciones',
            'eliminar',
            "Eliminó la cotización #{$id} ({$existente['nombre_cliente']}). Motivo: {$motivo}"
        );
        json_response(['ok' => true]);
    }

    json_error('Ruta no encontrada', 404);
}

// ---------- /notificaciones (buzon de cada usuario) ----------
if (($segments[0] ?? null) === 'notificaciones') {
    $user = current_user();
    $notifId = $segments[1] ?? null;

    if ($method === 'GET' && $notifId === null) {
        $stmt = db()->prepare(
            'SELECT n.*, c.archivo_respuesta, c.estado AS cotizacion_estado
             FROM notificaciones n
             LEFT JOIN cotizaciones c ON c.id = n.cotizacion_id AND c.mostrar_en_pagina = 1 AND c.eliminado_en IS NULL
             WHERE n.usuario_id = ?
             ORDER BY n.id DESC'
        );
        $stmt->execute([$user['id']]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['leida'] = (bool) $r['leida'];
        }
        json_response($rows);
    }

    // /notificaciones/{id}/leer -> marcar como leida
    if ($method === 'PUT' && $notifId !== null && ($segments[2] ?? null) === 'leer') {
        $stmt = db()->prepare('SELECT * FROM notificaciones WHERE id = ? AND usuario_id = ?');
        $stmt->execute([$notifId, $user['id']]);
        $row = $stmt->fetch();
        if (!$row) json_error('No encontrada', 404);
        db()->prepare('UPDATE notificaciones SET leida = 1 WHERE id = ?')->execute([$notifId]);
        json_response(['ok' => true]);
    }

    // /notificaciones/leer-todas -> marcar todas como leidas
    if ($method === 'PUT' && $notifId === 'leer-todas') {
        db()->prepare('UPDATE notificaciones SET leida = 1 WHERE usuario_id = ?')->execute([$user['id']]);
        json_response(['ok' => true]);
    }

    json_error('Ruta no encontrada', 404);
}

// ---------- /estadisticas (dashboard de ventas y cotizaciones) ----------
if (($segments[0] ?? null) === 'estadisticas') {
    require_ventas_access();

    $ventas = db()->query("SELECT total, creado_en FROM ventas WHERE estado <> 'anulado'")->fetchAll();
    $cotizaciones = db()->query('SELECT creado_en, estado FROM cotizaciones WHERE eliminado_en IS NULL AND origen <> \'contacto\'')->fetchAll();
    $detalles = db()->query("SELECT detalle FROM cotizaciones WHERE eliminado_en IS NULL AND origen <> 'contacto'")->fetchAll();

    // Ranking de repuestos y maquinarias mas cotizados (por nombre+tipo, ya
    // que el detalle guardado no trae el id del producto).
    $conteo = []; // clave "tipo|nombre" => ['tipo'=>, 'nombre'=>, 'unidades'=>, 'solicitudes'=>]
    foreach ($detalles as $fila) {
        $detalle = json_decode($fila['detalle'] ?? '{}', true);
        $productos = is_array($detalle['productos'] ?? null) ? $detalle['productos'] : [];
        foreach ($productos as $p) {
            $tipo = ($p['tipo'] ?? '') === 'maquinaria' ? 'maquinaria' : 'repuesto';
            $nombre = trim((string) ($p['nombre'] ?? 'Sin nombre'));
            $clave = $tipo . '|' . $nombre;
            if (!isset($conteo[$clave])) {
                $conteo[$clave] = ['tipo' => $tipo, 'nombre' => $nombre, 'unidades' => 0, 'solicitudes' => 0];
            }
            $conteo[$clave]['unidades'] += (float) ($p['cantidad'] ?? 1);
            $conteo[$clave]['solicitudes'] += 1;
        }
    }

    $repuestosRanking = array_values(array_filter($conteo, fn($c) => $c['tipo'] === 'repuesto'));
    $maquinariasRanking = array_values(array_filter($conteo, fn($c) => $c['tipo'] === 'maquinaria'));
    usort($repuestosRanking, fn($a, $b) => $b['unidades'] <=> $a['unidades']);
    usort($maquinariasRanking, fn($a, $b) => $b['unidades'] <=> $a['unidades']);

    json_response([
        'ventas' => [
            'semana' => agrupar_por_periodo($ventas, 'semana', 'total'),
            'mes' => agrupar_por_periodo($ventas, 'mes', 'total'),
            'anio' => agrupar_por_periodo($ventas, 'anio', 'total'),
        ],
        'cotizaciones' => [
            'semana' => agrupar_por_periodo($cotizaciones, 'semana'),
            'mes' => agrupar_por_periodo($cotizaciones, 'mes'),
            'anio' => agrupar_por_periodo($cotizaciones, 'anio'),
        ],
        'resumen' => [
            'total_ventas' => count($ventas),
            'monto_total_ventas' => array_sum(array_map(fn($v) => (float) $v['total'], $ventas)),
            'total_cotizaciones' => count($cotizaciones),
            'cotizaciones_pendientes' => count(array_filter($cotizaciones, fn($c) => $c['estado'] === 'pendiente')),
            'cotizaciones_respondidas' => count(array_filter($cotizaciones, fn($c) => $c['estado'] === 'respondida')),
            'cotizaciones_denegadas' => count(array_filter($cotizaciones, fn($c) => $c['estado'] === 'denegada')),
        ],
        'top_repuestos' => array_slice($repuestosRanking, 0, 8),
        'top_maquinarias' => array_slice($maquinariasRanking, 0, 8),
    ]);
}

// Attachments are served only after checking role or the owning client's visibility.
if (in_array($segments[0] ?? null, ['documentos', 'uploads'], true) && $method === 'GET') {
    $user = current_user();
    $filename = $segments[1] ?? '';
    if (count($segments) !== 2 || !preg_match('/^[a-f0-9]{32}\.(pdf|docx?|xlsx?|jpg|jpeg|png|gif|webp)$/i', $filename)) json_error('No encontrado', 404);
    $url = '/api/' . $segments[0] . '/' . $filename;
    $legacyUrl = '/uploads/' . $filename;
    $stmt = db()->prepare('SELECT usuario_id, mostrar_en_pagina, eliminado_en FROM cotizaciones WHERE archivo_respuesta = ? OR archivo_respuesta = ?');
    $stmt->execute([$url, $legacyUrl]);
    $quotes = $stmt->fetchAll();
    $allowed = es_rol_interno($user['rol']);
    foreach ($quotes as $quote) {
        if ((int) $quote['usuario_id'] === (int) $user['id'] && $quote['mostrar_en_pagina'] && $quote['eliminado_en'] === null) $allowed = true;
    }
    $formal=db()->prepare('SELECT id FROM cotizaciones_formales WHERE archivo_pdf = ?');$formal->execute([$url]);
    $formalFile=(bool)$formal->fetch();
    if ((!$quotes && !$formalFile) || !$allowed) json_error('No tienes permiso para descargar este archivo', 403);
    $dir = config()[$segments[0] === 'documentos' ? 'documents_dir' : 'uploads_dir'];
    $file = $dir . '/' . $filename;
    if (!is_file($file)) json_error('No encontrado', 404);
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . filesize($file));
    readfile($file);
    exit;
}

// ---------- /uploads (subir imagenes, solo admin/owner) ----------
if (($segments[0] ?? null) === 'uploads' && $method === 'POST') {
    require_admin_or_owner();

    if (!isset($_FILES['file'])) {
        json_error('No se envio ningun archivo', 400);
    }
    json_response(['url' => save_upload($_FILES['file'], true)]);
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
        $nombre = text_field($body, 'nombre', 100, true);
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
        $nombre = text_field($body, 'nombre', 100, true);
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

// ---------- /configuracion (numeros de contacto, correos, etc. editables) ----------
if (($segments[0] ?? null) === 'configuracion') {
    if ($method === 'GET') {
        // Publico: el sitio necesita leer estos valores sin haber iniciado sesion.
        $stmt = db()->query('SELECT clave, valor FROM configuracion_sitio');
        $config = [];
        foreach ($stmt->fetchAll() as $fila) {
            $config[$fila['clave']] = $fila['valor'];
        }
        json_response($config);
    }

    if ($method === 'PUT') {
        require_owner();
        $body = get_json_body();
        if (!is_array($body) || empty($body)) {
            json_error('Debes enviar al menos un valor para actualizar', 400);
        }
        $driver = db()->getAttribute(PDO::ATTR_DRIVER_NAME);
        if ($driver === 'mysql') {
            $upsert = db()->prepare(
                'INSERT INTO configuracion_sitio (clave, valor) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE valor = VALUES(valor)'
            );
        } else {
            $upsert = db()->prepare(
                'INSERT INTO configuracion_sitio (clave, valor) VALUES (?, ?)
                 ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor'
            );
        }
        foreach ($body as $clave => $valor) {
            if (!in_array($clave, ['whatsapp_primario', 'whatsapp_secundario', 'correo_contacto'], true)) json_error('Clave de configuracion no permitida', 422);
            if ($clave === 'correo_contacto') email_field($body, $clave);
            else {
                $numero = text_field($body, $clave, 15, true);
                if (!preg_match('/^\d{8,15}$/', $numero)) json_error('Numero de WhatsApp invalido', 422);
            }
        }
        foreach ($body as $clave => $valor) {
            $clave = trim((string) $clave);
            if ($clave === '') continue;
            $upsert->execute([$clave, trim((string) $valor)]);
        }
        $stmt = db()->query('SELECT clave, valor FROM configuracion_sitio');
        $config = [];
        foreach ($stmt->fetchAll() as $fila) {
            $config[$fila['clave']] = $fila['valor'];
        }
        json_response($config);
    }

    json_error('Ruta no encontrada', 404);
}


if (($segments[0] ?? null) === 'sugerencias') {
    if ($method === 'POST') {
        rate_limit('sugerencias', 30, 3600);
        // Publico: cualquier visitante puede enviar una sugerencia o reclamo.
        $user = optional_user();
        $body = get_json_body();
        $tipo = ($body['tipo'] ?? '') === 'reclamo' ? 'reclamo' : 'sugerencia';
        $nombre = text_field($body, 'nombre', 150, true);
        $correo = email_field($body, 'correo', false);
        $mensaje = text_field($body, 'mensaje', 5000, true);
        if ($nombre === '' || $mensaje === '') {
            json_error('Nombre y mensaje son obligatorios', 400);
        }
        $stmt = db()->prepare(
            'INSERT INTO sugerencias (tipo, nombre, correo, mensaje, usuario_id) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$tipo, $nombre, $correo ?: null, $mensaje, $user['id'] ?? null]);
        json_response(['ok' => true], 201);
    }

    if ($method === 'GET') {
        // Solo admins/owners pueden ver lo que se envia por el globo.
        require_admin_or_owner();
        $stmt = db()->query('SELECT * FROM sugerencias ORDER BY id DESC');
        json_response($stmt->fetchAll());
    }

    if ($method === 'PUT' && ($segments[1] ?? null) !== null) {
        require_admin_or_owner();
        $body = get_json_body();
        $stmt = db()->prepare('UPDATE sugerencias SET leido = ? WHERE id = ?');
        $stmt->execute([to_bool($body['leido'] ?? false) ? 1 : 0, $segments[1]]);
        json_response(['ok' => true]);
    }

    if ($method === 'DELETE' && ($segments[1] ?? null) !== null) {
        require_admin_or_owner();
        $stmt = db()->prepare('DELETE FROM sugerencias WHERE id = ?');
        $stmt->execute([$segments[1]]);
        json_response(['ok' => true]);
    }

    json_error('Ruta no encontrada', 404);
}


require __DIR__ . '/cotizador.php';

// ---------- /auditoria (registro de cambios: solo owner) ----------
if (($segments[0] ?? null) === 'auditoria') {
    require_owner();

    if ($method === 'GET') {
        $categoria = trim((string) ($_GET['categoria'] ?? ''));
        $buscar = trim((string) ($_GET['buscar'] ?? ''));

        $sql = 'SELECT * FROM auditoria WHERE 1=1';
        $params = [];
        if ($categoria !== '' && $categoria !== 'todas') {
            $sql .= ' AND categoria = ?';
            $params[] = $categoria;
        }
        if ($buscar !== '') {
            $sql .= ' AND (descripcion LIKE ? OR usuario_nombre LIKE ?)';
            $like = '%' . $buscar . '%';
            $params[] = $like;
            $params[] = $like;
        }
        $sql .= ' ORDER BY id DESC LIMIT 500';

        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        json_response($stmt->fetchAll());
    }

    json_error('Ruta no encontrada', 404);
}

json_error('Ruta no encontrada', 404);
