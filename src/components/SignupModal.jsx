import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { createAuthAPI } from '../utils/authAPI';

/**
 * SignupModal - Configurable user registration modal
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onSignup - Callback when signup succeeds (receives user object)
 * @param {Function} props.showToast - Optional toast notification function
 * @param {Function} props.onSwitchToLogin - Optional callback to switch to login
 * @param {string} props.apiBaseUrl - Base URL for API (required)
 * @param {string} props.appName - App name for branding (default: "App")
 * @param {string} props.primaryColor - Primary color for buttons (default: "#6366f1")
 * @param {Object} props.customStyles - Optional custom CSS classes
 * @param {Function} props.validatePassword - Optional custom password validation function
 */
export function SignupModal({ 
  isOpen, 
  onClose, 
  onSignup, 
  showToast, 
  onSwitchToLogin,
  apiBaseUrl,
  appName = "App",
  primaryColor = "#6366f1",
  customStyles = {},
  validatePassword = null
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Create API client
  const authAPI = React.useMemo(() => {
    if (!apiBaseUrl) {
      console.error('SignupModal: apiBaseUrl is required');
      return null;
    }
    return createAuthAPI(apiBaseUrl);
  }, [apiBaseUrl]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      setErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      newErrors.name = 'Name is required';
    } else {
      // Validate full name: at least 2 characters, a space, then at least 2 more characters
      const fullNamePattern = /^.{2,}\s.{2,}$/;
      if (!fullNamePattern.test(trimmedName)) {
        newErrors.name = 'Please enter your full name (first name and last name)';
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      if (validatePassword) {
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
          newErrors.password = passwordError;
        }
      } else {
        // Default validation: at least 6 characters
        if (formData.password.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        }
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to handle registration errors
  const handleRegistrationError = (errorMessage) => {
    const isEmailExists = errorMessage.toLowerCase().includes('email already exists') || 
                         errorMessage.toLowerCase().includes('already registered') ||
                         errorMessage.toLowerCase().includes('already exists');
    
    if (isEmailExists) {
      // Set error on email field
      setErrors({
        email: 'This email is already registered. Please use a different email or sign in instead.',
        submit: 'This email is already registered. Please use a different email or sign in instead.'
      });
      // Show toast message
      if (showToast) {
        showToast('This email is already registered. Please use a different email or sign in instead.', 'error');
      }
    } else {
      // Other errors
      setErrors({ submit: errorMessage });
      if (showToast) {
        showToast(errorMessage, 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!authAPI) {
      if (showToast) {
        showToast('API configuration error. Please contact support.', 'error');
      }
      return;
    }
    
    if (!validate()) {
      // Show first validation error to user
      const firstError = Object.values(errors)[0];
      if (firstError && showToast) {
        showToast(firstError, 'error');
      }
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'user'
      });

      // The register endpoint returns the user object directly (not wrapped in {success: true})
      // Check if we have a user ID or email to determine success
      if (response.id || response.email || (response.success !== false && !response.error)) {
        if (showToast) {
          showToast('Account created! Please check your email to verify your account.', 'success');
        }
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        setErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);
        
        // Call onSignup callback if provided
        if (onSignup) {
          await onSignup(response.user || response || { email: formData.email });
        }
        
        // Close modal
        if (onClose) {
          onClose();
        }
      } else {
        const errorMsg = response.error || 'Failed to create account. Please try again.';
        handleRegistrationError(errorMsg);
      }
    } catch (error) {
      const errorMsg = error.message || error.details?.error || 'Failed to create account. Please try again.';
      handleRegistrationError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-2xl w-full max-w-md mx-auto shadow-2xl ${customStyles.container || ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Create Account</h2>
            <p className="text-xs text-gray-500 mt-1">Sign up to get started with {appName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full pl-12 pr-4 py-3.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-12 pr-4 py-3.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-12 pr-10 py-3.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full pl-12 pr-10 py-3.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4" role="alert">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 text-sm" style={{ fontWeight: 400 }}>{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          {/* Login Link */}
          {onSwitchToLogin && (
            <div className="text-center pt-2">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToLogin();
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}


