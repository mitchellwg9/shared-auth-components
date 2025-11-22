<?php
/**
 * Email Test Script for data-q.org
 * Upload this to your API directory and access it via browser to test SMTP
 * Example: https://data-q.org/api/test-email.php
 */

// Include config and email utilities
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/utils/email.php';

// Set content type
header('Content-Type: text/html; charset=UTF-8');

// Get test email from query parameter or use default
$testEmail = $_GET['email'] ?? 'waynemitchell4@gmail.com';
$testName = $_GET['name'] ?? 'Test User';
$testToken = $_GET['token'] ?? 'test-token-' . bin2hex(random_bytes(16));

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Email Test - SMTP Configuration</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; }
        .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .success { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; color: #2e7d32; }
        .error { background: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; color: #c62828; }
        .config-item { margin: 10px 0; padding: 10px; background: #f9f9f9; border-left: 3px solid #2196f3; }
        .config-label { font-weight: bold; color: #666; }
        .config-value { color: #333; }
        button {
            background: #2196f3;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px 5px;
        }
        button:hover { background: #1976d2; }
        input {
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            width: 300px;
            margin: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📧 SMTP Email Test</h1>
        
        <div class="info">
            <h3>Current Configuration</h3>
            <div class="config-item">
                <span class="config-label">SMTP Enabled:</span>
                <span class="config-value"><?php echo defined('SMTP_ENABLED') && SMTP_ENABLED ? '✅ Yes' : '❌ No'; ?></span>
            </div>
            <div class="config-item">
                <span class="config-label">SMTP Host:</span>
                <span class="config-value"><?php echo defined('SMTP_HOST') ? SMTP_HOST : 'Not set'; ?></span>
            </div>
            <div class="config-item">
                <span class="config-label">SMTP User:</span>
                <span class="config-value"><?php echo defined('SMTP_USER') ? SMTP_USER : 'Not set'; ?></span>
            </div>
            <div class="config-item">
                <span class="config-label">SMTP Port:</span>
                <span class="config-value"><?php echo defined('SMTP_PORT') ? SMTP_PORT : 'Not set'; ?></span>
            </div>
            <div class="config-item">
                <span class="config-label">SMTP Secure:</span>
                <span class="config-value"><?php echo defined('SMTP_SECURE') ? SMTP_SECURE : 'Not set'; ?></span>
            </div>
            <div class="config-item">
                <span class="config-label">Email From:</span>
                <span class="config-value"><?php echo defined('EMAIL_FROM') ? EMAIL_FROM : 'Not set'; ?></span>
            </div>
            <div class="config-item">
                <span class="config-label">APP URL:</span>
                <span class="config-value"><?php echo defined('APP_URL') ? APP_URL : 'Not set'; ?></span>
            </div>
            <div class="config-item">
                <span class="config-label">APP Name:</span>
                <span class="config-value"><?php echo defined('APP_NAME') ? APP_NAME : 'Not set'; ?></span>
            </div>
        </div>

        <form method="GET" action="">
            <h3>Test Email Sending</h3>
            <p>
                <label>Test Email Address:</label><br>
                <input type="email" name="email" value="<?php echo htmlspecialchars($testEmail); ?>" placeholder="your-email@example.com">
            </p>
            <p>
                <label>Test Name:</label><br>
                <input type="text" name="name" value="<?php echo htmlspecialchars($testName); ?>" placeholder="Test User">
            </p>
            <button type="submit" name="action" value="test">🧪 Test SMTP Connection</button>
            <button type="submit" name="action" value="send">📧 Send Test Verification Email</button>
        </form>

        <?php
        if (isset($_GET['action'])) {
            $action = $_GET['action'];
            
            if ($action === 'test') {
                echo '<div class="info">';
                echo '<h3>Testing SMTP Connection...</h3>';
                
                // Test SMTP connection
                if (!defined('SMTP_ENABLED') || !SMTP_ENABLED) {
                    echo '<div class="error">❌ SMTP is not enabled in config.php</div>';
                } elseif (empty(SMTP_USER) || empty(SMTP_PASS)) {
                    echo '<div class="error">❌ SMTP credentials are missing</div>';
                } else {
                    echo '<p>Attempting to connect to ' . SMTP_HOST . ':' . SMTP_PORT . '...</p>';
                    
                    // Try to create a socket connection
                    $context = stream_context_create([
                        'ssl' => [
                            'verify_peer' => false,
                            'verify_peer_name' => false,
                            'allow_self_signed' => true
                        ]
                    ]);
                    
                    $socket = @stream_socket_client(
                        (SMTP_SECURE === 'ssl' ? 'ssl://' : 'tcp://') . SMTP_HOST . ':' . SMTP_PORT,
                        $errno,
                        $errstr,
                        10,
                        STREAM_CLIENT_CONNECT,
                        $context
                    );
                    
                    if ($socket) {
                        echo '<div class="success">✅ Successfully connected to SMTP server!</div>';
                        fclose($socket);
                    } else {
                        echo '<div class="error">❌ Failed to connect: ' . htmlspecialchars($errstr) . ' (Error: ' . $errno . ')</div>';
                    }
                }
                echo '</div>';
            }
            
            if ($action === 'send') {
                echo '<div class="info">';
                echo '<h3>Sending Test Verification Email...</h3>';
                echo '<p>To: ' . htmlspecialchars($testEmail) . '</p>';
                echo '<p>Name: ' . htmlspecialchars($testName) . '</p>';
                echo '<p>Token: ' . htmlspecialchars($testToken) . '</p>';
                echo '<hr>';
                
                try {
                    $result = sendVerificationEmail($testEmail, $testName, $testToken);
                    
                    if ($result) {
                        echo '<div class="success">';
                        echo '<h3>✅ Email Sent Successfully!</h3>';
                        echo '<p>The test verification email has been sent to: <strong>' . htmlspecialchars($testEmail) . '</strong></p>';
                        echo '<p>Please check your inbox (and spam folder) for the email.</p>';
                        echo '<p>The verification link in the email should point to:</p>';
                        echo '<p><code>' . htmlspecialchars(APP_URL . '/app/demo/?token=' . $testToken) . '</code></p>';
                        echo '</div>';
                    } else {
                        echo '<div class="error">';
                        echo '<h3>❌ Email Sending Failed</h3>';
                        echo '<p>The email function returned false. Check your server error logs for details.</p>';
                        echo '<p>Common issues:</p>';
                        echo '<ul>';
                        echo '<li>SMTP connection failed</li>';
                        echo '<li>Authentication failed (wrong username/password)</li>';
                        echo '<li>Firewall blocking port ' . SMTP_PORT . '</li>';
                        echo '<li>SSL/TLS configuration issue</li>';
                        echo '</ul>';
                        echo '</div>';
                    }
                } catch (Exception $e) {
                    echo '<div class="error">';
                    echo '<h3>❌ Error Sending Email</h3>';
                    echo '<p><strong>Error:</strong> ' . htmlspecialchars($e->getMessage()) . '</p>';
                    if ($e->getTraceAsString()) {
                        echo '<details><summary>Stack Trace</summary><pre>' . htmlspecialchars($e->getTraceAsString()) . '</pre></details>';
                    }
                    echo '</div>';
                }
                
                echo '</div>';
            }
        }
        ?>
        
        <div class="info" style="margin-top: 30px;">
            <h3>📋 Troubleshooting</h3>
            <p>If emails are not arriving:</p>
            <ol>
                <li>Check your <strong>spam/junk folder</strong></li>
                <li>Verify SMTP credentials are correct</li>
                <li>Check server error logs for SMTP connection errors</li>
                <li>Ensure port <?php echo SMTP_PORT ?? 465; ?> is not blocked by firewall</li>
                <li>Try changing SMTP_SECURE to 'tls' and port to 587 if SSL doesn't work</li>
            </ol>
        </div>
    </div>
</body>
</html>

