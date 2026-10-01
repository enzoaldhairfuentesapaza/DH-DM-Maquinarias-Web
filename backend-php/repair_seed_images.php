<?php
require_once __DIR__ . '/cli_only.php';
require_once __DIR__ . '/db.php';

/** Repair only bundled demo records; preserve custom, nonempty image URLs. */
function repair_seed_images(PDO $pdo): int
{
    $sources = [
        ['blog.json', 'blog_posts', 'titulo'],
        ['maquinaria.json', 'maquinarias', 'nombre'],
        ['maquinaria-imagenes-ejemplo.json', 'maquinarias', 'nombre'],
        ['novedades.json', 'novedades', 'titulo'],
        ['promociones.json', 'promociones', 'titulo'],
    ];
    $legacy = [
        'Excavadora Hidráulica 320D' => 'CAT 320.excavator.jpg',
        'Excavadora ZX210' => 'Hitachi excavator EX200.JPG',
    ];
    $changed = 0;
    $pdo->beginTransaction();
    try {
        foreach ($sources as [$file, $table, $key]) {
            $rows = json_decode(file_get_contents(__DIR__ . '/seed_data/' . $file), true, 512, JSON_THROW_ON_ERROR);
            $find = $pdo->prepare("SELECT id, imagen FROM {$table} WHERE {$key} = ?");
            $update = $pdo->prepare("UPDATE {$table} SET imagen = ? WHERE id = ? AND COALESCE(imagen, '') = ?");
            foreach ($rows as $row) {
                $image = $row['imagen'] ?? '';
                if ($image === '') continue;
                $find->execute([$row[$key]]);
                foreach ($find->fetchAll(PDO::FETCH_ASSOC) as $record) {
                    $current = (string) ($record['imagen'] ?? '');
                    $oldFile = $row['imagen_anterior_archivo'] ?? ($legacy[$row[$key]] ?? null);
                    $parts = parse_url($current);
                    $knownLegacy = $oldFile !== null
                        && ($parts['host'] ?? '') === 'commons.wikimedia.org'
                        && rawurldecode($parts['path'] ?? '') === '/wiki/Special:FilePath/' . $oldFile;
                    if ($current !== '' && !$knownLegacy) continue;
                    $update->execute([$image, $record['id'], $current]);
                    $changed += $update->rowCount();
                }
            }
        }
        $pdo->commit();
    } catch (Throwable $error) {
        $pdo->rollBack();
        throw $error;
    }
    return $changed;
}

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    echo 'Rutas de imágenes reparadas: ' . repair_seed_images(db()) . ". Las imágenes personalizadas se conservan.\n";
}
