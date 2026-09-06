<?php
/**
 * Migracion: agrega a la tabla usuarios las columnas necesarias para el
 * registro extendido (telefono, tipo/numero de documento, razon social).
 *
 * Correr una sola vez visitando esta URL desde el navegador, luego borrar
 * este archivo del servidor. Es seguro volver a correrlo (ignora columnas
 * que ya existan).
 */
require_once __DIR__ . '/db.php';

$pdo = db();
$driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

$columnas = [
    'telefono' => "VARCHAR(30) NULL",
    'tipo_documento' => "VARCHAR(10) NULL",
    'numero_documento' => "VARCHAR(20) NULL",
    'razon_social' => "VARCHAR(200) NULL",
];

$agregadas = [];

foreach ($columnas as $nombre => $tipo) {
    try {
        if ($driver === 'sqlite') {
            $existe = $pdo->query("PRAGMA table_info(usuarios)")->fetchAll();
            $yaExiste = false;
            foreach ($existe as $col) {
                if ($col['name'] === $nombre) {
                    $yaExiste = true;
                    break;
                }
            }
            if ($yaExiste) continue;
            $pdo->exec("ALTER TABLE usuarios ADD COLUMN {$nombre} {$tipo}");
        } else {
            $pdo->exec("ALTER TABLE usuarios ADD COLUMN {$nombre} {$tipo}");
        }
        $agregadas[] = $nombre;
    } catch (Exception $e) {
        // La columna probablemente ya existe, se ignora.
    }
}

echo "Listo. Columnas agregadas: " . (empty($agregadas) ? "ninguna (ya existian)" : implode(', ', $agregadas)) . "\n";
