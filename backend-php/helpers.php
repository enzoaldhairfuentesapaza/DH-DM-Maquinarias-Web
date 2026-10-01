<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';

function json_response($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function json_error(string $message, int $status = 400): void
{
    // Only excel_review enables this scope, resets it in finally, and reports per-row errors.
    // Normal endpoints keep their original HTTP error behavior.
    if (!empty($GLOBALS['hdm_excel_validation'])) throw new InvalidArgumentException($message);
    json_response(['detail' => $message], $status);
}

function get_json_body(): array
{
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 1024 * 1024) json_error('Solicitud demasiado grande', 413);
    $raw = file_get_contents('php://input', false, null, 0, 1024 * 1024 + 1);
    if (strlen($raw) > 1024 * 1024) json_error('Solicitud demasiado grande', 413);
    $data = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($data) || !str_starts_with(ltrim($raw), '{')) json_error('Debes enviar un objeto JSON valido', 400);
    return $data;
}

function bearer_token(): ?string
{
    // Se usa un header personalizado (no "Authorization") porque varios
    // hostings compartidos no pasan ese header especifico a PHP.
    $token = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? '';

    if (!$token && function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'x-auth-token') {
                $token = $value;
                break;
            }
        }
    }

    if (!$token && isset($_SERVER['HTTP_AUTHORIZATION']) && preg_match('/^Bearer (.+)$/i', $_SERVER['HTTP_AUTHORIZATION'], $m)) $token = $m[1];
    return $token !== '' ? trim($token) : null;
}

/**
 * Devuelve el usuario logueado (array) o null si no hay token / es invalido.
 * No lanza error: usarla en endpoints publicos que quieren saber si hay sesion.
 */
function optional_user(): ?array
{
    $token = bearer_token();
    if (!$token) {
        return null;
    }
    $payload = jwt_decode($token, config()['secret_key']);
    if (!$payload || !isset($payload['sub'])) {
        return null;
    }
    $stmt = db()->prepare('SELECT * FROM usuarios WHERE id = ? AND activo = 1');
    $stmt->execute([$payload['sub']]);
    $user = $stmt->fetch();
    if (!$user || !isset($payload["ver"]) || (int) $payload["ver"] !== (int) $user["token_version"]) return null;
    return $user;
}

/** Exige que haya un usuario logueado. Corta la ejecucion con 401 si no. */
function current_user(): array
{
    $user = optional_user();
    if (!$user) {
        json_error('No autenticado', 401);
    }
    return $user;
}

/** Exige que el usuario logueado tenga uno de los roles dados. */
function require_roles(array $roles): array
{
    $user = current_user();
    if (!in_array($user['rol'], $roles, true)) {
        json_error('No tienes permisos para esta accion', 403);
    }
    return $user;
}

function require_admin_or_owner(): array
{
    return require_roles(['admin', 'owner']);
}

function require_owner(): array
{
    return require_roles(['owner']);
}

/**
 * Roles que pueden entrar al panel de administracion.
 * El "cotizador" entra pero solo ve ventas/cotizaciones y estadisticas.
 */
function require_panel_access(): array
{
    return require_roles(['admin', 'owner', 'cotizador']);
}

/** Acceso a cotizaciones, ventas y estadisticas (incluye al cotizador). */
function require_ventas_access(): array
{
    return require_roles(['admin', 'owner', 'cotizador']);
}

/** true si el rol puede ver datos de cualquier cliente (no solo los suyos). */
function es_rol_interno(string $rol): bool
{
    return in_array($rol, ['admin', 'owner', 'cotizador'], true);
}

/**
 * Registra una entrada en el log de auditoria general del panel.
 * $categoria: p.ej. 'cotizaciones', 'accesos', 'novedades', 'blog_posts', etc.
 * $accion: 'crear' | 'editar' | 'eliminar' | 'estado' | 'otro'
 */
function registrar_auditoria(array $user, string $categoria, string $accion, string $descripcion): void
{
    try {
        $stmt = db()->prepare(
            'INSERT INTO auditoria (usuario_id, usuario_nombre, usuario_rol, categoria, accion, descripcion)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $user['id'] ?? null,
            $user['nombre'] ?? 'Desconocido',
            $user['rol'] ?? null,
            $categoria,
            $accion,
            $descripcion,
        ]);
    } catch (\Throwable $e) {
        // El log de auditoria nunca debe romper la operacion principal.
    }
}

