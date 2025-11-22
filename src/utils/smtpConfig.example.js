/**
 * SMTP Configuration Example
 * Copy this file to smtpConfig.js and fill in your credentials
 * smtpConfig.js is in .gitignore and will not be committed
 * 
 * For data-q.org (Afrihost):
 * - Host: mail.data-q.org
 * - Port: 465
 * - Secure: true (SSL)
 * - User: noreply@data-q.org
 * - Password: (your password)
 */

export const smtpConfig = {
  host: 'mail.data-q.org',
  port: 465,
  secure: true, // SSL for port 465
  auth: {
    user: 'noreply@data-q.org',
    pass: 'your-password-here'
  },
  from: 'noreply@data-q.org',
  fromName: 'Data-Q App' // Optional: customize the sender name
};

// Usage:
// import { createSMTPClient } from '@wayne/shared-auth/utils/smtpClient';
// import { smtpConfig } from './smtpConfig.js';
// 
// const smtp = await createSMTPClient(smtpConfig);

