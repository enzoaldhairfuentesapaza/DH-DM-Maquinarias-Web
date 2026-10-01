<?php
/**
 * JWT minimo (HS256), sin dependencias externas de Composer.
 * Suficiente para nuestro caso de uso (login con roles).
 */

function jwt_base64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function jwt_base64url_decode(string $data): string|false
{
    if ($data === '' || preg_match('/[^A-Za-z0-9_-]/', $data)) return false;
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($data, '-_', '+/'), true);
}

function jwt_encode(array $payload, string $secret, int $expiresInSeconds): string
{
    $header = ['typ' => 'JWT', 'alg' => 'HS256'];
    $payload['iat'] = time();
    $payload['exp'] = time() + $expiresInSeconds;

    $segments = [
        jwt_base64url_encode(json_encode($header)),
        jwt_base64url_encode(json_encode($payload)),
    ];

    $signingInput = implode('.', $segments);
    $signature = hash_hmac('sha256', $signingInput, $secret, true);
    $segments[] = jwt_base64url_encode($signature);

    return implode('.', $segments);
}

/**
 * Devuelve el payload (array) si el token es valido, o null si no lo es
 * (firma incorrecta, expirado, o formato invalido).
 */
function jwt_decode(string $token, string $secret): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }
    [$headerB64, $payloadB64, $signatureB64] = $parts;

    $signingInput = $headerB64 . '.' . $payloadB64;
    $expectedSignature = hash_hmac('sha256', $signingInput, $secret, true);
    $actualSignature = jwt_base64url_decode($signatureB64);

    if ($actualSignature === false || !hash_equals($expectedSignature, $actualSignature)) {
        return null;
    }

    $headerJson = jwt_base64url_decode($headerB64);
    $payloadJson = jwt_base64url_decode($payloadB64);
    if ($headerJson === false || $payloadJson === false) return null;
    $header = json_decode($headerJson, true);
    if (!is_array($header) || ($header['alg'] ?? null) !== 'HS256') return null;
    $payload = json_decode($payloadJson, true);
    if (!is_array($payload)) {
        return null;
    }

    if (!isset($payload['exp']) || !is_int($payload['exp']) || time() >= $payload['exp']) {
        return null; // expirado
    }

    return $payload;
}
