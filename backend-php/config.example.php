<?php
$production = (getenv('APP_ENV') ?: 'development') === 'production';
return [
    'app_env' => $production ? 'production' : 'development',
    'timezone' => 'America/Lima',
    'db' => [
        'driver' => getenv('DB_DRIVER') ?: ($production ? 'mysql' : 'sqlite'),
        'sqlite_path' => getenv('DB_SQLITE_PATH') ?: __DIR__ . '/hdm.db',
        'host' => getenv('DB_HOST') ?: 'localhost',
        'port' => (int) (getenv('DB_PORT') ?: 3306),
        'name' => getenv('DB_NAME') ?: '',
        'user' => getenv('DB_USER') ?: '',
        'pass' => getenv('DB_PASSWORD') ?: '',
        'charset' => 'utf8mb4',
    ],
    'secret_key' => getenv('JWT_SECRET') ?: '',
    'token_expire_seconds' => 3600,
    'owner_email' => getenv('OWNER_EMAIL') ?: '',
    'owner_password' => getenv('OWNER_PASSWORD') ?: '',
    'owner_nombre' => getenv('OWNER_NAME') ?: 'Administrador Principal',
    'cors_origins' => $production
        ? ['https://dh-dm-maquinarias.com', 'https://www.dh-dm-maquinarias.com']
        : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    'uploads_dir' => __DIR__ . '/uploads',
    'uploads_url_prefix' => '/api/uploads',
    'documents_dir' => __DIR__ . '/private/documents',
];
