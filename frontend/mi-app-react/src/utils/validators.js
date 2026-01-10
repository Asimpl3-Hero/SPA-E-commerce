/**
 * Validation utility functions
 * Provides validation for common input types
 */

/**
 * Validates an email address
 * @param {string} email - The email address to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates a phone number (US format)
 * @param {string} phone - The phone number to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
};

/**
 * Validates a password based on strength requirements
 * @param {string} password - The password to validate
 * @param {Object} options - Validation options
 * @param {number} options.minLength - Minimum length (default: 8)
 * @param {boolean} options.requireUppercase - Require uppercase letter (default: true)
 * @param {boolean} options.requireLowercase - Require lowercase letter (default: true)
 * @param {boolean} options.requireNumber - Require number (default: true)
 * @param {boolean} options.requireSpecial - Require special character (default: true)
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = true,
  } = options;

  const errors = [];

  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Password is required'] };
  }

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates a credit card number using Luhn algorithm
 * @param {string} cardNumber - The credit card number to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidCreditCard = (cardNumber) => {
  if (!cardNumber || typeof cardNumber !== 'string') {
    return false;
  }

  const cleaned = cardNumber.replace(/\D/g, '');

  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Validates a ZIP code (US format)
 * @param {string} zipCode - The ZIP code to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidZipCode = (zipCode) => {
  if (!zipCode || typeof zipCode !== 'string') {
    return false;
  }

  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode.trim());
};

/**
 * Validates a URL
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidURL = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates that a value is not empty
 * @param {*} value - The value to validate
 * @returns {boolean} True if not empty, false otherwise
 */
export const isNotEmpty = (value) => {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }

  return true;
};

/**
 * Validates that a value is within a range
 * @param {number} value - The value to validate
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {boolean} True if within range, false otherwise
 */
export const isInRange = (value, min, max) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }

  return value >= min && value <= max;
};

/**
 * Validates that a string has a minimum length
 * @param {string} str - The string to validate
 * @param {number} minLength - Minimum length
 * @returns {boolean} True if meets minimum length, false otherwise
 */
export const hasMinLength = (str, minLength) => {
  if (!str || typeof str !== 'string') {
    return false;
  }

  return str.length >= minLength;
};

/**
 * Validates that a string has a maximum length
 * @param {string} str - The string to validate
 * @param {number} maxLength - Maximum length
 * @returns {boolean} True if within maximum length, false otherwise
 */
export const hasMaxLength = (str, maxLength) => {
  if (!str || typeof str !== 'string') {
    return true;
  }

  return str.length <= maxLength;
};

/**
 * Validates that a value matches a pattern
 * @param {string} value - The value to validate
 * @param {RegExp} pattern - The pattern to match
 * @returns {boolean} True if matches pattern, false otherwise
 */
export const matchesPattern = (value, pattern) => {
  if (!value || typeof value !== 'string') {
    return false;
  }

  return pattern.test(value);
};

/**
 * Validates a date is not in the past
 * @param {Date|string|number} date - The date to validate
 * @returns {boolean} True if not in the past, false otherwise
 */
export const isNotPastDate = (date) => {
  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dateObj >= today;
};

/**
 * Validates a date is within age range
 * @param {Date|string|number} birthDate - The birth date to validate
 * @param {number} minAge - Minimum age
 * @param {number} maxAge - Maximum age (optional)
 * @returns {boolean} True if within age range, false otherwise
 */
export const isValidAge = (birthDate, minAge, maxAge = 150) => {
  if (birthDate === null || birthDate === undefined) {
    return false;
  }

  const dateObj = birthDate instanceof Date ? birthDate : new Date(birthDate);

  if (isNaN(dateObj.getTime())) {
    return false;
  }

  const today = new Date();
  const age = Math.floor((today - dateObj) / (365.25 * 24 * 60 * 60 * 1000));

  return age >= minAge && age <= maxAge;
};
