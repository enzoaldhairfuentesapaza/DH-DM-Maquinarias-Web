<?php
require_once __DIR__ . '/cli_only.php';
/**
 * Agrega:
 * - columnas archivo_respuesta y canal_respuesta a "cotizaciones"
 *   (para adjuntar el PDF/archivo de la cotizacion respondida y saber si
 *   se contacto al cliente por telefono o correo).
 * - tabla "notificaciones" (el buzon de cada usuario).
 *
 * Seguro de correr varias veces. Correr una sola vez visitando esta URL
 * Ejecutar por terminal; nunca desde el navegador.
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

function tableExists(PDO $pdo, string $table): bool
{
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    if ($driver === 'sqlite') {
        $stmt = $pdo->prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?");
        $stmt->execute([$table]);
        return (bool) $stmt->fetch();
    }
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) as c FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = ?"
    );
    $stmt->execute([$table]);
    return (int) $stmt->fetch()['c'] > 0;
}

$pdo = db();
$driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
$mensajes = [];

if (!columnExists($pdo, 'cotizaciones', 'archivo_respuesta')) {
    $tipo = $driver === 'sqlite' ? 'TEXT' : 'VARCHAR(500)';
    $pdo->exec("ALTER TABLE cotizaciones ADD COLUMN archivo_respuesta $tipo DEFAULT NULL");
    $mensajes[] = 'Columna archivo_respuesta agregada a cotizaciones.';
} else {
    $mensajes[] = 'cotizaciones ya tenia archivo_respuesta, se omite.';
}

if (!columnExists($pdo, 'cotizaciones', 'canal_respuesta')) {
    $tipo = $driver === 'sqlite' ? 'TEXT' : 'VARCHAR(20)';
    $pdo->exec("ALTER TABLE cotizaciones ADD COLUMN canal_respuesta $tipo DEFAULT NULL");
    $mensajes[] = 'Columna canal_respuesta agregada a cotizaciones.';
} else {
    $mensajes[] = 'cotizaciones ya tenia canal_respuesta, se omite.';
}

if (!tableExists($pdo, 'notificaciones')) {
    if ($driver === 'sqlite') {
        $pdo->exec("CREATE TABLE notificaciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            cotizacion_id INTEGER,
            tipo TEXT NOT NULL DEFAULT 'cotizacion',
            mensaje TEXT NOT NULL,
            leida INTEGER NOT NULL DEFAULT 0,
            creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )");
    } else {
        $pdo->exec("CREATE TABLE notificaciones (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            cotizacion_id INT DEFAULT NULL,
            tipo VARCHAR(30) NOT NULL DEFAULT 'cotizacion',
            mensaje TEXT NOT NULL,
            leida TINYINT(1) NOT NULL DEFAULT 0,
            creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX (usuario_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    }
    $mensajes[] = 'Tabla notificaciones creada.';
} else {
    $mensajes[] = 'La tabla notificaciones ya existia, se omite.';
}

echo implode("\n", $mensajes) . "\n";
