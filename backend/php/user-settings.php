<?php
/**
 * User Settings API Endpoint
 * Handles GET and PUT requests for user settings (theme, date_format, dark_mode)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['ok' => true]);
    exit;
}

// Start output buffering
ob_start();

// Set custom error handler
set_error_handler(function($severity, $message, $file, $line) {
    error_log("User Settings Error: $message in $file:$line");
    return false;
});

try {
    // Load config
    $configPath = __DIR__ . '/config.php';
    if (!file_exists($configPath)) {
        $configPath = __DIR__ . '/../config.php';
    }
    require_once $configPath;

    // Get database connection
    if (!function_exists('getDBConnection')) {
        ob_clean();
        http_response_code(500);
        echo json_encode(['error' => 'Database connection function not available']);
        exit;
    }
    
    $conn = getDBConnection();
    if (!$conn) {
        ob_clean();
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed']);
        exit;
    }

    // Get user ID from request
    $userId = null;
    if (isset($_GET['current_user_id'])) {
        $userId = $_GET['current_user_id'];
    } elseif (isset($_POST['current_user_id'])) {
        $userId = $_POST['current_user_id'];
    } else {
        $data = getRequestData();
        if (isset($data['current_user_id'])) {
            $userId = $data['current_user_id'];
        }
    }

    if (!$userId) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['error' => 'User ID required']);
        exit;
    }

    $method = $_SERVER['REQUEST_METHOD'];

    // Create table if it doesn't exist
    try {
        // Check if table exists first
        $checkTable = $conn->query("SHOW TABLES LIKE 'user_settings'");
        if ($checkTable->num_rows == 0) {
            $createTableSQL = "CREATE TABLE user_settings (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id INT UNSIGNED NOT NULL,
                theme VARCHAR(50) DEFAULT 'sapphire',
                date_format VARCHAR(20) DEFAULT 'dd/mm/yyyy',
                dark_mode TINYINT(1) DEFAULT 0,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_settings (user_id),
                INDEX idx_user_settings_user (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
            
            if (!$conn->query($createTableSQL)) {
                error_log("Failed to create user_settings table: " . $conn->error);
            } else {
                error_log("Successfully created user_settings table");
            }
        }
    } catch (Exception $e) {
        error_log("Error checking/creating user_settings table: " . $e->getMessage());
        // Continue anyway - table might already exist
    } catch (Error $e) {
        error_log("Fatal error checking/creating user_settings table: " . $e->getMessage());
    }

    if ($method === 'GET') {
        // Get user settings
        $stmt = $conn->prepare("SELECT theme, date_format, dark_mode FROM user_settings WHERE user_id = ?");
        $stmt->bind_param("s", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $settings = $result->fetch_assoc();
        $stmt->close();

        if (!$settings) {
            // Return defaults
            ob_clean();
            http_response_code(200);
            echo json_encode([
                'theme' => 'sapphire',
                'dateFormat' => 'dd/mm/yyyy',
                'darkMode' => false
            ]);
            exit;
        } else {
            ob_clean();
            http_response_code(200);
            echo json_encode([
                'theme' => $settings['theme'],
                'dateFormat' => $settings['date_format'],
                'darkMode' => (bool)$settings['dark_mode']
            ]);
            exit;
        }
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        // Update user settings
        $data = getRequestData();
        
        error_log("User Settings PUT - User ID: $userId");
        error_log("User Settings PUT - Data: " . json_encode($data));
        
        $theme = isset($data['theme']) ? $data['theme'] : null;
        $dateFormat = isset($data['dateFormat']) ? $data['dateFormat'] : null;
        $darkMode = isset($data['darkMode']) ? ($data['darkMode'] ? 1 : 0) : null;

        // Build update query
        $updates = [];
        $params = [];
        $types = '';
        $insertFields = ['user_id'];
        $insertValues = ['?'];
        $insertParams = [$userId];
        $insertTypes = 's';

        if ($theme !== null) {
            $updates[] = 'theme = ?';
            $params[] = $theme;
            $types .= 's';
            $insertFields[] = 'theme';
            $insertValues[] = '?';
            $insertParams[] = $theme;
            $insertTypes .= 's';
        }
        if ($dateFormat !== null) {
            $updates[] = 'date_format = ?';
            $params[] = $dateFormat;
            $types .= 's';
            $insertFields[] = 'date_format';
            $insertValues[] = '?';
            $insertParams[] = $dateFormat;
            $insertTypes .= 's';
        }
        if ($darkMode !== null) {
            $updates[] = 'dark_mode = ?';
            $params[] = $darkMode;
            $types .= 'i';
            $insertFields[] = 'dark_mode';
            $insertValues[] = '?';
            $insertParams[] = $darkMode;
            $insertTypes .= 'i';
        }

        if (empty($updates)) {
            ob_clean();
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit;
        }

        // Use INSERT ... ON DUPLICATE KEY UPDATE
        // Set defaults for INSERT if not provided
        if (!in_array('theme', $insertFields)) {
            $insertFields[] = 'theme';
            $insertValues[] = '?';
            $insertParams[] = 'sapphire';
            $insertTypes .= 's';
        }
        if (!in_array('date_format', $insertFields)) {
            $insertFields[] = 'date_format';
            $insertValues[] = '?';
            $insertParams[] = 'dd/mm/yyyy';
            $insertTypes .= 's';
        }
        if (!in_array('dark_mode', $insertFields)) {
            $insertFields[] = 'dark_mode';
            $insertValues[] = '?';
            $insertParams[] = 0;
            $insertTypes .= 'i';
        }

        $sql = 'INSERT INTO user_settings (' . implode(', ', $insertFields) . ') 
                VALUES (' . implode(', ', $insertValues) . ')
                ON DUPLICATE KEY UPDATE ' . implode(', ', $updates);

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            error_log("User Settings Prepare Error: " . $conn->error);
            ob_clean();
            http_response_code(500);
            echo json_encode(['error' => 'Database prepare failed: ' . $conn->error]);
            exit;
        }

        // Bind all parameters for INSERT and UPDATE
        $allParams = array_merge($insertParams, $params);
        $allTypes = $insertTypes . $types;
        
        error_log("User Settings Bind Types: $allTypes");
        error_log("User Settings Bind Params Count: " . count($allParams));
        
        $stmt->bind_param($allTypes, ...$allParams);
        
        if (!$stmt->execute()) {
            error_log("User Settings Execute Error: " . $stmt->error);
            ob_clean();
            http_response_code(500);
            echo json_encode(['error' => 'Database execute failed: ' . $stmt->error]);
            $stmt->close();
            exit;
        }
        
        $affectedRows = $stmt->affected_rows;
        $stmt->close();
        
        error_log("User Settings Success - Affected rows: $affectedRows");
        
        ob_clean();
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Settings updated successfully', 'affected_rows' => $affectedRows]);
        exit;
    }

    ob_clean();
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
} catch (Exception $e) {
    error_log("User Settings Exception: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => 'An error occurred while processing your request'
    ]);
    exit;
} catch (Error $e) {
    error_log("User Settings Fatal Error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => 'An error occurred while processing your request'
    ]);
    exit;
}

