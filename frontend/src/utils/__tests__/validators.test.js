import {
  isValidEmail,
  isValidPhone,
  validatePassword,
  isValidCreditCard,
  isValidZipCode,
  isValidURL,
  isNotEmpty,
  isInRange,
  hasMinLength,
  hasMaxLength,
  matchesPattern,
  isNotPastDate,
  isValidAge,
} from '../validators';

describe('validators', () => {
  describe('isValidEmail', () => {
    test('validates correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.co.uk')).toBe(true);
      expect(isValidEmail('test+filter@example.com')).toBe(true);
    });

    test('rejects invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@example')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    test('validates 10-digit phone numbers', () => {
      expect(isValidPhone('5551234567')).toBe(true);
      expect(isValidPhone('555-123-4567')).toBe(true);
      expect(isValidPhone('(555) 123-4567')).toBe(true);
    });

    test('rejects invalid phone numbers', () => {
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('12345678901')).toBe(false);
      expect(isValidPhone('')).toBe(false);
      expect(isValidPhone(null)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('validates strong passwords', () => {
      const result = validatePassword('Test123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('detects short passwords', () => {
      const result = validatePassword('Test1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    test('detects missing uppercase', () => {
      const result = validatePassword('test123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    test('detects missing lowercase', () => {
      const result = validatePassword('TEST123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    test('detects missing number', () => {
      const result = validatePassword('TestTest!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    test('detects missing special character', () => {
      const result = validatePassword('Test1234');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    test('handles custom options', () => {
      const result = validatePassword('test', {
        minLength: 4,
        requireUppercase: false,
        requireLowercase: true,
        requireNumber: false,
        requireSpecial: false,
      });
      expect(result.isValid).toBe(true);
    });

    test('handles empty password', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });
  });

  describe('isValidCreditCard', () => {
    test('validates valid credit card numbers', () => {
      expect(isValidCreditCard('4532015112830366')).toBe(true); // Visa
      expect(isValidCreditCard('5425233430109903')).toBe(true); // Mastercard
    });

    test('rejects invalid credit card numbers', () => {
      expect(isValidCreditCard('1234567890123456')).toBe(false);
      expect(isValidCreditCard('123')).toBe(false);
      expect(isValidCreditCard('')).toBe(false);
      expect(isValidCreditCard(null)).toBe(false);
    });

    test('handles cards with spaces and dashes', () => {
      expect(isValidCreditCard('4532-0151-1283-0366')).toBe(true);
      expect(isValidCreditCard('4532 0151 1283 0366')).toBe(true);
    });
  });

  describe('isValidZipCode', () => {
    test('validates 5-digit ZIP codes', () => {
      expect(isValidZipCode('12345')).toBe(true);
      expect(isValidZipCode('90210')).toBe(true);
    });

    test('validates ZIP+4 format', () => {
      expect(isValidZipCode('12345-6789')).toBe(true);
    });

    test('rejects invalid ZIP codes', () => {
      expect(isValidZipCode('1234')).toBe(false);
      expect(isValidZipCode('123456')).toBe(false);
      expect(isValidZipCode('abcde')).toBe(false);
      expect(isValidZipCode('')).toBe(false);
      expect(isValidZipCode(null)).toBe(false);
    });
  });

  describe('isValidURL', () => {
    test('validates correct URLs', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('http://example.com')).toBe(true);
      expect(isValidURL('https://www.example.com/path')).toBe(true);
    });

    test('rejects invalid URLs', () => {
      expect(isValidURL('not a url')).toBe(false);
      expect(isValidURL('example.com')).toBe(false);
      expect(isValidURL('')).toBe(false);
      expect(isValidURL(null)).toBe(false);
    });
  });

  describe('isNotEmpty', () => {
    test('validates non-empty values', () => {
      expect(isNotEmpty('text')).toBe(true);
      expect(isNotEmpty([1, 2, 3])).toBe(true);
      expect(isNotEmpty({ key: 'value' })).toBe(true);
      expect(isNotEmpty(0)).toBe(true);
      expect(isNotEmpty(false)).toBe(true);
    });

    test('rejects empty values', () => {
      expect(isNotEmpty('')).toBe(false);
      expect(isNotEmpty('   ')).toBe(false);
      expect(isNotEmpty([])).toBe(false);
      expect(isNotEmpty({})).toBe(false);
      expect(isNotEmpty(null)).toBe(false);
      expect(isNotEmpty(undefined)).toBe(false);
    });
  });

  describe('isInRange', () => {
    test('validates values in range', () => {
      expect(isInRange(5, 0, 10)).toBe(true);
      expect(isInRange(0, 0, 10)).toBe(true);
      expect(isInRange(10, 0, 10)).toBe(true);
    });

    test('rejects values out of range', () => {
      expect(isInRange(-1, 0, 10)).toBe(false);
      expect(isInRange(11, 0, 10)).toBe(false);
    });

    test('handles invalid input', () => {
      expect(isInRange(null, 0, 10)).toBe(false);
      expect(isInRange(undefined, 0, 10)).toBe(false);
      expect(isInRange('5', 0, 10)).toBe(false);
    });
  });

  describe('hasMinLength', () => {
    test('validates strings meeting minimum length', () => {
      expect(hasMinLength('hello', 3)).toBe(true);
      expect(hasMinLength('hello', 5)).toBe(true);
    });

    test('rejects strings below minimum length', () => {
      expect(hasMinLength('hi', 3)).toBe(false);
      expect(hasMinLength('', 1)).toBe(false);
    });

    test('handles invalid input', () => {
      expect(hasMinLength(null, 3)).toBe(false);
      expect(hasMinLength(undefined, 3)).toBe(false);
    });
  });

  describe('hasMaxLength', () => {
    test('validates strings within maximum length', () => {
      expect(hasMaxLength('hello', 10)).toBe(true);
      expect(hasMaxLength('hello', 5)).toBe(true);
    });

    test('rejects strings exceeding maximum length', () => {
      expect(hasMaxLength('hello world', 5)).toBe(false);
    });

    test('handles invalid input', () => {
      expect(hasMaxLength(null, 10)).toBe(true);
      expect(hasMaxLength(undefined, 10)).toBe(true);
    });
  });

  describe('matchesPattern', () => {
    test('validates values matching pattern', () => {
      expect(matchesPattern('abc123', /^[a-z0-9]+$/)).toBe(true);
      expect(matchesPattern('test@example.com', /\S+@\S+\.\S+/)).toBe(true);
    });

    test('rejects values not matching pattern', () => {
      expect(matchesPattern('ABC', /^[a-z]+$/)).toBe(false);
      expect(matchesPattern('test', /^\d+$/)).toBe(false);
    });

    test('handles invalid input', () => {
      expect(matchesPattern(null, /test/)).toBe(false);
      expect(matchesPattern(undefined, /test/)).toBe(false);
    });
  });

  describe('isNotPastDate', () => {
    test('validates future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(isNotPastDate(futureDate)).toBe(true);
    });

    test('validates today', () => {
      const today = new Date();
      expect(isNotPastDate(today)).toBe(true);
    });

    test('rejects past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(isNotPastDate(pastDate)).toBe(false);
    });

    test('handles invalid dates', () => {
      expect(isNotPastDate('invalid')).toBe(false);
      expect(isNotPastDate(null)).toBe(false);
    });
  });

  describe('isValidAge', () => {
    test('validates ages in range', () => {
      const birthDate18 = new Date();
      birthDate18.setFullYear(birthDate18.getFullYear() - 18);
      expect(isValidAge(birthDate18, 18, 65)).toBe(true);

      const birthDate30 = new Date();
      birthDate30.setFullYear(birthDate30.getFullYear() - 30);
      expect(isValidAge(birthDate30, 18, 65)).toBe(true);
    });

    test('rejects ages below minimum', () => {
      const birthDate15 = new Date();
      birthDate15.setFullYear(birthDate15.getFullYear() - 15);
      expect(isValidAge(birthDate15, 18, 65)).toBe(false);
    });

    test('rejects ages above maximum', () => {
      const birthDate70 = new Date();
      birthDate70.setFullYear(birthDate70.getFullYear() - 70);
      expect(isValidAge(birthDate70, 18, 65)).toBe(false);
    });

    test('handles invalid dates', () => {
      expect(isValidAge('invalid', 18, 65)).toBe(false);
      expect(isValidAge(null, 18, 65)).toBe(false);
    });
  });
});
