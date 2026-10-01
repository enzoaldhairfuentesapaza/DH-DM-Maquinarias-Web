<?php
require_once __DIR__ . '/cli_only.php';
/**
 * Crea el primer usuario OWNER usando los datos de config.php.
 * Correr UNA VEZ:
 *   - Local: php seed.php
 * Ejecutar por terminal; nunca desde el navegador.
 * Ejecutar por terminal; nunca desde el navegador.
 */
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

$cfg = config();
if (!filter_var($cfg['owner_email'], FILTER_VALIDATE_EMAIL)) { throw new RuntimeException('Configura un correo valido para el owner'); }
validate_password($cfg['owner_password']);
if (preg_match('/cambia|completar/i', $cfg['owner_password'])) { throw new RuntimeException('Configura una contraseña real para el owner'); }
if (db()->query("SELECT COUNT(*) FROM usuarios WHERE rol = 'owner'")->fetchColumn()) {
    echo "Ya existe un owner. Administra nuevos accesos desde el panel.\n";
    exit;
}

$stmt = db()->prepare('SELECT id FROM usuarios WHERE email = ?');
$stmt->execute([$cfg['owner_email']]);

if ($stmt->fetch()) {
    echo "Ya existe un usuario con el email {$cfg['owner_email']}, no se crea de nuevo.\n";
    exit;
}

$stmt = db()->prepare(
    'INSERT INTO usuarios (nombre, email, hashed_password, rol) VALUES (?, ?, ?, ?)'
);
$stmt->execute([
    $cfg['owner_nombre'],
    $cfg['owner_email'],
    hash_password($cfg['owner_password']),
    'owner',
]);

echo "Owner creado: {$cfg['owner_email']} (usa la contraseña de tu config.php)\n";
