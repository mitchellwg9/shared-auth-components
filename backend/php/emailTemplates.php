<?php
/**
 * Email Templates for Shared Auth Components
 * PHP version of the email template generators
 */

/**
 * Generate verification email HTML
 * @param array $options
 * @param string $options['appName'] - Name of the application
 * @param string $options['userName'] - User's name
 * @param string $options['verificationUrl'] - Full URL to verification page with token
 * @param string $options['primaryColor'] - Primary color for branding (default: #6366f1)
 * @param string|null $options['logoUrl'] - Optional logo URL
 * @return string HTML email content
 */
function generateVerificationEmail($options) {
    $appName = $options['appName'] ?? 'App';
    $userName = $options['userName'] ?? null;
    $verificationUrl = $options['verificationUrl'] ?? '';
    $primaryColor = $options['primaryColor'] ?? '#6366f1';
    $logoUrl = $options['logoUrl'] ?? null;
    $currentYear = date('Y');
    
    $logoHtml = $logoUrl ? "<img src=\"{$logoUrl}\" alt=\"{$appName}\" style=\"max-width: 200px; height: auto; margin-bottom: 20px;\" />" : '';
    
    return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0;
            background-color: #f5f5f5;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .email-wrapper {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, {$primaryColor} 0%, " . darkenColor($primaryColor, 20) . " 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .content { 
            padding: 30px; 
            background: #ffffff;
        }
        .button { 
            display: inline-block; 
            padding: 14px 32px; 
            background: linear-gradient(135deg, {$primaryColor} 0%, " . darkenColor($primaryColor, 20) . " 100%); 
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 20px 0;
            font-weight: 600;
            font-size: 16px;
        }
        .link-text {
            word-break: break-all;
            color: {$primaryColor};
            font-size: 14px;
            padding: 10px;
            background: #f1f5f9;
            border-radius: 6px;
        }
        .footer { 
            text-align: center; 
            padding: 20px; 
            color: #64748b; 
            font-size: 12px; 
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class='container'>
        <div class='email-wrapper'>
            <div class='header'>
                {$logoHtml}
                <h1 style='margin: 0; font-size: 28px;'>{$appName}</h1>
            </div>
            <div class='content'>
                <h2 style='color: #1e293b; margin-top: 0;'>Welcome, " . ($userName ? htmlspecialchars($userName) : 'there') . "!</h2>
                <p style='color: #475569;'>Thank you for signing up for {$appName}. To complete your registration, please verify your email address by clicking the button below:</p>
                <p style='text-align: center;'>
                    <a href='{$verificationUrl}' class='button'>Verify Email Address</a>
                </p>
                <p style='color: #475569;'>Or copy and paste this link into your browser:</p>
                <p class='link-text'>" . htmlspecialchars($verificationUrl) . "</p>
                <p style='color: #64748b; font-size: 14px;'>This verification link will expire in 24 hours.</p>
                <p style='color: #64748b; font-size: 14px;'>If you didn't create an account with {$appName}, please ignore this email.</p>
            </div>
            <div class='footer'>
                <p>&copy; {$currentYear} {$appName}. All rights reserved.</p>
                <p style='font-size: 11px; color: #94a3b8; margin-top: 8px;'>This is an automated email. Please do not reply to this message.</p>
            </div>
        </div>
    </div>
</body>
</html>
    ";
}

/**
 * Generate password reset email HTML
 * @param array $options
 * @param string $options['appName'] - Name of the application
 * @param string $options['userName'] - User's name
 * @param string $options['resetUrl'] - Full URL to password reset page with token
 * @param string $options['primaryColor'] - Primary color for branding (default: #6366f1)
 * @param string|null $options['logoUrl'] - Optional logo URL
 * @return string HTML email content
 */
