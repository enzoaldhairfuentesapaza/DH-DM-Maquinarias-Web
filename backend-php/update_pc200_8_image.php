<?php
/**
 * Reemplaza la foto de la Excavadora PC200-8 por la foto real subida por el
 * cliente (public/maquinaria/pc200-8.jpg), sin importar si ya tenia otra
 * imagen asignada antes (a diferencia de add_missing_images.php, que solo
 * actualiza cuando el campo esta vacio).
 *
 * Correr una sola vez visitando esta URL desde el navegador, luego borrar
 * este archivo del servidor.
 */
require_once __DIR__ . '/db.php';

$pdo = db();
$stmt = $pdo->prepare("UPDATE maquinarias SET imagen = ? WHERE nombre = ?");
$stmt->execute(['/maquinaria/pc200-8.jpg', 'Excavadora PC200-8']);

echo "Listo. Filas actualizadas: " . $stmt->rowCount() . "\n";
