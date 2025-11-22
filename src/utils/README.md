# Email Utilities

This package includes email templates and SMTP client utilities for sending authentication-related emails.

## Email Templates

Generate HTML email templates for your authentication flow:

```javascript
import { 
  generateVerificationEmail, 
  generatePasswordResetEmail, 
  generateWelcomeEmail 
} from '@wayne/shared-auth';

// Verification email
const html = generateVerificationEmail({
  appName: 'My App',
  userName: 'John Doe',
  verificationUrl: 'https://myapp.com/verify?token=abc123',
  primaryColor: '#6366f1',
  logoUrl: 'https://myapp.com/logo.png' // optional
});

// Password reset email
const resetHtml = generatePasswordResetEmail({
  appName: 'My App',
  userName: 'John Doe',
  resetUrl: 'https://myapp.com/reset-password?token=xyz789',
  primaryColor: '#6366f1'
});

// Welcome email (after verification)
const welcomeHtml = generateWelcomeEmail({
  appName: 'My App',
  userName: 'John Doe',
  loginUrl: 'https://myapp.com/login',
  primaryColor: '#6366f1'
});
```

## SMTP Client (Node.js Backend)

For backend services, use the SMTP client to send emails:

### Installation

```bash
npm install nodemailer
```

### Usage

```javascript
import { createSMTPClient } from '@wayne/shared-auth/utils/smtpClient';
import { generateVerificationEmail } from '@wayne/shared-auth';

// Create SMTP client
const smtp = createSMTPClient({
  host: 'mail.example.com',
  port: 465,
  secure: true, // true for 465, false for 587
  auth: {
    user: 'noreply@example.com',
    pass: 'your-password'
  },
  from: 'noreply@example.com',
  fromName: 'My App'
});

// Generate email HTML
const html = generateVerificationEmail({
  appName: 'My App',
  userName: 'John Doe',
  verificationUrl: 'https://myapp.com/verify?token=abc123'
});

// Send email
const result = await smtp.sendEmail({
  to: 'user@example.com',
  subject: 'Verify Your Email',
  html: html
});

if (result.success) {
  console.log('Email sent:', result.messageId);
} else {
  console.error('Email failed:', result.error);
}
```

### Using Environment Variables

```javascript
import { createSMTPClientFromEnv } from '@wayne/shared-auth/utils/smtpClient';

// Reads from environment variables:
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_FROM_NAME
const smtp = createSMTPClientFromEnv();
```

### Environment Variables

```env
SMTP_HOST=mail.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@example.com
SMTP_PASS=your-password
SMTP_FROM=noreply@example.com
SMTP_FROM_NAME=My App
```

## Integration Example

### Backend API Route (Node.js/Express)

```javascript
import express from 'express';
import { createSMTPClient } from '@wayne/shared-auth/utils/smtpClient';
import { generateVerificationEmail } from '@wayne/shared-auth';

const router = express.Router();
const smtp = createSMTPClient({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

router.post('/auth/register', async (req, res) => {
  // ... create user and generate token ...
  
  // Generate verification email
  const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;
  const emailHtml = generateVerificationEmail({
    appName: 'My App',
    userName: user.name,
    verificationUrl,
    primaryColor: '#6366f1'
  });

  // Send email
  const emailResult = await smtp.sendEmail({
    to: user.email,
    subject: 'Verify Your Email Address',
    html: emailHtml
  });

  if (!emailResult.success) {
    console.error('Failed to send verification email:', emailResult.error);
  }

  res.json({ success: true, user });
});
```

## Customization

All email templates support:
- Custom app name
- Custom primary color for branding
- Optional logo URL
- Custom user name
- Custom URLs

The templates use the design system colors and styling for consistency.

