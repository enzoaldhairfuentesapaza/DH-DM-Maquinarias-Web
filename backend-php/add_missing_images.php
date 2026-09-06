<?php
/**
 * Agrega fotos (licencia libre, Wikimedia Commons) a los productos que no
 * tenian imagen todavia. Solo actualiza el campo 'imagen' cuando esta vacio,
 * no toca ningun otro dato del producto.
 *
 * Correr una sola vez visitando esta URL desde el navegador, luego borrar
 * este archivo del servidor.
 *
 * Creditos de fotos (Wikimedia Commons, licencias libres):
 * - CAT 320.excavator.jpg
 * - Komatsu PC200-8 Hydraulic Excavator -Rakhu Bhagawati,Myagdi-0462.jpg
 * - Hitachi excavator EX200.JPG
 */
require_once __DIR__ . '/db.php';

function wm(string $filename, int $width = 900): string
{
    return 'https://commons.wikimedia.org/wiki/Special:FilePath/' . rawurlencode($filename) . '?width=' . $width;
}

$asignaciones = [
    'Excavadora Hidráulica 320D' => wm('CAT 320.excavator.jpg'),
    'Excavadora PC200-8' => '/maquinaria/pc200-8.jpg',
    'Excavadora ZX210' => wm('Hitachi excavator EX200.JPG'),
];

$pdo = db();
$actualizados = 0;

foreach ($asignaciones as $nombre => $urlImagen) {
    $stmt = $pdo->prepare(
        "UPDATE maquinarias SET imagen = ? WHERE nombre = ? AND (imagen IS NULL OR imagen = '')"
    );
    $stmt->execute([$urlImagen, $nombre]);
    $actualizados += $stmt->rowCount();
}

echo "Listo. Se actualizaron {$actualizados} productos con foto nueva (los que ya tenian foto no se tocaron).\n";
