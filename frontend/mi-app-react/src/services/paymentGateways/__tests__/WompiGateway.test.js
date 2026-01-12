import { WompiGateway } from '../WompiGateway';
import * as checkoutService from '@/services/checkoutService';

// Mock the config
jest.mock('@/config/wompi');

// Mock checkoutService
jest.mock('@/services/checkoutService');

describe('WompiGateway', () => {
  let gateway;
  let fetchMock;

  beforeEach(() => {
    gateway = new WompiGateway();

    // Mock global fetch
    fetchMock = jest.fn();
    global.fetch = fetchMock;

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    test('initializes with WOMPI_CONFIG', () => {
      expect(gateway.config).toBeDefined();
      expect(gateway.config.API_URL).toBeDefined();
      expect(gateway.config.PUBLIC_KEY).toBeDefined();
    });
  });

  describe('getSupportedMethods', () => {
    test('returns CARD and NEQUI methods', () => {
      const methods = gateway.getSupportedMethods();

      expect(methods).toEqual(['CARD', 'NEQUI']);
      expect(methods).toHaveLength(2);
    });
  });

  describe('detectCardType', () => {
    test('detects Visa card', () => {
      const result = gateway.detectCardType('4242424242424242');

      expect(result).toEqual({ type: 'visa', name: 'Visa' });
    });

    test('detects Visa card with spaces', () => {
      const result = gateway.detectCardType('4242 4242 4242 4242');

      expect(result).toEqual({ type: 'visa', name: 'Visa' });
    });

    test('detects Mastercard', () => {
      const result = gateway.detectCardType('5555555555554444');

      expect(result).toEqual({ type: 'mastercard', name: 'Mastercard' });
    });

    test('detects Mastercard (new range)', () => {
      const result = gateway.detectCardType('2221000000000009');

      expect(result).toEqual({ type: 'mastercard', name: 'Mastercard' });
    });

    test('detects American Express', () => {
      const result = gateway.detectCardType('378282246310005');

      expect(result).toEqual({ type: 'amex', name: 'American Express' });
    });

    test('detects American Express (347)', () => {
      const result = gateway.detectCardType('371449635398431');

      expect(result).toEqual({ type: 'amex', name: 'American Express' });
    });

    test('detects Discover', () => {
      const result = gateway.detectCardType('6011111111111117');

      expect(result).toEqual({ type: 'discover', name: 'Discover' });
    });

    test('detects Discover (65)', () => {
      const result = gateway.detectCardType('6512345678901234');

      expect(result).toEqual({ type: 'discover', name: 'Discover' });
    });

    test('detects Diners Club', () => {
      const result = gateway.detectCardType('30569309025904');

      expect(result).toEqual({ type: 'diners', name: 'Diners Club' });
    });

    test('detects Diners Club (36)', () => {
      const result = gateway.detectCardType('36227206271667');

      expect(result).toEqual({ type: 'diners', name: 'Diners Club' });
    });

    test('detects Diners Club (38)', () => {
      const result = gateway.detectCardType('3841234567890123');

      expect(result).toEqual({ type: 'diners', name: 'Diners Club' });
    });

    test('returns null for unknown card type', () => {
      const result = gateway.detectCardType('1234567890123456');

      expect(result).toBeNull();
    });

    test('returns null for empty string', () => {
      const result = gateway.detectCardType('');

      expect(result).toBeNull();
    });
  });

  describe('tokenize', () => {
    const cardData = {
      number: '4242424242424242',
      cvc: '123',
      exp_month: '12',
      exp_year: '2025',
      card_holder: 'John Doe',
    };

    test('successfully tokenizes card', async () => {
      const mockResponse = {
        data: {
          id: 'tok_test_12345',
        },
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const token = await gateway.tokenize(cardData);

      expect(token).toBe('tok_test_12345');
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/tokens/cards'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    test('pads exp_month with zero', async () => {
      const cardDataWithSingleDigitMonth = {
        ...cardData,
        exp_month: '5',
      };

      const mockResponse = {
        data: { id: 'tok_test_12345' },
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await gateway.tokenize(cardDataWithSingleDigitMonth);

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.exp_month).toBe('05');
    });

    test('removes spaces from card number', async () => {
      const cardDataWithSpaces = {
        ...cardData,
        number: '4242 4242 4242 4242',
      };

      const mockResponse = {
        data: { id: 'tok_test_12345' },
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await gateway.tokenize(cardDataWithSpaces);

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.number).toBe('4242424242424242');
    });

    test('throws error on failed tokenization with reason', async () => {
      const mockErrorResponse = {
        error: {
          reason: 'Invalid card number',
        },
      };

      fetchMock.mockResolvedValue({
        ok: false,
        json: async () => mockErrorResponse,
      });

      await expect(gateway.tokenize(cardData))
        .rejects
        .toThrow('Invalid card number');
    });

    test('throws error on failed tokenization with messages', async () => {
      const mockErrorResponse = {
        error: {
          messages: ['Card expired', 'Invalid CVC'],
        },
      };

      fetchMock.mockResolvedValue({
        ok: false,
        json: async () => mockErrorResponse,
      });

      await expect(gateway.tokenize(cardData))
        .rejects
        .toThrow('Card expired, Invalid CVC');
    });

    test('throws default error message when no specific error', async () => {
      const mockErrorResponse = {
        error: {},
      };

      fetchMock.mockResolvedValue({
        ok: false,
        json: async () => mockErrorResponse,
      });

      await expect(gateway.tokenize(cardData))
        .rejects
        .toThrow('Failed to tokenize card');
    });

    test('handles network error', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      await expect(gateway.tokenize(cardData))
        .rejects
        .toThrow('Network error');
    });
  });

  describe('validate', () => {
    describe('CARD validation', () => {
      test('validates complete card data successfully', () => {
        const paymentData = {
          method: 'CARD',
          cardData: {
            number: '4242424242424242',
            cvc: '123',
            exp_month: '12',
            exp_year: '2025',
            card_holder: 'John Doe',
          },
        };

        const result = gateway.validate(paymentData);

        expect(result.valid).toBe(true);
        expect(result.errors).toEqual({});
      });

      test('fails when card data is incomplete', () => {
        const paymentData = {
          method: 'CARD',
          cardData: {
            number: '4242424242424242',
            // Missing cvc, exp_month, exp_year, card_holder
          },
        };

        const result = gateway.validate(paymentData);

        expect(result.valid).toBe(false);
        expect(result.errors.card).toBe('Please fill in all card information');
      });

      test('fails when card number is too short', () => {
        const paymentData = {
          method: 'CARD',
          cardData: {
            number: '424242424242', // 12 digits
            cvc: '123',
            exp_month: '12',
            exp_year: '2025',
            card_holder: 'John Doe',
          },
        };

        const result = gateway.validate(paymentData);

        expect(result.valid).toBe(false);
        expect(result.errors.cardNumber).toBe('Invalid card number');
      });

      test('fails when card number is too long', () => {
        const paymentData = {
          method: 'CARD',
          cardData: {
            number: '42424242424242424242', // 20 digits
            cvc: '123',
            exp_month: '12',
            exp_year: '2025',
            card_holder: 'John Doe',
          },
        };

        const result = gateway.validate(paymentData);

        expect(result.valid).toBe(false);
        expect(result.errors.cardNumber).toBe('Invalid card number');
      });

      test('validates card number with spaces', () => {
        const paymentData = {
          method: 'CARD',
          cardData: {
            number: '4242 4242 4242 4242',
            cvc: '123',
            exp_month: '12',
            exp_year: '2025',
            card_holder: 'John Doe',
          },
        };

        const result = gateway.validate(paymentData);

        expect(result.valid).toBe(true);
      });

      test('fails when CVC is too short', () => {
        const paymentData = {
          method: 'CARD',
          cardData: {
            number: '4242424242424242',
            cvc: '12', // 2 digits
            exp_month: '12',
            exp_year: '2025',
            card_holder: 'John Doe',
          },
        };

        const result = gateway.validate(paymentData);

        expect(result.valid).toBe(false);
        expect(result.errors.cvc).toBe('Invalid CVC');
      });

      test('fails when CVC is too long', () => {
        const paymentData = {
          method: 'CARD',
          cardData: {
            number: '4242424242424242',
            cvc: '12345', // 5 digits
            exp_month: '12',
            exp_year: '2025',
            card_holder: 'John Doe',
          },
        };

        const result = gateway.validate(paymentData);

        expect(result.valid).toBe(false);
        expect(result.errors.cvc).toBe('Invalid CVC');
      });

      test('accepts 4-digit CVC (Amex)', () => {
        const paymentData = {
          method: 'CARD',
          cardData: {
            number: '378282246310005',
            cvc: '1234',
            exp_month: '12',
            exp_year: '2025',
            card_holder: 'John Doe',
          },
        };

        const result = gateway.validate(paymentData);

        expect(result.valid).toBe(true);
      });

      test('fails when exp_month is invalid (0)', () => {
        const paymentData = {
          method: 'CARD',
          cardData: {
            number: '4242424242424242',
            cvc: '123',
            exp_month: '0',
            exp_year: '2025',
            card_holder: 'John Doe',
          },
        };

        const result = gateway.validate(paymentData);

        expect(result.valid).toBe(false);
        expect(result.errors.expMonth).toBe('Invalid expiration month');
      });

      test('fails when exp_month is invalid (13)', () => {
        const paymentData = {
          method: 'CARD',
          cardData: {
            number: '4242424242424242',
            cvc: '123',
            exp_month: '13',
            exp_year: '2025',
            card_holder: 'John Doe',
          },
        };

        const result = gateway.validate(paymentData);

        expect(result.valid).toBe(false);
        expect(result.errors.expMonth).toBe('Invalid expiration month');
      });
    });

    describe('NEQUI validation', () => {
      test('validates complete Nequi data successfully', () => {
        const paymentData = {
          method: 'NEQUI',
          nequiPhone: '3001234567',
        };

        const result = gateway.validate(paymentData);

        expect(result.valid).toBe(true);
        expect(result.errors).toEqual({});
      });

      test('fails when nequi phone is missing', () => {
        const paymentData = {
          method: 'NEQUI',
          nequiPhone: '',
        };

        const result = gateway.validate(paymentData);

        expect(result.valid).toBe(false);
        expect(result.errors.nequi).toBe('Please enter your Nequi phone number');
      });

      test('fails when nequi phone is too short', () => {
        const paymentData = {
          method: 'NEQUI',
          nequiPhone: '300123456', // 9 digits
        };

        const result = gateway.validate(paymentData);

        expect(result.valid).toBe(false);
        expect(result.errors.nequiPhone).toBe('Nequi phone number must be 10 digits');
      });

      test('fails when nequi phone is too long', () => {
        const paymentData = {
          method: 'NEQUI',
          nequiPhone: '30012345678', // 11 digits
        };

        const result = gateway.validate(paymentData);

        expect(result.valid).toBe(false);
        expect(result.errors.nequiPhone).toBe('Nequi phone number must be 10 digits');
      });

      test('validates phone with formatting', () => {
        const paymentData = {
          method: 'NEQUI',
          nequiPhone: '(300) 123-4567',
        };

        const result = gateway.validate(paymentData);

        expect(result.valid).toBe(true);
      });
    });
  });

  describe('processPayment', () => {
    test('successfully processes payment', async () => {
      const orderData = {
        amount: 10000,
        customer: { email: 'test@example.com' },
      };

      const mockResponse = {
        success: true,
        orderId: 'order_123',
        transactionId: 'txn_456',
      };

      checkoutService.createOrder.mockResolvedValue(mockResponse);

      const result = await gateway.processPayment(orderData);

      expect(result).toEqual(mockResponse);
      expect(checkoutService.createOrder).toHaveBeenCalledWith(orderData);
    });

    test('throws error when order creation fails', async () => {
      const orderData = {
        amount: 10000,
        customer: { email: 'test@example.com' },
      };

      const mockResponse = {
        success: false,
        error: 'Payment declined',
      };

      checkoutService.createOrder.mockResolvedValue(mockResponse);

      await expect(gateway.processPayment(orderData))
        .rejects
        .toThrow('Payment declined');
    });

    test('throws default error when no specific error message', async () => {
      const orderData = {
        amount: 10000,
        customer: { email: 'test@example.com' },
      };

      const mockResponse = {
        success: false,
      };

      checkoutService.createOrder.mockResolvedValue(mockResponse);

      await expect(gateway.processPayment(orderData))
        .rejects
        .toThrow('Failed to create order');
    });
  });

  describe('getPaymentStatus', () => {
    test('successfully retrieves payment status', async () => {
      const mockResponse = {
        success: true,
        transaction: {
          status: 'APPROVED',
        },
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const status = await gateway.getPaymentStatus('txn_123');

      expect(status).toBe('APPROVED');
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/transaction-status/txn_123')
      );
    });

    test('throws error when status check fails', async () => {
      const mockResponse = {
        success: false,
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(gateway.getPaymentStatus('txn_123'))
        .rejects
        .toThrow('Failed to verify payment status');
    });

    test('handles network error', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      await expect(gateway.getPaymentStatus('txn_123'))
        .rejects
        .toThrow('Network error');
    });
  });

  describe('preparePaymentMethodData', () => {
    test('prepares CARD payment method data', () => {
      const result = gateway.preparePaymentMethodData(
        'CARD',
        { number: '4242424242424242' },
        null,
        'tok_test_12345'
      );

      expect(result).toEqual({
        type: 'CARD',
        token: 'tok_test_12345',
      });
    });

    test('prepares NEQUI payment method data', () => {
      const result = gateway.preparePaymentMethodData(
        'NEQUI',
        null,
        '(300) 123-4567'
      );

      expect(result).toEqual({
        type: 'NEQUI',
        phone_number: '3001234567',
      });
    });

    test('removes non-digit characters from Nequi phone', () => {
      const result = gateway.preparePaymentMethodData(
        'NEQUI',
        null,
        '+57 300-123-4567'
      );

      expect(result.phone_number).toBe('573001234567');
    });

    test('throws error for unsupported payment method', () => {
      expect(() => gateway.preparePaymentMethodData('PAYPAL', null, null))
        .toThrow('Unsupported payment method');
    });
  });
});
