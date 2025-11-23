<?php
/**
 * Test endpoint to verify API files are being updated
 * Returns version information and file modification times
 */

header('Content-Type: application/json');

$version = [
    'api_version' => '2025-11-23-13:25',
    'deployment_test' => true,
    'files' => [
        'twoFactorRoutes.php' => [
            'exists' => file_exists(__DIR__ . '/twoFactorRoutes.php'),
            'modified' => file_exists(__DIR__ . '/twoFactorRoutes.php') ? date('Y-m-d H:i:s', filemtime(__DIR__ . '/twoFactorRoutes.php')) : null,
            'has_error_handling' => file_exists(__DIR__ . '/twoFactorRoutes.php') ? (strpos(file_get_contents(__DIR__ . '/twoFactorRoutes.php'), 'ob_start()') !== false) : false,
        ],
        'routes/auth.php' => [
            'exists' => file_exists(__DIR__ . '/routes/auth.php'),
            'modified' => file_exists(__DIR__ . '/routes/auth.php') ? date('Y-m-d H:i:s', filemtime(__DIR__ . '/routes/auth.php')) : null,
            'has_change_password' => file_exists(__DIR__ . '/routes/auth.php') ? (strpos(file_get_contents(__DIR__ . '/routes/auth.php'), 'change-password') !== false) : false,
        ],
        'index.php' => [
            'exists' => file_exists(__DIR__ . '/index.php'),
            'modified' => file_exists(__DIR__ . '/index.php') ? date('Y-m-d H:i:s', filemtime(__DIR__ . '/index.php')) : null,
        ],
    ],
    'server_time' => date('Y-m-d H:i:s'),
    'server_timezone' => date_default_timezone_get(),
];

echo json_encode($version, JSON_PRETTY_PRINT);

