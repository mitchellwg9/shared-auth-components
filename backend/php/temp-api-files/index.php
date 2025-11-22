<?php
// Check if this is a direct PHP file access (bypass router)
// When .htaccess routes everything to index.php, SCRIPT_NAME might be index.php
// So we check REQUEST_URI instead
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$requestUri = strtok($requestUri, '?'); // Remove query string

$directAccessFiles = ['direct-show-logs.php', 'test-email.php', 'show-logs.php', 'test-smtp-config.php', 'check-email-verification.php', 'test-wayne.php'];

foreach ($directAccessFiles as $fileName) {
    if (strpos($requestUri, '/' . $fileName) !== false || strpos($requestUri, $fileName) !== false) {
        // Direct file access - include the file directly
        $filePath = __DIR__ . '/' . $fileName;
        if (file_exists($filePath)) {
            require_once $filePath;
            exit;
        }
    }
}

require_once 'config.php';

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];

// Get the request URI
$requestUri = $_SERVER['REQUEST_URI'];
$scriptName = $_SERVER['SCRIPT_NAME'];

// Remove query string
$requestUri = strtok($requestUri, '?');

// Get path from query parameter (set by .htaccess rewrite) or from URI
$path = '';
if (isset($_GET['path'])) {
    $path = $_GET['path'];
} else {
    // Extract path after /api/
    if (strpos($requestUri, '/api/') !== false) {
        $path = substr($requestUri, strpos($requestUri, '/api/') + 5); // +5 for '/api/'
    } elseif (strpos($requestUri, '/api') !== false && strlen($requestUri) > 4) {
        $path = substr($requestUri, strpos($requestUri, '/api') + 4);
    }
}

// Check if path is a direct file access that should bypass router
$directAccessFiles = ['direct-show-logs.php', 'test-email.php', 'show-logs.php', 'test-smtp-config.php', 'check-email-verification.php', 'test-wayne.php'];
foreach ($directAccessFiles as $fileName) {
    if ($path === $fileName || strpos($path, $fileName) !== false) {
        $filePath = __DIR__ . '/' . $fileName;
        if (file_exists($filePath)) {
            require_once $filePath;
            exit;
        }
    }
}

// Handle case where accessing /api/index.php directly
if (strpos($requestUri, '/api/index.php') !== false && empty($path)) {
    $path = '';
}

$path = trim($path, '/');
$pathParts = !empty($path) ? explode('/', $path) : [];

// Route handling
$resource = $pathParts[0] ?? '';
$id = $pathParts[1] ?? null;

// Debug: If no resource, show available routes
if (empty($resource)) {
    sendJSON([
        'message' => 'TymeTrackr API',
        'version' => '1.0',
        'status' => 'running',
        'available_routes' => [
                   'GET /api/users' => 'Get all users',
                   'GET /api/users/{id}' => 'Get single user',
                   'GET /api/clients' => 'Get all clients',
                   'GET /api/projects' => 'Get all projects',
                   'GET /api/organizations?user_id={id}' => 'Get organization for user',
                   'GET /api/leave-requests' => 'Get leave requests',
                   'POST /api/leave-requests' => 'Create leave request',
                   'GET /api/leave-balances?user_id={id}' => 'Get leave balances',
                   'GET /api/leave-types' => 'Get leave types',
                   'GET /api/public-holidays' => 'Get public holidays',
                   'POST /api/auth/login' => 'Login',
                   'POST /api/auth/register' => 'Register',
        ],
    ]);
}

        switch ($resource) {
            case 'users':
                require_once __DIR__ . '/routes/users.php';
                break;
            case 'clients':
                require_once __DIR__ . '/routes/clients.php';
                break;
            case 'projects':
                require_once __DIR__ . '/routes/projects.php';
                break;
            case 'tasks':
                require_once __DIR__ . '/routes/tasks.php';
                break;
            case 'time-entries':
                require_once __DIR__ . '/routes/time_entries.php';
                break;
            case 'auth':
                require_once __DIR__ . '/routes/auth.php';
                break;
            case 'settings':
                require_once __DIR__ . '/routes/settings.php';
                break;
            case 'notifications':
                require_once __DIR__ . '/routes/notifications.php';
                break;
            case 'organizations':
                require_once __DIR__ . '/routes/organizations.php';
                break;
            case 'owner':
                require_once __DIR__ . '/routes/owner.php';
                break;
            case 'leave-requests':
                require_once __DIR__ . '/routes/leave_requests.php';
                break;
            case 'leave-balances':
                require_once __DIR__ . '/routes/leave_balances.php';
                break;
            case 'leave-types':
                require_once __DIR__ . '/routes/leave_types.php';
                break;
            case 'public-holidays':
                require_once __DIR__ . '/routes/public_holidays.php';
                break;
            case 'leave-policies':
                require_once __DIR__ . '/routes/leave_policies.php';
                break;
            case 'test-email':
            case 'test-email.php':
                // Direct access to test-email.php for SMTP testing
                if (file_exists(__DIR__ . '/test-email.php')) {
                    require_once __DIR__ . '/test-email.php';
                    exit;
                } else {
                    sendJSON(['error' => 'Test email file not found'], 404);
                }
                break;
            case 'test-smtp-config':
                // Simple JSON endpoint to check SMTP config
                require_once __DIR__ . '/test-smtp-config.php';
                exit;
            case 'test-wayne':
            case 'test-wayne.php':
                // Simple test endpoint
                require_once __DIR__ . '/test-wayne.php';
                exit;
            case 'show-logs':
            case 'show-logs.php':
                // Helper to locate and view error logs
                require_once __DIR__ . '/show-logs.php';
                exit;
            default:
                sendJSON(['error' => 'Resource not found'], 404);
                break;
        }

?>

