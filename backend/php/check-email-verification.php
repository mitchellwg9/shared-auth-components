<?php
/**
 * Check if email verification columns exist in the database
 * This will help diagnose why emails aren't being sent
 */

require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

$conn = getDBConnection();

// Check if email verification columns exist
$checkEmailVerification = $conn->query("SHOW COLUMNS FROM users LIKE 'email_verified'");
$hasEmailVerification = $checkEmailVerification->num_rows > 0;

$result = [
    'has_email_verification_columns' => $hasEmailVerification,
    'smtp_enabled' => defined('SMTP_ENABLED') ? SMTP_ENABLED : false,
    'smtp_host' => defined('SMTP_HOST') ? SMTP_HOST : 'Not set',
    'smtp_user' => defined('SMTP_USER') ? SMTP_USER : 'Not set',
    'smtp_pass_set' => defined('SMTP_PASS') && !empty(SMTP_PASS) ? 'Yes' : 'No',
    'email_from' => defined('EMAIL_FROM') ? EMAIL_FROM : 'Not set',
    'app_url' => defined('APP_URL') ? APP_URL : 'Not set',
    'app_name' => defined('APP_NAME') ? APP_NAME : 'Not set',
];

if ($hasEmailVerification) {
    // Get column details
    $columns = $conn->query("SHOW COLUMNS FROM users WHERE Field IN ('email_verified', 'email_verification_token', 'email_verification_token_expires')");
    $columnDetails = [];
    while ($row = $columns->fetch_assoc()) {
        $columnDetails[] = $row;
    }
    $result['email_verification_columns'] = $columnDetails;
} else {
    $result['error'] = 'Email verification columns do not exist in the users table. Emails will not be sent.';
    $result['fix'] = 'You need to add these columns to your users table: email_verified (BOOLEAN), email_verification_token (VARCHAR(64)), email_verification_token_expires (DATETIME)';
}

echo json_encode($result, JSON_PRETTY_PRINT);

