# Shared Auth Backend (PHP)

PHP backend utilities for the shared authentication components. This package provides:

1. **Email Templates** - PHP functions to generate HTML emails matching the frontend design
2. **SMTP Client** - PHP function to send emails via SMTP
3. **Auth Routes** - PHP function to handle authentication endpoints

## Installation

Copy the PHP files to your backend API directory:

```
your-api/
  ├── routes/
  │   └── auth.php (your existing auth routes)
  ├── utils/
  │   ├── emailTemplates.php (from shared-auth/backend/php/)
  │   ├── smtpClient.php (from shared-auth/backend/php/)
  │   └── authRoutes.php (from shared-auth/backend/php/)
```

## Setup

### 1. Copy the configuration file

Copy `config.example.php` to `config.php` and update with your settings:

```php
<?php
// Email configuration
define('SMTP_ENABLED', true);
define('SMTP_HOST', 'mail.data-q.org');
define('SMTP_USER', 'noreply@data-q.org');
define('SMTP_PASS', '!Q@W#E4r5t6y');
define('SMTP_SECURE', 'ssl');
define('SMTP_PORT', 465);
define('EMAIL_FROM', 'noreply@data-q.org');
define('EMAIL_FROM_NAME', 'Your App Name');

// Application settings
define('APP_URL', 'https://data-q.org');
define('APP_NAME', 'Your App Name');
?>
```

### 2. Include the utilities in your auth routes

```php
<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../utils/emailTemplates.php';
require_once __DIR__ . '/../utils/smtpClient.php';
require_once __DIR__ . '/../utils/authRoutes.php';
require_once __DIR__ . '/../utils/getSMTPConfig.php'; // Helper to read config

$method = $_SERVER['REQUEST_METHOD'];
$data = getRequestData();
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/api', '', $path);
$pathParts = explode('/', trim($path, '/'));

// Handle auth routes (automatically reads SMTP config from constants)
if ($pathParts[0] === 'auth') {
    $conn = getDBConnection();
    handleAuthRoute($conn, $method, $pathParts, $data, getAppConfig());
}
```

### 3. Or use the email templates and SMTP client directly

```php
<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/utils/emailTemplates.php';
require_once __DIR__ . '/utils/smtpClient.php';
require_once __DIR__ . '/utils/getSMTPConfig.php';

// Get SMTP config from constants
$smtpConfig = getSMTPConfig();

// Generate verification email
$emailHtml = generateVerificationEmail([
    'appName' => defined('APP_NAME') ? APP_NAME : 'My App',
    'userName' => 'John Doe',
    'verificationUrl' => 'https://myapp.com/verify?token=abc123',
    'primaryColor' => '#6366f1'
]);

// Send email
if ($smtpConfig) {
    $result = sendEmailViaSMTP($smtpConfig, [
        'to' => 'user@example.com',
        'subject' => 'Verify Your Email',
        'html' => $emailHtml
    ]);
    
    if ($result['success']) {
        echo "Email sent: " . $result['messageId'];
    } else {
        echo "Error: " . $result['error'];
    }
} else {
    echo "SMTP not configured";
}
```

## Available Functions

### Email Templates

- `generateVerificationEmail($options)` - Generate verification email HTML
- `generatePasswordResetEmail($options)` - Generate password reset email HTML
- `generateWelcomeEmail($options)` - Generate welcome email HTML (after verification)

### SMTP Client

- `sendEmailViaSMTP($config, $emailOptions)` - Send email via SMTP

### Auth Routes

- `handleAuthRoute($conn, $method, $pathParts, $data, $config)` - Handle authentication endpoints

## Configuration

The `handleAuthRoute` function accepts a configuration array:

```php
[
    'appUrl' => 'https://data-q.org',        // Base URL of your app
    'appName' => 'Your App Name',            // Name of your app
    'smtp' => [                              // SMTP configuration (optional)
        'host' => 'mail.data-q.org',
        'port' => 465,
        'secure' => 'ssl',
        'auth' => [
            'user' => 'noreply@data-q.org',
            'pass' => 'your-password'
        ],
        'from' => 'noreply@data-q.org',
        'fromName' => 'Your App Name'
    ]
]
```

## Database Schema

Your `users` table should have these columns for email verification:

```sql
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(64) NULL;
ALTER TABLE users ADD COLUMN email_verification_token_expires DATETIME NULL;
```

## Notes

- The email templates match the design system used in the frontend components
- The SMTP client supports both SSL (port 465) and TLS (port 587)
- The auth routes handle registration and email verification automatically
- If SMTP is not configured, registration will still work but verification emails won't be sent

