<?php
header('Content-Type: application/json');

$debug = [
    'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? 'not set',
    'SCRIPT_NAME' => $_SERVER['SCRIPT_NAME'] ?? 'not set',
    'QUERY_STRING' => $_SERVER['QUERY_STRING'] ?? 'not set',
    'GET_path' => $_GET['path'] ?? 'not set',
    'GET_all' => $_GET,
    'SERVER_NAME' => $_SERVER['SERVER_NAME'] ?? 'not set',
    'DOCUMENT_ROOT' => $_SERVER['DOCUMENT_ROOT'] ?? 'not set',
    'current_dir' => __DIR__,
    'files_in_dir' => [],
];

// List files in current directory
if (is_dir(__DIR__)) {
    $files = scandir(__DIR__);
    $debug['files_in_dir'] = array_filter($files, function($f) {
        return $f !== '.' && $f !== '..' && (strpos($f, '.php') !== false || strpos($f, '.htaccess') !== false);
    });
}

// Check if test-wayne.php exists
$testWaynePath = __DIR__ . '/test-wayne.php';
$debug['test_wayne_exists'] = file_exists($testWaynePath);
$debug['test_wayne_path'] = $testWaynePath;
$debug['test_wayne_readable'] = is_readable($testWaynePath);

echo json_encode($debug, JSON_PRETTY_PRINT);
?>

