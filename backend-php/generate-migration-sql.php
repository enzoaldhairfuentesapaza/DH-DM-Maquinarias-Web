<?php
require_once __DIR__ . '/cli_only.php';
// Offline SQL for phpMyAdmin, without CREATE ROUTINE privileges.
$schema = file_get_contents(__DIR__ . '/schema.mysql.sql');
echo "-- Respaldar la base ANTES de importar; seleccionar la base correcta.\n" . $schema . "\n";
preg_match_all('/CREATE TABLE IF NOT EXISTS (\w+) \((.*?)\n\)/s', $schema, $tables, PREG_SET_ORDER);
foreach ($tables as $table) {
    foreach (explode("\n", $table[2]) as $line) {
        if (!preg_match('/^\s+(\w+)\s+((?:INT|BIGINT|TINYINT|VARCHAR|TEXT|JSON|ENUM|DATETIME|DECIMAL)\b.*?)(?:,)?$/', $line, $column)) continue;
        if ($column[1] === 'id') continue;
        $definition = rtrim($column[2], ',');
        $sql = "ALTER TABLE {$table[1]} ADD COLUMN {$column[1]} {$definition}";
        $quoted = str_replace("'", "''", $sql);
        echo "SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{$table[1]}' AND COLUMN_NAME = '{$column[1]}') > 0, 'SELECT 1', '{$quoted}');\n";
        echo "PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;\n";
    }
}
echo "ALTER TABLE usuarios MODIFY rol ENUM('cliente','admin','owner','cotizador') NOT NULL DEFAULT 'cliente';\n";
echo "ALTER TABLE cotizaciones MODIFY canal_respuesta VARCHAR(60) DEFAULT NULL;\n";
