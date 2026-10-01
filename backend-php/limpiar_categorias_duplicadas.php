<?php
require_once __DIR__ . '/cli_only.php';
/**
 * Utilidad: elimina categorías repetidas de "categorias_productos".
 *
 * Se considera "repetida" cuando dos filas tienen el mismo "tipo" y el mismo
 * "nombre" ignorando mayúsculas/minúsculas y espacios de más (ej. "Frenos",
 * "frenos " y "FRENOS" cuentan como la misma categoría). De cada grupo
 * repetido se conserva la fila más antigua (el id más chico) y se borran
 * las demás.
 *
 * Ejecutar cuando haga falta (se puede correr varias veces sin problema):
 *   php limpiar_categorias_duplicadas.php
 * Ejecutar por terminal; nunca desde el navegador.
 */

require_once __DIR__ . '/db.php';

$pdo = db();

$stmt = $pdo->query('SELECT id, tipo, nombre FROM categorias_productos ORDER BY tipo, id ASC');
$filas = $stmt->fetchAll(PDO::FETCH_ASSOC);

$vistos = []; // clave "tipo|nombre_normalizado" => id que se conserva
$aBorrar = [];
$duplicados = [];

foreach ($filas as $fila) {
    $clave = $fila['tipo'] . '|' . mb_strtolower(trim($fila['nombre']));
    if (isset($vistos[$clave])) {
        $aBorrar[] = (int) $fila['id'];
        $duplicados[] = "  - [{$fila['tipo']}] \"{$fila['nombre']}\" (id {$fila['id']}) es repetido de id {$vistos[$clave]}";
    } else {
        $vistos[$clave] = $fila['id'];
    }
}

if (empty($aBorrar)) {
    echo "No se encontraron categorías repetidas. No se borró nada.\n";
    exit(0);
}

echo "Se encontraron " . count($aBorrar) . " categoría(s) repetida(s):\n";
echo implode("\n", $duplicados) . "\n\n";

$placeholders = implode(',', array_fill(0, count($aBorrar), '?'));
$del = $pdo->prepare("DELETE FROM categorias_productos WHERE id IN ($placeholders)");
$del->execute($aBorrar);

echo "Listo. Se borraron " . $del->rowCount() . " categoría(s) repetida(s); se conservó la más antigua de cada grupo.\n";
