import React, { useState, useEffect, useRef } from 'react';
import { Settings, Shield, Eye, EyeOff, X, ChevronDown } from 'lucide-react';
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
  // Appearance settings (initial values)
  darkMode = false,
  onToggleDarkMode,
  theme = 'default',
  onThemeChange,
  dateFormat = 'dd/mm/yyyy',
  onDateFormatChange,
  // Custom appearance options (for app-specific customization)
  customAppearanceOptions = []
}) {
  // Local state for settings (only saved when "Save Settings" is clicked)
  const [localDarkMode, setLocalDarkMode] = useState(darkMode !== undefined ? darkMode : false);
  const [localTheme, setLocalTheme] = useState(theme || 'default');
  const [localDateFormat, setLocalDateFormat] = useState(dateFormat || 'dd/mm/yyyy');
  const [isSaving, setIsSaving] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const themeDropdownRef = useRef(null);

  // Update local state when props change (when modal opens with new values)
  useEffect(() => {
    if (isOpen) {
      setLocalDarkMode(darkMode !== undefined ? darkMode : false);
      setLocalTheme(theme || 'default');
      setLocalDateFormat(dateFormat || 'dd/mm/yyyy');
    }
  }, [isOpen, darkMode, theme, dateFormat]);

  // Close theme dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target)) {
        setThemeDropdownOpen(false);
      }
    };

    if (themeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [themeDropdownOpen]);

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

  // Handle save - save all settings to database
  const handleSave = async () => {
    if (!authAPI || !authAPI.updateUserSettings) {
      showToast?.('Error: API not configured', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // Save to database
      console.log('Saving settings:', {
        darkMode: localDarkMode,
        theme: localTheme,
        dateFormat: localDateFormat
      });
      const response = await authAPI.updateUserSettings({
        darkMode: localDarkMode,
        theme: localTheme,
        dateFormat: localDateFormat
      });
      console.log('Settings save response:', response);

      // Update parent component state and apply changes
      // Apply dark mode to document immediately
      if (localDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Update parent state (callbacks will update parent's state)
      if (onToggleDarkMode && localDarkMode !== darkMode) {
        onToggleDarkMode();
      }
      if (onThemeChange && localTheme !== theme) {
        onThemeChange(localTheme);
      }
      if (onDateFormatChange && localDateFormat !== dateFormat) {
        onDateFormatChange(localDateFormat);
      }

      showToast?.('Settings saved successfully!', 'success');
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
      showToast?.('Failed to save settings. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

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
        <div className={`rounded-lg max-w-2xl w-full mx-auto max-h-[85vh] overflow-y-auto shadow-xl ${localDarkMode ? 'bg-gray-800' : 'bg-white'}`} style={{ maxWidth: '42rem', width: 'calc(100% - 2rem)' }}>
        {/* Header */}
        <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between ${localDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `rgba(${primaryColorRgb}, 0.1)` }}
            >
              <Settings className="w-5 h-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${localDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Settings</h3>
              <p className={`text-sm ${localDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage your application settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              localDarkMode 
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
            <div className={`flex items-center justify-between p-3 ${localDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
              <div>
                <h4 className={`font-medium text-sm ${localDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Dark Mode</h4>
                <p className={`text-xs ${localDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Switch between light and dark themes</p>
              </div>
              <button
                type="button"
                onClick={() => setLocalDarkMode(!localDarkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  localDarkMode ? 'bg-blue-600 focus:ring-blue-500' : 'bg-gray-200 focus:ring-gray-400'
                }`}
                style={{ 
                  minWidth: '2.75rem',
                  minHeight: '1.5rem'
                }}
                aria-label={localDarkMode ? 'Disable dark mode' : 'Enable dark mode'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    localDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                  style={{ 
                    minWidth: '1rem',
                    minHeight: '1rem'
                  }}
                />
              </button>
            </div>

            {/* Color Theme */}
            <div className={`p-3 ${localDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-medium text-sm ${localDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Color Theme</h4>
                  <p className={`text-xs ${localDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Choose a color theme for your boards</p>
                </div>
                <div className="relative w-48" ref={themeDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:border-transparent flex items-center justify-between ${
                      localDarkMode 
                        ? 'bg-gray-600 border-gray-500 text-gray-200 focus:ring-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                    }`}
                    style={{ '--tw-ring-color': primaryColor }}
                  >
                    <div className="flex items-center gap-2">
                      {(() => {
                        const selectedTheme = themes.find(t => t.id === localTheme);
                        if (selectedTheme) {
                          return (
                            <>
                              <div 
                                className="w-5 h-5 rounded border-2 flex-shrink-0"
                                style={{ 
                                  backgroundColor: selectedTheme.colors.column,
                                  borderColor: localDarkMode ? '#6B7280' : '#9CA3AF'
                                }}
                              />
                              <span>{selectedTheme.name}</span>
                            </>
                          );
                        }
                        return <span>Select theme</span>;
                      })()}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${themeDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {themeDropdownOpen && (
                    <div className={`absolute z-50 w-full mt-1 border rounded-lg shadow-lg ${
                      localDarkMode 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {themes.map((themeOption) => {
                        const isSelected = localTheme === themeOption.id;
                        return (
                          <button
                            key={themeOption.id}
                            type="button"
                            onClick={() => {
                              setLocalTheme(themeOption.id);
                              setThemeDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-opacity-50 transition-colors ${
                              isSelected
                                ? localDarkMode ? 'bg-blue-600 bg-opacity-30' : 'bg-blue-50'
                                : localDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'
                            } ${localDarkMode ? 'text-gray-200' : 'text-gray-900'}`}
                          >
                            <div 
                              className="w-5 h-5 rounded border-2 flex-shrink-0"
                              style={{ 
                                backgroundColor: themeOption.colors.column,
                                borderColor: localDarkMode ? '#6B7280' : '#9CA3AF'
                              }}
                            />
                            <span>{themeOption.name}</span>
                            {isSelected && (
                              <span className="ml-auto text-blue-500">✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Date Format */}
            <div className={`p-3 ${localDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-medium text-sm ${localDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Date Format</h4>
                  <p className={`text-xs ${localDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Choose how dates are displayed throughout the app</p>
                </div>
                <select
                  value={localDateFormat}
                  onChange={(e) => setLocalDateFormat(e.target.value)}
                  className={`px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:border-transparent w-48 ${
                    localDarkMode 
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
                  <div key={index} className={`p-3 ${localDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                    {option.render ? option.render() : (
                      <div>
                        <h4 className={`font-medium text-sm ${localDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{option.label}</h4>
                        {option.description && (
                          <p className={`text-xs ${localDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{option.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Save Button */}
            <div className={`flex gap-2 pt-4 border-t ${localDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: primaryColor }}
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                onClick={onClose}
                disabled={isSaving}
                className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  localDarkMode 
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
