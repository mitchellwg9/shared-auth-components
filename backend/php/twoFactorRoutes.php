<?php
/**
 * 2FA Routes Handler
 * Handles 2FA setup, verification, and status
 * 
 * Usage: Include this file in your API router and route /auth/two-factor/* to this handler
 */

require_once __DIR__ . '/twoFactorHelper.php';
require_once __DIR__ . '/../config.php'; // Adjust path as needed

function handle2FARoute($conn, $method, $pathParts, $data, $userId = null) {
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
}

/**
 * Handle 2FA setup
 * GET: Get setup info (QR code URL and secret)
 * POST: Enable 2FA after verification
 */
function handle2FASetup($conn, $method, $userId, $data) {
    if ($method === 'GET') {
        // Generate new secret for setup
        $secret = generate2FASecret(16);
        
        // Get user email for QR code label
        $stmt = $conn->prepare("SELECT email FROM users WHERE id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $email = $user['email'] ?? 'user';
        
        // Get app name from config
        $appName = defined('APP_NAME') ? APP_NAME : 'App';
        
        // Generate QR code URL (otpauth:// URL)
        $issuer = $appName;
        $label = urlencode($issuer . ':' . $email);
        $qrUrl = "otpauth://totp/{$label}?secret={$secret}&issuer=" . urlencode($issuer);
        
        sendJSON([
            'secret' => $secret,
            'qrUrl' => $qrUrl,
            'manualEntryKey' => chunk_split($secret, 4, ' ')
        ]);
        
    } else if ($method === 'POST') {
        // Verify code and enable 2FA
        if (empty($data['code']) || empty($data['secret'])) {
            sendJSON(['error' => 'Code and secret are required'], 400);
        }
        
        $code = trim($data['code']);
        $secret = trim($data['secret']);
        
        // Verify code
        if (!verifyTOTP($secret, $code)) {
            sendJSON(['error' => 'Invalid code. Please try again.'], 400);
        }
        
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
        $stmt = $conn->prepare("
            UPDATE users 
            SET two_factor_enabled = ?, 
                two_factor_secret = ?,
                two_factor_backup_codes = ?
            WHERE id = ?
        ");
        $stmt->bind_param("issi", $twoFactorEnabled, $secret, $backupCodesJson, $userId);
        
        if ($stmt->execute()) {
            sendJSON([
                'success' => true,
                'backupCodes' => $backupCodes,
                'message' => '2FA enabled successfully'
            ]);
        } else {
            sendJSON(['error' => 'Failed to enable 2FA'], 500);
        }
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
    $check2FAEnabled = $conn->query("SHOW COLUMNS FROM users LIKE 'two_factor_enabled'");
    $has2FAEnabled = $check2FAEnabled->num_rows > 0;
    
    if (!$has2FAEnabled) {
        sendJSON(['enabled' => false, 'supported' => false]);
    }
    
    $stmt = $conn->prepare("SELECT two_factor_enabled FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    $enabled = isset($user['two_factor_enabled']) && (int)$user['two_factor_enabled'] === 1;
    
    sendJSON(['enabled' => $enabled, 'supported' => true]);
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

