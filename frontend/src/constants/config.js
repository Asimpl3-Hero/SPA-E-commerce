/**
 * Application configuration constants
 * Centralized location for all app configuration
 */

/**
 * Environment
 * Note: Lazy evaluation for Jest compatibility
 */
const getEnvMode = () => {
  // Check if we're in a browser/Vite environment
  if (typeof window !== 'undefined' && window.import && window.import.meta) {
    return window.import.meta.env?.MODE || 'production';
  }
  // Fallback for Jest/Node environment
  return process.env.NODE_ENV || 'test';
};

export const ENV = {
  get NODE_ENV() { return getEnvMode(); },
  get IS_DEV() { return getEnvMode() === 'development'; },
  get IS_PROD() { return getEnvMode() === 'production'; },
  get IS_TEST() { return getEnvMode() === 'test'; },
};

/**
 * Shipping Methods
 */
export const SHIPPING_METHODS = {
  STANDARD: { id: 'standard', name: 'Standard Shipping', days: '5-7', cost: 10 },
  EXPRESS: { id: 'express', name: 'Express Shipping', days: '2-3', cost: 20 },
  OVERNIGHT: { id: 'overnight', name: 'Overnight Shipping', days: '1', cost: 35 },
};

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  CART: 'cart',
  CHECKOUT_DATA: 'checkout_data',
  ORDER_ID: 'last_order_id',
};

/**
 * Validation Rules (for checkout forms)
 */
export const VALIDATION_RULES = {
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PHONE: {
    PATTERN: /^\d{10}$/,
  },
  ZIP_CODE: {
    PATTERN: /^\d{5}(-\d{4})?$/,
  },
};

/**
 * Wompi Configuration
 */
const getWompiPublicKey = () => {
  try {
    const importMeta = new Function('return typeof import !== "undefined" ? import.meta : undefined')();
    if (importMeta && importMeta.env && importMeta.env.VITE_WOMPI_PUBLIC_KEY) {
      return importMeta.env.VITE_WOMPI_PUBLIC_KEY;
    }
  } catch (e) {
    // Silent catch
  }

  if (typeof process !== 'undefined' && process.env && process.env.VITE_WOMPI_PUBLIC_KEY) {
    return process.env.VITE_WOMPI_PUBLIC_KEY;
  }

  return import.meta.env.VITE_WOMPI_PUBLIC_KEY;
};

const getWompiScriptUrl = () => {
  try {
    const importMeta = new Function('return typeof import !== "undefined" ? import.meta : undefined')();
    if (importMeta && importMeta.env && importMeta.env.VITE_WOMPI_SCRIPT_URL) {
      return importMeta.env.VITE_WOMPI_SCRIPT_URL;
    }
  } catch (e) {
    // Silent catch
  }

  if (typeof process !== 'undefined' && process.env && process.env.VITE_WOMPI_SCRIPT_URL) {
    return process.env.VITE_WOMPI_SCRIPT_URL;
  }

  return import.meta.env.VITE_WOMPI_SCRIPT_URL;
};

export const WOMPI_CONFIG = {
  PUBLIC_KEY: getWompiPublicKey(),
  SCRIPT_URL: getWompiScriptUrl(),
  CURRENCY: 'COP',
};
