/**
 * Shared API helper functions
 * Used by both authAPI and ownerAPI to avoid code duplication
 */

/**
 * Get current user ID from localStorage
 * @returns {string|null} User ID or null if not found
 */
export function getCurrentUserId() {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user?.id || user?.user_id || null;
    }
  } catch (e) {
    // Ignore errors
  }
  return null;
}

/**
 * Get current user object from localStorage
 * @returns {Object|null} User object or null if not found
 */
export function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (e) {
    // Ignore errors
  }
  return null;
}

/**
 * Create an API request helper function
 * @param {string} baseUrl - Base URL for the API
 * @returns {Function} apiRequest function
 */
export function createApiRequest(baseUrl) {
  return async function apiRequest(endpoint, options = {}) {
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
      // Re-throw the error (let the caller handle logging if needed)
      throw error;
    }
  };
}

