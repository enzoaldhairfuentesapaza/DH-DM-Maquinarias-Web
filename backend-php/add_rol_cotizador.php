<?php
require_once __DIR__ . '/cli_only.php';
/**
 * Migracion v1.2: agrega el rol "cotizador" al ENUM de la tabla usuarios.
 *
 * Ejecutar UNA sola vez despues de actualizar el backend:
 *   php add_rol_cotizador.php
 * Ejecutar por terminal; nunca desde el navegador.
 *
 * En SQLite no hace falta porque la columna rol es TEXT libre.
 */

require_once __DIR__ . '/db.php';

$pdo = db();
$driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

if ($driver !== 'mysql') {
    echo "La base no es MySQL ({$driver}): no se necesita migrar, el rol ya es valido.\n";
    exit;
}

try {
    $pdo->exec(
        "ALTER TABLE usuarios
         MODIFY COLUMN rol ENUM('cliente','admin','owner','cotizador')
         NOT NULL DEFAULT 'cliente'"
    );
    echo "Listo: el rol 'cotizador' ya esta disponible en la tabla usuarios.\n";
} catch (PDOException $e) {
    echo "Error al migrar: " . $e->getMessage() . "\n";
    exit(1);
}
