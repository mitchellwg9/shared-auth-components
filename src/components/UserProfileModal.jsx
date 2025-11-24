import React, { useState, useEffect } from 'react';
import { User, Lock, Shield, X, Eye, EyeOff } from 'lucide-react';

/**
 * UserProfileModal - Shared component for editing user profile
 * Standard across all apps with Profile and Security tabs
 */
export function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  showToast,
  authAPI,
  primaryColor = "#6366f1"
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      const is2FAEnabled = currentUser.two_factor_enabled || currentUser.twoFactorEnabled || false;
      
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        newPassword: '',
        confirmPassword: ''
      });
      setTwoFactorEnabled(is2FAEnabled);
      
      // Only reset secret and QR code if 2FA is already enabled
      // If 2FA is not enabled, preserve the setup state (secret, QR code, etc.)
      if (is2FAEnabled) {
        setTwoFactorSecret(currentUser.two_factor_secret || currentUser.twoFactorSecret || null);
        setShowQRCode(false);
        setVerificationCode('');
      } else {
        // If 2FA is not enabled, only reset if we're not in the middle of setup
        // Check if we have a secret in state - if not, it's safe to reset
        // This prevents resetting during active setup
        if (!twoFactorSecret && !showQRCode) {
          setTwoFactorSecret(null);
          setShowQRCode(false);
          setVerificationCode('');
        }
        // If we have a secret or showQRCode is true, preserve the setup state
      }
      
      setPasswordErrors({});
      
      // Load 2FA status if API is available
      if (authAPI && authAPI.get2FAStatus) {
        load2FAStatus();
      }
    }
  }, [isOpen, currentUser, authAPI]);

  const load2FAStatus = async () => {
    try {
      const status = await authAPI.get2FAStatus();
      setTwoFactorEnabled(status.enabled || false);
    } catch (error) {
      console.error('Failed to load 2FA status:', error);
    }
  };

  const generate2FASecret = async () => {
    if (!authAPI || !authAPI.get2FASetup) {
      showToast?.('2FA setup is not available', 'error');
      return;
    }

    // Check if user is logged in
    if (!currentUser || !currentUser.id) {
      console.error('2FA Setup - No current user or user ID:', currentUser);
      showToast?.('You must be logged in to enable 2FA', 'error');
      return;
    }

    // Check localStorage for user ID
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('2FA Setup - Current user from localStorage:', { id: user.id, user_id: user.user_id, email: user.email });
      } else {
        console.warn('2FA Setup - No user in localStorage');
      }
    } catch (e) {
      console.error('2FA Setup - Failed to read localStorage:', e);
    }

    try {
      setLoading(true);
      console.log('2FA Setup - Calling get2FASetup API...');
      const setup = await authAPI.get2FASetup();
      
      console.log('2FA Setup - API response:', setup);
      
      if (!setup) {
        console.error('2FA Setup - No response from API');
        showToast?.('Failed to generate 2FA secret: No response from server', 'error');
        return;
      }
      
      if (setup.error) {
        console.error('2FA Setup - API error:', setup.error);
        showToast?.(setup.error || 'Failed to generate 2FA secret', 'error');
        return;
      }
      
      if (!setup.secret) {
        console.error('2FA Setup - No secret in response:', setup);
        showToast?.('Failed to generate 2FA secret: Invalid response', 'error');
        return;
      }
      
      console.log('2FA Secret generated:', setup.secret.substring(0, 8) + '...');
      
      // Set secret first, then generate QR code
      setTwoFactorSecret(setup.secret);
      
      // Generate QR code URL with proper encoding for Google Authenticator
      const issuer = 'Shared Auth';
      const accountName = currentUser.email || currentUser.name;
      // Use proper TOTP URL format that Google Authenticator can scan
      // Format: otpauth://totp/ISSUER:ACCOUNT?secret=SECRET&issuer=ISSUER
      const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${setup.secret}&issuer=${encodeURIComponent(issuer)}`;
      // Use QR Server API (same as TymTrackr) - more reliable
      // Use 250x250 size to fit better in modal
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(otpAuthUrl)}&ecc=M`;
      setQrCodeUrl(qrUrl);
      setShowQRCode(true);
      
      console.log('2FA Setup state - Secret set:', !!setup.secret, 'QR Code shown:', true);
    } catch (error) {
      console.error('2FA Secret generation error:', error);
      console.error('2FA Secret generation error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      showToast?.(error.message || 'Failed to generate 2FA secret', 'error');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable2FA = async () => {
    if (!authAPI || !authAPI.enable2FA) {
      showToast?.('2FA setup is not available', 'error');
      return;
    }

    // Clean the code - remove any spaces, dashes, or other non-digit characters
    const cleanCode = verificationCode.replace(/[^0-9]/g, '');
    
    if (cleanCode.length !== 6) {
      showToast?.('Please enter a valid 6-digit verification code', 'error');
      return;
    }
    
    if (!twoFactorSecret) {
      showToast?.('2FA secret is missing. Please click "Enable 2FA" again to generate a new secret.', 'error');
      // Reset to allow user to start over
      setShowQRCode(false);
      setTwoFactorSecret(null);
      setQrCodeUrl('');
      return;
    }

    console.log('2FA Verification - Code:', cleanCode, 'Secret:', twoFactorSecret.substring(0, 8) + '...');

    try {
      setLoading(true);
      const response = await authAPI.enable2FA(twoFactorSecret, cleanCode);
      
      console.log('2FA Enable response:', response);
      
      if (response && response.success) {
        setTwoFactorEnabled(true);
        showToast?.('Two-factor authentication enabled successfully!', 'success');
        setVerificationCode('');
        setShowQRCode(false);
        
        // Update current user
        if (onUserUpdate) {
          onUserUpdate({
            ...currentUser,
            two_factor_enabled: true,
            twoFactorEnabled: true,
            two_factor_secret: twoFactorSecret,
            twoFactorSecret: twoFactorSecret
          });
        }
        
        // Also update localStorage
        try {
          const userStr = localStorage.getItem('currentUser');
          if (userStr) {
            const user = JSON.parse(userStr);
            user.two_factor_enabled = true;
            user.twoFactorEnabled = true;
            user.two_factor_secret = twoFactorSecret;
            user.twoFactorSecret = twoFactorSecret;
            localStorage.setItem('currentUser', JSON.stringify(user));
          }
        } catch (e) {
          console.error('Failed to update localStorage:', e);
        }
      } else {
        const errorMsg = response?.error || response?.message || 'Failed to enable 2FA';
        console.error('2FA Enable failed:', errorMsg, response);
        showToast?.(errorMsg, 'error');
      }
    } catch (error) {
      console.error('2FA enable error:', error);
      showToast?.(error.message || 'Failed to enable 2FA', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!authAPI || !authAPI.disable2FA) {
      showToast?.('2FA is not available', 'error');
      return;
    }

    try {
      setLoading(true);
      // Disable 2FA without requiring password (like StickeeBoard)
      await authAPI.disable2FA('');
      setTwoFactorEnabled(false);
      setTwoFactorSecret(null);
      showToast?.('Two-factor authentication disabled', 'success');
      
      // Update current user
      if (onUserUpdate) {
        onUserUpdate({
          ...currentUser,
          two_factor_enabled: false,
          twoFactorEnabled: false
        });
      }
      
      // Also update localStorage
      try {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.two_factor_enabled = false;
          user.twoFactorEnabled = false;
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
      } catch (e) {
        console.error('Failed to update localStorage:', e);
      }
    } catch (error) {
      showToast?.(error.message || 'Failed to disable 2FA', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = () => {
    const errors = {};
    
    // Only validate if user is trying to change password (newPassword is filled)
    if (!formData.newPassword && !formData.confirmPassword) {
      // No password change attempted
      return true;
    }
    
    if (!formData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    // Only change password if new password is provided
    if (!formData.newPassword && !formData.confirmPassword) {
      return true; // No password change requested, return success
    }
    
    if (!validatePassword()) {
      return false; // Validation failed
    }

    if (!authAPI || !authAPI.changePassword) {
      showToast?.('Password change is not available', 'error');
      return false;
    }
    
    // Change password without requiring current password
    // Use empty string for current password - API allows this
    try {
      const response = await authAPI.changePassword('', formData.newPassword);
      if (response && response.success) {
        // Don't show toast here - will be shown by save handler
        setFormData({ ...formData, newPassword: '', confirmPassword: '' });
        setPasswordErrors({});
        return true;
      } else {
        showToast?.(response?.message || 'Failed to change password', 'error');
        return false;
      }
    } catch (error) {
      showToast?.(error.message || 'Failed to change password', 'error');
      return false;
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      showToast?.('Name is required', 'error');
      throw new Error('Name is required');
    }

    if (!authAPI || !authAPI.updateProfile) {
      // Fallback: just update local state
      if (onUserUpdate) {
        onUserUpdate({
          ...currentUser,
          name: formData.name.trim(),
          email: formData.email.trim() || currentUser.email
        });
      }
      // Don't show toast here - will be shown by save handler
      return;
    }

    try {
      await authAPI.updateProfile(formData.name.trim(), formData.email.trim() || currentUser.email);
      
      if (onUserUpdate) {
        onUserUpdate({
          ...currentUser,
          name: formData.name.trim(),
          email: formData.email.trim() || currentUser.email
        });
      }
      // Don't show toast here - will be shown by save handler
    } catch (error) {
      showToast?.(error.message || 'Failed to update profile', 'error');
      throw error;
    }
  };

  if (!isOpen) return null;

  // Convert hex color to RGB for opacity
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgb = hexToRgb(primaryColor);
  const primaryColorRgb = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '99, 102, 241';

  return (
    <>
      {/* Main Profile Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-lg max-w-2xl w-full mx-auto my-4 shadow-xl flex flex-col" style={{ maxWidth: '42rem', width: 'calc(100% - 2rem)', maxHeight: '90vh' }}>
          {/* Header - Fixed at top */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `rgba(${primaryColorRgb}, 0.1)` }}
              >
                <User className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">My Profile</h3>
                <p className="text-xs text-gray-500">Manage your account settings</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6" style={{ minHeight: 0, maxHeight: 'calc(90vh - 180px)', WebkitOverflowScrolling: 'touch' }}>
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Personal Information</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      style={{ '--tw-ring-color': primaryColor }}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                      style={{ '--tw-ring-color': primaryColor }}
                      placeholder="Enter your email"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  
                  {/* Password Change - Inline */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={formData.newPassword}
                        onChange={(e) => {
                          setFormData({ ...formData, newPassword: e.target.value });
                          if (passwordErrors.newPassword) {
                            setPasswordErrors({ ...passwordErrors, newPassword: '' });
                          }
                        }}
                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                          passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        style={{ '--tw-ring-color': primaryColor }}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => {
                          setFormData({ ...formData, confirmPassword: e.target.value });
                          if (passwordErrors.confirmPassword) {
                            setPasswordErrors({ ...passwordErrors, confirmPassword: '' });
                          }
                          // Clear error if passwords now match
                          if (e.target.value === formData.newPassword && passwordErrors.confirmPassword) {
                            setPasswordErrors({ ...passwordErrors, confirmPassword: '' });
                          }
                        }}
                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                          passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        style={{ '--tw-ring-color': primaryColor }}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 2FA Section */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div 
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-300"
                  style={{ backgroundColor: '#F3F4F6' }}
                >
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Two-Factor Authentication (2FA)
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {twoFactorEnabled || showQRCode 
                        ? 'Protect your account with an extra layer of security' 
                        : 'Enable 2FA to protect your account'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (twoFactorEnabled) {
                        handleDisable2FA();
                      } else if (!showQRCode) {
                        generate2FASecret();
                      }
                    }}
                    disabled={loading || !authAPI || showQRCode}
                    className={`relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 border-2 ${
                      (twoFactorEnabled || showQRCode)
                        ? 'focus:ring-blue-500' 
                        : 'focus:ring-gray-400'
                    } ${showQRCode ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ 
                      width: '2.75rem',
                      height: '1.5rem',
                      minWidth: '2.75rem',
                      minHeight: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      position: 'relative',
                      backgroundColor: (twoFactorEnabled || showQRCode) ? '#2563EB' : '#6B7280',
                      borderColor: (twoFactorEnabled || showQRCode) ? '#1D4ED8' : '#4B5563'
                    }}
                    aria-label={twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                  >
                    <span
                      className={`inline-block rounded-full bg-white transition-transform shadow-md absolute ${
                        (twoFactorEnabled || showQRCode) ? 'translate-x-6' : 'translate-x-1'
                      }`}
                      style={{ 
                        width: '1rem',
                        height: '1rem',
                        minWidth: '1rem',
                        minHeight: '1rem',
                        left: '0.25rem',
                        border: '1px solid rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </button>
                </div>

                {showQRCode && (
                  <div className="space-y-4 mt-4">
                    <div className="rounded-lg p-4 border border-gray-200" style={{ backgroundColor: '#F3F4F6' }}>
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Scan this QR code with your authenticator app:
                      </p>
                      <div className="flex justify-center mb-4">
                        {qrCodeUrl ? (
                          <img 
                            src={qrCodeUrl} 
                            alt="2FA QR Code" 
                            className="border border-gray-300 rounded max-w-full h-auto"
                            style={{ maxWidth: '250px', width: '100%' }}
                            onError={(e) => {
                              console.error('QR code image failed to load:', qrCodeUrl);
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-[250px] h-[250px] border border-gray-300 rounded flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                            <p className="text-gray-500 text-sm">Loading QR code...</p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-4">
                        Use apps like Google Authenticator, Microsoft Authenticator, or Authy
                      </p>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enter verification code:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-lg font-mono tracking-widest"
                            style={{ '--tw-ring-color': primaryColor }}
                            maxLength={6}
                          />
                          <button
                            onClick={verifyAndEnable2FA}
                            disabled={verificationCode.length !== 6 || loading}
                            className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors font-medium disabled:opacity-50"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {loading ? 'Verifying...' : 'Verify'}
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowQRCode(false);
                          setTwoFactorSecret(null);
                          setQrCodeUrl('');
                          setVerificationCode('');
                        }}
                        className="mt-2 text-sm text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

          </div>
          
          {/* Footer - Fixed at bottom */}
          <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-white">
            <div className="flex gap-2">
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      // Save profile first
                      await handleSaveProfile();
                      // Then change password if new password is provided
                      let passwordSuccess = true;
                      const hasPasswordChange = formData.newPassword && formData.newPassword.trim();
                      if (hasPasswordChange) {
                        passwordSuccess = await handleChangePassword();
                      }
                      
                      // Only show one success message and close if both operations succeeded
                      if (passwordSuccess) {
                        showToast?.('Changes saved successfully!', 'success');
                        // Small delay to show success message
                        setTimeout(() => {
                          onClose();
                        }, 300);
                      }
                    } catch (error) {
                      console.error('Save error:', error);
                      showToast?.(error.message || 'Failed to save changes', 'error');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors font-medium disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}

