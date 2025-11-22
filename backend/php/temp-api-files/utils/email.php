<?php
/**
 * Email utility for sending emails
 * Supports both SMTP (authenticated) and PHP's mail() function
 */

function sendEmailSMTP($to, $subject, $message, $html = true) {
    error_log("sendEmailSMTP called - To: $to, Subject: $subject");
    
    if (!SMTP_ENABLED || empty(SMTP_USER) || empty(SMTP_PASS)) {
        error_log("❌ SMTP is enabled but credentials are missing. SMTP_ENABLED: " . (SMTP_ENABLED ? 'true' : 'false') . ", USER: " . (empty(SMTP_USER) ? 'empty' : 'set') . ", PASS: " . (empty(SMTP_PASS) ? 'empty' : 'set'));
        error_log("Falling back to mail() function.");
        return sendEmailBasic($to, $subject, $message, $html);
    }
    
    error_log("Connecting to SMTP: " . SMTP_HOST . ":" . SMTP_PORT . " (secure: " . SMTP_SECURE . ")");
    
    // Create socket connection
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        ]
    ]);
    
    $socket = @stream_socket_client(
        (SMTP_SECURE === 'ssl' ? 'ssl://' : 'tcp://') . SMTP_HOST . ':' . SMTP_PORT,
        $errno,
        $errstr,
        30,
        STREAM_CLIENT_CONNECT,
        $context
    );
    
    if (!$socket) {
        error_log("❌ SMTP connection failed: $errstr ($errno)");
        return false;
    }
    
    error_log("✅ SMTP socket connected successfully");
    
    // Read server greeting (220 response)
    $greeting = '';
    while ($line = fgets($socket, 515)) {
        $greeting .= $line;
        // Server greeting ends with a line starting with "220 " (space, not hyphen)
        if (substr($line, 0, 4) === '220 ') {
            break;
        }
        // Some servers send multi-line greeting ending with just "220"
        if (substr(trim($line), 0, 3) === '220' && substr($line, 3, 1) === ' ') {
            break;
        }
    }
    
    error_log("Server greeting: " . trim($greeting));
    
    // Check if greeting is valid (should start with 220)
    if (substr($greeting, 0, 3) !== '220') {
        error_log("❌ SMTP server error in greeting: " . trim($greeting));
        fclose($socket);
        return false;
    }
    
    // Get client hostname for EHLO
    $clientHost = isset($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : 'localhost';
    
    // For SSL (port 465), connection is already encrypted, send EHLO directly
    // For TLS (port 587), need to start TLS first
    if (SMTP_SECURE === 'tls') {
        // Send EHLO first (before STARTTLS)
        fputs($socket, "EHLO " . $clientHost . "\r\n");
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            // EHLO response ends with "250 " (space, not hyphen)
            if (substr($line, 0, 4) === '250 ') {
                break;
            }
        }
        
        // Start TLS
        fputs($socket, "STARTTLS\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) !== '220') {
            error_log("STARTTLS failed: $response");
            fclose($socket);
            return false;
        }
        stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        
        // Send EHLO again after TLS
        fputs($socket, "EHLO " . $clientHost . "\r\n");
        $ehloResponse = '';
        while ($line = fgets($socket, 515)) {
            $ehloResponse .= $line;
            // EHLO response ends with "250 " (space, not hyphen)
            if (substr($line, 0, 4) === '250 ') {
                break;
            }
        }
    } else {
        // For SSL, connection is already encrypted, send EHLO directly
        fputs($socket, "EHLO " . $clientHost . "\r\n");
        $ehloResponse = '';
        // Read all EHLO response lines until we get the final "250 " line
        while ($line = fgets($socket, 515)) {
            $ehloResponse .= $line;
            // Last line of EHLO response starts with "250 " (space after code, not hyphen)
            // Multi-line responses have "250-" for continuation and "250 " for final line
            if (substr($line, 0, 4) === '250 ') {
                error_log("✅ Got final EHLO line (250 with space)");
                break;
            }
            // Continuation lines start with "250-"
            if (substr($line, 0, 4) === '250-') {
                // Continue reading
                continue;
            }
            // If we get something that's not 250, something is wrong
            if (substr($line, 0, 3) !== '250') {
                error_log("⚠️ Unexpected EHLO response line: " . trim($line));
                // Don't break - might be multi-line with different format
                // But log it for debugging
            }
        }
    }
    
    error_log("Complete EHLO response received: " . strlen($ehloResponse) . " bytes");
    
    // Check what authentication methods are available
    // Parse EHLO response - it can be multi-line
    $authMethods = [];
    $ehloLines = explode("\n", $ehloResponse);
    error_log("EHLO Response (full): " . $ehloResponse);
    error_log("EHLO Response lines: " . count($ehloLines));
    
    foreach ($ehloLines as $lineNum => $line) {
        $line = trim($line);
        error_log("EHLO line $lineNum: $line");
        
        // Look for AUTH in EHLO response - can be on same line or continuation
        // Format examples: "250-AUTH PLAIN LOGIN" or "250 AUTH PLAIN LOGIN" or "250-AUTH=PLAIN LOGIN"
        if (preg_match('/250[- ]AUTH[= ](.+)/i', $line, $matches)) {
            $authString = trim($matches[1]);
            error_log("Found AUTH line: $authString");
            // Split by spaces or commas
            $methods = preg_split('/[\s,]+/', $authString);
            $authMethods = array_merge($authMethods, $methods);
        }
        // Also check if line contains AUTH keywords directly
        if (preg_match('/250.*AUTH.*(PLAIN|LOGIN|CRAM-MD5|DIGEST-MD5)/i', $line, $authMatches)) {
            error_log("Found AUTH keywords in line: " . implode(', ', array_slice($authMatches, 1)));
            $authMethods = array_merge($authMethods, array_slice($authMatches, 1));
        }
    }
    
    // Remove empty values and normalize to uppercase
    $authMethods = array_filter(array_map('trim', $authMethods));
    $authMethods = array_map('strtoupper', array_values($authMethods));
    $authMethods = array_unique($authMethods);
    
    error_log("Available auth methods detected: " . (empty($authMethods) ? 'None detected, will try both PLAIN and LOGIN' : implode(', ', $authMethods)));
    
    // Try AUTH PLAIN first (more common), then AUTH LOGIN
    // If no methods detected, try both
    $authSuccess = false;
    $lastError = '';
    
    // Try AUTH PLAIN first
    if (empty($authMethods) || in_array('PLAIN', $authMethods)) {
        error_log("Attempting AUTH PLAIN...");
        $authString = base64_encode("\0" . SMTP_USER . "\0" . SMTP_PASS);
        fputs($socket, "AUTH PLAIN " . $authString . "\r\n");
        $response = fgets($socket, 515);
        $responseCode = substr($response, 0, 3);
        error_log("AUTH PLAIN response ($responseCode): " . trim($response));
        if ($responseCode === '235') {
            error_log("✅ AUTH PLAIN successful");
            $authSuccess = true;
        } else {
            $lastError = "AUTH PLAIN failed: " . trim($response);
            error_log("❌ " . $lastError);
        }
    }
    
    // If PLAIN failed, try LOGIN
    if (!$authSuccess && (empty($authMethods) || in_array('LOGIN', $authMethods))) {
        error_log("Attempting AUTH LOGIN...");
        fputs($socket, "AUTH LOGIN\r\n");
        $response = fgets($socket, 515);
        $responseCode = substr($response, 0, 3);
        error_log("AUTH LOGIN step 1 response ($responseCode): " . trim($response));
        if ($responseCode === '334') {
            fputs($socket, base64_encode(SMTP_USER) . "\r\n");
            $response = fgets($socket, 515);
            $responseCode = substr($response, 0, 3);
            error_log("AUTH LOGIN step 2 response ($responseCode): " . trim($response));
            if ($responseCode === '334') {
                fputs($socket, base64_encode(SMTP_PASS) . "\r\n");
                $response = fgets($socket, 515);
                $responseCode = substr($response, 0, 3);
                error_log("AUTH LOGIN step 3 response ($responseCode): " . trim($response));
                if ($responseCode === '235') {
                    error_log("✅ AUTH LOGIN successful");
                    $authSuccess = true;
                } else {
                    $lastError = "AUTH LOGIN password failed: " . trim($response);
                    error_log("❌ " . $lastError);
                }
            } else {
                $lastError = "AUTH LOGIN username failed: " . trim($response);
                error_log("❌ " . $lastError);
            }
        } else {
            $lastError = "AUTH LOGIN not supported: " . trim($response);
            error_log("❌ " . $lastError);
        }
    }
    
    if (!$authSuccess) {
        error_log("❌ All authentication methods failed. Last error: $lastError");
        error_log("EHLO full response was: " . $ehloResponse);
        error_log("EHLO response length: " . strlen($ehloResponse) . " bytes");
        error_log("EHLO response lines: " . count(explode("\n", $ehloResponse)));
        fclose($socket);
        // Don't log "SMTP Authentication failed" with EHLO response - that's misleading
        return false;
    }
    
    error_log("✅ SMTP authentication successful, proceeding with email sending");
    
    // Send MAIL FROM
    fputs($socket, "MAIL FROM: <" . EMAIL_FROM . ">\r\n");
    $response = fgets($socket, 515);
    if (substr($response, 0, 3) !== '250') {
        error_log("MAIL FROM failed: $response");
        fclose($socket);
        return false;
    }
    
    // Send RCPT TO
    fputs($socket, "RCPT TO: <$to>\r\n");
    $response = fgets($socket, 515);
    if (substr($response, 0, 3) !== '250') {
        error_log("RCPT TO failed: $response");
        fclose($socket);
        return false;
    }
    
    // Send DATA
    fputs($socket, "DATA\r\n");
    $response = fgets($socket, 515);
    if (substr($response, 0, 3) !== '354') {
        error_log("DATA command failed: $response");
        fclose($socket);
        return false;
    }
    
    // Build email headers with proper authentication and spam prevention
    $domain = parse_url(APP_URL, PHP_URL_HOST);
    $messageId = '<' . time() . '.' . md5($to . time()) . '@' . $domain . '>';
    
    $headers = [];
    $fromName = defined('EMAIL_FROM_NAME') ? EMAIL_FROM_NAME : (defined('APP_NAME') ? APP_NAME : 'App');
    $headers[] = 'From: ' . $fromName . ' <' . EMAIL_FROM . '>';
    $headers[] = 'Reply-To: ' . EMAIL_REPLY_TO;
    $headers[] = 'To: ' . $to;
    $headers[] = 'Subject: ' . $subject;
    $headers[] = 'Message-ID: ' . $messageId;
    $headers[] = 'Date: ' . date('r');
    $appName = defined('APP_NAME') ? APP_NAME : 'App';
    $headers[] = 'X-Mailer: ' . $appName;
    $headers[] = 'X-Priority: 3';
    $headers[] = 'List-Unsubscribe: <' . APP_URL . '/unsubscribe>';
    $headers[] = 'List-Unsubscribe-Post: List-Unsubscribe=One-Click';
    
    if ($html) {
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'Content-Type: text/html; charset=UTF-8';
        $headers[] = 'Content-Transfer-Encoding: 8bit';
    }
    
    // Send email
    fputs($socket, implode("\r\n", $headers) . "\r\n\r\n");
    fputs($socket, $message . "\r\n");
    fputs($socket, ".\r\n");
    
    $response = fgets($socket, 515);
    if (substr($response, 0, 3) !== '250') {
        error_log("Email sending failed: $response");
        fclose($socket);
        return false;
    }
    
    // Quit
    fputs($socket, "QUIT\r\n");
    fclose($socket);
    
    error_log("Email sent successfully via SMTP to: $to");
    return true;
}

