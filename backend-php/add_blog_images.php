<?php
/**
 * Reemplaza las imagenes del blog por las fotos reales que subio el cliente
 * (public/blogs/blog1.jpg ... blog5.jpg), revisadas una por una segun su
 * contenido real (no por orden de archivo, que no coincidia).
 *
 * Correr una sola vez visitando esta URL desde el navegador, luego borrar
 * este archivo del servidor.
 */
require_once __DIR__ . '/db.php';

$asignaciones = [
    'Cómo elegir el filtro hidráulico correcto para tu equipo' => '/blogs/blog5.jpg',
    'Mantenimiento preventivo: ahorra en reparaciones' => '/blogs/blog4.jpg',
    'Repuestos originales vs. alternativos: ventajas y diferencias' => '/blogs/blog3.jpg',
    'Filtros HDM-Filter: nuestra línea propia de filtración' => '/blogs/blog3.jpg',
    'Señales de que tu filtro de combustible necesita cambio' => '/blogs/blog2.jpg',
    'Tren de rodaje: cómo alargar su vida útil' => '/blogs/blog1.jpg',
];

$pdo = db();
$actualizados = 0;

foreach ($asignaciones as $titulo => $urlImagen) {
    $stmt = $pdo->prepare("UPDATE blog_posts SET imagen = ? WHERE titulo = ?");
    $stmt->execute([$urlImagen, $titulo]);
    $actualizados += $stmt->rowCount();
}

echo "Listo. Se actualizaron {$actualizados} articulos con las fotos reales subidas.\n";
