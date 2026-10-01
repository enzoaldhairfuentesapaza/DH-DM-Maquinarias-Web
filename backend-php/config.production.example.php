<?php
// Copy to config.local.php on the hosting. Do not commit real values.
return [
    'app_env' => 'production',
    'db' => [
        'driver' => 'mysql', 'host' => 'localhost', 'port' => 3306,
        'name' => 'COMPLETAR', 'user' => 'COMPLETAR', 'pass' => 'COMPLETAR',
    ],
    'secret_key' => 'COMPLETAR_CON_64_CARACTERES_ALEATORIOS',
    'owner_email' => 'COMPLETAR',
    'owner_password' => 'COMPLETAR',
    'owner_nombre' => 'Administrador Principal',
    'cors_origins' => ['https://dh-dm-maquinarias.com', 'https://www.dh-dm-maquinarias.com'],
];
