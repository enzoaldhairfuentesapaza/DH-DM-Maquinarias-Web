<?php
require_once __DIR__ . '/cli_only.php';
require_once __DIR__ . '/db.php';
$pdo = db();
$cfg = config();
if (!is_dir($cfg['documents_dir'])) mkdir($cfg['documents_dir'], 0750, true);
foreach ($pdo->query("SELECT id, archivo_respuesta FROM cotizaciones WHERE archivo_respuesta IS NOT NULL")->fetchAll() as $row) {
    if (!preg_match('#^/(?:api/)?uploads/([a-f0-9]{32}\.(?:pdf|docx?|xlsx?|jpg|jpeg|png|gif|webp))$#i', $row['archivo_respuesta'], $m)) continue;
    $source = $cfg['uploads_dir'] . '/' . $m[1];
    $destination = $cfg['documents_dir'] . '/' . $m[1];
    // Copy first, then update the reference, then remove the public file.
    if (!is_file($destination) && (!is_file($source) || !copy($source, $destination))) {
        fwrite(STDERR, "No se encontro el archivo de la cotizacion #{$row['id']}; revisar manualmente.\n");
        exit(1);
    }
    $pdo->prepare('UPDATE cotizaciones SET archivo_respuesta = ? WHERE id = ?')->execute(['/api/documentos/' . $m[1], $row['id']]);
    if (is_file($source) && !unlink($source)) throw new RuntimeException('No se pudo retirar el archivo publico');
}
echo "Adjuntos protegidos.\n";
