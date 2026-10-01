<?php
require_once __DIR__ . '/cli_only.php';
/**
 * Migracion: crea la tabla "sugerencias" (sugerencias y reclamos enviados
 * desde el globo flotante del sitio público).
 *
 * Ejecutar UNA sola vez despues de actualizar el backend:
 *   php migrate_sugerencias.php
 */

require_once __DIR__ . '/db.php';

$pdo = db();
$driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

try {
    if ($driver === 'mysql') {
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS sugerencias (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tipo ENUM('sugerencia','reclamo') NOT NULL DEFAULT 'sugerencia',
                nombre VARCHAR(150) NOT NULL,
                correo VARCHAR(150) DEFAULT NULL,
                mensaje TEXT NOT NULL,
                leido TINYINT(1) NOT NULL DEFAULT 0,
                usuario_id INT DEFAULT NULL,
                creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
    } else {
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS sugerencias (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tipo TEXT NOT NULL DEFAULT 'sugerencia',
                nombre TEXT NOT NULL,
                correo TEXT,
                mensaje TEXT NOT NULL,
                leido INTEGER NOT NULL DEFAULT 0,
                usuario_id INTEGER,
                creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
            )"
        );
    }
    echo "Tabla sugerencias lista.\n\nMigracion completada correctamente.\n";
} catch (PDOException $e) {
    echo 'Error al migrar: ' . $e->getMessage() . "\n";
    exit(1);
}
