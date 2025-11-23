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
  const [activeSection, setActiveSection] = useState('appearance');

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
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-xl">
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

        {/* Content */}
        <div className="p-6">
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              {/* Dark Mode */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-gray-900 mb-1">Dark Mode</h4>
                  <p className="text-xs text-gray-500">Switch between light and dark themes</p>
                </div>
                {onToggleDarkMode && (
                  <button
                    onClick={onToggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      darkMode ? 'bg-blue-600 focus:ring-blue-500' : 'bg-gray-300 focus:ring-gray-400'
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

              {/* Color Theme */}
              {onThemeChange && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-sm text-gray-900 mb-2">Color Theme</h4>
                  <p className="text-xs text-gray-500 mb-4">Choose a color theme for your app</p>
                  <div className="grid grid-cols-4 gap-3">
                    {themes.map((themeOption) => {
                      const isSelected = theme === themeOption.id;
                      return (
                        <button
                          key={themeOption.id}
                          onClick={() => onThemeChange(themeOption.id)}
                          className={`p-4 rounded-lg border-2 transition-all text-center ${
                            isSelected 
                              ? 'border-blue-600 ring-2 ring-blue-600/50 shadow-md' 
                              : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
                          }`}
                          style={{
                            backgroundColor: themeOption.colors.background,
                          }}
                        >
                          <div className="flex items-center justify-center mb-2">
                            <div 
                              className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: themeOption.colors.primary }}
                            />
                          </div>
                          <div className="text-xs font-medium text-gray-900">
                            {themeOption.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Date Format */}
              {onDateFormatChange && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-sm text-gray-900 mb-2">Date Format</h4>
                  <p className="text-xs text-gray-500 mb-3">Choose how dates are displayed throughout the app</p>
                  <select
                    value={dateFormat}
                    onChange={(e) => onDateFormatChange(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ '--tw-ring-color': primaryColor }}
                  >
                    <option value="dd/mm/yyyy">DD/MM/YYYY (25/12/2024)</option>
                    <option value="mm/dd/yyyy">MM/DD/YYYY (12/25/2024)</option>
                    <option value="yyyy-mm-dd">YYYY-MM-DD (2024-12-25)</option>
                    <option value="dd-mmm-yyyy">DD-MMM-YYYY (25-Dec-2024)</option>
                  </select>
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

