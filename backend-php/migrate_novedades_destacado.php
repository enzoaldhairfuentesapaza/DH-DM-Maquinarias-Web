<?php
require_once __DIR__ . '/cli_only.php';
/**
 * Migracion: agrega la columna "destacado" a la tabla "novedades".
 *
 * Por que hace falta: el Tablón de Anuncios del inicio ahora muestra las
 * novedades marcadas como destacadas (antes mostraba solo imagenes fijas
 * sin relacion con la seccion "Novedades" del panel). Para eso la tabla
 * necesita esta columna nueva, que no existia.
 *
 * Ejecutar UNA sola vez despues de actualizar el backend:
 *   php migrate_novedades_destacado.php
 * Ejecutar por terminal; nunca desde el navegador.
 */

require_once __DIR__ . '/db.php';

$pdo = db();
$driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

function columnaExisteND(PDO $pdo, string $driver, string $tabla, string $columna): bool
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
    if (!columnaExisteND($pdo, $driver, 'novedades', 'destacado')) {
        if ($driver === 'mysql') {
            $pdo->exec('ALTER TABLE novedades ADD COLUMN destacado TINYINT(1) NOT NULL DEFAULT 0');
        } else {
            $pdo->exec('ALTER TABLE novedades ADD COLUMN destacado INTEGER NOT NULL DEFAULT 0');
        }
        echo "Agregada columna novedades.destacado\n";
    } else {
        echo "La columna novedades.destacado ya existia\n";
    }
    echo "\nMigracion completada correctamente.\n";
} catch (PDOException $e) {
    echo 'Error al migrar: ' . $e->getMessage() . "\n";
    exit(1);
}
