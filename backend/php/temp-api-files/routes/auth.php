<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../utils/email.php';

$method = $_SERVER['REQUEST_METHOD'];
$data = getRequestData();

// Get path from query parameter (set by .htaccess rewrite) or from URI
$path = '';
if (isset($_GET['path'])) {
    $path = $_GET['path'];
} else {
    // Extract path after /api/
    $requestUri = $_SERVER['REQUEST_URI'] ?? '';
    $requestUri = strtok($requestUri, '?'); // Remove query string
    if (strpos($requestUri, '/api/') !== false) {
        $path = substr($requestUri, strpos($requestUri, '/api/') + 5); // +5 for '/api/'
    } elseif (strpos($requestUri, '/api') !== false && strlen($requestUri) > 4) {
        $path = substr($requestUri, strpos($requestUri, '/api') + 4);
    }
}

$path = trim($path, '/');
$pathParts = !empty($path) ? explode('/', $path) : [];

// Debug logging for routing
error_log("Auth route - Method: $method, REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'not set'));
error_log("Auth route - Path after processing: '$path', PathParts: " . json_encode($pathParts));
error_log("Auth route - PathParts[0]: " . ($pathParts[0] ?? 'empty') . ", PathParts[1]: " . ($pathParts[1] ?? 'empty'));

switch ($method) {
    case 'POST':
        $action = $pathParts[1] ?? '';
        if ($action === 'login') {
            // Login
            $missing = validateRequired($data, ['email', 'password']);
            if (!empty($missing)) {
                sendJSON(['error' => 'Missing required fields', 'fields' => $missing], 400);
            }
            
            // Validate email format
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                sendJSON(['error' => 'Invalid email format'], 400);
            }
            
            $conn = getDBConnection();
            $email = strtolower(trim($data['email']));
            
            // Check if email verification columns exist
            $checkEmailVerification = $conn->query("SHOW COLUMNS FROM users LIKE 'email_verified'");
            $hasEmailVerification = $checkEmailVerification->num_rows > 0;
            
            // Check if organization columns exist
            $checkOrgIdCol = $conn->query("SHOW COLUMNS FROM users LIKE 'organization_id'");
            $hasOrgIdColumn = $checkOrgIdCol->num_rows > 0;
            
            $checkOrgAdminCol = $conn->query("SHOW COLUMNS FROM users LIKE 'is_organization_admin'");
            $hasOrgAdminColumn = $checkOrgAdminCol->num_rows > 0;
            
            $hasOrgColumns = $hasOrgIdColumn || $hasOrgAdminColumn;
            
            // Build SELECT query based on available columns
            $selectFields = ['id', 'email', 'password', 'name', 'role'];
            if ($hasEmailVerification) {
                $selectFields[] = 'email_verified';
            }
            if ($hasOrgIdColumn) {
                $selectFields[] = 'organization_id';
            }
            if ($hasOrgAdminColumn) {
                $selectFields[] = 'is_organization_admin';
            }
            
            // Check if is_system_owner column exists
            $checkSystemOwner = $conn->query("SHOW COLUMNS FROM users LIKE 'is_system_owner'");
            $hasSystemOwner = $checkSystemOwner->num_rows > 0;
            if ($hasSystemOwner) {
                $selectFields[] = 'is_system_owner';
            }
            
            $selectQuery = "SELECT " . implode(', ', $selectFields) . " FROM users WHERE email = ?";
            $stmt = $conn->prepare($selectQuery);
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                sendJSON(['error' => 'Email address not found', 'error_type' => 'email_not_found'], 401);
            }
            
            $user = $result->fetch_assoc();
            
            // Check password
            if ($user['password'] !== $data['password']) {
                sendJSON(['error' => 'Invalid password', 'error_type' => 'invalid_password'], 401);
            }
            
            // Check email verification if column exists
            if ($hasEmailVerification && isset($user['email_verified']) && !$user['email_verified']) {
                sendJSON([
                    'error' => 'Email address not verified. Please check your inbox for the verification email.',
                    'error_type' => 'email_not_verified',
                    'email' => $user['email']
                ], 403);
            }
            
            unset($user['password']);
            
            // Always ensure organization fields are set, even if query didn't return them
            if ($hasOrgColumns) {
                // Explicitly check and set the values
                if (array_key_exists('is_organization_admin', $user)) {
                    // Convert to boolean (handle 0/1, '0'/'1', true/false, NULL)
                    $isAdmin = $user['is_organization_admin'];
                    if ($isAdmin === null || $isAdmin === '') {
                        $isAdmin = false;
                    } else {
                        $isAdmin = (bool)$isAdmin;
                    }
                    $user['is_organization_admin'] = $isAdmin;
                    $user['isOrganizationAdmin'] = $isAdmin;
                } else {
                    // Field exists in DB but wasn't returned - fetch it separately
                    $checkStmt = $conn->prepare("SELECT is_organization_admin FROM users WHERE email = ?");
                    $checkStmt->bind_param("s", $email);
                    $checkStmt->execute();
                    $checkResult = $checkStmt->get_result();
                    if ($checkRow = $checkResult->fetch_assoc()) {
                        $isAdmin = (bool)$checkRow['is_organization_admin'];
                        $user['is_organization_admin'] = $isAdmin;
                        $user['isOrganizationAdmin'] = $isAdmin;
                    } else {
                        $user['is_organization_admin'] = false;
                        $user['isOrganizationAdmin'] = false;
                    }
                    $checkStmt->close();
                }
                
                // Ensure organization_id is set
                if (!isset($user['organization_id']) || $user['organization_id'] === null) {
                    $user['organization_id'] = null;
                }
            } else {
                // Columns don't exist
                $user['is_organization_admin'] = false;
                $user['isOrganizationAdmin'] = false;
                $user['organization_id'] = null;
            }
            
            // Handle is_system_owner field
            if ($hasSystemOwner) {
                if (array_key_exists('is_system_owner', $user)) {
                    $isSystemOwner = $user['is_system_owner'];
                    if ($isSystemOwner === null || $isSystemOwner === '') {
                        $isSystemOwner = false;
                    } else {
                        $isSystemOwner = (bool)$isSystemOwner;
                    }
                    $user['is_system_owner'] = $isSystemOwner;
                    $user['isSystemOwner'] = $isSystemOwner;
                } else {
                    // Field exists but wasn't returned - fetch it separately
                    $checkStmt = $conn->prepare("SELECT is_system_owner FROM users WHERE email = ?");
                    $checkStmt->bind_param("s", $email);
                    $checkStmt->execute();
                    $checkResult = $checkStmt->get_result();
                    if ($checkRow = $checkResult->fetch_assoc()) {
                        $isSystemOwner = (bool)$checkRow['is_system_owner'];
                        $user['is_system_owner'] = $isSystemOwner;
                        $user['isSystemOwner'] = $isSystemOwner;
                    } else {
                        $user['is_system_owner'] = false;
                        $user['isSystemOwner'] = false;
                    }
                    $checkStmt->close();
                }
            } else {
                $user['is_system_owner'] = false;
                $user['isSystemOwner'] = false;
            }
            
            // Log for debugging (remove in production)
            error_log("Auth login - User: " . $user['email'] . ", is_organization_admin: " . ($user['is_organization_admin'] ? 'true' : 'false') . ", is_system_owner: " . ($user['is_system_owner'] ? 'true' : 'false') . ", org_id: " . ($user['organization_id'] ?? 'null'));
            
            sendJSON(['success' => true, 'user' => $user]);
        } elseif ($action === 'register') {
            // Register new user
            $missing = validateRequired($data, ['email', 'password', 'name']);
            if (!empty($missing)) {
                sendJSON(['error' => 'Missing required fields', 'fields' => $missing], 400);
            }
            
            // Validate email format
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                sendJSON(['error' => 'Invalid email format'], 400);
            }
            
            $conn = getDBConnection();
            $email = strtolower(trim($data['email']));
            $emailEscaped = $conn->real_escape_string($email);
            $password = $conn->real_escape_string($data['password']); // Should be hashed
            $name = $conn->real_escape_string($data['name']);
            $role = isset($data['role']) ? $conn->real_escape_string($data['role']) : 'user';
            
            // Check if email exists
            $check = $conn->prepare("SELECT id FROM users WHERE email = ?");
            $check->bind_param("s", $email);
            $check->execute();
            if ($check->get_result()->num_rows > 0) {
                sendJSON(['error' => 'Email already exists'], 400);
            }
            
            // Check if email verification columns exist
            $checkEmailVerification = $conn->query("SHOW COLUMNS FROM users LIKE 'email_verified'");
            $hasEmailVerification = $checkEmailVerification->num_rows > 0;
            
            // Generate a unique ID for the user
            $userId = 'u' . time() . rand(1000, 9999);
            
            // Generate verification token if email verification is enabled
            $verificationToken = null;
            $tokenExpires = null;
            if ($hasEmailVerification) {
                $verificationToken = bin2hex(random_bytes(32));
                $tokenExpires = date('Y-m-d H:i:s', strtotime('+24 hours'));
            }
            
            // Insert user
            if ($hasEmailVerification) {
                $stmt = $conn->prepare("INSERT INTO users (id, email, password, name, role, email_verified, email_verification_token, email_verification_token_expires) VALUES (?, ?, ?, ?, ?, FALSE, ?, ?)");
                $stmt->bind_param("sssssss", $userId, $email, $password, $name, $role, $verificationToken, $tokenExpires);
            } else {
                $stmt = $conn->prepare("INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)");
                $stmt->bind_param("sssss", $userId, $email, $password, $name, $role);
            }
            
            if ($stmt->execute()) {
                // Send verification email if email verification is enabled
                if ($hasEmailVerification && $verificationToken) {
                    error_log("=== EMAIL SEND ATTEMPT ===");
                    error_log("To: $email");
                    error_log("Name: $name");
                    error_log("Token: $verificationToken");
                    error_log("SMTP_ENABLED: " . (defined('SMTP_ENABLED') ? (SMTP_ENABLED ? 'true' : 'false') : 'not defined'));
                    error_log("SMTP_HOST: " . (defined('SMTP_HOST') ? SMTP_HOST : 'not defined'));
                    error_log("SMTP_USER: " . (defined('SMTP_USER') ? SMTP_USER : 'not defined'));
                    error_log("SMTP_PASS set: " . (defined('SMTP_PASS') && !empty(SMTP_PASS) ? 'yes' : 'no'));
                    error_log("SMTP_PORT: " . (defined('SMTP_PORT') ? SMTP_PORT : 'not defined'));
                    error_log("SMTP_SECURE: " . (defined('SMTP_SECURE') ? SMTP_SECURE : 'not defined'));
                    error_log("EMAIL_FROM: " . (defined('EMAIL_FROM') ? EMAIL_FROM : 'not defined'));
                    error_log("APP_URL: " . (defined('APP_URL') ? APP_URL : 'not defined'));
                    
                    try {
                        $emailSent = sendVerificationEmail($email, $name, $verificationToken);
                        if (!$emailSent) {
                            error_log("❌ Email send returned FALSE for new user: $email");
                        } else {
                            error_log("✅ Email sent successfully to: $email");
                        }
                    } catch (Exception $e) {
                        error_log("❌ EXCEPTION sending verification email to new user $email: " . $e->getMessage());
                        error_log("Stack trace: " . $e->getTraceAsString());
                        // Don't fail registration if email fails, just log it
                    }
                    error_log("=== END EMAIL SEND ATTEMPT ===");
                } else {
                    error_log("⚠️ Email verification skipped - hasEmailVerification: " . ($hasEmailVerification ? 'true' : 'false') . ", token: " . ($verificationToken ? 'set' : 'null'));
                }
                
                sendJSON([
                    'success' => true, 
                    'user' => ['id' => $userId, 'email' => $email, 'name' => $name, 'role' => $role],
                    'email_verification_required' => $hasEmailVerification
                ], 201);
            } else {
                sendJSON(['error' => 'Registration failed'], 500);
            }
        } elseif ($action === 'resend-verification') {
            // Resend verification email
            $missing = validateRequired($data, ['email']);
            if (!empty($missing)) {
                sendJSON(['error' => 'Email address is required'], 400);
            }
            
            // Validate email format
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                sendJSON(['error' => 'Invalid email format'], 400);
            }
            
            $conn = getDBConnection();
            $email = strtolower(trim($data['email']));
            
            // Check if email verification columns exist
            $checkEmailVerification = $conn->query("SHOW COLUMNS FROM users LIKE 'email_verified'");
            $hasEmailVerification = $checkEmailVerification->num_rows > 0;
            
            if (!$hasEmailVerification) {
                sendJSON(['error' => 'Email verification is not enabled'], 400);
            }
            
            // Get user
            $stmt = $conn->prepare("SELECT id, email, name, email_verified FROM users WHERE email = ?");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                sendJSON(['error' => 'Email address not found'], 404);
            }
            
            $user = $result->fetch_assoc();
            
            // Check if already verified
            if ($user['email_verified']) {
                sendJSON(['error' => 'Email address is already verified'], 400);
            }
            
            // Generate new verification token
            $verificationToken = bin2hex(random_bytes(32));
            $tokenExpires = date('Y-m-d H:i:s', strtotime('+24 hours'));
            
            // Update token in database
            $updateStmt = $conn->prepare("UPDATE users SET email_verification_token = ?, email_verification_token_expires = ? WHERE email = ?");
            $updateStmt->bind_param("sss", $verificationToken, $tokenExpires, $email);
            
            if ($updateStmt->execute()) {
                // Send verification email
                try {
                    $emailSent = sendVerificationEmail($email, $user['name'], $verificationToken);
                    if ($emailSent) {
                        sendJSON(['success' => true, 'message' => 'Verification email sent successfully'], 200);
                    } else {
                        error_log("Email send returned false for: $email");
                        sendJSON(['success' => true, 'message' => 'Verification token updated. Email may be delayed - please check your spam folder.', 'email_sent' => false], 200);
                    }
                } catch (Exception $e) {
                    error_log("Failed to send verification email to $email: " . $e->getMessage());
                    error_log("Stack trace: " . $e->getTraceAsString());
                    sendJSON(['error' => 'Failed to send verification email. Please try again or contact support.', 'details' => $e->getMessage()], 500);
                }
            } else {
                sendJSON(['error' => 'Failed to update verification token'], 500);
            }
        }
        break;
    case 'GET':
        $action = $pathParts[1] ?? '';
        
        error_log("GET request - Action: '$action', Full pathParts: " . json_encode($pathParts));
        
        // Test endpoint to send a test email
        if ($action === 'test-send-email' || $action === 'test-send-email.php') {
            $testEmail = $_GET['email'] ?? 'waynemitchell4@gmail.com';
            $testName = $_GET['name'] ?? 'Test User';
            $testToken = 'test-token-' . bin2hex(random_bytes(16));
            
            $result = [
                'test_email' => $testEmail,
                'test_name' => $testName,
                'smtp_config' => [
                    'smtp_enabled' => defined('SMTP_ENABLED') ? SMTP_ENABLED : false,
                    'smtp_host' => defined('SMTP_HOST') ? SMTP_HOST : 'Not set',
                    'smtp_port' => defined('SMTP_PORT') ? SMTP_PORT : 'Not set',
                    'smtp_secure' => defined('SMTP_SECURE') ? SMTP_SECURE : 'Not set',
                    'smtp_user' => defined('SMTP_USER') ? SMTP_USER : 'Not set',
                    'smtp_pass_set' => defined('SMTP_PASS') && !empty(SMTP_PASS) ? 'Yes' : 'No',
                    'email_from' => defined('EMAIL_FROM') ? EMAIL_FROM : 'Not set',
                    'app_url' => defined('APP_URL') ? APP_URL : 'Not set',
                ],
                'attempting_send' => true,
            ];
            
            try {
                error_log("=== TEST EMAIL SEND ===");
                error_log("To: $testEmail");
                error_log("Using SMTP: " . (defined('SMTP_ENABLED') && SMTP_ENABLED ? 'Yes' : 'No'));
                
                $emailSent = sendVerificationEmail($testEmail, $testName, $testToken);
                
                $result['email_sent'] = $emailSent;
                $result['success'] = $emailSent;
                
                if ($emailSent) {
                    $result['message'] = 'Test email sent successfully! Check your inbox (and spam folder).';
                    error_log("✅ Test email sent successfully to: $testEmail");
                } else {
                    $result['message'] = 'Email sending returned false. Check server error logs for details.';
                    error_log("❌ Test email send returned false for: $testEmail");
                }
            } catch (Exception $e) {
                $result['email_sent'] = false;
                $result['success'] = false;
                $result['error'] = $e->getMessage();
                $result['message'] = 'Exception occurred while sending email: ' . $e->getMessage();
                error_log("❌ Exception sending test email: " . $e->getMessage());
            }
            
            error_log("=== END TEST EMAIL SEND ===");
            sendJSON($result);
        }
        
        // Diagnostic endpoint to check email verification setup
        if ($action === 'check-email-verification') {
            $conn = getDBConnection();
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
            
            sendJSON($result);
        }
        
        // Test endpoint to check SMTP config
        if ($action === 'test-smtp-config' || $action === 'test-smtp-config.php') {
            $config = [
                'smtp_enabled' => defined('SMTP_ENABLED') ? SMTP_ENABLED : false,
                'smtp_host' => defined('SMTP_HOST') ? SMTP_HOST : 'Not set',
                'smtp_port' => defined('SMTP_PORT') ? SMTP_PORT : 'Not set',
                'smtp_secure' => defined('SMTP_SECURE') ? SMTP_SECURE : 'Not set',
                'smtp_user' => defined('SMTP_USER') ? SMTP_USER : 'Not set',
                'smtp_pass_set' => defined('SMTP_PASS') && !empty(SMTP_PASS) ? 'Yes (hidden)' : 'No',
                'email_from' => defined('EMAIL_FROM') ? EMAIL_FROM : 'Not set',
                'email_from_name' => defined('EMAIL_FROM_NAME') ? EMAIL_FROM_NAME : 'Not set',
                'app_url' => defined('APP_URL') ? APP_URL : 'Not set',
                'app_name' => defined('APP_NAME') ? APP_NAME : 'Not set',
                'using_afrihost_settings' => (
                    (defined('SMTP_HOST') && SMTP_HOST === 'mail.data-q.org') &&
                    (defined('SMTP_USER') && SMTP_USER === 'noreply@data-q.org') &&
                    (defined('SMTP_PORT') && SMTP_PORT === 465) &&
                    (defined('SMTP_SECURE') && SMTP_SECURE === 'ssl')
                ) ? 'Yes' : 'No'
            ];
            sendJSON($config);
        }
        
        if ($action === 'verify-email') {
            // Verify email with token from query string
            $token = $_GET['token'] ?? '';
            
            if (empty($token)) {
                sendJSON(['error' => 'Verification token is required'], 400);
            }
            
            $conn = getDBConnection();
            
            // Check if email verification columns exist
            $checkEmailVerification = $conn->query("SHOW COLUMNS FROM users LIKE 'email_verified'");
            $hasEmailVerification = $checkEmailVerification->num_rows > 0;
            
            if (!$hasEmailVerification) {
                sendJSON(['error' => 'Email verification is not enabled'], 400);
            }
            
            // Find user with this token
            $stmt = $conn->prepare("SELECT id, email, name, email_verified, email_verification_token_expires FROM users WHERE email_verification_token = ?");
            $stmt->bind_param("s", $token);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                sendJSON(['error' => 'Invalid or expired verification token'], 400);
            }
            
            $user = $result->fetch_assoc();
            
            // Check if already verified
            if ($user['email_verified']) {
                sendJSON(['success' => true, 'message' => 'Email address is already verified', 'already_verified' => true], 200);
            }
            
            // Check if token has expired
            $now = date('Y-m-d H:i:s');
            if ($user['email_verification_token_expires'] < $now) {
                sendJSON(['error' => 'Verification token has expired. Please request a new verification email.'], 400);
            }
            
            // Verify the email - use both id AND token in WHERE clause for extra safety
            $updateStmt = $conn->prepare("UPDATE users SET email_verified = TRUE, email_verification_token = NULL, email_verification_token_expires = NULL WHERE id = ? AND email_verification_token = ?");
            $updateStmt->bind_param("is", $user['id'], $token);
            
            if ($updateStmt->execute()) {
                // Check if any rows were actually updated
                if ($updateStmt->affected_rows === 0) {
                    sendJSON(['error' => 'Failed to verify email address - token mismatch'], 500);
                } else {
                    sendJSON(['success' => true, 'message' => 'Email address verified successfully'], 200);
                }
            } else {
                sendJSON(['error' => 'Failed to verify email address'], 500);
            }
        } else {
            // Unknown action for GET request - add debug info
            error_log("GET request - Action not found. Action: '$action', PathParts: " . json_encode($pathParts) . ", REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'not set'));
            sendJSON([
                'error' => 'Action not found', 
                'action' => $action, 
                'pathParts' => $pathParts, 
                'request_uri' => $_SERVER['REQUEST_URI'] ?? 'not set',
                'available_actions' => ['verify-email', 'test-smtp-config', 'test-send-email', 'check-email-verification'],
                'debug' => [
                    'method' => $method,
                    'path' => $path ?? 'not set',
                    'pathParts_count' => count($pathParts),
                    'pathParts' => $pathParts
                ]
            ], 404);
        }
        break;
    default:
        sendJSON(['error' => 'Method not allowed'], 405);
}

?>

