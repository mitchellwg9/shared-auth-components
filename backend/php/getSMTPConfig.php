<?php
/**
 * Helper function to get SMTP configuration from constants
 * This reads the SMTP settings from your config.php file
 * 
 * Usage:
 * require_once __DIR__ . '/config.php';
 * require_once __DIR__ . '/getSMTPConfig.php';
 * 
 * $smtpConfig = getSMTPConfig();
 */
function getSMTPConfig() {
    if (!defined('SMTP_ENABLED') || !SMTP_ENABLED) {
        return null; // SMTP not enabled
    }
    
    if (!defined('SMTP_HOST') || !defined('SMTP_USER') || !defined('SMTP_PASS')) {
        return null; // SMTP not properly configured
    }
    
    return [
        'host' => SMTP_HOST,
        'port' => defined('SMTP_PORT') ? SMTP_PORT : 465,
        'secure' => defined('SMTP_SECURE') ? SMTP_SECURE : 'ssl',
        'auth' => [
            'user' => SMTP_USER,
            'pass' => SMTP_PASS
        ],
        'from' => defined('EMAIL_FROM') ? EMAIL_FROM : SMTP_USER,
        'fromName' => defined('EMAIL_FROM_NAME') ? EMAIL_FROM_NAME : (defined('APP_NAME') ? APP_NAME : null)
    ];
}

/**
 * Get application configuration
 * @return array Application config
 */
function getAppConfig() {
    return [
        'appUrl' => defined('APP_URL') ? APP_URL : '',
        'appName' => defined('APP_NAME') ? APP_NAME : 'App',
        'smtp' => getSMTPConfig()
    ];
}

?>

