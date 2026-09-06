<?php

function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $config = require __DIR__ . '/config.php';
    $dbConfig = $config['db'];

    if ($dbConfig['driver'] === 'sqlite') {
        $dsn = 'sqlite:' . $dbConfig['sqlite_path'];
        $pdo = new PDO($dsn);
    } else {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            $dbConfig['host'],
            $dbConfig['name'],
            $dbConfig['charset'] ?? 'utf8mb4'
        );
        $pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['pass']);
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
    }
    return $config;
}
