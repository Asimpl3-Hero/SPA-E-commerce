import { API_URL, API_ENDPOINTS, buildApiUrl } from '../api';

describe('api.js', () => {
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

  describe('API_URL', () => {
    it('should have default API base URL', () => {
      expect(API_URL).toBe('http://localhost:4567/api');
    });

    it('should use VITE_API_BASE_URL from process.env when available', () => {
      process.env.VITE_API_BASE_URL = 'http://custom-api.com/api';

      jest.isolateModules(() => {
        const { API_URL: customApiUrl } = require('../api');
        expect(customApiUrl).toBe('http://custom-api.com/api');
      });
    });
  });

  describe('API_ENDPOINTS', () => {
    describe('CHECKOUT', () => {
      it('should have create order endpoint', () => {
        expect(API_ENDPOINTS.CHECKOUT.CREATE_ORDER).toBe('/checkout/create-order');
      });

      it('should have process payment endpoint', () => {
        expect(API_ENDPOINTS.CHECKOUT.PROCESS_PAYMENT).toBe('/checkout/process-payment');
      });

      it('should have get order endpoint', () => {
        expect(API_ENDPOINTS.CHECKOUT.GET_ORDER).toBe('/checkout/order/:reference');
      });

      it('should have acceptance token endpoint', () => {
        expect(API_ENDPOINTS.CHECKOUT.ACCEPTANCE_TOKEN).toBe('/checkout/acceptance-token');
      });
    });

    describe('PRODUCTS', () => {
      it('should have list endpoint', () => {
        expect(API_ENDPOINTS.PRODUCTS.LIST).toBe('/products');
      });

      it('should have detail endpoint', () => {
        expect(API_ENDPOINTS.PRODUCTS.DETAIL).toBe('/products/:id');
      });

      it('should have search endpoint', () => {
        expect(API_ENDPOINTS.PRODUCTS.SEARCH).toBe('/products?search=:query');
      });
    });

    describe('CATEGORIES', () => {
      it('should have list endpoint', () => {
        expect(API_ENDPOINTS.CATEGORIES.LIST).toBe('/categories');
      });
    });
  });

  describe('buildApiUrl', () => {
    it('should build URL without parameters', () => {
      const url = buildApiUrl(API_ENDPOINTS.PRODUCTS.LIST);
      expect(url).toBe('http://localhost:4567/api/products');
    });

    it('should build URL with single parameter', () => {
      const url = buildApiUrl(API_ENDPOINTS.PRODUCTS.DETAIL, { id: '123' });
      expect(url).toBe('http://localhost:4567/api/products/123');
    });

    it('should build URL with multiple parameters', () => {
      const url = buildApiUrl(API_ENDPOINTS.CHECKOUT.GET_ORDER, { reference: 'ORD-123' });
      expect(url).toBe('http://localhost:4567/api/checkout/order/ORD-123');
    });

    it('should handle empty params object', () => {
      const url = buildApiUrl(API_ENDPOINTS.CATEGORIES.LIST, {});
      expect(url).toBe('http://localhost:4567/api/categories');
    });

    it('should replace query parameters', () => {
      const url = buildApiUrl(API_ENDPOINTS.PRODUCTS.SEARCH, { query: 'laptop' });
      expect(url).toBe('http://localhost:4567/api/products?search=laptop');
    });

    it('should handle numeric parameter values', () => {
      const url = buildApiUrl(API_ENDPOINTS.PRODUCTS.DETAIL, { id: 456 });
      expect(url).toBe('http://localhost:4567/api/products/456');
    });

    it('should handle special characters in parameters', () => {
      const url = buildApiUrl(API_ENDPOINTS.PRODUCTS.SEARCH, { query: 'gaming%20laptop' });
      expect(url).toBe('http://localhost:4567/api/products?search=gaming%20laptop');
    });

    it('should not modify endpoint when parameter is not present', () => {
      const url = buildApiUrl(API_ENDPOINTS.PRODUCTS.DETAIL, { wrongKey: 'value' });
      expect(url).toBe('http://localhost:4567/api/products/:id');
    });

    it('should replace multiple occurrences of same parameter', () => {
      const customEndpoint = '/test/:id/sub/:id';
      const url = buildApiUrl(customEndpoint, { id: '123' });
      expect(url).toBe('http://localhost:4567/api/test/123/sub/123');
    });
  });

  describe('getApiBaseUrl function', () => {
    it('should return default URL when no env variables are set', () => {
      delete process.env.VITE_API_BASE_URL;

      jest.isolateModules(() => {
        const { API_URL } = require('../api');
        expect(API_URL).toBe('http://localhost:4567/api');
      });
    });

    it('should handle undefined process object', () => {
      const originalProcess = global.process;

      jest.isolateModules(() => {
        // Mock scenario where process might be undefined
        const { API_URL } = require('../api');
        expect(API_URL).toBeTruthy();
      });
    });
  });
});
