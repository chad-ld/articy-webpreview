<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'test' => 'htaccess-php-test',
    'message' => 'If you can read this, PHP files are being executed correctly!',
    'timestamp' => date('Y-m-d H:i:s'),
    'status' => 'success',
    'php_version' => phpversion()
]);
?>
