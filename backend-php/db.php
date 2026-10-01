<?php

function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $config = config();
    $dbConfig = $config['db'];

    if ($dbConfig['driver'] === 'sqlite') {
        $dsn = 'sqlite:' . $dbConfig['sqlite_path'];
        $pdo = new PDO($dsn);
    } elseif ($dbConfig['driver'] === 'mysql') {
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            $dbConfig['host'],
            $dbConfig['port'] ?? 3306,
            $dbConfig['name'],
            $dbConfig['charset'] ?? 'utf8mb4'
        );
        $pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['pass']);
    } else {
        throw new RuntimeException('Driver de base de datos no soportado');
    }

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

    if ($dbConfig['driver'] === 'sqlite') {
        // Permite que varias peticiones concurrentes lean/escriban sin
        // bloquearse entre si de inmediato (SQLite es solo para desarrollo
        // local; en produccion se usa MySQL/InnoDB, que maneja esto nativamente).
        $pdo->exec('PRAGMA journal_mode = WAL');
        $pdo->exec('PRAGMA busy_timeout = 5000');
    }

    return $pdo;
}

function config(): array
{
    static $config = null;
    if ($config === null) {
        $config = require __DIR__ . '/config.php';
        if (strlen($config['secret_key']) < 32 || preg_match('/cambia|completar/i', $config['secret_key'])) {
            throw new RuntimeException('Configura JWT_SECRET o secret_key con al menos 32 caracteres aleatorios');
        }
        if ($config['app_env'] === 'production' && $config['db']['driver'] !== 'mysql') {
            throw new RuntimeException('Produccion requiere MySQL');
        }
        date_default_timezone_set($config['timezone'] ?? 'America/Lima');
    }
    return $config;
}
