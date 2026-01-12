import {
  formatCurrency,
  formatDate,
  formatShortDate,
  formatNumber,
  formatPercentage,
  truncateText,
  formatFileSize,
  capitalize,
  toTitleCase,
  formatPhoneNumber,
} from '../formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    test('formats positive numbers', () => {
      expect(formatCurrency(100)).toBe('$100');
      expect(formatCurrency(1234.56)).toBe('$1.234');
    });

    test('formats zero', () => {
      expect(formatCurrency(0)).toBe('$0');
    });

    test('formats negative numbers', () => {
      expect(formatCurrency(-50)).toBe('$-50');
    });

    test('handles invalid input', () => {
      expect(formatCurrency(null)).toBe('$0');
      expect(formatCurrency(undefined)).toBe('$0');
      expect(formatCurrency('invalid')).toBe('$0');
      expect(formatCurrency(NaN)).toBe('$0');
    });

    test('formats large numbers with thousand separators', () => {
      expect(formatCurrency(1000000)).toBe('$1.000.000');
      expect(formatCurrency(1234567)).toBe('$1.234.567');
    });

    test('handles decimal precision by flooring', () => {
      expect(formatCurrency(99.999)).toBe('$99');
      expect(formatCurrency(99.991)).toBe('$99');
    });
  });

  describe('formatDate', () => {
    test('formats Date objects', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const formatted = formatDate(date);
      expect(formatted).toContain('January');
      expect(formatted).toContain('2024');
    });

    test('formats date strings', () => {
      const formatted = formatDate('2024-01-15');
      expect(formatted).toContain('January');
    });

    test('formats timestamps', () => {
      const timestamp = new Date('2024-01-15').getTime();
      const formatted = formatDate(timestamp);
      expect(formatted).toContain('2024');
    });

    test('handles invalid dates', () => {
      expect(formatDate('invalid')).toBe('Invalid Date');
      expect(formatDate(null)).toBe('Invalid Date');
    });

    test('accepts custom options', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date, 'en-US', { month: 'short' });
      expect(formatted).toContain('Jan');
    });
  });

  describe('formatShortDate', () => {
    test('formats date in short format', () => {
      const date = new Date('2024-01-15');
      const formatted = formatShortDate(date);
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  describe('formatNumber', () => {
    test('formats numbers with thousand separators', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1234567)).toBe('1,234,567');
    });

    test('formats zero', () => {
      expect(formatNumber(0)).toBe('0');
    });

    test('handles invalid input', () => {
      expect(formatNumber(null)).toBe('0');
      expect(formatNumber(undefined)).toBe('0');
      expect(formatNumber('invalid')).toBe('0');
    });

    test('formats decimals', () => {
      const result = formatNumber(1234.56);
      expect(result).toContain('1,234');
    });
  });

  describe('formatPercentage', () => {
    test('formats percentages', () => {
      expect(formatPercentage(0.15)).toBe('15%');
      expect(formatPercentage(0.5)).toBe('50%');
      expect(formatPercentage(1)).toBe('100%');
    });

    test('formats with decimals', () => {
      expect(formatPercentage(0.155, 2)).toBe('15.50%');
      expect(formatPercentage(0.333, 1)).toBe('33.3%');
    });

    test('handles invalid input', () => {
      expect(formatPercentage(null)).toBe('0%');
      expect(formatPercentage(undefined)).toBe('0%');
      expect(formatPercentage('invalid')).toBe('0%');
    });
  });

  describe('truncateText', () => {
    test('truncates long text', () => {
      const longText = 'This is a very long text that should be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very long...');
    });

    test('does not truncate short text', () => {
      const shortText = 'Short';
      expect(truncateText(shortText, 20)).toBe('Short');
    });

    test('handles empty or invalid input', () => {
      expect(truncateText('')).toBe('');
      expect(truncateText(null)).toBe('');
      expect(truncateText(undefined)).toBe('');
    });

    test('uses default max length', () => {
      const longText = 'a'.repeat(150);
      const result = truncateText(longText);
      expect(result.length).toBe(103); // 100 chars + '...'
    });
  });

  describe('formatFileSize', () => {
    test('formats bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    test('formats kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
    });

    test('formats megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(5242880)).toBe('5 MB');
    });

    test('formats with decimals', () => {
      expect(formatFileSize(1536, 1)).toBe('1.5 KB');
    });

    test('handles invalid input', () => {
      expect(formatFileSize(null)).toBe('0 Bytes');
      expect(formatFileSize(undefined)).toBe('0 Bytes');
      expect(formatFileSize('invalid')).toBe('0 Bytes');
    });
  });

  describe('capitalize', () => {
    test('capitalizes first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('Hello');
    });

    test('handles single character', () => {
      expect(capitalize('a')).toBe('A');
    });

    test('handles empty or invalid input', () => {
      expect(capitalize('')).toBe('');
      expect(capitalize(null)).toBe('');
      expect(capitalize(undefined)).toBe('');
    });
  });

  describe('toTitleCase', () => {
    test('converts to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
      expect(toTitleCase('HELLO WORLD')).toBe('Hello World');
      expect(toTitleCase('hello WORLD')).toBe('Hello World');
    });

    test('handles single word', () => {
      expect(toTitleCase('hello')).toBe('Hello');
    });

    test('handles empty or invalid input', () => {
      expect(toTitleCase('')).toBe('');
      expect(toTitleCase(null)).toBe('');
      expect(toTitleCase(undefined)).toBe('');
    });
  });

  describe('formatPhoneNumber', () => {
    test('formats 10-digit phone numbers', () => {
      expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
    });

    test('formats numbers with existing formatting', () => {
      expect(formatPhoneNumber('555-123-4567')).toBe('(555) 123-4567');
      expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567');
    });

    test('does not format invalid numbers', () => {
      expect(formatPhoneNumber('123')).toBe('123');
      expect(formatPhoneNumber('12345678901')).toBe('12345678901');
    });

    test('handles empty input', () => {
      expect(formatPhoneNumber('')).toBe('');
      expect(formatPhoneNumber(null)).toBe('');
    });
  });
});
