import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, X } from 'lucide-react';
import { createAuthAPI } from '../utils/authAPI';

/**
 * LoginScreen - Configurable login component with email verification support
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open (if used as modal)
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onLogin - Callback when login succeeds (receives user object)
 * @param {Function} props.showToast - Optional toast notification function
 * @param {Function} props.onSwitchToSignup - Optional callback to switch to signup
 * @param {string} props.apiBaseUrl - Base URL for API (required)
 * @param {string} props.appName - App name for branding (default: "App")
 * @param {string} props.primaryColor - Primary color for buttons (default: "#6366f1")
 * @param {string} props.logo - Optional logo URL
 * @param {Object} props.customStyles - Optional custom CSS classes
 */
export function LoginScreen({ 
  isOpen, 
  onClose, 
  onLogin, 
  showToast, 
  onSwitchToSignup,
  apiBaseUrl,
  appName = "App",
  primaryColor = "#6366f1",
  logo = null,
  customStyles = {}
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  // Create API client
  const authAPI = React.useMemo(() => {
    if (!apiBaseUrl) {
      console.error('LoginScreen: apiBaseUrl is required');
      return null;
    }
    return createAuthAPI(apiBaseUrl);
  }, [apiBaseUrl]);

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResendVerification = async () => {
    if (!authAPI) return;
    
    const emailToUse = verificationEmail || email;
    if (!emailToUse || isResendingVerification) return;
    
    setIsResendingVerification(true);
    try {
      await authAPI.resendVerification(emailToUse);
      if (showToast) {
        showToast('Verification email sent! Please check your inbox.', 'success');
      }
      setError('');
      setErrorType('');
      setVerificationEmail('');
    } catch (err) {
      const errorMsg = err.message || 'Failed to resend verification email';
      if (showToast) {
        showToast(errorMsg, 'error');
      }
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleLogin = async () => {
    if (!authAPI) {
      setError('API configuration error. Please contact support.');
      return;
    }

    if (isLoading) return;
    
    // Validate email format
    if (!email.trim()) {
      setError('Email address is required');
      setErrorType('validation');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      setErrorType('validation');
      return;
    }
    
    if (!password.trim()) {
      setError('Password is required');
      setErrorType('validation');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setErrorType('');
    setVerificationEmail('');
    
    try {
      const response = await authAPI.login(email, password);
      
      if (response.success && response.user) {
        const user = response.user;
        // Store user in localStorage
        try {
          localStorage.setItem('currentUser', JSON.stringify(user));
        } catch (e) {
          console.error('Failed to store user in localStorage:', e);
        }
        
        if (onLogin) {
          await onLogin(user);
        }
        setError('');
        setErrorType('');
        setEmail('');
        setPassword('');
        setVerificationEmail('');
      } else {
        const errorMsg = response.error || 'Invalid credentials';
        setError(errorMsg);
        setErrorType(response.error_type || '');
        if (response.error_type === 'email_not_verified' && response.email) {
          setVerificationEmail(response.email);
        }
        if (showToast) {
          showToast(errorMsg, 'error');
        }
      }
    } catch (err) {
      // Handle specific error types from API
      if (err.details) {
        const errorType = err.details.error_type || '';
        const errorMessage = err.details.error || err.message;
        
        setError(errorMessage);
        setErrorType(errorType);
        
        // If email not verified, store the email for resend functionality
        if (errorType === 'email_not_verified' && err.details.email) {
          setVerificationEmail(err.details.email);
        }
        
        if (showToast) {
          showToast(errorMessage, 'error');
        }
      } else {
        const errorMessage = err.message || 'Invalid credentials. Please check your email and password.';
        setError(errorMessage);
        setErrorType('');
        if (showToast) {
          showToast(errorMessage, 'error');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) handleLogin();
  };

  // If used as a modal (isOpen prop is provided)
  if (isOpen !== undefined) {
    // If modal is closed, don't render anything
    if (!isOpen) return null;
    
    // Render modal when open
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className={`bg-white rounded-2xl w-full max-w-md mx-auto shadow-2xl ${customStyles.container || ''}`}>
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
              <p className="text-sm text-gray-500 mt-1">Welcome back to {appName}</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) {
                        setError('');
                        setErrorType('');
                        setVerificationEmail('');
                      }
                    }}
                    onKeyDown={handleKeyPress}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) {
                        setError('');
                        setErrorType('');
                        setVerificationEmail('');
                      }
                    }}
                    onKeyDown={handleKeyPress}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {error && error.trim() !== '' && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4" role="alert">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-red-700 text-sm" style={{ fontWeight: 400 }}>{error}</p>
                      {errorType === 'email_not_verified' && (
                        <div className="mt-2">
                          <button
                            onClick={handleResendVerification}
                            disabled={isResendingVerification}
                            className="text-sm text-blue-600 hover:text-blue-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ fontWeight: 400 }}
                          >
                            {isResendingVerification ? 'Sending...' : 'Click here to request a new verification email'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="pt-4">
                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
              {onSwitchToSignup && (
                <div className="text-center pt-2">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        if (onClose) onClose();
                        onSwitchToSignup();
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                      style={{ color: primaryColor }}
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If used as a full page (isOpen prop is NOT provided)
  // Only render full page if isOpen is explicitly undefined (not provided)
  // This allows the component to be used as a standalone login page
  if (isOpen === undefined) {
    return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl w-full max-w-md mx-auto shadow-2xl ${customStyles.container || ''}`}>
        <div className="p-8">
          {logo && (
            <div className="text-center mb-6">
              <img src={logo} alt={appName} className="h-16 mx-auto mb-4" />
            </div>
          )}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">{appName}</h1>
            <p className="text-gray-600 mt-2">Sign in to continue</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) {
                    setError('');
                    setErrorType('');
                    setVerificationEmail('');
                  }
                }}
                onKeyDown={handleKeyPress}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ '--tw-ring-color': primaryColor }}
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) {
                    setError('');
                    setErrorType('');
                    setVerificationEmail('');
                  }
                }}
                onKeyDown={handleKeyPress}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ '--tw-ring-color': primaryColor }}
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>
            {error && error.trim() !== '' && (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4" role="alert">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-red-700 text-sm" style={{ fontWeight: 400 }}>{error}</p>
                    {errorType === 'email_not_verified' && (
                      <div className="mt-2">
                        <button
                          onClick={handleResendVerification}
                          disabled={isResendingVerification}
                          className="text-sm text-blue-600 hover:text-blue-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ fontWeight: 400 }}
                        >
                          {isResendingVerification ? 'Sending...' : 'Click here to request a new verification email'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full px-6 py-3 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd)`,
                fontWeight: 500
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
            {onSwitchToSignup && (
              <div className="text-center pt-2">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={onSwitchToSignup}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                    style={{ color: primaryColor }}
                  >
                    Sign up
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    );
  }

  // If isOpen was provided but we got here, something went wrong
  // Don't render anything (this shouldn't happen, but safety check)
  return null;
}

