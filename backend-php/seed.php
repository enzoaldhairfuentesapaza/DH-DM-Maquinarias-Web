<?php
/**
 * Crea el primer usuario OWNER usando los datos de config.php.
 * Correr UNA VEZ:
 *   - Local: php seed.php
 *   - Produccion: visita https://tudominio.com/api/seed.php una vez desde el
 *     navegador (borra o renombra este archivo despues, por seguridad).
 */
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

$cfg = config();

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