function sendEmailBasic($to, $subject, $message, $html = true) {
    // Improved headers for better email deliverability
    $headers = [];
    $headers[] = 'From: ' . EMAIL_FROM;
    $headers[] = 'Reply-To: ' . EMAIL_REPLY_TO;
    $headers[] = 'Return-Path: ' . EMAIL_FROM;
    $appName = defined('APP_NAME') ? APP_NAME : 'App';
    $headers[] = 'X-Mailer: ' . $appName . ' (PHP/' . phpversion() . ')';
    $headers[] = 'X-Priority: 3'; // Normal priority
    $headers[] = 'Message-ID: <' . time() . '.' . md5($to . time()) . '@' . parse_url(APP_URL, PHP_URL_HOST) . '>';
    
    if ($html) {
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'Content-type: text/html; charset=UTF-8';
    }
    
    $headersString = implode("\r\n", $headers);
    
    // Log email attempt
    error_log("Attempting to send email to: $to, Subject: $subject (using mail() function)");
    
    $result = @mail($to, $subject, $message, $headersString);
    
    if ($result) {
        error_log("Email sent successfully to: $to");
    } else {
        $error = error_get_last();
        error_log("Failed to send email to: $to. Error: " . ($error ? $error['message'] : 'Unknown error'));
    }
    
    return $result;
}

