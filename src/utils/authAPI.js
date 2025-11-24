/**
 * Configurable Authentication API Client
 * Creates an API client with a configurable base URL
 */

import { getCurrentUserId, createApiRequest } from './apiHelpers';

/**
 * Create an authentication API client
 * @param {string} apiBaseUrl - Base URL for the API (e.g., 'https://api.yourapp.com')
 * @returns {Object} API client with login, register, verifyEmail, and resendVerification methods
 */
export function createAuthAPI(apiBaseUrl) {
  if (!apiBaseUrl) {
    throw new Error('API base URL is required');
  }

  // Remove trailing slash if present
  const baseUrl = apiBaseUrl.replace(/\/$/, '');

  // Create API request helper
  const apiRequest = createApiRequest(baseUrl);

  return {
    login: async (email, password) => {
      return apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
    },

    register: async (userData) => {
      return apiRequest('/auth/register', {
        method: 'POST',
        body: userData,
      });
    },

    resendVerification: async (email) => {
      return apiRequest('/auth/resend-verification', {
        method: 'POST',
        body: { email },
      });
    },

    verifyEmail: async (token) => {
      return apiRequest(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
        method: 'GET',
      });
    },

    // 2FA methods
    verify2FA: async (email, code) => {
      return apiRequest('/auth/two-factor/verify', {
        method: 'POST',
        body: { email, code },
      });
    },

    get2FASetup: async () => {
      return apiRequest('/auth/two-factor/setup', {
        method: 'GET',
      });
    },

    enable2FA: async (secret, code) => {
      return apiRequest('/auth/two-factor/setup', {
        method: 'POST',
        body: { secret, code },
      });
    },

    get2FAStatus: async () => {
      return apiRequest('/auth/two-factor/status', {
        method: 'GET',
      });
    },

    disable2FA: async (password = '') => {
      // Password is optional (like StickeeBoard) - just disable 2FA directly
      return apiRequest('/auth/two-factor/disable', {
        method: 'POST',
        body: { password },
      });
    },

    // Profile management
    updateProfile: async (name, email) => {
      return apiRequest('/auth/profile', {
        method: 'PUT',
        body: { name, email },
      });
    },

    changePassword: async (currentPassword, newPassword) => {
      return apiRequest('/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      });
    },

    // User settings
    getUserSettings: async () => {
      return apiRequest('/user-settings', {
        method: 'GET',
      });
    },

    updateUserSettings: async (settings) => {
      return apiRequest('/user-settings', {
        method: 'PUT',
        body: settings,
      });
    },
  };
}

