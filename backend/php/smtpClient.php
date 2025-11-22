<?php
/**
 * SMTP Client for PHP
 * Simple SMTP client for sending emails from backend services
 * Compatible with the shared-auth email templates
 */

/**
 * Send email using SMTP
 * @param array $config SMTP configuration
 * @param string $config['host'] - SMTP server host
 * @param int $config['port'] - SMTP server port (465 for SSL, 587 for TLS)
 * @param string $config['secure'] - 'ssl' or 'tls'
 * @param array $config['auth'] - Authentication credentials
 * @param string $config['auth']['user'] - SMTP username
 * @param string $config['auth']['pass'] - SMTP password
 * @param string $config['from'] - Default from email address
 * @param string|null $config['fromName'] - Default from name
 * @param array $emailOptions Email options
 * @param string|array $emailOptions['to'] - Recipient email address(es)
 * @param string $emailOptions['subject'] - Email subject
 * @param string $emailOptions['html'] - HTML email body
 * @param string|null $emailOptions['text'] - Plain text email body
 * @param string|null $emailOptions['from'] - Sender email (overrides default)
 * @param string|null $emailOptions['fromName'] - Sender name (overrides default)
 * @param string|null $emailOptions['replyTo'] - Reply-to email address
 * @return array Result with 'success' (bool), 'messageId' (string|null), 'error' (string|null)
 */
