<?php
/**
 * Configuration for Shared Auth Backend - data-q.org
 * This file contains sensitive credentials and is in .gitignore
 */

// Email configuration
// Set to true to use SMTP (uses PHP's built-in SMTP implementation)
define('SMTP_ENABLED', true);

// SMTP settings (if SMTP_ENABLED is true)
// Afrihost SMTP settings - Use your domain's mail server
define('SMTP_HOST', 'mail.data-q.org');
define('SMTP_USER', 'noreply@data-q.org'); // Your Afrihost email address
define('SMTP_PASS', '!Q@W#E4r5t6y'); // Your Afrihost email password for noreply@data-q.org
define('SMTP_SECURE', 'ssl'); // 'tls' or 'ssl'
define('SMTP_PORT', 465);

// Email sender information
define('EMAIL_FROM', 'noreply@data-q.org');
define('EMAIL_FROM_NAME', 'Shared Auth Demo'); // Optional: Name to display as sender
define('EMAIL_REPLY_TO', 'noreply@data-q.org');

// Application settings
define('APP_URL', 'https://data-q.org'); // Base URL of your application
define('APP_NAME', 'Shared Auth Demo'); // Name of your application

// Database settings (example - adjust to your needs)
// These should match your actual database credentials
define('DB_HOST', 'localhost');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');
define('DB_NAME', 'your_db_name');

?>

