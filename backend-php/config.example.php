<?php
/**
 * Configuracion central. En produccion, copia config.example.php a config.php
 * y coloca aqui tus datos reales de MySQL (los que te da hosting.com.pe
 * al crear la base de datos en Webuzo/cPanel).
 */

return [
    // Para desarrollo local con SQLite (no requiere instalar MySQL):
    'db' => [
        'driver' => 'sqlite',
        'sqlite_path' => __DIR__ . '/hdm.db',
    ],

    // Para produccion con MySQL (descomenta y completa con tus datos reales,
    // y comenta el bloque 'sqlite' de arriba):
    // 'db' => [
    //     'driver' => 'mysql',
    //     'host' => 'localhost',
    //     'name' => 'usuario_hdm',       // nombre de la base de datos
    //     'user' => 'usuario_hdm',       // usuario de MySQL
    //     'pass' => 'tu_password_aqui',
    //     'charset' => 'utf8mb4',
    // ],

    // Cambia esto por una cadena larga y aleatoria en produccion.
    'secret_key' => 'cambia-esto-por-una-clave-secreta-larga-y-aleatoria',
    'token_expire_seconds' => 60 * 60, // 1 hora

    // Datos del primer OWNER (se crea al correr seed.php una sola vez)
    'owner_email' => 'owner@hdm.com',
    'owner_password' => 'CambiaEstaClave123!',
    'owner_nombre' => 'Administrador Principal',

    // Dominios permitidos para CORS (tu frontend). En produccion pon tu dominio real.
    'cors_origins' => [
        'http://localhost:5173',
        'http://localhost:3000',
        // 'https://tudominio.com',
    ],

    // Carpeta donde se guardan las imagenes subidas desde el panel admin
    'uploads_dir' => __DIR__ . '/uploads',
    'uploads_url_prefix' => '/uploads',
];
