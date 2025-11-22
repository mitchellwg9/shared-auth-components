<?php
/**
 * Simple SMTP Config Test Endpoint
 * Returns JSON with current SMTP configuration (without passwords)
 * Access: https://data-q.org/api/test-smtp-config
 */

require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

$config = [
    'smtp_enabled' => defined('SMTP_ENABLED') ? SMTP_ENABLED : false,
    'smtp_host' => defined('SMTP_HOST') ? SMTP_HOST : 'Not set',
    'smtp_port' => defined('SMTP_PORT') ? SMTP_PORT : 'Not set',
    'smtp_secure' => defined('SMTP_SECURE') ? SMTP_SECURE : 'Not set',
    'smtp_user' => defined('SMTP_USER') ? SMTP_USER : 'Not set',
    'smtp_pass_set' => defined('SMTP_PASS') && !empty(SMTP_PASS) ? 'Yes (hidden)' : 'No',
    'email_from' => defined('EMAIL_FROM') ? EMAIL_FROM : 'Not set',
    'email_from_name' => defined('EMAIL_FROM_NAME') ? EMAIL_FROM_NAME : 'Not set',
    'app_url' => defined('APP_URL') ? APP_URL : 'Not set',
    'app_name' => defined('APP_NAME') ? APP_NAME : 'Not set',
    'config_file_loaded' => file_exists(__DIR__ . '/config.php') ? 'Yes' : 'No',
    'config_file_path' => __DIR__ . '/config.php',
];

// Verify Afrihost settings
$isAfrihost = (
    (defined('SMTP_HOST') && SMTP_HOST === 'mail.data-q.org') &&
    (defined('SMTP_USER') && SMTP_USER === 'noreply@data-q.org') &&
    (defined('SMTP_PORT') && SMTP_PORT === 465) &&
    (defined('SMTP_SECURE') && SMTP_SECURE === 'ssl')
);

$config['using_afrihost_settings'] = $isAfrihost ? 'Yes' : 'No';

echo json_encode($config, JSON_PRETTY_PRINT);

