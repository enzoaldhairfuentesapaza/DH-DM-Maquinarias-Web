<?php
require_once __DIR__ . '/cli_only.php';
/**
 * Migracion: crea la tabla "categorias_productos" si todavia no existe.
 *
 * Por que hace falta: esta tabla se agrego al archivo schema.mysql.sql junto
 * con la pantalla de "Categorías" del panel (Productos > Categorías), pero
 * como esa base de datos ya existia desde antes, MySQL nunca la creo sola
 * (schema.mysql.sql solo se usa para instalaciones nuevas). Por eso agregar
 * o editar categorias fallaba: el backend intentaba usar una tabla que no
 * existia en el servidor.
 *
 * De paso, esta migracion "siembra" la tabla con las categorias que ya
 * estan en uso dentro de maquinarias y repuestos, para que el selector del
 * panel no aparezca vacio la primera vez.
 *
 * Ejecutar UNA sola vez despues de actualizar el backend:
 *   php migrate_categorias.php
 * Ejecutar por terminal; nunca desde el navegador.
 */

require_once __DIR__ . '/db.php';

$pdo = db();
$driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

try {
    if ($driver === 'mysql') {
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS categorias_productos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tipo ENUM('maquinaria','repuesto') NOT NULL,
                nombre VARCHAR(100) NOT NULL,
                creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_tipo_nombre (tipo, nombre)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
    } else {
        // SQLite (entorno de desarrollo local)
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS categorias_productos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tipo TEXT NOT NULL,
                nombre TEXT NOT NULL,
                creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(tipo, nombre)
            )"
        );
    }
    echo "Tabla categorias_productos lista.\n";

    // Sembramos las categorias que ya estan en uso, para no partir de cero.
    $sembradas = 0;
    foreach (['maquinaria' => 'maquinarias', 'repuesto' => 'repuestos'] as $tipo => $tabla) {
        $stmt = $pdo->query("SELECT DISTINCT categoria FROM {$tabla} WHERE categoria IS NOT NULL AND categoria <> ''");
        foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $nombre) {
            try {
                $ins = $pdo->prepare('INSERT INTO categorias_productos (tipo, nombre) VALUES (?, ?)');
                $ins->execute([$tipo, $nombre]);
                $sembradas++;
                echo "Sembrada categoria [{$tipo}] {$nombre}\n";
            } catch (PDOException $e) {
                // Ya existia (UNIQUE): la ignoramos y seguimos.
                if ($e->getCode() !== '23000') {
                    throw $e;
                }
            }
        }
    }

    echo "\nMigracion completada. Categorias sembradas: {$sembradas}.\n";
} catch (PDOException $e) {
    echo 'Error al migrar: ' . $e->getMessage() . "\n";
    exit(1);
}