function sendEmailViaSMTP($config, $emailOptions) {
    $host = $config['host'] ?? 'localhost';
    $port = $config['port'] ?? 587;
    $secure = $config['secure'] ?? 'tls';
    $smtpUser = $config['auth']['user'] ?? '';
    $smtpPass = $config['auth']['pass'] ?? '';
    $defaultFrom = $config['from'] ?? $smtpUser;
    $defaultFromName = $config['fromName'] ?? null;
    
    $to = is_array($emailOptions['to']) ? implode(', ', $emailOptions['to']) : $emailOptions['to'];
    $subject = $emailOptions['subject'] ?? '';
    $html = $emailOptions['html'] ?? '';
    $text = $emailOptions['text'] ?? null;
    $from = $emailOptions['from'] ?? $defaultFrom;
    $fromName = $emailOptions['fromName'] ?? $defaultFromName;
    $replyTo = $emailOptions['replyTo'] ?? null;
    
    if (empty($smtpUser) || empty($smtpPass)) {
        return [
            'success' => false,
            'error' => 'SMTP credentials are required'
        ];
    }
    
    // Create socket connection
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        ]
    ]);
    
    $socket = @stream_socket_client(
        ($secure === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port,
        $errno,
        $errstr,
        30,
        STREAM_CLIENT_CONNECT,
        $context
    );
    
    if (!$socket) {
        return [
            'success' => false,
            'error' => "SMTP connection failed: $errstr ($errno)"
        ];
    }
    
    // Read server greeting
    $response = fgets($socket, 515);
    if (substr($response, 0, 3) !== '220') {
        fclose($socket);
        return [
            'success' => false,
            'error' => "SMTP server error: $response"
        ];
    }
    
    // Get client hostname for EHLO
    $clientHost = isset($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : 'localhost';
    
    // Handle TLS/SSL
    if ($secure === 'tls') {
        // Send EHLO first
        fputs($socket, "EHLO " . $clientHost . "\r\n");
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) === ' ') break;
        }
        
        // Start TLS
        fputs($socket, "STARTTLS\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) !== '220') {
            fclose($socket);
            return [
                'success' => false,
                'error' => "STARTTLS failed: $response"
            ];
        }
        stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        
        // Send EHLO again after TLS
        fputs($socket, "EHLO " . $clientHost . "\r\n");
        $ehloResponse = '';
        while ($line = fgets($socket, 515)) {
            $ehloResponse .= $line;
            if (substr($line, 3, 1) === ' ') break;
        }
    } else {
        // For SSL, connection is already encrypted
        fputs($socket, "EHLO " . $clientHost . "\r\n");
        $ehloResponse = '';
        while ($line = fgets($socket, 515)) {
            $ehloResponse .= $line;
            if (substr($line, 0, 4) === '250 ') {
                break;
            }
        }
    }
    
    // Check authentication methods
    $authMethods = [];
    if (preg_match('/250-AUTH\s+(.+)/i', $ehloResponse, $matches)) {
        $authMethods = explode(' ', trim($matches[1]));
    } elseif (preg_match('/250.*AUTH\s+(.+)/i', $ehloResponse, $matches)) {
        $authMethods = explode(' ', trim($matches[1]));
    }
    
    // Try AUTH PLAIN first
    $authSuccess = false;
    if (in_array('PLAIN', $authMethods) || empty($authMethods)) {
        $authString = base64_encode("\0" . $smtpUser . "\0" . $smtpPass);
        fputs($socket, "AUTH PLAIN " . $authString . "\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) === '235') {
            $authSuccess = true;
        }
    }
    
    // If PLAIN failed, try LOGIN
    if (!$authSuccess && (in_array('LOGIN', $authMethods) || empty($authMethods))) {
        fputs($socket, "AUTH LOGIN\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) === '334') {
            fputs($socket, base64_encode($smtpUser) . "\r\n");
            $response = fgets($socket, 515);
            if (substr($response, 0, 3) === '334') {
                fputs($socket, base64_encode($smtpPass) . "\r\n");
                $response = fgets($socket, 515);
                if (substr($response, 0, 3) === '235') {
                    $authSuccess = true;
                }
            }
        }
    }
    
    if (!$authSuccess) {
        fclose($socket);
        return [
            'success' => false,
            'error' => 'SMTP authentication failed'
        ];
    }
    
    // Send MAIL FROM
    $fromString = $fromName ? "{$fromName} <{$from}>" : $from;
    fputs($socket, "MAIL FROM: <{$from}>\r\n");
    $response = fgets($socket, 515);
    if (substr($response, 0, 3) !== '250') {
        fclose($socket);
        return [
            'success' => false,
            'error' => "MAIL FROM failed: $response"
        ];
    }
    
    // Send RCPT TO
    fputs($socket, "RCPT TO: <{$to}>\r\n");
    $response = fgets($socket, 515);
    if (substr($response, 0, 3) !== '250') {
        fclose($socket);
        return [
            'success' => false,
            'error' => "RCPT TO failed: $response"
        ];
    }
    
    // Send DATA
    fputs($socket, "DATA\r\n");
    $response = fgets($socket, 515);
    if (substr($response, 0, 3) !== '354') {
        fclose($socket);
        return [
            'success' => false,
            'error' => "DATA command failed: $response"
        ];
    }
    
    // Build email headers
    $domain = parse_url($_SERVER['HTTP_HOST'] ?? 'localhost', PHP_URL_HOST);
    $messageId = '<' . time() . '.' . md5($to . time()) . '@' . $domain . '>';
    
    $headers = [];
    $headers[] = 'From: ' . $fromString;
    if ($replyTo) {
        $headers[] = 'Reply-To: ' . $replyTo;
    }
    $headers[] = 'To: ' . $to;
    $headers[] = 'Subject: ' . $subject;
    $headers[] = 'Message-ID: ' . $messageId;
    $headers[] = 'Date: ' . date('r');
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/html; charset=UTF-8';
    $headers[] = 'Content-Transfer-Encoding: 8bit';
    
    // Send email
    fputs($socket, implode("\r\n", $headers) . "\r\n\r\n");
    fputs($socket, $html . "\r\n");
    fputs($socket, ".\r\n");
    
    $response = fgets($socket, 515);
    if (substr($response, 0, 3) !== '250') {
        fclose($socket);
        return [
            'success' => false,
            'error' => "Email sending failed: $response"
        ];
    }
    
    // Quit
    fputs($socket, "QUIT\r\n");
    fclose($socket);
    
    return [
        'success' => true,
        'messageId' => $messageId,
        'response' => $response
    ];
}

?>

