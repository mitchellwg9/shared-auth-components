<?php
/**
 * User Settings Routes
 * Handles GET and PUT requests for user settings (theme, date_format, dark_mode)
 */

if (!function_exists('sendJSON')) {
    function sendJSON($data, $code = 200) {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}

// Start output buffering to prevent accidental output
ob_start();

// Set custom error handler to log errors without displaying them
set_error_handler(function($severity, $message, $file, $line) {
    error_log("User Settings Route Error: $message in $file:$line");
    return false; // Don't execute PHP internal error handler
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
        sendJSON(['error' => 'Database connection function not available'], 500);
    }
    
    $conn = getDBConnection();
    if (!$conn) {
        ob_clean();
        sendJSON(['error' => 'Database connection failed'], 500);
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
        sendJSON(['error' => 'User ID required'], 400);
    }

    $method = $_SERVER['REQUEST_METHOD'];

    // Create table if it doesn't exist
    try {
        $createTableSQL = "CREATE TABLE IF NOT EXISTS user_settings (
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
        
        $conn->query($createTableSQL);
    } catch (Exception $e) {
        error_log("Failed to create user_settings table: " . $e->getMessage());
        // Continue anyway - table might already exist
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
            sendJSON([
                'theme' => 'sapphire',
                'dateFormat' => 'dd/mm/yyyy',
                'darkMode' => false
            ]);
        } else {
            ob_clean();
            sendJSON([
                'theme' => $settings['theme'],
                'dateFormat' => $settings['date_format'],
                'darkMode' => (bool)$settings['dark_mode']
            ]);
        }
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        // Update user settings
        $data = getRequestData();
        
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
            sendJSON(['error' => 'No fields to update'], 400);
        }

        // Use INSERT ... ON DUPLICATE KEY UPDATE
        $sql = 'INSERT INTO user_settings (' . implode(', ', $insertFields) . ') 
                VALUES (' . implode(', ', $insertValues) . ')
                ON DUPLICATE KEY UPDATE ' . implode(', ', $updates);
        
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

        // Rebuild SQL with all fields
        $sql = 'INSERT INTO user_settings (' . implode(', ', $insertFields) . ') 
                VALUES (' . implode(', ', $insertValues) . ')
                ON DUPLICATE KEY UPDATE ' . implode(', ', $updates);

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            ob_clean();
            sendJSON(['error' => 'Database prepare failed: ' . $conn->error], 500);
        }

        // Bind all parameters for INSERT and UPDATE
        $allParams = array_merge($insertParams, $params);
        $allTypes = $insertTypes . $types;
        $stmt->bind_param($allTypes, ...$allParams);
        
        if (!$stmt->execute()) {
            ob_clean();
            sendJSON(['error' => 'Database execute failed: ' . $stmt->error], 500);
        }
        
        $stmt->close();
        ob_clean();
        sendJSON(['success' => true, 'message' => 'Settings updated successfully']);
    }

    ob_clean();
    sendJSON(['error' => 'Method not allowed'], 405);
} catch (Exception $e) {
    error_log("User Settings Route Exception: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    ob_clean();
    sendJSON([
        'error' => 'Server error',
        'message' => 'An error occurred while processing your request'
    ], 500);
} catch (Error $e) {
    error_log("User Settings Route Fatal Error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    ob_clean();
    sendJSON([
        'error' => 'Server error',
        'message' => 'An error occurred while processing your request'
    ], 500);
}

