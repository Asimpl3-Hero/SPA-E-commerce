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
 * Application Information
 */
export const APP_INFO = {
  NAME: 'E-Commerce Store',
  VERSION: '1.0.0',
  DESCRIPTION: 'Modern e-commerce application built with React',
  AUTHOR: 'Your Company',
  EMAIL: 'support@example.com',
  PHONE: '(555) 123-4567',
};

/**
 * Business Rules
 */
export const BUSINESS_RULES = {
  FREE_SHIPPING_THRESHOLD: 250,
  TAX_RATE: 0.1, // 10%
  DEFAULT_SHIPPING_COST: 10,
  MIN_ORDER_AMOUNT: 1,
  MAX_CART_ITEMS: 99,
  MAX_QUANTITY_PER_ITEM: 10,
};

/**
 * Pagination Configuration
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 12,
  PAGE_SIZE_OPTIONS: [12, 24, 36, 48],
  MAX_PAGE_SIZE: 100,
};

/**
 * Sort Options
 */
export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
  { value: 'newest', label: 'Newest First' },
  { value: 'rating', label: 'Highest Rated' },
];

/**
 * Product Categories
 */
export const PRODUCT_CATEGORIES = [
  { id: 'electronics', name: 'Electronics', icon: 'monitor' },
  { id: 'fashion', name: 'Fashion', icon: 'shirt' },
  { id: 'home', name: 'Home & Garden', icon: 'home' },
  { id: 'sports', name: 'Sports & Outdoors', icon: 'dumbbell' },
  { id: 'books', name: 'Books', icon: 'book' },
  { id: 'toys', name: 'Toys & Games', icon: 'gamepad' },
  { id: 'beauty', name: 'Beauty & Personal Care', icon: 'sparkles' },
  { id: 'automotive', name: 'Automotive', icon: 'car' },
];

/**
 * Price Ranges for Filtering
 */
export const PRICE_RANGES = [
  { id: '0-50', label: 'Under $50', min: 0, max: 50 },
  { id: '50-100', label: '$50 - $100', min: 50, max: 100 },
  { id: '100-200', label: '$100 - $200', min: 100, max: 200 },
  { id: '200-500', label: '$200 - $500', min: 200, max: 500 },
  { id: '500+', label: '$500 & Above', min: 500, max: Infinity },
];

/**
 * Rating Options
 */
export const RATING_OPTIONS = [
  { value: 5, label: '5 Stars' },
  { value: 4, label: '4 Stars & Up' },
  { value: 3, label: '3 Stars & Up' },
  { value: 2, label: '2 Stars & Up' },
  { value: 1, label: '1 Star & Up' },
];

/**
 * Order Status
 */
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

/**
 * Order Status Labels
 */
export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Pending',
  [ORDER_STATUS.PROCESSING]: 'Processing',
  [ORDER_STATUS.SHIPPED]: 'Shipped',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
  [ORDER_STATUS.REFUNDED]: 'Refunded',
};

/**
 * Payment Methods
 */
export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  PAYPAL: 'paypal',
  APPLE_PAY: 'apple_pay',
  GOOGLE_PAY: 'google_pay',
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
 * Toast Notification Settings
 */
export const TOAST_CONFIG = {
  DURATION: 3000,
  POSITION: 'top-right',
  SUCCESS_DURATION: 2000,
  ERROR_DURATION: 5000,
};

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  CART: 'cart',
  RECENT_SEARCHES: 'recent_searches',
  VIEWED_PRODUCTS: 'viewed_products',
  CHECKOUT_DATA: 'checkout_data',
  ORDER_ID: 'last_order_id',
};

/**
 * Debounce/Throttle Delays (milliseconds)
 */
export const DELAYS = {
  SEARCH_DEBOUNCE: 500,
  RESIZE_THROTTLE: 300,
  SCROLL_THROTTLE: 100,
  INPUT_DEBOUNCE: 300,
};

/**
 * Breakpoints (must match CSS)
 */
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1440,
};

/**
 * Image Settings
 */
export const IMAGE_CONFIG = {
  PLACEHOLDER: '/placeholder.png',
  FALLBACK: '/fallback.png',
  MAX_SIZE: 5242880, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  QUALITY: 80,
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
 * Feature Flags
 */
export const FEATURES = {
  ENABLE_REVIEWS: true,
  ENABLE_SOCIAL_SHARE: true,
  ENABLE_NEWSLETTER: true,
  ENABLE_PRODUCT_SEARCH: true,
  ENABLE_CATEGORY_FILTERS: true,
};

/**
 * Social Media Links
 */
export const SOCIAL_LINKS = {
  FACEBOOK: 'https://facebook.com/yourstore',
  TWITTER: 'https://twitter.com/yourstore',
  INSTAGRAM: 'https://instagram.com/yourstore',
  LINKEDIN: 'https://linkedin.com/company/yourstore',
  YOUTUBE: 'https://youtube.com/yourstore',
};

/**
 * Currency Configuration
 */
export const CURRENCY = {
  CODE: 'USD',
  SYMBOL: '$',
  LOCALE: 'en-US',
};

/**
 * Date Format
 */
export const DATE_FORMAT = {
  SHORT: 'MM/DD/YYYY',
  LONG: 'MMMM DD, YYYY',
  TIME: 'hh:mm A',
  DATETIME: 'MM/DD/YYYY hh:mm A',
};
