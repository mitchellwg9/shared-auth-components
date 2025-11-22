// Main entry point for the package
export { LoginScreen } from './components/LoginScreen';
export { SignupModal } from './components/SignupModal';
export { EmailVerificationPage } from './components/EmailVerificationPage';
export { createAuthAPI } from './utils/authAPI';
export { useAuth } from './hooks/useAuth';

// Export email utilities
export { 
  generateVerificationEmail, 
  generatePasswordResetEmail, 
  generateWelcomeEmail 
} from './utils/emailTemplates';

export { 
  createSMTPClient, 
  createSMTPClientFromEnv 
} from './utils/smtpClient';

// Export theme for programmatic use
export { theme, stylePaths } from './styles';

