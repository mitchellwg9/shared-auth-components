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

## Usage

### 1. Include the utilities in your auth routes

```php
<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../utils/emailTemplates.php';
require_once __DIR__ . '/../utils/smtpClient.php';
require_once __DIR__ . '/../utils/authRoutes.php';

$method = $_SERVER['REQUEST_METHOD'];
$data = getRequestData();
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/api', '', $path);
$pathParts = explode('/', trim($path, '/'));

// Configure SMTP
$smtpConfig = [
    'host' => 'mail.data-q.org',
    'port' => 465,
    'secure' => 'ssl',
    'auth' => [
        'user' => 'noreply@data-q.org',
        'pass' => '!Q@W#E4r5t6y'
    ],
    'from' => 'noreply@data-q.org',
    'fromName' => 'Your App Name'
];

// Handle auth routes
if ($pathParts[0] === 'auth') {
    $conn = getDBConnection();
    handleAuthRoute($conn, $method, $pathParts, $data, [
        'appUrl' => 'https://data-q.org',
        'appName' => 'Your App Name',
        'smtp' => $smtpConfig
    ]);
}
```

### 2. Or use the email templates and SMTP client directly

```php
<?php
require_once __DIR__ . '/utils/emailTemplates.php';
require_once __DIR__ . '/utils/smtpClient.php';

// Generate verification email
$emailHtml = generateVerificationEmail([
    'appName' => 'My App',
    'userName' => 'John Doe',
    'verificationUrl' => 'https://myapp.com/verify?token=abc123',
    'primaryColor' => '#6366f1'
]);

// Send email
$result = sendEmailViaSMTP([
    'host' => 'mail.data-q.org',
    'port' => 465,
    'secure' => 'ssl',
    'auth' => [
        'user' => 'noreply@data-q.org',
        'pass' => '!Q@W#E4r5t6y'
    ],
    'from' => 'noreply@data-q.org',
    'fromName' => 'My App'
], [
    'to' => 'user@example.com',
    'subject' => 'Verify Your Email',
    'html' => $emailHtml
]);

if ($result['success']) {
    echo "Email sent: " . $result['messageId'];
} else {
    echo "Error: " . $result['error'];
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

