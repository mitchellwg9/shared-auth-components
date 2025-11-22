<?php
/**
 * Script to help locate and view PHP error logs
 * Access: https://data-q.org/api/show-logs.php
 */

header('Content-Type: text/html; charset=UTF-8');

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>PHP Error Log Location</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; }
        .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .success { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .error { background: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .log-entry { 
            background: #f9f9f9; 
            padding: 10px; 
            margin: 5px 0; 
            border-left: 3px solid #2196f3;
            font-family: monospace;
            font-size: 12px;
            word-wrap: break-word;
        }
        pre {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            max-height: 600px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📋 PHP Error Log Location Helper</h1>
        
        <div class="info">
            <h3>Error Log Configuration</h3>
            <p><strong>error_log setting:</strong> <?php echo ini_get('error_log') ?: 'Not set (using default)'; ?></p>
            <p><strong>log_errors:</strong> <?php echo ini_get('log_errors') ? 'Enabled' : 'Disabled'; ?></p>
            <p><strong>display_errors:</strong> <?php echo ini_get('display_errors') ? 'Enabled' : 'Disabled'; ?></p>
        </div>

        <?php
        // Common error log locations
        $possibleLogPaths = [
            ini_get('error_log'),
            __DIR__ . '/error_log',
            __DIR__ . '/../error_log',
            __DIR__ . '/../../error_log',
            '/var/log/php_errors.log',
            '/var/log/php/error.log',
            '/var/log/apache2/error.log',
            '/var/log/httpd/error_log',
            $_SERVER['DOCUMENT_ROOT'] . '/error_log',
            $_SERVER['DOCUMENT_ROOT'] . '/../error_log',
            dirname($_SERVER['DOCUMENT_ROOT']) . '/logs/error_log',
        ];

        // Remove empty values
        $possibleLogPaths = array_filter($possibleLogPaths);
        $possibleLogPaths = array_unique($possibleLogPaths);

        echo '<div class="info">';
        echo '<h3>Checking Common Log Locations:</h3>';
        echo '<ul>';

        $foundLogs = [];
        foreach ($possibleLogPaths as $logPath) {
            if (file_exists($logPath) && is_readable($logPath)) {
                $size = filesize($logPath);
                $sizeFormatted = $size > 1024 * 1024 ? number_format($size / (1024 * 1024), 2) . ' MB' : number_format($size / 1024, 2) . ' KB';
                $modified = date('Y-m-d H:i:s', filemtime($logPath));
                echo "<li style='color: green;'>✅ <strong>$logPath</strong> (Size: $sizeFormatted, Modified: $modified)</li>";
                $foundLogs[] = $logPath;
            } else {
                echo "<li style='color: #999;'>❌ $logPath (not found)</li>";
            }
        }
        echo '</ul>';
        echo '</div>';

        // Show recent log entries from found logs
        if (!empty($foundLogs)) {
            echo '<div class="success">';
            echo '<h3>Recent Error Log Entries (Last 50 lines from first found log):</h3>';
            $logFile = $foundLogs[0];
            
            // Read last 50 lines
            $lines = file($logFile);
            $recentLines = array_slice($lines, -50);
            
            echo '<pre>';
            foreach ($recentLines as $line) {
                // Highlight important lines
                $line = htmlspecialchars($line);
                if (stripos($line, 'smtp') !== false || stripos($line, 'email') !== false || 
                    stripos($line, 'auth') !== false || stripos($line, 'error') !== false ||
                    stripos($line, '✅') !== false || stripos($line, '❌') !== false) {
                    echo "<div style='background: #fff3cd; padding: 2px; margin: 2px 0;'>$line</div>";
                } else {
                    echo $line;
                }
            }
            echo '</pre>';
            echo '</div>';
        } else {
            echo '<div class="error">';
            echo '<h3>⚠️ No Error Logs Found</h3>';
            echo '<p>Common locations for Afrihost/cPanel hosting:</p>';
            echo '<ul>';
            echo '<li>Check your cPanel → Error Logs section</li>';
            echo '<li>Check: <code>' . __DIR__ . '/error_log</code></li>';
            echo '<li>Check: <code>' . dirname(__DIR__) . '/error_log</code></li>';
            echo '<li>Check your hosting control panel for "Error Logs" or "Logs" section</li>';
            echo '</ul>';
            echo '</div>';
        }

        // Show server info
        echo '<div class="info">';
        echo '<h3>Server Information</h3>';
        echo '<p><strong>Document Root:</strong> ' . $_SERVER['DOCUMENT_ROOT'] . '</p>';
        echo '<p><strong>Script Directory:</strong> ' . __DIR__ . '</p>';
        echo '<p><strong>Server Software:</strong> ' . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . '</p>';
        echo '</div>';
        ?>
    </div>
</body>
</html>

