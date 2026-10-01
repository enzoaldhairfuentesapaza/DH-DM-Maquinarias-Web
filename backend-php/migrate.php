<?php
require_once __DIR__ . '/cli_only.php';
require_once __DIR__ . '/db.php';

// Idempotent, additive migration. Back up the database before executing it.
$pdo = db();
$driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
$schema = file_get_contents(__DIR__ . '/schema.mysql.sql');
if ($driver === 'mysql') {
    $pdo->exec($schema);
} else {
    require __DIR__ . '/init_sqlite.php';
}
preg_match_all('/CREATE TABLE IF NOT EXISTS (\w+) \((.*?)\n\)/s', $schema, $tables, PREG_SET_ORDER);
foreach ($tables as $table) {
    $name = $table[1];
    if ($driver === 'mysql') {
        $stmt = $pdo->prepare('SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?');
        $stmt->execute([$name]);
        $existing = $stmt->fetchAll(PDO::FETCH_COLUMN);
    } else {
        $existing = array_column($pdo->query("PRAGMA table_info({$name})")->fetchAll(), 'name');
    }
    foreach (explode("\n", $table[2]) as $line) {
        if (!preg_match('/^\s+(\w+)\s+((?:INT|BIGINT|TINYINT|VARCHAR|TEXT|JSON|ENUM|DATETIME|DECIMAL)\b.*?)(?:,)?$/', $line, $column)) continue;
        [$full, $field, $definition] = $column;
        if (in_array($field, $existing, true) || $field === 'id') continue;
        $definition = rtrim($definition, ',');
        if ($driver === 'sqlite') {
            $definition = preg_replace('/ENUM\([^)]*\)|VARCHAR\(\d+\)|DATETIME|JSON/', 'TEXT', $definition);
            $definition = preg_replace('/TINYINT\(\d+\)|\bINT\b|BIGINT/', 'INTEGER', $definition);
            $definition = preg_replace('/DECIMAL\([^)]*\)/', 'REAL', $definition);
            $definition = str_replace(' ON UPDATE CURRENT_TIMESTAMP', '', $definition);
            // SQLite cannot ADD a non-constant default; old rows get a deterministic backfill.
            if (str_contains($definition, 'DEFAULT CURRENT_TIMESTAMP')) {
                $pdo->exec("ALTER TABLE {$name} ADD COLUMN {$field} TEXT");
                $pdo->exec("UPDATE {$name} SET {$field} = CURRENT_TIMESTAMP WHERE {$field} IS NULL");
                echo "Agregada {$name}.{$field}\n";
                continue;
            }
        }
        $pdo->exec("ALTER TABLE {$name} ADD COLUMN {$field} {$definition}");
        echo "Agregada {$name}.{$field}\n";
    }
}
if ($driver === 'mysql') {
    $pdo->exec("ALTER TABLE usuarios MODIFY rol ENUM('cliente','admin','owner','cotizador') NOT NULL DEFAULT 'cliente'");
    $pdo->exec('ALTER TABLE cotizaciones MODIFY canal_respuesta VARCHAR(60) DEFAULT NULL');
}
// Configuration inserts never replace values the business already customized.
require __DIR__ . '/migrate_configuracion_sitio.php';
echo "Migracion aditiva completada.\n";
