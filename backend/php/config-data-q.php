<?php
// data-q.org API Configuration
// Database connection settings

// Enable error reporting for debugging (remove in production)
// Disable display_errors to prevent HTML error output - use log_errors instead
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Security headers - Set these before any output
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: geolocation=(), microphone=(), camera=()');

// HSTS - Force HTTPS (only if already on HTTPS)
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
}

// Remove server information
header_remove('X-Powered-By');
header_remove('Server');

// Enable CORS for React frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration for data-q.org
define('DB_HOST', 'localhost');
define('DB_USER', 'dataqdxe_appdev'); // Database username
define('DB_PASS', '!Q@W#E4r5t6y'); // Database password
define('DB_NAME', 'dataqdxe_wp1899'); // Database name

// Create database connection
function getDBConnection() {
    try {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        if ($conn->connect_error) {
            throw new Exception("Connection failed: " . $conn->connect_error);
        }
        
        $conn->set_charset("utf8mb4");
        return $conn;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed', 'message' => $e->getMessage()]);
        exit();
    }
}

// Helper function to send JSON response
function sendJSON($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

// Helper function to get request data
function getRequestData() {
    $data = file_get_contents('php://input');
    return json_decode($data, true);
}

// Helper function to validate required fields
function validateRequired($data, $required) {
    $missing = [];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            $missing[] = $field;
        }
    }
    return $missing;
}

// Email configuration
// Set to true to use SMTP (uses PHP's built-in SMTP implementation)
define('SMTP_ENABLED', true);

// SMTP settings (if SMTP_ENABLED is true)
// Afrihost SMTP settings - Use your domain's mail server
define('SMTP_HOST', 'mail.data-q.org');
define('SMTP_USER', 'noreply@data-q.org'); // Your Afrihost email address
define('SMTP_PASS', '!Q@W#E4r5t6y'); // Your Afrihost email password for noreply@data-q.org
define('SMTP_SECURE', 'ssl'); // 'tls' or 'ssl'
define('SMTP_PORT', 465);

// Email sender information
define('EMAIL_FROM', 'noreply@data-q.org');
define('EMAIL_FROM_NAME', 'Shared Auth Demo');
define('EMAIL_REPLY_TO', 'noreply@data-q.org');

// Application URL (for email links)
define('APP_URL', 'https://data-q.org');
define('APP_NAME', 'Shared Auth Demo');

?>

