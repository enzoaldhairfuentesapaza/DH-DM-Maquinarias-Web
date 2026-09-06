<?php
/**
 * Agrega las columnas de stock (stock_disponible, stock_cantidad) a las
 * tablas maquinarias y repuestos si todavia no existen. Seguro de correr
 * varias veces: revisa si la columna ya existe antes de agregarla.
 *
 * Correr una sola vez visitando esta URL desde el navegador, luego borrar
 * este archivo del servidor.
 */
require_once __DIR__ . '/db.php';

function columnExists(PDO $pdo, string $table, string $column): bool
{
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    if ($driver === 'sqlite') {
        $stmt = $pdo->query("PRAGMA table_info($table)");
        foreach ($stmt->fetchAll() as $row) {
            if ($row['name'] === $column) return true;
        }
        return false;
    }
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) as c FROM information_schema.columns
         WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?"
    );
    $stmt->execute([$table, $column]);
    return (int) $stmt->fetch()['c'] > 0;
}

$pdo = db();
$mensajes = [];

foreach (['maquinarias', 'repuestos'] as $tabla) {
    if (!columnExists($pdo, $tabla, 'stock_disponible')) {
        $pdo->exec("ALTER TABLE $tabla ADD COLUMN stock_disponible TINYINT(1) NOT NULL DEFAULT 1");
        $mensajes[] = "Columna stock_disponible agregada a $tabla.";
    } else {
        $mensajes[] = "$tabla ya tenia stock_disponible, se omite.";
    }

    if (!columnExists($pdo, $tabla, 'stock_cantidad')) {
        $pdo->exec("ALTER TABLE $tabla ADD COLUMN stock_cantidad INT NOT NULL DEFAULT 0");
        $mensajes[] = "Columna stock_cantidad agregada a $tabla.";
    } else {
        $mensajes[] = "$tabla ya tenia stock_cantidad, se omite.";
    }
}

echo implode("\n", $mensajes) . "\n";
