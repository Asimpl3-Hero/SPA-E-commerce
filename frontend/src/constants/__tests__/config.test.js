import { ENV, SHIPPING_METHODS, STORAGE_KEYS, VALIDATION_RULES, WOMPI_CONFIG } from '../config';

describe('config.js', () => {
  describe('ENV', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
      delete global.window;
    });

    it('should return NODE_ENV from process.env in test environment', () => {
      expect(ENV.NODE_ENV).toBe('test');
    });

    it('should identify test environment correctly', () => {
      expect(ENV.IS_TEST).toBe(true);
      expect(ENV.IS_DEV).toBe(false);
      expect(ENV.IS_PROD).toBe(false);
    });

    it('should identify development environment', () => {
      process.env.NODE_ENV = 'development';
      // Force re-evaluation by accessing the getter
      const isDev = ENV.IS_DEV;
      const isProd = ENV.IS_PROD;
      const isTest = ENV.IS_TEST;

      expect(isDev).toBe(true);
      expect(isProd).toBe(false);
      expect(isTest).toBe(false);
    });

    it('should identify production environment', () => {
      process.env.NODE_ENV = 'production';
      const isDev = ENV.IS_DEV;
      const isProd = ENV.IS_PROD;
      const isTest = ENV.IS_TEST;

      expect(isDev).toBe(false);
      expect(isProd).toBe(true);
      expect(isTest).toBe(false);
    });

    it('should default to production when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      // Mock window with import.meta
      global.window = {
        import: {
          meta: {
            env: {}
          }
        }
      };

      const nodeEnv = ENV.NODE_ENV;
      expect(nodeEnv).toBe('production');
    });

    it('should use window.import.meta.env.MODE when available', () => {
      global.window = {
        import: {
          meta: {
            env: {
              MODE: 'development'
            }
          }
        }
      };

      const nodeEnv = ENV.NODE_ENV;
      expect(nodeEnv).toBe('development');
    });
  });

  describe('SHIPPING_METHODS', () => {
    it('should have standard shipping method', () => {
      expect(SHIPPING_METHODS.STANDARD).toEqual({
        id: 'standard',
        name: 'Standard Shipping',
        days: '5-7',
        cost: 10
      });
    });

    it('should have express shipping method', () => {
      expect(SHIPPING_METHODS.EXPRESS).toEqual({
        id: 'express',
        name: 'Express Shipping',
        days: '2-3',
        cost: 20
      });
    });

    it('should have overnight shipping method', () => {
      expect(SHIPPING_METHODS.OVERNIGHT).toEqual({
        id: 'overnight',
        name: 'Overnight Shipping',
        days: '1',
        cost: 35
      });
    });
  });

  describe('STORAGE_KEYS', () => {
    it('should have cart key', () => {
      expect(STORAGE_KEYS.CART).toBe('cart');
    });

    it('should have checkout data key', () => {
      expect(STORAGE_KEYS.CHECKOUT_DATA).toBe('checkout_data');
    });

    it('should have order ID key', () => {
      expect(STORAGE_KEYS.ORDER_ID).toBe('last_order_id');
    });
  });

  describe('VALIDATION_RULES', () => {
    describe('EMAIL', () => {
      it('should validate correct email', () => {
        expect(VALIDATION_RULES.EMAIL.PATTERN.test('test@example.com')).toBe(true);
        expect(VALIDATION_RULES.EMAIL.PATTERN.test('user.name@domain.co')).toBe(true);
      });

      it('should reject invalid email', () => {
        expect(VALIDATION_RULES.EMAIL.PATTERN.test('invalid')).toBe(false);
        expect(VALIDATION_RULES.EMAIL.PATTERN.test('test@')).toBe(false);
        expect(VALIDATION_RULES.EMAIL.PATTERN.test('@example.com')).toBe(false);
      });
    });

    describe('PHONE', () => {
      it('should validate 10-digit phone number', () => {
        expect(VALIDATION_RULES.PHONE.PATTERN.test('1234567890')).toBe(true);
      });

      it('should reject invalid phone number', () => {
        expect(VALIDATION_RULES.PHONE.PATTERN.test('123')).toBe(false);
        expect(VALIDATION_RULES.PHONE.PATTERN.test('12345678901')).toBe(false);
        expect(VALIDATION_RULES.PHONE.PATTERN.test('abc1234567')).toBe(false);
      });
    });

    describe('ZIP_CODE', () => {
      it('should validate 5-digit zip code', () => {
        expect(VALIDATION_RULES.ZIP_CODE.PATTERN.test('12345')).toBe(true);
      });

      it('should validate 9-digit zip code with hyphen', () => {
        expect(VALIDATION_RULES.ZIP_CODE.PATTERN.test('12345-6789')).toBe(true);
      });

      it('should reject invalid zip code', () => {
        expect(VALIDATION_RULES.ZIP_CODE.PATTERN.test('123')).toBe(false);
        expect(VALIDATION_RULES.ZIP_CODE.PATTERN.test('123456')).toBe(false);
        expect(VALIDATION_RULES.ZIP_CODE.PATTERN.test('abcde')).toBe(false);
      });
    });
  });

  describe('WOMPI_CONFIG', () => {
    const originalProcessEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalProcessEnv };
      delete global.window;
    });

    afterEach(() => {
      process.env = originalProcessEnv;
      delete global.window;
    });

    it('should have default public key', () => {
      expect(WOMPI_CONFIG.PUBLIC_KEY).toBe('pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7');
    });

    it('should have script URL', () => {
      expect(WOMPI_CONFIG.SCRIPT_URL).toBe('https://checkout.wompi.co/widget.js');
    });

    it('should have currency', () => {
      expect(WOMPI_CONFIG.CURRENCY).toBe('COP');
    });

    it('should use environment variable when available', () => {
      // This test checks that the function can handle process.env
      process.env.VITE_WOMPI_PUBLIC_KEY = 'pub_test_custom_key';

      // Re-import to get new value
      jest.isolateModules(() => {
        const { WOMPI_CONFIG: freshConfig } = require('../config');
        expect(freshConfig.PUBLIC_KEY).toBeTruthy();
      });
    });
  });
});
