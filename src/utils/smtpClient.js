/**
 * SMTP Client for Node.js
 * Simple SMTP client for sending emails from backend services
 * 
 * Usage:
 * import { createSMTPClient } from '@wayne/shared-auth/utils/smtpClient';
 * 
 * const smtp = createSMTPClient({
 *   host: 'mail.example.com',
 *   port: 465,
 *   secure: true, // true for 465, false for other ports
 *   auth: {
 *     user: 'noreply@example.com',
 *     pass: 'password'
 *   }
 * });
 * 
 * await smtp.sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Test Email',
 *   html: '<h1>Hello</h1>',
 *   from: 'noreply@example.com'
 * });
 */

/**
 * Create an SMTP client instance
 * @param {Object} config - SMTP configuration
 * @param {string} config.host - SMTP server host
 * @param {number} config.port - SMTP server port (465 for SSL, 587 for TLS)
 * @param {boolean} config.secure - Use SSL (true for port 465, false for port 587)
 * @param {Object} config.auth - Authentication credentials
 * @param {string} config.auth.user - SMTP username
 * @param {string} config.auth.pass - SMTP password
 * @param {string} [config.from] - Default from email address
 * @param {string} [config.fromName] - Default from name
 * @returns {Promise<Object>} SMTP client instance
 */
export async function createSMTPClient(config) {
  // Check if we're in a Node.js environment
  if (typeof window !== 'undefined') {
    throw new Error('SMTP client can only be used in Node.js environment. Use email templates in the frontend and send via your backend API.');
  }

  // Try to use nodemailer if available
  // Note: nodemailer must be installed separately: npm install nodemailer
  // This is a dynamic import that only loads when the function is called
  let nodemailer;
  try {
    // Use dynamic import - this will only work in Node.js environments
    // In browser environments, this will fail gracefully
    const nodemailerModule = await import('nodemailer');
    nodemailer = nodemailerModule.default || nodemailerModule;
  } catch (e) {
    // nodemailer not available - provide helpful error
    if (typeof window !== 'undefined') {
      throw new Error(
        'SMTP client can only be used in Node.js backend environments, not in the browser.'
      );
    }
    throw new Error(
      'nodemailer is required for SMTP functionality. Install it with: npm install nodemailer\n' +
      'The SMTP client is designed for Node.js backend use only.'
    );
  }

  const {
    host,
    port,
    secure = port === 465,
    auth,
    from = auth?.user,
    fromName = null
  } = config;

  if (!host || !port || !auth?.user || !auth?.pass) {
    throw new Error('SMTP configuration is incomplete. Required: host, port, auth.user, auth.pass');
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure, // true for 465, false for other ports
    auth: {
      user: auth.user,
      pass: auth.pass
    }
  });

  return {
    /**
     * Send an email
     * @param {Object} options
     * @param {string|string[]} options.to - Recipient email address(es)
     * @param {string} options.subject - Email subject
     * @param {string} [options.html] - HTML email body
     * @param {string} [options.text] - Plain text email body
     * @param {string} [options.from] - Sender email (overrides default)
     * @param {string} [options.fromName] - Sender name (overrides default)
     * @param {string} [options.replyTo] - Reply-to email address
     * @returns {Promise<Object>} Send result
     */
    async sendEmail({
      to,
      subject,
      html,
      text,
      from: customFrom,
      fromName: customFromName,
      replyTo
    }) {
      const fromAddress = customFrom || from;
      const fromDisplay = customFromName || fromName;
      const fromString = fromDisplay 
        ? `${fromDisplay} <${fromAddress}>`
        : fromAddress;

      const mailOptions = {
        from: fromString,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text: text || (html ? html.replace(/<[^>]*>/g, '') : undefined),
        ...(replyTo && { replyTo })
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        return {
          success: true,
          messageId: info.messageId,
          response: info.response
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          code: error.code
        };
      }
    },

    /**
     * Verify SMTP connection
     * @returns {Promise<boolean>} True if connection is valid
     */
    async verify() {
      try {
        await transporter.verify();
        return true;
      } catch (error) {
        console.error('SMTP verification failed:', error);
        return false;
      }
    }
  };
}

/**
 * Create SMTP client from environment variables
 * Looks for: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_FROM_NAME
 * @returns {Promise<Object>} SMTP client instance
 */
export async function createSMTPClientFromEnv() {
  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE !== 'false' && (process.env.SMTP_PORT === '465' || process.env.SMTP_SECURE === 'true'),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    from: process.env.SMTP_FROM,
    fromName: process.env.SMTP_FROM_NAME
  };

  return await createSMTPClient(config);
}

