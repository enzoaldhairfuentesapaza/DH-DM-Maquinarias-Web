<?php
require_once __DIR__ . '/cli_only.php';
/**
 * Migracion: crea la tabla "configuracion_sitio" y la siembra con valores
 * por defecto (numeros de contacto al azar, para que el admin los cambie
 * por los reales desde el panel "Editar Página > Números y correo").
 *
 * Ejecutar UNA sola vez despues de actualizar el backend:
 *   php migrate_configuracion_sitio.php
 */

require_once __DIR__ . '/db.php';

$pdo = db();
$driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

try {
    if ($driver === 'mysql') {
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS configuracion_sitio (
                clave VARCHAR(80) PRIMARY KEY,
                valor VARCHAR(255) NOT NULL,
                actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
    } else {
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS configuracion_sitio (
                clave TEXT PRIMARY KEY,
                valor TEXT NOT NULL,
                actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
            )"
        );
    }
    echo "Tabla configuracion_sitio lista.\n";

    // Valores al azar de partida (el admin los reemplaza por los reales).
    $defaults = [
        'whatsapp_primario' => '51988341207',
        'whatsapp_secundario' => '51976215893',
        'correo_contacto' => 'contacto@dh-dm-maquinarias.com',
    ];

    $existe = $pdo->prepare('SELECT COUNT(*) FROM configuracion_sitio WHERE clave = ?');
    $ins = $pdo->prepare('INSERT INTO configuracion_sitio (clave, valor) VALUES (?, ?)');

    foreach ($defaults as $clave => $valor) {
        $existe->execute([$clave]);
        if ((int) $existe->fetchColumn() === 0) {
            $ins->execute([$clave, $valor]);
            echo "Sembrado {$clave} = {$valor}\n";
        }
    }

    echo "\nMigracion completada correctamente.\n";
} catch (PDOException $e) {
    echo 'Error al migrar: ' . $e->getMessage() . "\n";
    exit(1);
}
