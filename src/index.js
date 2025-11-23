// Main entry point for the package
export { LoginScreen } from './components/LoginScreen';
export { SignupModal } from './components/SignupModal';
export { EmailVerificationPage } from './components/EmailVerificationPage';
export { TwoFactorVerify } from './components/TwoFactorVerify';
export { SystemOwnerPanel } from './components/SystemOwnerPanel';
export { UserProfileDropdown } from './components/UserProfileDropdown';
export { UserProfileModal } from './components/UserProfileModal';
export { UserSettingsModal } from './components/UserSettingsModal';
export { ChangePasswordModal } from './components/ChangePasswordModal';
export { createAuthAPI } from './utils/authAPI';
export { createOwnerAPI } from './utils/ownerAPI';
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