function hash_password(string $plain): string
{
    return password_hash($plain, PASSWORD_BCRYPT);
}

function verify_password(string $plain, string $hashed): bool
{
    return password_verify($plain, $hashed);
}

/** Quita el hashed_password antes de devolver un usuario en JSON. */
function sanitize_user(array $user): array
{
    unset($user['hashed_password'], $user['token_version']);
    $user['activo'] = (bool) $user['activo'];
    return $user;
}

/**
 * Crea una notificacion en el buzon del cliente cuando su cotizacion es
 * respondida o denegada (solo si la cotizacion esta ligada a una cuenta,
 * es decir tiene usuario_id).
 */
/**
 * Crea la notificacion en el buzon del cliente SOLO si:
 *  - tiene cuenta en la web (usuario_id), y
 *  - el encargado activo el flag "Mostrar en la página" al responder.
 * $canal puede venir como cadena separada por comas: "whatsapp,correo,pagina".
 */
function crear_notificacion_cotizacion(array $cotizacion, string $estado, ?string $canal, bool $mostrarEnPagina): void
{
    $usuarioId = $cotizacion['usuario_id'] ?? null;
    if (!$usuarioId || !$mostrarEnPagina) {
        return;
    }

    $accion = $estado === 'respondida' ? 'respondida' : 'denegada';
    $canales = array_filter(array_map('trim', explode(',', (string) $canal)));
    $etiquetas = [
        'whatsapp' => 'WhatsApp',
        'correo' => 'correo',
        'pagina' => 'la página',
    ];
    $nombresCanales = array_map(fn($c) => $etiquetas[$c] ?? $c, $canales);

    if (!empty($nombresCanales)) {
        $listado = implode(' y ', array_filter([
            implode(', ', array_slice($nombresCanales, 0, -1)),
            end($nombresCanales),
        ]));
        $mensaje = "Tu cotización #{$cotizacion['id']} ha sido {$accion}. También te contactamos por {$listado}.";
    } else {
        $mensaje = "Tu cotización #{$cotizacion['id']} ha sido {$accion}. Revisa los detalles aquí en tu buzón.";
    }

    $stmt = db()->prepare(
        'INSERT INTO notificaciones (usuario_id, cotizacion_id, tipo, mensaje) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$usuarioId, $cotizacion['id'], 'cotizacion', $mensaje]);
}

/**
 * Agrupa filas con una fecha "creado_en" en periodos (semana/mes/anio) para
 * graficos del panel. Si se pasa $sumField, tambien suma ese campo numerico
 * (ej. "total" en ventas); si no, solo cuenta filas (ej. cotizaciones).
 * Se agrupa en PHP (no en SQL) para funcionar igual en SQLite y MySQL.
 */
function agrupar_por_periodo(array $rows, string $periodo, ?string $sumField = null): array
{
    $buckets = []; // clave => ['cantidad' => n, 'total' => n]

    foreach ($rows as $row) {
        $fecha = strtotime($row['creado_en'] ?? 'now') ?: time();

        if ($periodo === 'semana') {
            // Semana ISO del anio, ej. "2026-W37"
            $clave = date('o-\WW', $fecha);
            $etiqueta = 'Sem. ' . date('W', $fecha);
        } elseif ($periodo === 'mes') {
            $clave = date('Y-m', $fecha);
            $etiqueta = ucfirst(strftime_es((int) date('n', $fecha))) . ' ' . date('Y', $fecha);
        } else { // anio
            $clave = date('Y', $fecha);
            $etiqueta = date('Y', $fecha);
        }

        if (!isset($buckets[$clave])) {
            $buckets[$clave] = ['periodo' => $etiqueta, 'orden' => $clave, 'cantidad' => 0, 'total' => 0.0];
        }
        $buckets[$clave]['cantidad'] += 1;
        if ($sumField !== null) {
            $buckets[$clave]['total'] += (float) ($row[$sumField] ?? 0);
        }
    }

    ksort($buckets);
    $resultado = array_values($buckets);

    // Nos quedamos con los ultimos periodos para no saturar el grafico.
    $limite = $periodo === 'semana' ? 12 : ($periodo === 'mes' ? 12 : 6);
    if (count($resultado) > $limite) {
        $resultado = array_slice($resultado, -$limite);
    }

    foreach ($resultado as &$r) {
        unset($r['orden']);
        if ($sumField === null) unset($r['total']);
    }

    return $resultado;
}

/** Nombre corto de mes en espaniol sin depender de locales del sistema. */
function strftime_es(int $mes): string
{
    $meses = [1 => 'ene', 2 => 'feb', 3 => 'mar', 4 => 'abr', 5 => 'may', 6 => 'jun',
        7 => 'jul', 8 => 'ago', 9 => 'sep', 10 => 'oct', 11 => 'nov', 12 => 'dic'];
    return $meses[$mes] ?? (string) $mes;
}

function apply_cors(): void
{
    $origins = config()['cors_origins'];
    $requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($requestOrigin, $origins, true)) {
        header('Access-Control-Allow-Origin: ' . $requestOrigin);
    }
    header('Vary: Origin');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token, X-HTTP-Method-Override');
    header('Access-Control-Allow-Credentials: true');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

/** true/false a partir de valores que pueden venir como bool, "true", 1, "1", etc. */
function to_bool($value): int
{
    return (filter_var($value, FILTER_VALIDATE_BOOLEAN)) ? 1 : 0;
}

/**
 * Ejecuta un INSERT confiando en una restriccion UNIQUE de la base de datos
 * (en vez de "verificar si existe" y luego insertar, que tiene una condicion
 * de carrera real si dos usuarios lo hacen al mismo tiempo). Si la base de
 * datos rechaza el insert por duplicado, devuelve un 400 limpio.
 */
function insert_or_conflict(string $sql, array $params, string $conflictMessage): string
{
    try {
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        return db()->lastInsertId();
    } catch (PDOException $e) {
        // Codigo 23000 = violacion de restriccion de integridad (UNIQUE, etc.)
        // tanto en MySQL como en SQLite.
        if ($e->getCode() === '23000') {
            json_error($conflictMessage, 400);
        }
        throw $e;
    }
}

function text_field(array $body, string $key, int $max = 255, bool $required = false): ?string
{
    $value = $body[$key] ?? null;
    if ($value === null && !$required) return null;
    if (!is_string($value)) json_error("El campo {$key} debe ser texto", 422);
    $value = trim($value);
    if ($required && $value === '') json_error("El campo {$key} es obligatorio", 422);
    if (preg_match('//u', $value) !== 1 || preg_match_all('/./us', $value) > $max) json_error("El campo {$key} supera el limite permitido", 422);
    return $value;
}

function email_field(array $body, string $key, bool $required = true): ?string
{
    $value = text_field($body, $key, 150, $required);
    if ($value && !filter_var($value, FILTER_VALIDATE_EMAIL)) json_error("El campo {$key} debe ser un correo valido", 422);
    return $value;
}

function validate_password($password): void
{
    if (!is_string($password) || strlen($password) < 8 || strlen($password) > 72 || str_contains($password, "\0")) json_error('La contraseña debe tener entre 8 y 72 bytes', 422);
}

function validate_account(array &$body, bool $creating = true): void
{
    if ($creating || array_key_exists('nombre', $body)) $body['nombre'] = text_field($body, 'nombre', 150, true);
    if ($creating || array_key_exists('email', $body)) $body['email'] = strtolower(email_field($body, 'email'));
    if ($creating || !empty($body['password'])) validate_password($body['password'] ?? null);
    foreach (['telefono' => 30, 'numero_documento' => 20, 'razon_social' => 200] as $key => $max) {
        if (array_key_exists($key, $body)) $body[$key] = text_field($body, $key, $max);
    }
    if (!empty($body['tipo_documento']) && !in_array($body['tipo_documento'], ['dni', 'ruc'], true)) json_error('Tipo de documento invalido', 422);
    if (!empty($body['tipo_documento']) && !empty($body['numero_documento'])) {
        $length = $body['tipo_documento'] === 'dni' ? 8 : 11;
        if (!preg_match('/^\d{' . $length . '}$/', $body['numero_documento'])) json_error('Numero de documento invalido', 422);
    }
}

function rate_limit(string $action, int $limit, int $seconds): void
{
    $now = time();
    $start = intdiv($now, $seconds) * $seconds;
    $key = hash_hmac('sha256', $action . '|' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . '|' . $start, config()['secret_key']);
    $sql = db()->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql'
        ? 'INSERT INTO rate_limits (bucket, hits, expires_at) VALUES (?, 1, ?) ON DUPLICATE KEY UPDATE hits = hits + 1'
        : 'INSERT INTO rate_limits (bucket, hits, expires_at) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET hits = hits + 1';
    db()->prepare($sql)->execute([$key, $start + $seconds]);
    $stmt = db()->prepare('SELECT hits FROM rate_limits WHERE bucket = ?');
    $stmt->execute([$key]);
    if ((int) $stmt->fetchColumn() > $limit) {
        header('Retry-After: ' . ($start + $seconds - $now));
        json_error('Demasiados intentos. Espera unos minutos y vuelve a intentar.', 429);
    }
    if (random_int(1, 100) === 1) db()->prepare('DELETE FROM rate_limits WHERE expires_at < ?')->execute([$now]);
}

function save_upload(array $file, bool $imageOnly): string
{
    if (!isset($file['error']) || is_array($file['error']) || $file['error'] !== UPLOAD_ERR_OK) json_error('No se pudo recibir el archivo', 400);
    if ($file['size'] <= 0 || $file['size'] > ($imageOnly ? 5 : 10) * 1024 * 1024) json_error('El archivo supera el limite permitido o esta vacio', 413);
    if (!is_uploaded_file($file['tmp_name'])) json_error('Archivo invalido', 400);
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    $allowed = [
        'jpg' => ['image/jpeg'], 'jpeg' => ['image/jpeg'], 'png' => ['image/png'],
        'gif' => ['image/gif'], 'webp' => ['image/webp'],
    ];
    if (!$imageOnly) $allowed += [
        'pdf' => ['application/pdf'], 'doc' => ['application/msword', 'application/CDFV2'],
        'xls' => ['application/vnd.ms-excel', 'application/CDFV2'],
        'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'],
        'xlsx' => ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip'],
    ];
    if (!isset($allowed[$ext]) || !in_array($mime, $allowed[$ext], true)) json_error('Contenido o formato de archivo no permitido', 422);
    if (in_array($ext, ['docx', 'xlsx'], true) && $mime === 'application/zip') {
        if (!class_exists('ZipArchive')) json_error('El servidor necesita la extension ZIP para validar este documento', 422);
        $zip = new ZipArchive();
        if ($zip->open($file['tmp_name']) !== true) json_error('Documento invalido', 422);
        $document = $ext === 'docx' ? 'word/document.xml' : 'xl/workbook.xml';
        $valid = $zip->locateName('[Content_Types].xml') !== false && $zip->locateName($document) !== false;
        $zip->close();
        if (!$valid) json_error('El archivo no es un documento Office valido', 422);
    }
    if ($imageOnly && !@getimagesize($file['tmp_name'])) json_error('La imagen no es valida', 422);
    $dir = config()[$imageOnly ? 'uploads_dir' : 'documents_dir'];
    if (!is_dir($dir) && !mkdir($dir, 0750, true)) throw new RuntimeException('No se pudo crear el directorio de archivos');
    $filename = bin2hex(random_bytes(16)) . '.' . $ext;
    if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $filename)) throw new RuntimeException('No se pudo guardar el archivo');
    return $imageOnly ? config()['uploads_url_prefix'] . '/' . $filename : '/api/documentos/' . $filename;
}

function quote_for_client(array $row): array
{
    $row['detalle'] = json_decode($row['detalle'], true) ?? [];
    $row['mostrar_en_pagina'] = (bool) $row['mostrar_en_pagina'];
    if (!$row['mostrar_en_pagina']) {
        $row['respuesta'] = null;
        $row['motivo_denegacion'] = null;
        $row['archivo_respuesta'] = null;
        $row['canal_respuesta'] = null;
    }
    unset($row['eliminado_por'], $row['eliminado_por_nombre'], $row['motivo_eliminacion']);
    return $row;
}
