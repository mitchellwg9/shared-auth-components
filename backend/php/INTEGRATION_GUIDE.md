# Email Integration Guide for data-q.org API

This guide will help you integrate SMTP email sending into your existing `https://data-q.org/api` backend.

## Quick Fix: Update Your Existing API

If your API already has email sending code (like TymTrackr), you just need to update the SMTP settings in your `config.php`:

### Step 1: Update config.php

Make sure your `config.php` has these SMTP settings:

```php
// Email configuration
define('SMTP_ENABLED', true);

// SMTP settings
define('SMTP_HOST', 'mail.data-q.org');
define('SMTP_USER', 'noreply@data-q.org');
define('SMTP_PASS', '!Q@W#E4r5t6y');
define('SMTP_SECURE', 'ssl'); // 'tls' or 'ssl'
define('SMTP_PORT', 465);

// Email sender information
define('EMAIL_FROM', 'noreply@data-q.org');
define('EMAIL_FROM_NAME', 'Shared Auth Demo');
define('APP_URL', 'https://data-q.org');
```

### Step 2: Verify Your Email Function

Check your `utils/email.php` file. The `sendVerificationEmail()` function should be using `sendEmail()` which should use SMTP when `SMTP_ENABLED` is true.

### Step 3: Test SMTP Connection

Create a test file `test-email-smtp.php`:

```php
<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/utils/email.php';

// Test email sending
$testEmail = 'your-email@example.com'; // Change to your email
$testName = 'Test User';
$testToken = 'test-token-123';

echo "Testing email sending...\n";
echo "SMTP_ENABLED: " . (SMTP_ENABLED ? 'true' : 'false') . "\n";
echo "SMTP_HOST: " . SMTP_HOST . "\n";
echo "SMTP_USER: " . SMTP_USER . "\n";
echo "SMTP_PORT: " . SMTP_PORT . "\n";
echo "SMTP_SECURE: " . SMTP_SECURE . "\n";
echo "\n";

$result = sendVerificationEmail($testEmail, $testName, $testToken);

if ($result) {
    echo "✅ Email sent successfully!\n";
    echo "Check your inbox at: $testEmail\n";
} else {
    echo "❌ Email sending failed!\n";
    echo "Check error logs for details.\n";
}
?>
```

Run it via command line or browser to test.

### Step 4: Check Error Logs

If emails aren't sending, check your PHP error logs. Common issues:

1. **SMTP connection failed**: Check firewall/port blocking
2. **Authentication failed**: Verify username/password
3. **SSL/TLS issues**: Try changing `SMTP_SECURE` to `'tls'` and port to `587`

## Alternative: Use Shared Auth Backend

If you want to use the shared-auth backend utilities instead:

1. Copy files from `backend/php/` to your API:
   - `emailTemplates.php` → `utils/emailTemplates.php`
   - `smtpClient.php` → `utils/smtpClient.php`
   - `getSMTPConfig.php` → `utils/getSMTPConfig.php`

2. Update your registration endpoint to use the new functions:

```php
require_once __DIR__ . '/../utils/emailTemplates.php';
require_once __DIR__ . '/../utils/smtpClient.php';
require_once __DIR__ . '/../utils/getSMTPConfig.php';

// In your register action:
if ($hasEmailVerification && $verificationToken) {
    $smtpConfig = getSMTPConfig();
    if ($smtpConfig) {
        $verificationUrl = APP_URL . '/app/demo/?token=' . urlencode($verificationToken);
        $emailHtml = generateVerificationEmail([
            'appName' => 'Shared Auth Demo',
            'userName' => $name,
            'verificationUrl' => $verificationUrl,
            'primaryColor' => '#6366f1'
        ]);
        
        $emailResult = sendEmailViaSMTP($smtpConfig, [
            'to' => $email,
            'subject' => 'Verify Your Email Address - Shared Auth Demo',
            'html' => $emailHtml
        ]);
        
        if (!$emailResult['success']) {
            error_log("Email failed: " . $emailResult['error']);
        }
    }
}
```

## Troubleshooting

### Email not arriving?

1. **Check spam folder** - Verification emails often go to spam
2. **Check error logs** - Look for SMTP connection errors
3. **Test SMTP connection** - Use the test file above
4. **Verify credentials** - Make sure password is correct
5. **Check port/firewall** - Port 465 (SSL) or 587 (TLS) must be open

### Common Error Messages

- **"SMTP connection failed"**: Check host, port, and firewall
- **"Authentication failed"**: Wrong username or password
- **"STARTTLS failed"**: Try using SSL (port 465) instead of TLS (port 587)

## Need Help?

Check your API's error logs first. The email sending function should log errors if something goes wrong.

