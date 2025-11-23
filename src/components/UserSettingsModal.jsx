import React, { useState, useEffect } from 'react';
import { Settings, Shield, Eye, EyeOff, X } from 'lucide-react';
import { TwoFactorVerify } from './TwoFactorVerify';

/**
 * UserSettingsModal - Shared component for user settings
 * Always includes Security and Appearance sections
 */
export function UserSettingsModal({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  showToast,
  authAPI,
  primaryColor = "#6366f1",
  // Appearance settings
  darkMode = false,
  onToggleDarkMode,
  theme = 'default',
  onThemeChange,
  dateFormat = 'dd/mm/yyyy',
  onDateFormatChange,
  // Custom appearance options (for app-specific customization)
  customAppearanceOptions = []
}) {
  const [activeSection, setActiveSection] = useState('security');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      setTwoFactorEnabled(currentUser.two_factor_enabled || currentUser.twoFactorEnabled || false);
      setActiveSection('security');
      
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

  const themes = [
    { id: 'default', name: 'Default', colors: { primary: '#6366f1', background: '#ffffff', text: '#1f2937' } },
    { id: 'blue', name: 'Blue', colors: { primary: '#3b82f6', background: '#ffffff', text: '#1f2937' } },
    { id: 'green', name: 'Green', colors: { primary: '#10b981', background: '#ffffff', text: '#1f2937' } },
    { id: 'purple', name: 'Purple', colors: { primary: '#8b5cf6', background: '#ffffff', text: '#1f2937' } },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `rgba(${primaryColorRgb}, 0.1)` }}
            >
              <Settings className="w-5 h-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Settings</h3>
              <p className="text-sm text-gray-500">Manage your application settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveSection('security')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeSection === 'security'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeSection === 'security' ? { color: primaryColor, borderBottomColor: primaryColor } : {}}
            >
              Security
            </button>
            <button
              onClick={() => setActiveSection('appearance')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeSection === 'appearance'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeSection === 'appearance' ? { color: primaryColor, borderBottomColor: primaryColor } : {}}
            >
              Appearance
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeSection === 'security' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Two-Factor Authentication (2FA)
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Add an extra layer of security to your account by requiring a verification code from your mobile device.
                </p>

                {!twoFactorEnabled ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-4">
                      2FA is currently disabled. To enable it, go to your Profile settings.
                    </p>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors font-medium"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Go to Profile
                    </button>
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
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <div className={`flex items-center justify-between p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                <div>
                  <h4 className={`font-medium text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Dark Mode</h4>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Switch between light and dark themes</p>
                </div>
                {onToggleDarkMode && (
                  <button
                    onClick={onToggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      darkMode ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                )}
              </div>

              {onThemeChange && (
                <div className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                  <div className="mb-3">
                    <h4 className={`font-medium text-sm mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Color Theme</h4>
                    <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Choose a color theme for your app</p>
                    <div className="grid grid-cols-2 gap-2">
                      {themes.map((themeOption) => {
                        const isSelected = theme === themeOption.id;
                        return (
                          <button
                            key={themeOption.id}
                            onClick={() => onThemeChange(themeOption.id)}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              isSelected 
                                ? `${darkMode ? 'border-blue-500' : 'border-blue-600'} ring-2 ${darkMode ? 'ring-blue-500/50' : 'ring-blue-600/50'}` 
                                : `${darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'}`
                            }`}
                            style={{
                              backgroundColor: themeOption.colors.background,
                              color: themeOption.colors.text,
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-400"
                                style={{ backgroundColor: themeOption.colors.primary }}
                              />
                            </div>
                            <div className="text-xs font-medium">
                              {themeOption.name}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {onDateFormatChange && (
                <div className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-medium text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Date Format</h4>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Choose how dates are displayed</p>
                    </div>
                    <select
                      value={dateFormat}
                      onChange={(e) => onDateFormatChange(e.target.value)}
                      className={`px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      <option value="dd/mm/yyyy">DD/MM/YYYY (25/12/2024)</option>
                      <option value="mm/dd/yyyy">MM/DD/YYYY (12/25/2024)</option>
                      <option value="yyyy-mm-dd">YYYY-MM-DD (2024-12-25)</option>
                      <option value="dd-mmm-yyyy">DD-MMM-YYYY (25-Dec-2024)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Custom appearance options */}
              {customAppearanceOptions.length > 0 && (
                <div className="space-y-4">
                  {customAppearanceOptions.map((option, index) => (
                    <div key={index} className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                      {option.render ? option.render() : (
                        <div>
                          <h4 className={`font-medium text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{option.label}</h4>
                          {option.description && (
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{option.description}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

