<?php
require_once __DIR__ . '/cli_only.php';
// Offline alternative for hosts without SSH. It never connects to a database.
$email = getenv('OWNER_EMAIL') ?: '';
$password = getenv('OWNER_PASSWORD') ?: '';
$name = getenv('OWNER_NAME') ?: 'Administrador Principal';
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150 || strlen($password) < 8 || strlen($password) > 72 || str_contains($password, "\0")) {
    fwrite(STDERR, "Define OWNER_EMAIL y OWNER_PASSWORD (8 a 72 bytes) en el entorno.\n"); exit(1);
}
$hex = fn(string $value) => 'CONVERT(0x' . bin2hex($value) . ' USING utf8mb4)';
$hash = password_hash($password, PASSWORD_BCRYPT);
echo "-- Importar una vez por phpMyAdmin; eliminar este archivo SQL despues.\n";
echo 'INSERT INTO usuarios (nombre, email, hashed_password, rol) SELECT ' . $hex($name) . ', ' . $hex(strtolower($email)) . ', ' . $hex($hash) . ", 'owner' WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE rol = 'owner');\n";