function generatePasswordResetEmail($options) {
    $appName = $options['appName'] ?? 'App';
    $userName = $options['userName'] ?? null;
    $resetUrl = $options['resetUrl'] ?? '';
    $primaryColor = $options['primaryColor'] ?? '#6366f1';
    $logoUrl = $options['logoUrl'] ?? null;
    $currentYear = date('Y');
    
    $logoHtml = $logoUrl ? "<img src=\"{$logoUrl}\" alt=\"{$appName}\" style=\"max-width: 200px; height: auto; margin-bottom: 20px;\" />" : '';
    
    return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0;
            background-color: #f5f5f5;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .email-wrapper {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, {$primaryColor} 0%, " . darkenColor($primaryColor, 20) . " 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .content { 
            padding: 30px; 
            background: #ffffff;
        }
        .button { 
            display: inline-block; 
            padding: 14px 32px; 
            background: linear-gradient(135deg, {$primaryColor} 0%, " . darkenColor($primaryColor, 20) . " 100%); 
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 20px 0;
            font-weight: 600;
            font-size: 16px;
        }
        .link-text {
            word-break: break-all;
            color: {$primaryColor};
            font-size: 14px;
            padding: 10px;
            background: #f1f5f9;
            border-radius: 6px;
        }
        .footer { 
            text-align: center; 
            padding: 20px; 
            color: #64748b; 
            font-size: 12px; 
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class='container'>
        <div class='email-wrapper'>
            <div class='header'>
                {$logoHtml}
                <h1 style='margin: 0; font-size: 28px;'>{$appName}</h1>
            </div>
            <div class='content'>
                <h2 style='color: #1e293b; margin-top: 0;'>Password Reset Request</h2>
                <p style='color: #475569;'>Hello " . ($userName ? htmlspecialchars($userName) : 'there') . ",</p>
                <p style='color: #475569;'>We received a request to reset your password for your {$appName} account. Click the button below to reset your password:</p>
                <p style='text-align: center;'>
                    <a href='{$resetUrl}' class='button'>Reset Password</a>
                </p>
                <p style='color: #475569;'>Or copy and paste this link into your browser:</p>
                <p class='link-text'>" . htmlspecialchars($resetUrl) . "</p>
                <p style='color: #64748b; font-size: 14px;'>This link will expire in 1 hour.</p>
                <p style='color: #64748b; font-size: 14px;'>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class='footer'>
                <p>&copy; {$currentYear} {$appName}. All rights reserved.</p>
                <p style='font-size: 11px; color: #94a3b8; margin-top: 8px;'>This is an automated email. Please do not reply to this message.</p>
            </div>
        </div>
    </div>
</body>
</html>
    ";
}

/**
 * Generate welcome email HTML (after verification)
 * @param array $options
 * @param string $options['appName'] - Name of the application
 * @param string $options['userName'] - User's name
 * @param string $options['loginUrl'] - Full URL to login page
 * @param string $options['primaryColor'] - Primary color for branding (default: #6366f1)
 * @param string|null $options['logoUrl'] - Optional logo URL
 * @return string HTML email content
 */
function generateWelcomeEmail($options) {
    $appName = $options['appName'] ?? 'App';
    $userName = $options['userName'] ?? null;
    $loginUrl = $options['loginUrl'] ?? '';
    $primaryColor = $options['primaryColor'] ?? '#6366f1';
    $logoUrl = $options['logoUrl'] ?? null;
    $currentYear = date('Y');
    
    $logoHtml = $logoUrl ? "<img src=\"{$logoUrl}\" alt=\"{$appName}\" style=\"max-width: 200px; height: auto; margin-bottom: 20px;\" />" : '';
    
    return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0;
            background-color: #f5f5f5;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .email-wrapper {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, {$primaryColor} 0%, " . darkenColor($primaryColor, 20) . " 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .content { 
            padding: 30px; 
            background: #ffffff;
        }
        .button { 
            display: inline-block; 
            padding: 14px 32px; 
            background: linear-gradient(135deg, {$primaryColor} 0%, " . darkenColor($primaryColor, 20) . " 100%); 
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 20px 0;
            font-weight: 600;
            font-size: 16px;
        }
        .footer { 
            text-align: center; 
            padding: 20px; 
            color: #64748b; 
            font-size: 12px; 
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class='container'>
        <div class='email-wrapper'>
            <div class='header'>
                {$logoHtml}
                <h1 style='margin: 0; font-size: 28px;'>{$appName}</h1>
            </div>
            <div class='content'>
                <h2 style='color: #1e293b; margin-top: 0;'>Welcome to {$appName}!</h2>
                <p style='color: #475569;'>Hello " . ($userName ? htmlspecialchars($userName) : 'there') . ",</p>
                <p style='color: #475569;'>Your email has been successfully verified! You can now access all features of {$appName}.</p>
                <p style='text-align: center;'>
                    <a href='{$loginUrl}' class='button'>Log In to Your Account</a>
                </p>
                <p style='color: #64748b; font-size: 14px;'>Thank you for joining us!</p>
            </div>
            <div class='footer'>
                <p>&copy; {$currentYear} {$appName}. All rights reserved.</p>
                <p style='font-size: 11px; color: #94a3b8; margin-top: 8px;'>This is an automated email. Please do not reply to this message.</p>
            </div>
        </div>
    </div>
</body>
</html>
    ";
}

/**
 * Helper function to darken a hex color
 * @param string $hexColor - Hex color code (e.g., #6366f1)
 * @param int $percent - Percentage to darken (0-100)
 * @return string Darkened hex color
 */
function darkenColor($hexColor, $percent) {
    $hexColor = ltrim($hexColor, '#');
    $r = hexdec(substr($hexColor, 0, 2));
    $g = hexdec(substr($hexColor, 2, 2));
    $b = hexdec(substr($hexColor, 4, 2));
    
    $r = max(0, min(255, $r - ($r * $percent / 100)));
    $g = max(0, min(255, $g - ($g * $percent / 100)));
    $b = max(0, min(255, $b - ($b * $percent / 100)));
    
    return '#' . str_pad(dechex($r), 2, '0', STR_PAD_LEFT) . 
           str_pad(dechex($g), 2, '0', STR_PAD_LEFT) . 
           str_pad(dechex($b), 2, '0', STR_PAD_LEFT);
}

?>

