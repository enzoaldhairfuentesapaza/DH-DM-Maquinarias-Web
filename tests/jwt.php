<?php
require __DIR__ . '/../backend-php/jwt.php';
$secret = 'test-secret';
$valid = jwt_encode(['sub' => 1], $secret, 60);
$checks = [
    'valid' => jwt_decode($valid, $secret) !== null,
    'expired boundary' => jwt_decode(jwt_encode(['sub' => 1], $secret, 0), $secret) === null,
    'wrong secret' => jwt_decode($valid, 'wrong') === null,
    'bad format' => jwt_decode('a.b.c', $secret) === null,
    'bad base64' => jwt_decode('!.!.!', $secret) === null,
];
foreach ([['alg' => 'none'], ['alg' => 'HS512'], ['alg' => 'HS256']] as $header) {
    $body = ['sub' => 1]; // Missing expiry must fail, even with a valid HMAC.
    $input = jwt_base64url_encode(json_encode($header)) . '.' . jwt_base64url_encode(json_encode($body));
    $token = $input . '.' . jwt_base64url_encode(hash_hmac('sha256', $input, $secret, true));
    $checks['header/expiry ' . $header['alg']] = jwt_decode($token, $secret) === null;
}
foreach ($checks as $label => $ok) if (!$ok) { fwrite(STDERR, "FAIL {$label}\n"); exit(1); }
echo count($checks) . " JWT checks passed\n";
