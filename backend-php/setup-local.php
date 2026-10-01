<?php
require_once __DIR__ . '/cli_only.php';
$path = __DIR__ . '/config.local.php';
if (is_file($path)) { fwrite(STDERR, "Ya existe config.local.php; no se sobrescribio.\n"); exit(1); }
$settings = ['app_env' => 'development', 'secret_key' => bin2hex(random_bytes(32))];
file_put_contents($path, "<?php\nreturn " . var_export($settings, true) . ";\n");
chmod($path, 0600);
echo "Configuracion local creada. Define OWNER_EMAIL y OWNER_PASSWORD antes de seed.php.\n";
