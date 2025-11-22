<?php
/**
 * Shared Authentication Routes for PHP
 * Include this file in your API routes to handle authentication endpoints
 * 
 * Usage:
 * require_once __DIR__ . '/path/to/shared-auth/backend/php/authRoutes.php';
 * require_once __DIR__ . '/path/to/shared-auth/backend/php/emailTemplates.php';
 * require_once __DIR__ . '/path/to/shared-auth/backend/php/smtpClient.php';
 * 
 * Then call handleAuthRoute() in your routing logic
 */

/**
 * Handle authentication routes
 * @param mysqli $conn - Database connection
 * @param string $method - HTTP method (GET, POST)
 * @param array $pathParts - URL path parts (e.g., ['auth', 'login'])
 * @param array $data - Request data
 * @param array $config - Configuration
 * @param string $config['appUrl'] - Base URL of your app (e.g., 'https://data-q.org')
 * @param string $config['appName'] - Name of your app
 * @param array $config['smtp'] - SMTP configuration (optional, if not provided emails won't be sent)
 * @param string $config['smtp']['host'] - SMTP host
 * @param int $config['smtp']['port'] - SMTP port
 * @param string $config['smtp']['secure'] - 'ssl' or 'tls'
 * @param array $config['smtp']['auth'] - SMTP auth
 * @param string $config['smtp']['auth']['user'] - SMTP username
 * @param string $config['smtp']['auth']['pass'] - SMTP password
 * @param string $config['smtp']['from'] - From email
 * @param string|null $config['smtp']['fromName'] - From name
 * @return void (sends JSON response and exits)
 */
function handleAuthRoute($conn, $method, $pathParts, $data, $config) {
    $appUrl = $config['appUrl'] ?? '';
    $appName = $config['appName'] ?? 'App';
    $smtpConfig = $config['smtp'] ?? null;
    
    switch ($method) {
        case 'POST':
            $action = $pathParts[1] ?? '';
            
            if ($action === 'register') {
                // Validate required fields
                $missing = [];
                if (empty($data['email'])) $missing[] = 'email';
                if (empty($data['password'])) $missing[] = 'password';
                if (empty($data['name'])) $missing[] = 'name';
                
                if (!empty($missing)) {
                    sendJSON(['error' => 'Missing required fields', 'fields' => $missing], 400);
                }
                
                // Validate email format
                if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                    sendJSON(['error' => 'Invalid email format'], 400);
                }
                
                $email = strtolower(trim($data['email']));
                $password = $data['password']; // Should be hashed in production
                $name = $data['name'];
                $role = $data['role'] ?? 'user';
                
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
                
                // Generate user ID
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
                    // Send verification email if enabled and SMTP is configured
                    if ($hasEmailVerification && $verificationToken && $smtpConfig) {
                        try {
                            $verificationUrl = $appUrl . '/app/demo/?token=' . urlencode($verificationToken);
                            $emailHtml = generateVerificationEmail([
                                'appName' => $appName,
                                'userName' => $name,
                                'verificationUrl' => $verificationUrl,
                                'primaryColor' => '#6366f1'
                            ]);
                            
                            $emailResult = sendEmailViaSMTP($smtpConfig, [
                                'to' => $email,
                                'subject' => 'Verify Your Email Address',
                                'html' => $emailHtml
                            ]);
                            
                            if (!$emailResult['success']) {
                                error_log("Failed to send verification email: " . ($emailResult['error'] ?? 'Unknown error'));
                            }
                        } catch (Exception $e) {
                            error_log("Failed to send verification email: " . $e->getMessage());
                        }
                    }
                    
                    sendJSON([
                        'success' => true,
                        'user' => [
                            'id' => $userId,
                            'email' => $email,
                            'name' => $name,
                            'role' => $role
                        ],
                        'email_verification_required' => $hasEmailVerification
                    ], 201);
                } else {
                    sendJSON(['error' => 'Registration failed'], 500);
                }
            }
            break;
            
        case 'GET':
            $action = $pathParts[1] ?? '';
            
            if ($action === 'verify-email') {
                $token = $_GET['token'] ?? null;
                
                if (empty($token)) {
                    sendJSON(['error' => 'Verification token is required'], 400);
                }
                
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
                    sendJSON(['success' => true, 'already_verified' => true, 'message' => 'Email already verified'], 200);
                }
                
                // Check if token expired
                $now = date('Y-m-d H:i:s');
                if ($user['email_verification_token_expires'] < $now) {
                    sendJSON(['error' => 'Verification token has expired. Please request a new verification email.'], 400);
                }
                
                // Verify the email
                $updateStmt = $conn->prepare("UPDATE users SET email_verified = TRUE, email_verification_token = NULL, email_verification_token_expires = NULL WHERE id = ? AND email_verification_token = ?");
                $updateStmt->bind_param("is", $user['id'], $token);
                
                if ($updateStmt->execute() && $updateStmt->affected_rows > 0) {
                    sendJSON(['success' => true, 'message' => 'Email verified successfully'], 200);
                } else {
                    sendJSON(['error' => 'Failed to verify email'], 500);
                }
            }
            break;
    }
}

/**
 * Helper function to send JSON response
 * @param array $data - Data to send
 * @param int $statusCode - HTTP status code
 */
function sendJSON($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

?>

