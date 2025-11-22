/**
 * Email Templates for Shared Auth Components
 * Generates HTML email templates for authentication-related emails
 */

/**
 * Generate email verification email HTML
 * @param {Object} options
 * @param {string} options.appName - Name of the application
 * @param {string} options.userName - User's name
 * @param {string} options.verificationUrl - Full URL to verification page with token
 * @param {string} options.primaryColor - Primary color for branding (default: #6366f1)
 * @param {string} options.logoUrl - Optional logo URL
 * @returns {string} HTML email content
 */
export function generateVerificationEmail({
  appName = 'App',
  userName,
  verificationUrl,
  primaryColor = '#6366f1',
  logoUrl = null
}) {
  return `
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
            background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .content { 
            background: #ffffff; 
            padding: 40px 30px; 
        }
        .content h2 {
            color: #1e293b;
            margin-top: 0;
            font-size: 24px;
        }
        .content p {
            color: #475569;
            font-size: 16px;
            margin: 16px 0;
        }
        .button { 
            display: inline-block; 
            padding: 14px 32px; 
            background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); 
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 24px 0; 
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .button:hover {
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        .link-text {
            word-break: break-all; 
            color: ${primaryColor}; 
            font-size: 14px;
            background: #f1f5f9;
            padding: 12px;
            border-radius: 6px;
            margin: 16px 0;
        }
        .footer { 
            text-align: center; 
            margin-top: 32px; 
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
            color: #64748b; 
            font-size: 12px; 
        }
        .logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 16px;
        }
    </style>
</head>
<body>
    <div class='container'>
        <div class='email-wrapper'>
            <div class='header'>
                ${logoUrl ? `<img src="${logoUrl}" alt="${appName}" class="logo" />` : ''}
                <h1>${appName}</h1>
            </div>
            <div class='content'>
                <h2>Welcome, ${userName || 'there'}!</h2>
                <p>Thank you for signing up for ${appName}. To complete your registration, please verify your email address by clicking the button below:</p>
                <p style='text-align: center;'>
                    <a href='${verificationUrl}' class='button'>Verify Email Address</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p class='link-text'>${verificationUrl}</p>
                <p style='color: #64748b; font-size: 14px;'>This verification link will expire in 24 hours.</p>
                <p style='color: #64748b; font-size: 14px;'>If you didn't create an account with ${appName}, please ignore this email.</p>
            </div>
            <div class='footer'>
                <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
                <p style='font-size: 11px; color: #94a3b8; margin-top: 8px;'>This is an automated email. Please do not reply to this message.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim();
}

/**
 * Generate password reset email HTML
 * @param {Object} options
 * @param {string} options.appName - Name of the application
 * @param {string} options.userName - User's name
 * @param {string} options.resetUrl - Full URL to password reset page with token
 * @param {string} options.primaryColor - Primary color for branding (default: #6366f1)
 * @param {string} options.logoUrl - Optional logo URL
 * @returns {string} HTML email content
 */
export function generatePasswordResetEmail({
  appName = 'App',
  userName,
  resetUrl,
  primaryColor = '#6366f1',
  logoUrl = null
}) {
  return `
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
            background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .content { 
            background: #ffffff; 
            padding: 40px 30px; 
        }
        .content h2 {
            color: #1e293b;
            margin-top: 0;
            font-size: 24px;
        }
        .content p {
            color: #475569;
            font-size: 16px;
            margin: 16px 0;
        }
        .button { 
            display: inline-block; 
            padding: 14px 32px; 
            background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); 
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 24px 0; 
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .link-text {
            word-break: break-all; 
            color: ${primaryColor}; 
            font-size: 14px;
            background: #f1f5f9;
            padding: 12px;
            border-radius: 6px;
            margin: 16px 0;
        }
        .footer { 
            text-align: center; 
            margin-top: 32px; 
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
            color: #64748b; 
            font-size: 12px; 
        }
        .logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 16px;
        }
        .warning {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 12px;
            margin: 16px 0;
            border-radius: 4px;
        }
        .warning p {
            color: #dc2626;
            margin: 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class='container'>
        <div class='email-wrapper'>
            <div class='header'>
                ${logoUrl ? `<img src="${logoUrl}" alt="${appName}" class="logo" />` : ''}
                <h1>${appName}</h1>
            </div>
            <div class='content'>
                <h2>Reset Your Password</h2>
                <p>Hello ${userName || 'there'},</p>
                <p>We received a request to reset your password for your ${appName} account. Click the button below to reset your password:</p>
                <p style='text-align: center;'>
                    <a href='${resetUrl}' class='button'>Reset Password</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p class='link-text'>${resetUrl}</p>
                <div class='warning'>
                    <p><strong>Important:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.</p>
                </div>
            </div>
            <div class='footer'>
                <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
                <p style='font-size: 11px; color: #94a3b8; margin-top: 8px;'>This is an automated email. Please do not reply to this message.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim();
}

/**
 * Generate welcome email HTML (after verification)
 * @param {Object} options
 * @param {string} options.appName - Name of the application
 * @param {string} options.userName - User's name
 * @param {string} options.loginUrl - URL to login page
 * @param {string} options.primaryColor - Primary color for branding (default: #6366f1)
 * @param {string} options.logoUrl - Optional logo URL
 * @returns {string} HTML email content
 */
export function generateWelcomeEmail({
  appName = 'App',
  userName,
  loginUrl,
  primaryColor = '#6366f1',
  logoUrl = null
}) {
  return `
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
            background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .content { 
            background: #ffffff; 
            padding: 40px 30px; 
        }
        .content h2 {
            color: #1e293b;
            margin-top: 0;
            font-size: 24px;
        }
        .content p {
            color: #475569;
            font-size: 16px;
            margin: 16px 0;
        }
        .button { 
            display: inline-block; 
            padding: 14px 32px; 
            background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); 
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 24px 0; 
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .footer { 
            text-align: center; 
            margin-top: 32px; 
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
            color: #64748b; 
            font-size: 12px; 
        }
        .logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 16px;
        }
    </style>
</head>
<body>
    <div class='container'>
        <div class='email-wrapper'>
            <div class='header'>
                ${logoUrl ? `<img src="${logoUrl}" alt="${appName}" class="logo" />` : ''}
                <h1>${appName}</h1>
            </div>
            <div class='content'>
                <h2>Welcome to ${appName}!</h2>
                <p>Hello ${userName || 'there'},</p>
                <p>Your email has been successfully verified! You can now access all features of ${appName}.</p>
                <p style='text-align: center;'>
                    <a href='${loginUrl}' class='button'>Sign In Now</a>
                </p>
                <p>Thank you for joining us. We're excited to have you on board!</p>
            </div>
            <div class='footer'>
                <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim();
}

