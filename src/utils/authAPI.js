/**
 * Configurable Authentication API Client
 * Creates an API client with a configurable base URL
 */

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

  // Get current user ID from localStorage (set on login)
  function getCurrentUserId() {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user?.id || null;
      }
    } catch (e) {
      // Ignore errors
    }
    return null;
  }

  // Helper function to make API requests
  async function apiRequest(endpoint, options = {}) {
    const currentUserId = getCurrentUserId();
    let url = `${baseUrl}${endpoint}`;
    
    // For GET requests, append current_user_id to query string
    if ((!options.method || options.method === 'GET') && currentUserId) {
      const separator = endpoint.includes('?') ? '&' : '?';
      url = `${baseUrl}${endpoint}${separator}current_user_id=${encodeURIComponent(currentUserId)}`;
    }
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add current_user_id to request body for POST/PUT/DELETE requests
    if (config.body && typeof config.body === 'object') {
      if (currentUserId && (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE')) {
        config.body.current_user_id = currentUserId;
      }
      config.body = JSON.stringify(config.body);
    } else if (currentUserId && (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE')) {
      // If body is not an object, create one
      config.body = JSON.stringify({ current_user_id: currentUserId, ...(typeof config.body === 'string' ? JSON.parse(config.body) : {}) });
    }

    try {
      const response = await fetch(url, config);
      
      // Get response text first to handle both JSON and non-JSON responses
      const text = await response.text();
      let data;
      
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        // If response is not JSON, create an error object
        console.error('Non-JSON response:', text);
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 200)}`);
      }

      if (!response.ok) {
        const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`;
        const fullError = new Error(errorMessage);
        fullError.status = response.status;
        fullError.details = data;
        throw fullError;
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      if (error.message) {
        console.error('Error message:', error.message);
      }
      if (error.details) {
        console.error('Error details:', error.details);
      }
      throw error;
    }
  }

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

    disable2FA: async (password) => {
      return apiRequest('/auth/two-factor/disable', {
        method: 'POST',
        body: { password },
      });
    },
  };
}

