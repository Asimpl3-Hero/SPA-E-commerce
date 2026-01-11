import {
  createOrder,
  processPayment,
  getOrderByReference,
  getAcceptanceToken
} from '../checkoutService';
import { API_URL } from '@/constants/api';

// Mock fetch
global.fetch = jest.fn();

describe('checkoutService', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      const orderData = {
        customer: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
        },
        items: [
          { product_id: 1, quantity: 2, price: 100 },
        ],
        total: 200,
      };

      const mockResponse = {
        id: 1,
        reference: 'ORD-12345',
        ...orderData,
        status: 'pending',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await createOrder(orderData);

      expect(fetch).toHaveBeenCalledWith(`${API_URL}/checkout/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when order creation fails', async () => {
      const errorMessage = 'Invalid order data';
      const orderData = { items: [] };

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      });

      await expect(createOrder(orderData)).rejects.toThrow(errorMessage);
    });

    it('should throw default error message when no error provided', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(createOrder({})).rejects.toThrow('Failed to create order');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Connection timeout');
      fetch.mockRejectedValueOnce(networkError);

      await expect(createOrder({})).rejects.toThrow('Connection timeout');
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      const paymentData = {
        order_id: 1,
        payment_method: 'credit_card',
        card_token: 'tok_test_12345',
        acceptance_token: 'acc_test_67890',
      };

      const mockResponse = {
        success: true,
        transaction_id: 'txn_12345',
        status: 'approved',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await processPayment(paymentData);

      expect(fetch).toHaveBeenCalledWith(`${API_URL}/checkout/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when payment fails', async () => {
      const errorMessage = 'Payment declined';
      const paymentData = { order_id: 1 };

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      });

      await expect(processPayment(paymentData)).rejects.toThrow(errorMessage);
    });

    it('should throw default error message when no error provided', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(processPayment({})).rejects.toThrow('Failed to process payment');
    });

    it('should handle payment processing errors', async () => {
      const processingError = new Error('Payment gateway error');
      fetch.mockRejectedValueOnce(processingError);

      await expect(processPayment({})).rejects.toThrow('Payment gateway error');
    });
  });

  describe('getOrderByReference', () => {
    it('should get order by reference successfully', async () => {
      const reference = 'ORD-12345';
      const mockOrder = {
        id: 1,
        reference: reference,
        status: 'completed',
        customer: { name: 'John Doe' },
        items: [],
        total: 200,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrder,
      });

      const result = await getOrderByReference(reference);

      expect(fetch).toHaveBeenCalledWith(`${API_URL}/checkout/order/${reference}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockOrder);
    });

    it('should throw error when order not found', async () => {
      const errorMessage = 'Order not found';
      const reference = 'INVALID-REF';

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      });

      await expect(getOrderByReference(reference)).rejects.toThrow(errorMessage);
    });

    it('should throw default error message when no error provided', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(getOrderByReference('test')).rejects.toThrow('Failed to get order');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      fetch.mockRejectedValueOnce(networkError);

      await expect(getOrderByReference('ORD-123')).rejects.toThrow('Network error');
    });
  });

  describe('getAcceptanceToken', () => {
    it('should get acceptance token successfully', async () => {
      const mockToken = {
        acceptance_token: 'acc_token_12345',
        permalink: 'https://example.com/terms',
        type: 'END_USER_POLICY',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockToken,
      });

      const result = await getAcceptanceToken();

      expect(fetch).toHaveBeenCalledWith(`${API_URL}/checkout/acceptance-token`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockToken);
    });

    it('should throw error when token request fails', async () => {
      const errorMessage = 'Service unavailable';

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      });

      await expect(getAcceptanceToken()).rejects.toThrow(errorMessage);
    });

    it('should throw default error message when no error provided', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(getAcceptanceToken()).rejects.toThrow('Failed to get acceptance token');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Connection refused');
      fetch.mockRejectedValueOnce(networkError);

      await expect(getAcceptanceToken()).rejects.toThrow('Connection refused');
    });

    it('should be called without any parameters', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ acceptance_token: 'test' }),
      });

      await getAcceptanceToken();

      expect(fetch).toHaveBeenCalledTimes(1);
      const [url, options] = fetch.mock.calls[0];
      expect(url).toBe(`${API_URL}/checkout/acceptance-token`);
      expect(options.method).toBe('GET');
    });
  });

  describe('Error handling across all methods', () => {
    it('should log errors to console for createOrder', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');

      fetch.mockRejectedValueOnce(error);

      await expect(createOrder({})).rejects.toThrow('Test error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating order:', error);

      consoleErrorSpy.mockRestore();
    });

    it('should log errors to console for processPayment', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Payment error');

      fetch.mockRejectedValueOnce(error);

      await expect(processPayment({})).rejects.toThrow('Payment error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error processing payment:', error);

      consoleErrorSpy.mockRestore();
    });

    it('should log errors to console for getOrderByReference', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Get order error');

      fetch.mockRejectedValueOnce(error);

      await expect(getOrderByReference('ref')).rejects.toThrow('Get order error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting order:', error);

      consoleErrorSpy.mockRestore();
    });

    it('should log errors to console for getAcceptanceToken', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Token error');

      fetch.mockRejectedValueOnce(error);

      await expect(getAcceptanceToken()).rejects.toThrow('Token error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting acceptance token:', error);

      consoleErrorSpy.mockRestore();
    });
  });
});
