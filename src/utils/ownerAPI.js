/**
 * Configurable Owner API Client
 * Creates an API client for system owner endpoints with a configurable base URL
 */

import { createApiRequest } from './apiHelpers';

/**
 * Create an owner API client
 * @param {string} apiBaseUrl - Base URL for the API (e.g., 'https://api.yourapp.com')
 * @returns {Object} API client with owner management methods
 */
export function createOwnerAPI(apiBaseUrl) {
  if (!apiBaseUrl) {
    throw new Error('API base URL is required');
  }

  // Remove trailing slash if present
  const baseUrl = apiBaseUrl.replace(/\/$/, '');

  // Create API request helper
  const apiRequest = createApiRequest(baseUrl);

  return {
    getOrganizations: async () => {
      return apiRequest('/owner/organizations');
    },

    getUsers: async () => {
      return apiRequest('/owner/users');
    },

    getAnalytics: async () => {
      return apiRequest('/owner/analytics');
    },

    getSubscriptions: async () => {
      return apiRequest('/owner/subscriptions');
    },

    createOrganization: async (orgData) => {
      return apiRequest('/owner/organizations', {
        method: 'POST',
        body: orgData,
      });
    },

    updateOrganization: async (id, orgData) => {
      return apiRequest(`/owner/organizations/${id}`, {
        method: 'PUT',
        body: orgData,
      });
    },

    deleteOrganization: async (id) => {
      return apiRequest(`/owner/organizations/${id}`, {
        method: 'DELETE',
      });
    },

    updateSubscription: async (subscriptionData) => {
      return apiRequest('/owner/update-subscription', {
        method: 'POST',
        body: subscriptionData,
      });
    },
  };
}

