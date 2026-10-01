<?php
require_once __DIR__ . '/cli_only.php';
/**
 * Migracion v1.3: agrega a la base de datos ya existente todo lo necesario
 * para el flujo nuevo de cotizaciones (papelera, flag "mostrar en la
 * pagina", canal de respuesta multiple) y el registro de auditoria general.
 *
 * Ejecutar UNA sola vez despues de actualizar el backend:
 *   php migrate_v1_3.php
 * Ejecutar por terminal; nunca desde el navegador.
 */

require_once __DIR__ . '/db.php';

$pdo = db();
$driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

function columnaExiste(PDO $pdo, string $driver, string $tabla, string $columna): bool
{
    if ($driver === 'mysql') {
        $stmt = $pdo->prepare(
            "SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?"
        );
        $stmt->execute([$tabla, $columna]);
        return (bool) $stmt->fetchColumn();
    }
    // SQLite
    $stmt = $pdo->query("PRAGMA table_info({$tabla})");
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $col) {
        if ($col['name'] === $columna) return true;
    }
    return false;
}

try {
    if ($driver === 'mysql') {
        $columnasNuevas = [
            'mostrar_en_pagina' => "TINYINT(1) NOT NULL DEFAULT 0",
            'eliminado_en' => "DATETIME DEFAULT NULL",
            'eliminado_por' => "INT DEFAULT NULL",
            'eliminado_por_nombre' => "VARCHAR(150) DEFAULT NULL",
            'motivo_eliminacion' => "TEXT DEFAULT NULL",
        ];
        foreach ($columnasNuevas as $col => $def) {
            if (!columnaExiste($pdo, $driver, 'cotizaciones', $col)) {
                $pdo->exec("ALTER TABLE cotizaciones ADD COLUMN {$col} {$def}");
                echo "Agregada columna cotizaciones.{$col}\n";
            } else {
                echo "Ya existia cotizaciones.{$col}\n";
            }
        }
        // canal_respuesta ahora puede guardar varios canales separados por coma.
        $pdo->exec("ALTER TABLE cotizaciones MODIFY COLUMN canal_respuesta VARCHAR(60) DEFAULT NULL");
        echo "Ampliada cotizaciones.canal_respuesta\n";
    } else {
        // SQLite: las columnas ya se crean via init_sqlite.php en desarrollo.
        $columnas = ['mostrar_en_pagina', 'eliminado_en', 'eliminado_por', 'eliminado_por_nombre', 'motivo_eliminacion'];
        foreach ($columnas as $col) {
            if (!columnaExiste($pdo, $driver, 'cotizaciones', $col)) {
                $tipo = $col === 'mostrar_en_pagina' ? 'INTEGER NOT NULL DEFAULT 0' : 'TEXT';
                $pdo->exec("ALTER TABLE cotizaciones ADD COLUMN {$col} {$tipo}");
                echo "Agregada columna cotizaciones.{$col}\n";
            }
        }
    }

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS auditoria (
            id " . ($driver === 'mysql' ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT') . ",
            usuario_id INT DEFAULT NULL,
            usuario_nombre VARCHAR(150) DEFAULT NULL,
            usuario_rol VARCHAR(30) DEFAULT NULL,
            categoria VARCHAR(60) NOT NULL,
            accion VARCHAR(30) NOT NULL,
            descripcion VARCHAR(500) NOT NULL,
            creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )" . ($driver === 'mysql' ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4' : '')
    );
    echo "Tabla auditoria lista.\n";

    echo "\nMigración v1.3 completada correctamente.\n";
} catch (PDOException $e) {
    echo "Error al migrar: " . $e->getMessage() . "\n";
    exit(1);
}
