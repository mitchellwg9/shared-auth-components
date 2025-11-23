import React, { useState, useEffect } from 'react';
import { User, Lock, Shield, X } from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';

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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || ''
      });
      setTwoFactorEnabled(currentUser.two_factor_enabled || currentUser.twoFactorEnabled || false);
      setTwoFactorSecret(currentUser.two_factor_secret || currentUser.twoFactorSecret || null);
      setActiveTab('profile');
      setShowQRCode(false);
      setVerificationCode('');
      
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

    try {
      setLoading(true);
      const setup = await authAPI.get2FASetup();
      setTwoFactorSecret(setup.secret);
      
      // Generate QR code URL
      const issuer = 'Shared Auth';
      const accountName = currentUser.email || currentUser.name;
      const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${setup.secret}&issuer=${encodeURIComponent(issuer)}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`;
      setQrCodeUrl(qrUrl);
      setShowQRCode(true);
    } catch (error) {
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

    if (verificationCode.length !== 6 || !twoFactorSecret) {
      showToast?.('Please enter a valid 6-digit verification code', 'error');
      return;
    }

    try {
      setLoading(true);
      await authAPI.enable2FA(twoFactorSecret, verificationCode);
      setTwoFactorEnabled(true);
      showToast?.('Two-factor authentication enabled successfully!', 'success');
      setVerificationCode('');
      setShowQRCode(false);
      
      // Update current user
      if (onUserUpdate) {
        onUserUpdate({
          ...currentUser,
          two_factor_enabled: true,
          twoFactorEnabled: true
        });
      }
    } catch (error) {
      showToast?.(error.message || 'Failed to enable 2FA', 'error');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!authAPI || !authAPI.disable2FA) {
      showToast?.('2FA is not available', 'error');
      return;
    }

    const password = prompt('Please enter your password to disable 2FA:');
    if (!password) return;

    try {
      setLoading(true);
      await authAPI.disable2FA(password);
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
    } catch (error) {
      showToast?.(error.message || 'Failed to disable 2FA', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      showToast?.('Name is required', 'error');
      return;
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
      showToast?.('Profile updated successfully!', 'success');
      return;
    }

    try {
      setLoading(true);
      await authAPI.updateProfile(formData.name.trim(), formData.email.trim() || currentUser.email);
      
      if (onUserUpdate) {
        onUserUpdate({
          ...currentUser,
          name: formData.name.trim(),
          email: formData.email.trim() || currentUser.email
        });
      }
      showToast?.('Profile updated successfully!', 'success');
    } catch (error) {
      showToast?.(error.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `rgba(${primaryColorRgb}, 0.1)` }}
              >
                <User className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">My Profile</h3>
                <p className="text-sm text-gray-500">Manage your account settings</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                      style={{ '--tw-ring-color': primaryColor }}
                      placeholder="Enter your email"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                </div>
              </div>

              {/* Password Change */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Change your password to keep your account secure.
                </p>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  Change Password
                </button>
              </div>

              {/* 2FA Section */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Two-Factor Authentication (2FA)
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Add an extra layer of security to your account by requiring a verification code from your mobile device.
                </p>

                {!twoFactorEnabled ? (
                  <div className="space-y-4">
                    {!showQRCode ? (
                      <button
                        onClick={generate2FASecret}
                        disabled={loading || !authAPI}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                      >
                        {loading ? 'Generating...' : 'Enable 2FA'}
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-sm font-medium text-gray-900 mb-2">
                            Scan this QR code with your authenticator app:
                          </p>
                          <div className="flex justify-center mb-4">
                            {qrCodeUrl && (
                              <img src={qrCodeUrl} alt="2FA QR Code" className="border border-gray-300 rounded" />
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
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-900">2FA is enabled</p>
                          <p className="text-xs text-green-700 mt-1">
                            Your account is protected with two-factor authentication
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Active
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={disable2FA}
                      disabled={loading || !authAPI}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {loading ? 'Disabling...' : 'Disable 2FA'}
                    </button>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="px-6 py-2.5 text-white rounded-lg hover:opacity-90 transition-colors font-medium disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        currentUser={currentUser}
        onSave={(updatedUser) => {
          if (onUserUpdate) {
            onUserUpdate(updatedUser);
          }
        }}
        showToast={showToast}
        authAPI={authAPI}
        primaryColor={primaryColor}
      />
    </>
  );
}

