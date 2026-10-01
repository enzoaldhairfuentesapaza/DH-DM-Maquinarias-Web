<?php
require_once __DIR__ . '/cli_only.php';
// Compatibility entry point: repair bundled images without replacing custom images.
require_once __DIR__ . '/repair_seed_images.php';
echo 'Rutas de imágenes reparadas: ' . repair_seed_images(db()) . ". Las imágenes ya están incluidas en public/.\n";
