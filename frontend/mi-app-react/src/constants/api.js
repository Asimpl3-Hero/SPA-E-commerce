/**
 * API endpoint constants
 * Centralized location for all API endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4567/api';
const API_VERSION = 'v1';

export const API_URL = `${API_BASE_URL}/${API_VERSION}`;

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Products
  PRODUCTS: {
    LIST: '/products',
    DETAIL: '/products/:id',
    SEARCH: '/products/search',
    FEATURED: '/products/featured',
    RELATED: '/products/:id/related',
    REVIEWS: '/products/:id/reviews',
  },

  // Categories
  CATEGORIES: {
    LIST: '/categories',
    DETAIL: '/categories/:id',
    PRODUCTS: '/categories/:id/products',
  },

  // Orders (Guest Checkout)
  ORDERS: {
    CREATE: '/orders',
    DETAIL: '/orders/:id',
    TRACK: '/orders/:id/tracking',
  },

  // Payment
  PAYMENT: {
    CREATE_INTENT: '/payment/create-intent',
    CONFIRM: '/payment/confirm',
    METHODS: '/payment/methods',
  },

  // Shipping
  SHIPPING: {
    CALCULATE: '/shipping/calculate',
    METHODS: '/shipping/methods',
    TRACK: '/shipping/track/:trackingNumber',
  },

  // Search
  SEARCH: {
    PRODUCTS: '/search/products',
    SUGGESTIONS: '/search/suggestions',
  },

  // Newsletter
  NEWSLETTER: {
    SUBSCRIBE: '/newsletter/subscribe',
    UNSUBSCRIBE: '/newsletter/unsubscribe',
  },

  // Contact
  CONTACT: {
    SUBMIT: '/contact',
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

/**
 * HTTP Methods
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

/**
 * API Request Headers
 */
export const API_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  ACCEPT: 'Accept',
};

/**
 * Content Types
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
};

/**
 * API Response Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * API Error Messages
 */
export const API_ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT: 'Request timeout. Please try again.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

/**
 * API Timeout (milliseconds)
 */
export const API_TIMEOUT = 30000; // 30 seconds

/**
 * Retry Configuration
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  RETRY_STATUS_CODES: [408, 429, 500, 502, 503, 504],
};
