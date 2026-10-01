<?php
// Router for the PHP development server; matches Apache's access restrictions.
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
if (preg_match('#^/(?:api/)?(?:uploads)/([a-f0-9]{32}\.(?:jpg|jpeg|png|gif|webp))$#i', $path, $m)) {
    $file = __DIR__ . '/uploads/' . $m[1];
    if (is_file($file)) {
        header('Content-Type: ' . (new finfo(FILEINFO_MIME_TYPE))->file($file));
        header('X-Content-Type-Options: nosniff');
        readfile($file);
        return true;
    }
}
if (preg_match('#\.(?:php|db|sql|sqlite)(?:/|$)|/(?:private|seed_data)(?:/|$)|/\.#i', $path)) {
    http_response_code(403); echo 'Acceso denegado'; return true;
}
require __DIR__ . '/index.php';