function sendEmail($to, $subject, $message, $html = true) {
    if (SMTP_ENABLED && !empty(SMTP_USER) && !empty(SMTP_PASS)) {
        return sendEmailSMTP($to, $subject, $message, $html);
    } else {
        return sendEmailBasic($to, $subject, $message, $html);
    }
}

function sendVerificationEmail($email, $name, $token) {
    // For data-q.org demo, use /app/demo/?token= format
    $verificationUrl = APP_URL . '/app/demo/?token=' . urlencode($token);
    
    $subject = 'Verify Your Email Address - ' . (defined('APP_NAME') ? APP_NAME : 'Shared Auth Demo');
    
    $message = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>" . (defined('APP_NAME') ? APP_NAME : 'App') . "</h1>
            </div>
            <div class='content'>
                <h2>Welcome, {$name}!</h2>
                <p>Thank you for signing up. To complete your registration, please verify your email address by clicking the button below:</p>
                <p style='text-align: center;'>
                    <a href='{$verificationUrl}' class='button'>Verify Email Address</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style='word-break: break-all; color: #667eea;'>{$verificationUrl}</p>
                <p>This verification link will expire in 24 hours.</p>
                <p>If you didn't create an account, please ignore this email.</p>
            </div>
            <div class='footer'>
                <p>&copy; " . date('Y') . " " . (defined('APP_NAME') ? APP_NAME : 'App') . ". All rights reserved.</p>
                <p style='font-size: 11px; color: #999; margin-top: 10px;'>This is an automated email. Please do not reply to this message.</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    return sendEmail($email, $subject, $message, true);
}

?>

