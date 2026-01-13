/**
 * API endpoint constants
 * Centralized location for all API endpoints
 */

// Default API base URL
const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper to safely get environment variable with Jest compatibility
const getApiBaseUrl = () => {
  try {
    // Try to access import.meta.env (Vite environment)
    // Using indirect eval to avoid syntax error in Jest
    const importMeta = new Function(
      'return typeof import !== "undefined" ? import.meta : undefined'
    )();
    if (importMeta && importMeta.env && importMeta.env.VITE_API_BASE_URL) {
      return importMeta.env.VITE_API_BASE_URL;
    }
  } catch (e) {
    // Silent catch - import.meta not available
  }

  // Fallback to process.env for Jest/Node
  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env.VITE_API_BASE_URL
  ) {
    return process.env.VITE_API_BASE_URL;
  }

  return DEFAULT_API_BASE_URL;
};

const API_BASE_URL = getApiBaseUrl();

export const API_URL = API_BASE_URL;

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Checkout & Orders
  CHECKOUT: {
    CREATE_ORDER: "/checkout/create-order",
    PROCESS_PAYMENT: "/checkout/process-payment",
    GET_ORDER: "/checkout/order/:reference",
    ACCEPTANCE_TOKEN: "/checkout/acceptance-token",
  },
  // Products
  PRODUCTS: {
    LIST: "/products",
    DETAIL: "/products/:id",
    SEARCH: "/products?search=:query",
  },
  // Categories
  CATEGORIES: {
    LIST: "/categories",
  },
};

/**
 * Helper function to build full API URL
 * @param {string} endpoint - API endpoint
 * @param {Object} params - URL parameters to replace
 * @returns {string} Full API URL
 */
export const buildApiUrl = (endpoint, params = {}) => {
  let url = `${API_URL}${endpoint}`;

  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, value);
  });

  return url;
};
