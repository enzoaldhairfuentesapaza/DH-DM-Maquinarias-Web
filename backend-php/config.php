<?php
// Keep real credentials in config.local.php or server environment variables.
$defaults = require __DIR__ . '/config.example.php';
$localPath = getenv('HDM_CONFIG_FILE') ?: __DIR__ . '/config.local.php';
return is_file($localPath) ? array_replace_recursive($defaults, require $localPath) : $defaults;
