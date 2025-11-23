<?php
/**
 * 2FA Routes Handler
 * Handles 2FA setup, verification, and status
 * 
 * Usage: Include this file in your API router and route /auth/two-factor/* to this handler
 * 
 * Version: 2025-11-23-13:25 (with error handling and output buffering)
 */

// Suppress any output before JSON response
ob_start();

// Suppress errors during require
$oldErrorReporting = error_reporting(0);
$oldDisplayErrors = ini_get('display_errors');
ini_set('display_errors', '0');

try {
    require_once __DIR__ . '/twoFactorHelper.php';
} catch (Exception $e) {
    error_log("Failed to require twoFactorHelper.php: " . $e->getMessage());
    ob_clean();
    header('Content-Type: application/json');
    echo json_encode(['error' => '2FA helper not available', 'details' => $e->getMessage()], JSON_PRETTY_PRINT);
    exit;
}

try {
    require_once __DIR__ . '/../config.php';
} catch (Exception $e) {
    error_log("Failed to require config.php: " . $e->getMessage());
    ob_clean();
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Configuration not available', 'details' => $e->getMessage()], JSON_PRETTY_PRINT);
    exit;
}

// Restore error settings
error_reporting($oldErrorReporting);
ini_set('display_errors', $oldDisplayErrors);

// Clear any output buffer
ob_clean();

// Set error handler to ensure JSON responses
set_error_handler(function($severity, $message, $file, $line) {
    // Log the error but don't output it
    error_log("PHP Error in twoFactorRoutes.php: $message in $file:$line");
    // Return false to let PHP handle it normally, but we'll catch it in try-catch
    return false;
}, E_ALL);

function handle2FARoute($conn, $method, $pathParts, $data, $userId = null) {
    try {
    // Get action from path (e.g., /auth/two-factor/setup -> 'setup')
    $action = $pathParts[2] ?? '';
    
    // For setup and status, user must be authenticated (userId required)
    if (in_array($action, ['setup', 'status', 'disable']) && !$userId) {
        sendJSON(['error' => 'Authentication required'], 401);
    }
    
    switch ($action) {
        case 'setup':
            return handle2FASetup($conn, $method, $userId, $data);
        case 'verify':
            return handle2FAVerify($conn, $method, $data);
        case 'status':
            return handle2FAStatus($conn, $userId);
        case 'disable':
            return handle2FADisable($conn, $method, $userId, $data);
        default:
            sendJSON(['error' => 'Action not found'], 404);
    }
    } catch (Exception $e) {
        error_log("2FA route exception: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        sendJSON([
            'error' => 'Server error',
            'error_type' => 'server_error',
            'message' => 'An error occurred while processing your request'
        ], 500);
    } catch (Error $e) {
        error_log("2FA route fatal error: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        sendJSON([
            'error' => 'Server error',
            'error_type' => 'server_error',
            'message' => 'An error occurred while processing your request'
        ], 500);
    }
}

/**
 * Handle 2FA setup
 * GET: Get setup info (QR code URL and secret)
 * POST: Enable 2FA after verification
 */
