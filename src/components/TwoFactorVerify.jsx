import React, { useState } from 'react';
import { Shield, X } from 'lucide-react';
import { createAuthAPI } from '../utils/authAPI';

/**
 * TwoFactorVerify - Component for verifying 2FA code during login
 * 
 * @param {Object} props
 * @param {string} props.email - User's email address
 * @param {Function} props.onVerify - Callback when verification succeeds (receives user object)
 * @param {Function} props.onCancel - Optional callback to cancel 2FA verification
 * @param {Function} props.showToast - Optional toast notification function
 * @param {string} props.apiBaseUrl - Base URL for API (required)
 * @param {string} props.appName - App name for branding (default: "App")
 */
export function TwoFactorVerify({
  email,
  onVerify,
  onCancel,
  showToast,
  apiBaseUrl,
  appName = "App"
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Create API client
  const authAPI = React.useMemo(() => {
    if (!apiBaseUrl) {
      console.error('TwoFactorVerify: apiBaseUrl is required');
      return null;
    }
    return createAuthAPI(apiBaseUrl);
  }, [apiBaseUrl]);

  const handleVerify = async () => {
    if (!code.trim()) {
      setError('Please enter your 2FA code');
      return;
    }

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const user = await authAPI.verify2FA(email, code);
      
      // Store user in localStorage
      try {
        localStorage.setItem('currentUser', JSON.stringify(user));
      } catch (e) {
        console.error('Failed to store user in localStorage:', e);
      }

      if (onVerify) {
        await onVerify(user);
      }
      
      setCode('');
      setError('');
    } catch (err) {
      const errorMessage = err.details?.error || err.message || 'Invalid code. Please try again.';
      setError(errorMessage);
      if (showToast) {
        showToast(errorMessage, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleVerify();
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-500 mt-1">Enter your 6-digit code</p>
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              onKeyPress={handleKeyPress}
              placeholder="000000"
              maxLength={6}
              className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest font-mono"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border-2 border-red-300 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={isLoading || code.length !== 6}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>

          <p className="text-xs text-center text-gray-500">
            Don't have access to your authenticator? Use a backup code instead.
          </p>
        </div>
      </div>
    </div>
  );
}

