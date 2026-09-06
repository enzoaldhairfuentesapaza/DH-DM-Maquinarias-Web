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
    json_response(['detail' => $message], $status);
}

function get_json_body(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
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
    return $user ?: null;
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
    unset($user['hashed_password']);
    $user['activo'] = (bool) $user['activo'];
    return $user;
}

function apply_cors(): void
{
    $origins = config()['cors_origins'];
    $requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($requestOrigin, $origins, true)) {
        header('Access-Control-Allow-Origin: ' . $requestOrigin);
    }
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token');
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
