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
  // Default values if not provided
  const currentDarkMode = darkMode !== undefined ? darkMode : false;
  const currentTheme = theme || 'default';
  const currentDateFormat = dateFormat || 'dd/mm/yyyy';

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
    {
      id: 'sapphire',
      name: 'Sapphire',
      colors: {
        background: '#EFF6FF',
        column: '#DBEAFE',
        taskCard: '#FFFFFF',
        text: '#1E3A8A',
        textSecondary: '#475569',
      },
    },
    {
      id: 'emerald',
      name: 'Emerald',
      colors: {
        background: '#ECFDF5',
        column: '#D1FAE5',
        taskCard: '#FFFFFF',
        text: '#064E3B',
        textSecondary: '#475569',
      },
    },
    {
      id: 'amethyst',
      name: 'Amethyst',
      colors: {
        background: '#F5F3FF',
        column: '#EDE9FE',
        taskCard: '#FFFFFF',
        text: '#4C1D95',
        textSecondary: '#6B7280',
      },
    },
    {
      id: 'rose',
      name: 'Rose',
      colors: {
        background: '#FFF1F2',
        column: '#FEE2E2',
        taskCard: '#FFFFFF',
        text: '#881337',
        textSecondary: '#6B7280',
      },
    },
    {
      id: 'amber',
      name: 'Amber',
      colors: {
        background: '#FFFBEB',
        column: '#FEF3C7',
        taskCard: '#FFFFFF',
        text: '#78350F',
        textSecondary: '#6B7280',
      },
    },
    {
      id: 'cyan',
      name: 'Cyan',
      colors: {
        background: '#ECFEFF',
        column: '#CFFAFE',
        taskCard: '#FFFFFF',
        text: '#164E63',
        textSecondary: '#475569',
      },
    },
    {
      id: 'indigo',
      name: 'Indigo',
      colors: {
        background: '#EEF2FF',
        column: '#E0E7FF',
        taskCard: '#FFFFFF',
        text: '#312E81',
        textSecondary: '#475569',
      },
    },
  ];

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className={`rounded-lg max-w-2xl w-full mx-auto max-h-[85vh] overflow-y-auto shadow-xl ${currentDarkMode ? 'bg-gray-800' : 'bg-white'}`} style={{ maxWidth: '42rem', width: 'calc(100% - 2rem)' }}>
        {/* Header */}
        <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between ${currentDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `rgba(${primaryColorRgb}, 0.1)` }}
            >
              <Settings className="w-5 h-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${currentDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Settings</h3>
              <p className={`text-sm ${currentDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage your application settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              currentDarkMode 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Dark Mode */}
            <div className={`flex items-center justify-between p-3 ${currentDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
              <div>
                <h4 className={`font-medium text-sm ${currentDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Dark Mode</h4>
                <p className={`text-xs ${currentDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Switch between light and dark themes</p>
              </div>
              <button
                type="button"
                onClick={onToggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  currentDarkMode ? 'bg-blue-600 focus:ring-blue-500' : 'bg-gray-200 focus:ring-gray-400'
                }`}
                style={{ minWidth: '2.75rem', minHeight: '1.5rem' }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    currentDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                  style={{ minWidth: '1rem', minHeight: '1rem' }}
                />
              </button>
            </div>

            {/* Color Theme */}
            <div className={`p-3 ${currentDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
              <div className="mb-3">
                <h4 className={`font-medium text-sm mb-1 ${currentDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Color Theme</h4>
                <p className={`text-xs mb-3 ${currentDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Choose a color theme for your boards</p>
                <div className="grid grid-cols-3 gap-2">
                  {themes.map((themeOption) => {
                    const isSelected = currentTheme === themeOption.id;
                    const themeColors = themeOption.colors;
                    return (
                      <button
                        key={themeOption.id}
                        onClick={() => {
                          if (onThemeChange) {
                            onThemeChange(themeOption.id);
                          }
                        }}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          isSelected 
                            ? `${currentDarkMode ? 'border-blue-500' : 'border-blue-600'} ring-2 ${currentDarkMode ? 'ring-blue-500/50' : 'ring-blue-600/50'}` 
                            : `${currentDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'}`
                        }`}
                        style={{
                          ...(typeof themeColors.column === 'string' && themeColors.column.startsWith('linear-gradient')
                            ? { background: themeColors.column }
                            : { backgroundColor: themeColors.column }),
                          color: themeColors.text,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-400"
                            style={
                              typeof themeColors.background === 'string' && themeColors.background.startsWith('linear-gradient')
                                ? { background: themeColors.background }
                                : { backgroundColor: themeColors.background }
                            }
                          />
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-400"
                            style={
                              typeof themeColors.column === 'string' && themeColors.column.startsWith('linear-gradient')
                                ? { background: themeColors.column }
                                : { backgroundColor: themeColors.column }
                            }
                          />
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-400"
                            style={
                              typeof themeColors.taskCard === 'string' && themeColors.taskCard.startsWith('linear-gradient')
                                ? { background: themeColors.taskCard }
                                : { backgroundColor: themeColors.taskCard }
                            }
                          />
                        </div>
                        <div className="text-xs font-medium" style={{ color: themeColors.text }}>
                          {themeOption.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Date Format */}
            <div className={`p-3 ${currentDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-medium text-sm ${currentDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Date Format</h4>
                  <p className={`text-xs ${currentDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Choose how dates are displayed throughout the app</p>
                </div>
                <select
                  value={currentDateFormat}
                  onChange={(e) => {
                    if (onDateFormatChange) {
                      onDateFormatChange(e.target.value);
                    }
                  }}
                  className={`px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:border-transparent w-48 ${
                    currentDarkMode 
                      ? 'bg-gray-600 border-gray-500 text-gray-200 focus:ring-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                  }`}
                  style={{ '--tw-ring-color': primaryColor }}
                >
                  <option value="dd/mm/yyyy">DD/MM/YYYY (25/12/2024)</option>
                  <option value="mm/dd/yyyy">MM/DD/YYYY (12/25/2024)</option>
                  <option value="yyyy-mm-dd">YYYY-MM-DD (2024-12-25)</option>
                  <option value="dd-mmm-yyyy">DD-MMM-YYYY (25-Dec-2024)</option>
                </select>
              </div>
            </div>

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

            {/* Save Button */}
            <div className={`flex gap-2 pt-4 border-t ${currentDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => {
                  showToast?.('Settings saved successfully!', 'success');
                  onClose();
                }}
                className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors font-medium"
                style={{ backgroundColor: primaryColor }}
              >
                Save Settings
              </button>
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentDarkMode 
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