function handle2FASetup($conn, $method, $userId, $data) {
    if ($method === 'GET') {
        if (!$userId) {
            error_log("2FA Setup GET - No user ID provided");
            sendJSON(['error' => 'Authentication required'], 401);
            return;
        }
        
        // Ensure generate2FASecret function exists
        if (!function_exists('generate2FASecret')) {
            error_log("2FA Setup GET - generate2FASecret function not found");
            sendJSON(['error' => '2FA helper functions not available'], 500);
            return;
        }
        
        try {
            // Generate new secret for setup
            $secret = generate2FASecret(16);
            
            if (!$secret || strlen($secret) < 16) {
                error_log("2FA Setup GET - Failed to generate secret (length: " . strlen($secret ?? '') . ")");
                sendJSON(['error' => 'Failed to generate 2FA secret'], 500);
                return;
            }
            
            error_log("2FA Setup GET - User ID: $userId, Generated secret: " . substr($secret, 0, 8) . "...");
            
            // Get user email for QR code label
            $stmt = $conn->prepare("SELECT email FROM users WHERE id = ?");
            if (!$stmt) {
                error_log("2FA Setup GET - Prepare failed: " . $conn->error);
                sendJSON(['error' => 'Database error'], 500);
                return;
            }
            
            $stmt->bind_param("s", $userId); // Use "s" for string as user IDs might be strings
            if (!$stmt->execute()) {
                error_log("2FA Setup GET - Execute failed: " . $stmt->error);
                $stmt->close();
                sendJSON(['error' => 'Database error'], 500);
                return;
            }
            
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            $stmt->close();
            
            if (!$user) {
                error_log("2FA Setup GET - User not found: $userId");
                sendJSON(['error' => 'User not found'], 404);
                return;
            }
            
            $email = $user['email'] ?? 'user';
            
            // Get app name from config
            $appName = defined('APP_NAME') ? APP_NAME : 'App';
            
            // Generate QR code URL (otpauth:// URL)
            $issuer = $appName;
            $label = urlencode($issuer . ':' . $email);
            $qrUrl = "otpauth://totp/{$label}?secret={$secret}&issuer=" . urlencode($issuer);
            
            error_log("2FA Setup GET - Success, returning secret and QR URL");
            
            sendJSON([
                'secret' => $secret,
                'qrUrl' => $qrUrl,
                'manualEntryKey' => chunk_split($secret, 4, ' ')
            ]);
        } catch (Exception $e) {
            error_log("2FA Setup GET - Exception: " . $e->getMessage());
            error_log("2FA Setup GET - Stack trace: " . $e->getTraceAsString());
            sendJSON(['error' => 'Failed to generate 2FA secret: ' . $e->getMessage()], 500);
        } catch (Error $e) {
            error_log("2FA Setup GET - Fatal error: " . $e->getMessage());
            error_log("2FA Setup GET - Stack trace: " . $e->getTraceAsString());
            sendJSON(['error' => 'Failed to generate 2FA secret'], 500);
        }
        
    } else if ($method === 'POST') {
        // Verify code and enable 2FA
        if (!$userId) {
            sendJSON(['error' => 'Authentication required'], 401);
            return;
        }
        
        if (empty($data['code']) || empty($data['secret'])) {
            sendJSON(['error' => 'Code and secret are required'], 400);
            return;
        }
        
        $code = trim($data['code']);
        $secret = trim($data['secret']);
        
        // Remove any spaces, dashes, or other non-digit characters
        $code = preg_replace('/[^0-9]/', '', $code);
        
        error_log("2FA Enable attempt - User ID: $userId");
        error_log("2FA Code received: '$code' (length: " . strlen($code) . ", is_numeric: " . (ctype_digit($code) ? 'yes' : 'no') . ")");
        error_log("2FA Secret: " . substr($secret, 0, 8) . "... (length: " . strlen($secret) . ")");
        error_log("2FA Server time: " . date('Y-m-d H:i:s') . " (Unix: " . time() . ")");
        
        // Verify code with window of 1 (current, previous, next time step)
        // This allows for clock skew between server and authenticator app
        $verified = verifyTOTP($secret, $code, 1);
        
        if (!$verified) {
            // Generate what the codes should be for debugging
            $currentCode = generateTOTP($secret, 30, 0);
            $prevCode = generateTOTP($secret, 30, -1);
            $nextCode = generateTOTP($secret, 30, 1);
            error_log("2FA Enable failed: Invalid TOTP code");
            error_log("2FA Expected codes - Current: $currentCode, Previous: $prevCode, Next: $nextCode");
            error_log("2FA Code comparison - Entered: '$code', Current: '$currentCode', Previous: '$prevCode', Next: '$nextCode'");
            sendJSON([
                'error' => 'Invalid code. Please enter the current 6-digit code from your authenticator app. Make sure your device time is synchronized.',
                'debug_info' => 'Check server logs for detailed verification info'
            ], 400);
            return;
        }
        
        error_log("2FA Code verified successfully");
        
        // Generate backup codes
        $backupCodes = generateBackupCodes(10);
        $backupCodesJson = json_encode($backupCodes);
        
        // Check if 2FA columns exist
        $check2FAEnabled = $conn->query("SHOW COLUMNS FROM users LIKE 'two_factor_enabled'");
        $has2FAEnabled = $check2FAEnabled->num_rows > 0;
        
        if (!$has2FAEnabled) {
            sendJSON(['error' => '2FA columns not found in database'], 500);
        }
        
        // Enable 2FA in database
        $twoFactorEnabled = 1;
        
        // Log for debugging
        error_log("Enabling 2FA for user ID: $userId, Secret: " . substr($secret, 0, 4) . "...");
        
        $stmt = $conn->prepare("
            UPDATE users 
            SET two_factor_enabled = ?, 
                two_factor_secret = ?,
                two_factor_backup_codes = ?
            WHERE id = ?
        ");
        
        if (!$stmt) {
            error_log("2FA Enable error: Prepare failed: " . $conn->error);
            sendJSON(['error' => 'Database error: ' . $conn->error], 500);
            return;
        }
        
        // Use "s" for userId as it might be a string
        $stmt->bind_param("isss", $twoFactorEnabled, $secret, $backupCodesJson, $userId);
        
        if ($stmt->execute()) {
            $affectedRows = $stmt->affected_rows;
            error_log("2FA enabled successfully. Affected rows: $affectedRows");
            
            if ($affectedRows === 0) {
                error_log("Warning: No rows updated. User ID might not exist: $userId");
                sendJSON(['error' => 'User not found or no changes made'], 404);
            } else {
                sendJSON([
                    'success' => true,
                    'backupCodes' => $backupCodes,
                    'message' => '2FA enabled successfully'
                ]);
            }
        } else {
            error_log("2FA Enable error: Execute failed: " . $stmt->error);
            sendJSON(['error' => 'Failed to enable 2FA: ' . $stmt->error], 500);
        }
        
        $stmt->close();
    } else {
        sendJSON(['error' => 'Method not allowed'], 405);
    }
}

/**
 * Handle 2FA verification during login
 * POST: Verify 2FA code after initial login
 */
function handle2FAVerify($conn, $method, $data) {
    if ($method !== 'POST') {
        sendJSON(['error' => 'Method not allowed'], 405);
    }
    
    if (empty($data['email']) || empty($data['code'])) {
        sendJSON(['error' => 'Email and code are required'], 400);
    }
    
    $email = strtolower(trim($data['email']));
    $code = trim($data['code']);
    
    // Check if 2FA columns exist
    $check2FAEnabled = $conn->query("SHOW COLUMNS FROM users LIKE 'two_factor_enabled'");
    $has2FAEnabled = $check2FAEnabled->num_rows > 0;
    
    if (!$has2FAEnabled) {
        sendJSON(['error' => '2FA not supported'], 500);
    }
    
    // Get user with 2FA info
    $selectFields = ['id', 'name', 'email', 'two_factor_enabled', 'two_factor_secret', 'two_factor_backup_codes'];
    
    // Add other optional fields
    $checkEmailVerification = $conn->query("SHOW COLUMNS FROM users LIKE 'email_verified'");
    if ($checkEmailVerification->num_rows > 0) {
        $selectFields[] = 'email_verified';
    }
    
    $checkPlan = $conn->query("SHOW COLUMNS FROM users LIKE 'plan'");
    if ($checkPlan->num_rows > 0) {
        $selectFields[] = 'plan';
    }
    
    $checkSubscriptionStatus = $conn->query("SHOW COLUMNS FROM users LIKE 'subscription_status'");
    if ($checkSubscriptionStatus->num_rows > 0) {
        $selectFields[] = 'subscription_status';
    }
    
    $selectQuery = "SELECT " . implode(', ', $selectFields) . " FROM users WHERE email = ?";
    $stmt = $conn->prepare($selectQuery);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if (!$user) {
        sendJSON(['error' => 'User not found'], 404);
    }
    
    if (!(bool)$user['two_factor_enabled']) {
        sendJSON(['error' => '2FA is not enabled for this account'], 400);
    }
    
    $secret = $user['two_factor_secret'];
    $backupCodesJson = $user['two_factor_backup_codes'];
    
    // Try TOTP code first
    $valid = verifyTOTP($secret, $code);
    $usedBackupCode = false;
    
    // If TOTP fails, try backup codes
    if (!$valid && $backupCodesJson) {
        $result = verifyBackupCode($backupCodesJson, $code);
        if ($result['valid']) {
            $valid = true;
            $usedBackupCode = true;
            
            // Update backup codes in database
            $newBackupCodes = json_encode($result['remaining']);
            $updateStmt = $conn->prepare("UPDATE users SET two_factor_backup_codes = ? WHERE id = ?");
            $updateStmt->bind_param("si", $newBackupCodes, $user['id']);
            $updateStmt->execute();
            $updateStmt->close();
        }
    }
    
    if (!$valid) {
        sendJSON(['error' => 'Invalid code. Please try again.'], 401);
    }
    
    // Build response with user data
    $response = [
        'id' => (int)$user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'usedBackupCode' => $usedBackupCode,
        'remainingBackupCodes' => $usedBackupCode && isset($result['remaining']) ? count($result['remaining']) : null
    ];
    
    if (isset($user['email_verified'])) {
        $response['email_verified'] = (bool)$user['email_verified'];
    } else {
        $response['email_verified'] = true;
    }
    
    if (isset($user['plan'])) {
        $response['plan'] = $user['plan'] ?? 'free';
    } else {
        $response['plan'] = 'free';
    }
    
    if (isset($user['subscription_status'])) {
        $response['subscription_status'] = $user['subscription_status'] ?? 'inactive';
    } else {
        $response['subscription_status'] = 'inactive';
    }
    
    sendJSON($response);
}

/**
 * Get 2FA status
 * GET: Check if 2FA is enabled for the user
 */
function handle2FAStatus($conn, $userId) {
    try {
        $check2FAEnabled = $conn->query("SHOW COLUMNS FROM users LIKE 'two_factor_enabled'");
        if (!$check2FAEnabled) {
            error_log("2FA Status error: Query failed: " . $conn->error);
            sendJSON(['enabled' => false, 'supported' => false, 'error' => 'Database query failed']);
            return;
        }
        
        $has2FAEnabled = $check2FAEnabled->num_rows > 0;
        
        if (!$has2FAEnabled) {
            sendJSON(['enabled' => false, 'supported' => false]);
            return;
        }
        
        $stmt = $conn->prepare("SELECT two_factor_enabled FROM users WHERE id = ?");
        if (!$stmt) {
            error_log("2FA Status error: Prepare failed: " . $conn->error);
            sendJSON(['enabled' => false, 'supported' => true, 'error' => 'Database error']);
            return;
        }
        
        $stmt->bind_param("s", $userId); // Use "s" for string, as user IDs might be strings
        if (!$stmt->execute()) {
            error_log("2FA Status error: Execute failed: " . $stmt->error);
            sendJSON(['enabled' => false, 'supported' => true, 'error' => 'Database error']);
            $stmt->close();
            return;
        }
        
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();
        
        if (!$user) {
            sendJSON(['enabled' => false, 'supported' => true, 'error' => 'User not found']);
            return;
        }
        
        $enabled = isset($user['two_factor_enabled']) && (int)$user['two_factor_enabled'] === 1;
        
        sendJSON(['enabled' => $enabled, 'supported' => true]);
    } catch (Exception $e) {
        error_log("2FA Status exception: " . $e->getMessage());
        sendJSON(['enabled' => false, 'supported' => false, 'error' => 'Server error']);
    } catch (Error $e) {
        error_log("2FA Status fatal error: " . $e->getMessage());
        sendJSON(['enabled' => false, 'supported' => false, 'error' => 'Server error']);
    }
}

/**
 * Disable 2FA
 * POST: Disable 2FA for the user (requires password verification)
 */
function handle2FADisable($conn, $method, $userId, $data) {
    if ($method !== 'POST') {
        sendJSON(['error' => 'Method not allowed'], 405);
    }
    
    // Verify password before disabling
    if (empty($data['password'])) {
        sendJSON(['error' => 'Password required to disable 2FA'], 400);
    }
    
    $password = $data['password'];
    
    // Get user password hash
    $stmt = $conn->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if (!$user) {
        sendJSON(['error' => 'User not found'], 404);
    }
    
    // Verify password
    if (!password_verify($password, $user['password'])) {
        sendJSON(['error' => 'Invalid password'], 401);
    }
    
    // Disable 2FA
    $twoFactorEnabled = 0;
    $stmt = $conn->prepare("UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL, two_factor_backup_codes = NULL WHERE id = ?");
    $stmt->bind_param("i", $userId);
    
    if ($stmt->execute()) {
        sendJSON(['success' => true, 'message' => '2FA disabled successfully']);
    } else {
        sendJSON(['error' => 'Failed to disable 2FA'], 500);
    }
}

?>

