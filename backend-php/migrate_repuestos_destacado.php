<?php
require_once __DIR__ . '/cli_only.php';
/**
 * Migracion: agrega la columna "destacado" a la tabla "repuestos".
 *
 * Por que hace falta: hasta ahora solo la maquinaria podia marcarse como
 * "destacada" para aparecer en el inicio. Esta columna permite hacer lo
 * mismo con los repuestos.
 *
 * Ejecutar UNA sola vez despues de actualizar el backend:
 *   php migrate_repuestos_destacado.php
 */

require_once __DIR__ . '/db.php';

$pdo = db();
$driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

function columnaExisteRD(PDO $pdo, string $driver, string $tabla, string $columna): bool
{
    if ($driver === 'mysql') {
        $stmt = $pdo->prepare(
            "SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?"
        );
        $stmt->execute([$tabla, $columna]);
        return (bool) $stmt->fetchColumn();
    }
    $stmt = $pdo->query("PRAGMA table_info({$tabla})");
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $col) {
        if ($col['name'] === $columna) return true;
    }
    return false;
}

try {
    if (!columnaExisteRD($pdo, $driver, 'repuestos', 'destacado')) {
        if ($driver === 'mysql') {
            $pdo->exec('ALTER TABLE repuestos ADD COLUMN destacado TINYINT(1) NOT NULL DEFAULT 0');
        } else {
            $pdo->exec('ALTER TABLE repuestos ADD COLUMN destacado INTEGER NOT NULL DEFAULT 0');
        }
        echo "Agregada columna repuestos.destacado\n";
    } else {
        echo "La columna repuestos.destacado ya existia\n";
    }
    echo "\nMigracion completada correctamente.\n";
} catch (PDOException $e) {
    echo 'Error al migrar: ' . $e->getMessage() . "\n";
    exit(1);
}
