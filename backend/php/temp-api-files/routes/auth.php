<?php
// Suppress any output before JSON response
ob_start();

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../utils/email.php';

// Clear any output buffer
ob_clean();

// Set error handler to ensure JSON responses
set_error_handler(function($severity, $message, $file, $line) {
    // Log the error but don't output it
    error_log("PHP Error in auth.php: $message in $file:$line");
    // Return false to let PHP handle it normally, but we'll catch it in try-catch
    return false;
}, E_ALL);

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

try {
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
            
            // Check if subscription columns exist
            $checkPlan = $conn->query("SHOW COLUMNS FROM users LIKE 'plan'");
            $hasPlan = $checkPlan->num_rows > 0;
            if ($hasPlan) {
                $selectFields[] = 'plan';
            }
            
            $checkSubscriptionStatus = $conn->query("SHOW COLUMNS FROM users LIKE 'subscription_status'");
            $hasSubscriptionStatus = $checkSubscriptionStatus->num_rows > 0;
            if ($hasSubscriptionStatus) {
                $selectFields[] = 'subscription_status';
            }
            
            // Check if 2FA columns exist
            $check2FAEnabled = $conn->query("SHOW COLUMNS FROM users LIKE 'two_factor_enabled'");
            $has2FAEnabled = $check2FAEnabled->num_rows > 0;
            if ($has2FAEnabled) {
                $selectFields[] = 'two_factor_enabled';
            }
            
            $selectQuery = "SELECT " . implode(', ', $selectFields) . " FROM users WHERE email = ?";
            $stmt = $conn->prepare($selectQuery);
            
            if (!$stmt) {
                error_log("Login error: Prepare failed: " . $conn->error);
                sendJSON(['error' => 'Database error', 'error_type' => 'database_error'], 500);
            }
            
            $stmt->bind_param("s", $email);
            
            if (!$stmt->execute()) {
                error_log("Login error: Execute failed: " . $stmt->error);
                sendJSON(['error' => 'Database error', 'error_type' => 'database_error'], 500);
            }
            
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                $stmt->close();
                sendJSON(['error' => 'Email address not found', 'error_type' => 'email_not_found'], 401);
            }
            
            $user = $result->fetch_assoc();
            $stmt->close();
            
            // Check password - support both hashed (password_hash) and plain text (for migration)
            $passwordValid = false;
            
            try {
                // Check if password is a valid hash format (starts with $2y$ or similar)
                $isHash = (strlen($user['password']) >= 60 && substr($user['password'], 0, 4) === '$2y$');
                
                if ($isHash) {
                    // Password is hashed, use password_verify
                    if (password_verify($data['password'], $user['password'])) {
                        // Password is hashed and matches
                        $passwordValid = true;
                        
                        // If password was stored with old algorithm, rehash it with current algorithm
                        if (password_needs_rehash($user['password'], PASSWORD_DEFAULT)) {
                            $newHash = password_hash($data['password'], PASSWORD_DEFAULT);
                            $updateStmt = $conn->prepare("UPDATE users SET password = ? WHERE email = ?");
                            if ($updateStmt) {
                                $updateStmt->bind_param("ss", $newHash, $email);
                                $updateStmt->execute();
                                $updateStmt->close();
                            }
                        }
                    }
                } else {
                    // Legacy: plain text password (for existing users during migration)
                    if ($user['password'] === $data['password']) {
                        $passwordValid = true;
                        $newHash = password_hash($data['password'], PASSWORD_DEFAULT);
                        $updateStmt = $conn->prepare("UPDATE users SET password = ? WHERE email = ?");
                        if ($updateStmt) {
                            $updateStmt->bind_param("ss", $newHash, $email);
                            $updateStmt->execute();
                            $updateStmt->close();
                            error_log("⚠️ Migrated plain text password to hash for user: $email");
                        }
                    }
                }
            } catch (Exception $e) {
                error_log("Login error: Exception during password verification: " . $e->getMessage());
                sendJSON(['error' => 'Authentication error', 'error_type' => 'auth_error'], 500);
            }
            
            if (!$passwordValid) {
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
            
            // Check if 2FA is enabled
            $twoFactorEnabled = false;
            if ($has2FAEnabled && isset($user['two_factor_enabled']) && (int)$user['two_factor_enabled'] === 1) {
                $twoFactorEnabled = true;
                // Return requires2FA flag - frontend should call 2FA verify endpoint
                sendJSON([
                    'requires2FA' => true,
                    'email' => $user['email'],
                    'message' => 'Please enter your 2FA code'
                ], 200);
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
            
            // Add subscription fields if columns exist
            if ($hasPlan) {
                $user['plan'] = $user['plan'] ?? 'free';
            } else {
                $user['plan'] = 'free';
            }
            
            if ($hasSubscriptionStatus) {
                $user['subscription_status'] = $user['subscription_status'] ?? 'inactive';
            } else {
                $user['subscription_status'] = 'inactive';
            }
            
            // Add 2FA status
            $user['two_factor_enabled'] = $twoFactorEnabled;
            $user['requires2FA'] = false;
            
            // Log for debugging (remove in production)
            error_log("Auth login - User: " . $user['email'] . ", is_organization_admin: " . ($user['is_organization_admin'] ? 'true' : 'false') . ", is_system_owner: " . ($user['is_system_owner'] ? 'true' : 'false') . ", org_id: " . ($user['organization_id'] ?? 'null') . ", plan: " . ($user['plan'] ?? 'free'));
            
            sendJSON(['success' => true, 'user' => $user]);
        } elseif ($action === 'change-password') {
            // Version: 2025-11-23-13:47
            // Change password (currentPassword is optional)
            $missing = validateRequired($data, ['newPassword']);
            if (!empty($missing)) {
                sendJSON(['error' => 'Missing required fields', 'fields' => $missing], 400);
            }
            
            // Get current user ID from query string or request body
            $currentUserId = $_GET['current_user_id'] ?? $data['current_user_id'] ?? null;
            
            if (!$currentUserId) {
                sendJSON(['error' => 'Authentication required'], 401);
            }
            
            $conn = getDBConnection();
            $currentPassword = $data['currentPassword'] ?? '';
            $newPassword = $data['newPassword'];
            
            // Validate new password length
            if (strlen($newPassword) < 6) {
                sendJSON(['error' => 'New password must be at least 6 characters'], 400);
            }
            
            // Get user's current password hash
            $stmt = $conn->prepare("SELECT password FROM users WHERE id = ?");
            if (!$stmt) {
                error_log("Change password error: Prepare failed: " . $conn->error);
                sendJSON(['error' => 'Database error'], 500);
            }
            
            $stmt->bind_param("s", $currentUserId);
            if (!$stmt->execute()) {
                error_log("Change password error: Execute failed: " . $stmt->error);
                sendJSON(['error' => 'Database error'], 500);
            }
            
            $result = $stmt->get_result();
            if ($result->num_rows === 0) {
                $stmt->close();
                sendJSON(['error' => 'User not found'], 404);
            }
            
            $user = $result->fetch_assoc();
            $stmt->close();
            
            // Verify current password only if provided
            $passwordValid = true; // Default to true if no current password provided
            if (!empty($currentPassword)) {
                $passwordValid = false;
                try {
                    // Check if password is hashed (starts with $2y$ or $2a$ or $2b$ for bcrypt)
                    if (preg_match('/^\$2[ayb]\$/', $user['password'])) {
                        // Password is hashed, use password_verify
                        $passwordValid = password_verify($currentPassword, $user['password']);
                    } else {
                        // Password is plain text (legacy), compare directly
                        $passwordValid = ($user['password'] === $currentPassword);
                    }
                } catch (Exception $e) {
                    error_log("Password verification error: " . $e->getMessage());
                    $passwordValid = false;
                }
                
                if (!$passwordValid) {
                    sendJSON(['error' => 'Current password is incorrect'], 401);
                }
            }
            
            // Hash new password
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            
            // Update password
            $updateStmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
            if (!$updateStmt) {
                error_log("Change password error: Prepare failed: " . $conn->error);
                sendJSON(['error' => 'Database error'], 500);
            }
            
            $updateStmt->bind_param("ss", $hashedPassword, $currentUserId);
            if (!$updateStmt->execute()) {
                error_log("Change password error: Execute failed: " . $updateStmt->error);
                sendJSON(['error' => 'Failed to update password'], 500);
            }
            
            $updateStmt->close();
            sendJSON(['success' => true, 'message' => 'Password changed successfully'], 200);
            
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
            // Hash password using PHP's password_hash() - uses bcrypt by default
            $password = password_hash($data['password'], PASSWORD_DEFAULT);
            $name = $conn->real_escape_string($data['name']);
            $role = isset($data['role']) ? $conn->real_escape_string($data['role']) : 'user';
            
            // Check if email exists
            $check = $conn->prepare("SELECT id FROM users WHERE email = ?");
            if (!$check) {
                error_log("Registration error: Prepare failed for email check: " . $conn->error);
                sendJSON(['error' => 'Database error', 'error_type' => 'database_error'], 500);
            }
            $check->bind_param("s", $email);
            if (!$check->execute()) {
                error_log("Registration error: Execute failed for email check: " . $check->error);
                $check->close();
                sendJSON(['error' => 'Database error', 'error_type' => 'database_error'], 500);
            }
            if ($check->get_result()->num_rows > 0) {
                $check->close();
                sendJSON(['error' => 'Email already exists'], 400);
            }
            $check->close();
            
            // Check if email verification columns exist
            $checkEmailVerification = $conn->query("SHOW COLUMNS FROM users LIKE 'email_verified'");
            $hasEmailVerification = $checkEmailVerification->num_rows > 0;
            
            // Check if organization columns exist
            $checkOrgIdCol = $conn->query("SHOW COLUMNS FROM users LIKE 'organization_id'");
            $hasOrgIdColumn = $checkOrgIdCol->num_rows > 0;
            
            $checkOrgAdminCol = $conn->query("SHOW COLUMNS FROM users LIKE 'is_organization_admin'");
            $hasOrgAdminColumn = $checkOrgAdminCol->num_rows > 0;
            
            // Check if system owner column exists
            $checkSystemOwner = $conn->query("SHOW COLUMNS FROM users LIKE 'is_system_owner'");
            $hasSystemOwner = $checkSystemOwner->num_rows > 0;
            
            // Get organization fields from request (optional)
            $organizationId = null;
            $isOrganizationAdmin = false;
            $isSystemOwner = false;
            
            if ($hasOrgIdColumn && isset($data['organization_id']) && !empty($data['organization_id'])) {
                $organizationId = $conn->real_escape_string($data['organization_id']);
            }
            
            if ($hasOrgAdminColumn && isset($data['is_organization_admin'])) {
                $isOrganizationAdmin = (bool)$data['is_organization_admin'];
            }
            
            // Get system owner field from request (optional, but should be restricted in production)
            if ($hasSystemOwner && isset($data['is_system_owner'])) {
                $isSystemOwner = (bool)$data['is_system_owner'];
            }
            
            // Check if subscription columns exist
            $checkPlan = $conn->query("SHOW COLUMNS FROM users LIKE 'plan'");
            $hasPlan = $checkPlan->num_rows > 0;
            
            $checkSubscriptionStatus = $conn->query("SHOW COLUMNS FROM users LIKE 'subscription_status'");
            $hasSubscriptionStatus = $checkSubscriptionStatus->num_rows > 0;
            
            // Get subscription fields from request (optional)
            $plan = 'free';
            $subscriptionStatus = 'inactive';
            
            if ($hasPlan && isset($data['plan']) && !empty($data['plan'])) {
                $validPlans = ['free', 'family', 'pro', 'enterprise'];
                if (in_array($data['plan'], $validPlans)) {
                    $plan = $conn->real_escape_string($data['plan']);
                }
            }
            
            if ($hasSubscriptionStatus && isset($data['subscription_status']) && !empty($data['subscription_status'])) {
                $validStatuses = ['active', 'inactive', 'canceled', 'past_due', 'trialing'];
                if (in_array($data['subscription_status'], $validStatuses)) {
                    $subscriptionStatus = $conn->real_escape_string($data['subscription_status']);
                }
            }
            
            // Generate a unique ID for the user
            $userId = 'u' . time() . rand(1000, 9999);
            
            // Generate verification token if email verification is enabled
            $verificationToken = null;
            $tokenExpires = null;
            if ($hasEmailVerification) {
                $verificationToken = bin2hex(random_bytes(32));
                $tokenExpires = date('Y-m-d H:i:s', strtotime('+24 hours'));
            }
            
            // Build INSERT query based on available columns
            $insertFields = ['id', 'email', 'password', 'name', 'role'];
            $insertValues = ['?', '?', '?', '?', '?'];
            $bindParamTypes = 'sssss';
            $bindValues = [$userId, $email, $password, $name, $role];
            
            if ($hasEmailVerification) {
                $insertFields[] = 'email_verified';
                $insertFields[] = 'email_verification_token';
                $insertFields[] = 'email_verification_token_expires';
                $insertValues[] = 'FALSE';  // Not bound, literal value
                $insertValues[] = '?';
                $insertValues[] = '?';
                $bindParamTypes .= 'ss';  // Only 2 params for token and expires
                $bindValues[] = $verificationToken;
                $bindValues[] = $tokenExpires;
            }
            
            if ($hasOrgIdColumn) {
                $insertFields[] = 'organization_id';
                $insertValues[] = '?';
                $bindParamTypes .= 's';
                $bindValues[] = $organizationId;
            }
            
            if ($hasOrgAdminColumn) {
                $insertFields[] = 'is_organization_admin';
                $insertValues[] = '?';
                $bindParamTypes .= 'i'; // integer (boolean)
                $bindValues[] = $isOrganizationAdmin ? 1 : 0;
            }
            
            if ($hasSystemOwner) {
                $insertFields[] = 'is_system_owner';
                $insertValues[] = '?';
                $bindParamTypes .= 'i'; // integer (boolean)
                $bindValues[] = $isSystemOwner ? 1 : 0;
            }
            
            if ($hasPlan) {
                $insertFields[] = 'plan';
                $insertValues[] = '?';
                $bindParamTypes .= 's';
                $bindValues[] = $plan;
            }
            
            if ($hasSubscriptionStatus) {
                $insertFields[] = 'subscription_status';
                $insertValues[] = '?';
                $bindParamTypes .= 's';
                $bindValues[] = $subscriptionStatus;
            }
            
            // Debug: Log the bind parameters for troubleshooting
            error_log("Registration: bindParamTypes length: " . strlen($bindParamTypes) . ", bindValues count: " . count($bindValues));
            error_log("Registration: bindParamTypes: $bindParamTypes");
            error_log("Registration: bindValues count: " . count($bindValues));
            
            // Build and execute INSERT query
            $insertQuery = "INSERT INTO users (" . implode(', ', $insertFields) . ") VALUES (" . implode(', ', $insertValues) . ")";
            $stmt = $conn->prepare($insertQuery);
            
            if (!$stmt) {
                error_log("Registration error: Prepare failed: " . $conn->error);
                error_log("Registration error: Query was: " . $insertQuery);
                sendJSON(['error' => 'Database error', 'error_type' => 'database_error', 'message' => 'Failed to prepare registration query'], 500);
            }
            
            // Dynamically bind parameters
            try {
                // Verify parameter count matches
                if (strlen($bindParamTypes) !== count($bindValues)) {
                    error_log("Registration error: Parameter count mismatch. Types: " . strlen($bindParamTypes) . ", Values: " . count($bindValues));
                    error_log("Registration error: bindParamTypes: $bindParamTypes");
                    error_log("Registration error: bindValues: " . json_encode($bindValues));
                    $stmt->close();
                    sendJSON(['error' => 'Database error', 'error_type' => 'database_error', 'message' => 'Parameter binding error'], 500);
                }
                $stmt->bind_param($bindParamTypes, ...$bindValues);
            } catch (Exception $e) {
                error_log("Registration error: bind_param failed: " . $e->getMessage());
                error_log("Registration error: bindParams: " . $bindParams[0] . ", bindValues count: " . count($bindValues));
                $stmt->close();
                sendJSON(['error' => 'Database error', 'error_type' => 'database_error', 'message' => 'Failed to bind parameters'], 500);
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
                
                $stmt->close();
                sendJSON([
                    'success' => true, 
                    'user' => ['id' => $userId, 'email' => $email, 'name' => $name, 'role' => $role],
                    'email_verification_required' => $hasEmailVerification
                ], 201);
            } else {
                error_log("Registration error: Execute failed: " . $stmt->error);
                error_log("Registration error: Query was: " . $insertQuery);
                error_log("Registration error: bindParams: " . $bindParams[0]);
                $stmt->close();
                sendJSON([
                    'error' => 'Registration failed', 
                    'error_type' => 'database_error',
                    'message' => 'Failed to create user account'
                ], 500);
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
                error_log("SMTP_HOST: " . (defined('SMTP_HOST') ? SMTP_HOST : 'not defined'));
                error_log("SMTP_USER: " . (defined('SMTP_USER') ? SMTP_USER : 'not defined'));
                error_log("SMTP_PORT: " . (defined('SMTP_PORT') ? SMTP_PORT : 'not defined'));
                error_log("SMTP_SECURE: " . (defined('SMTP_SECURE') ? SMTP_SECURE : 'not defined'));
                
                // Capture any output/errors
                ob_start();
                $emailSent = sendVerificationEmail($testEmail, $testName, $testToken);
                $output = ob_get_clean();
                
                $result['email_sent'] = $emailSent;
                $result['success'] = $emailSent;
                $result['output_captured'] = $output;
                
                if ($emailSent) {
                    $result['message'] = 'Test email sent successfully! Check your inbox (and spam folder).';
                    error_log("✅ Test email sent successfully to: $testEmail");
                } else {
                    $result['message'] = 'Email sending returned false. Check server error logs for details.';
                    error_log("❌ Test email send returned false for: $testEmail");
                    // Get last error if available
                    $lastError = error_get_last();
                    if ($lastError) {
                        $result['last_error'] = $lastError;
                    }
                }
            } catch (Exception $e) {
                $result['email_sent'] = false;
                $result['success'] = false;
                $result['error'] = $e->getMessage();
                $result['error_trace'] = $e->getTraceAsString();
                $result['message'] = 'Exception occurred while sending email: ' . $e->getMessage();
                error_log("❌ Exception sending test email: " . $e->getMessage());
                error_log("Stack trace: " . $e->getTraceAsString());
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
                'query_string' => $_SERVER['QUERY_STRING'] ?? 'not set',
                'get_path' => $_GET['path'] ?? 'not set',
                'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'not set',
                'available_actions' => ['verify-email', 'test-smtp-config', 'test-send-email', 'check-email-verification'],
                'debug' => [
                    'method' => $method,
                    'path' => $path ?? 'not set',
                    'pathParts_count' => count($pathParts),
                    'pathParts' => $pathParts,
                    'pathParts[0]' => $pathParts[0] ?? 'empty',
                    'pathParts[1]' => $pathParts[1] ?? 'empty',
                ]
            ], 404);
        }
        break;
    default:
        sendJSON(['error' => 'Method not allowed'], 405);
    }
} catch (Exception $e) {
    error_log("Auth route exception: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    sendJSON([
        'error' => 'Server error',
        'error_type' => 'server_error',
        'message' => 'An error occurred while processing your request'
    ], 500);
} catch (Error $e) {
    error_log("Auth route fatal error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    sendJSON([
        'error' => 'Server error',
        'error_type' => 'server_error',
        'message' => 'An error occurred while processing your request'
    ], 500);
}

?>

