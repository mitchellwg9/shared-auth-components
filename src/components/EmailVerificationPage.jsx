import React, { useState, useEffect } from 'react';
import { createAuthAPI } from '../utils/authAPI';

/**
 * EmailVerificationPage - Configurable email verification page
 * 
 * @param {Object} props
 * @param {string} props.token - Verification token from URL
 * @param {Function} props.onVerificationComplete - Callback when verification completes (for redirect)
 * @param {Function} props.showToast - Optional toast notification function
 * @param {string} props.apiBaseUrl - Base URL for API (required)
 * @param {string} props.appName - App name for branding (default: "App")
 * @param {string} props.primaryColor - Primary color for buttons (default: "#6366f1")
 * @param {Object} props.customStyles - Optional custom CSS classes
 */
export function EmailVerificationPage({ 
  token, 
  onVerificationComplete, 
  showToast,
  apiBaseUrl,
  appName = "App",
  primaryColor = "#6366f1",
  customStyles = {}
}) {
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error', 'already_verified'
  const [message, setMessage] = useState('');

  // Create API client
  const authAPI = React.useMemo(() => {
    if (!apiBaseUrl) {
      console.error('EmailVerificationPage: apiBaseUrl is required');
      return null;
    }
    return createAuthAPI(apiBaseUrl);
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    if (!authAPI) {
      setStatus('error');
      setMessage('API configuration error. Please contact support.');
      return;
    }

    verifyEmail(token);
  }, [token, authAPI]);

  const verifyEmail = async (verificationToken) => {
    try {
      setStatus('verifying');
      const response = await authAPI.verifyEmail(verificationToken);
      
      if (response.success) {
        if (response.already_verified) {
          setStatus('already_verified');
          setMessage('Your email address is already verified. You can now log in.');
        } else {
          setStatus('success');
          setMessage('Your email address has been verified successfully! You can now log in.');
        }
        
        if (showToast) {
          showToast(response.message || 'Email verified successfully!', 'success');
        }
        
        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          if (onVerificationComplete) {
            onVerificationComplete();
          }
        }, 3000);
      }
    } catch (error) {
      setStatus('error');
      const errorMsg = error.message || error.details?.error || 'Failed to verify email address';
      setMessage(errorMsg);
      
      if (showToast) {
        showToast(errorMsg, 'error');
      }
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 ${customStyles.container || ''}`}>
      <div className={`bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md w-full border border-white/20 ${customStyles.content || ''}`}>
        {status === 'verifying' && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Verifying Email</h2>
            <p className="text-white/80">Please wait while we verify your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="inline-block bg-green-500 rounded-full p-3 mb-4">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
            <p className="text-white/80 mb-4">{message}</p>
            <p className="text-white/60 text-sm">Redirecting to login...</p>
          </div>
        )}

        {status === 'already_verified' && (
          <div className="text-center">
            <div className="inline-block bg-blue-500 rounded-full p-3 mb-4">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Already Verified</h2>
            <p className="text-white/80 mb-4">{message}</p>
            <p className="text-white/60 text-sm">Redirecting to login...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="inline-block bg-red-500 rounded-full p-3 mb-4">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
            <p className="text-white/80 mb-4">{message}</p>
            <p className="text-white/60 text-sm mb-4">
              If your verification link has expired, please request a new one from the login screen.
            </p>
            <button
              onClick={() => {
                if (onVerificationComplete) {
                  onVerificationComplete();
                }
              }}
              className="w-full text-white font-medium py-2 px-4 rounded-lg transition-colors"
              style={{ 
                background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd)`,
                fontWeight: 500
              }}
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

