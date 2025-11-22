<?php
/**
 * Test email sending via SMTP with detailed debugging
 * Access this file directly via browser: /api/test-email.php?email=your-email@example.com
 */

// Enable error display for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/utils/email.php';

header('Content-Type: text/html; charset=UTF-8');

echo "<h1>Email Test - Detailed Debug</h1>";
echo "<pre>";

// Test configuration
echo "SMTP Configuration:\n";
echo "SMTP_ENABLED: " . (SMTP_ENABLED ? 'true' : 'false') . "\n";
echo "SMTP_HOST: " . SMTP_HOST . "\n";
echo "SMTP_PORT: " . SMTP_PORT . "\n";
echo "SMTP_SECURE: " . SMTP_SECURE . "\n";
echo "SMTP_USER: " . SMTP_USER . "\n";
echo "SMTP_PASS: " . (empty(SMTP_PASS) ? '(empty)' : '(set - ' . strlen(SMTP_PASS) . ' chars)') . "\n";
echo "EMAIL_FROM: " . EMAIL_FROM . "\n";
echo "\n";

// Test SMTP connection directly
echo "=== Testing SMTP Connection ===\n";
$testEmail = $_GET['email'] ?? 'test@example.com';
echo "Test email: $testEmail\n";
echo "\n";

// Test socket connection
$context = stream_context_create([
    'ssl' => [
        'verify_peer' => false,
        'verify_peer_name' => false,
        'allow_self_signed' => true
    ]
]);

$socketUrl = (SMTP_SECURE === 'ssl' ? 'ssl://' : 'tcp://') . SMTP_HOST . ':' . SMTP_PORT;
echo "Attempting connection to: $socketUrl\n";

$socket = @stream_socket_client(
    $socketUrl,
    $errno,
    $errstr,
    30,
    STREAM_CLIENT_CONNECT,
    $context
);

if (!$socket) {
    echo "❌ Connection failed!\n";
    echo "Error: $errstr (Code: $errno)\n";
    echo "\nPossible issues:\n";
    echo "- Server firewall blocking outbound connections\n";
    echo "- SSL/TLS not properly configured\n";
    echo "- Wrong port or hostname\n";
    echo "- Server doesn't allow SSL connections on this port\n";
} else {
    echo "✅ Socket connection established\n";
    
    // Read greeting
    $response = fgets($socket, 515);
    echo "Server greeting: " . trim($response) . "\n";
    
    if (substr($response, 0, 3) === '220') {
        echo "✅ Server greeting OK\n";
        
        // Send EHLO
        $clientHost = isset($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : 'localhost';
        fputs($socket, "EHLO " . $clientHost . "\r\n");
        echo "Sent: EHLO $clientHost\n";
        
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= trim($line) . "\n";
            if (substr($line, 3, 1) === ' ') break;
        }
        echo "Server response:\n$response";
        
        // Note: The actual sendEmail function handles authentication properly
        // This test just verifies connection - authentication is tested in the full send below
        echo "\n=== Connection Test Complete ===\n";
        echo "Note: Authentication is handled by the sendEmail function\n";
        echo "Testing full email send below will verify authentication works\n";
        
        fclose($socket);
    } else {
        echo "❌ Invalid server greeting\n";
        fclose($socket);
    }
}

echo "\n=== Testing Full Email Send ===\n";
$subject = 'TymeTrackr Email Test';
$message = '<h1>Test Email</h1><p>This is a test email from TymeTrackr.</p>';

try {
    $result = sendEmail($testEmail, $subject, $message, true);
    
    if ($result) {
        echo "✅ Email sent successfully!\n";
    } else {
        echo "❌ Email sending failed!\n";
    }
} catch (Exception $e) {
    echo "❌ Exception: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n";
echo "=== Check server error logs for more details ===\n";
echo "</pre>";

?>

