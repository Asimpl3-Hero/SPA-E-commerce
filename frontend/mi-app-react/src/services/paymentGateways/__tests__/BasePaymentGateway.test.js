import { BasePaymentGateway } from '../BasePaymentGateway';

describe('BasePaymentGateway', () => {
  let gateway;

  beforeEach(() => {
    gateway = new BasePaymentGateway({ apiKey: 'test-key' });
  });

  test('constructor initializes with config', () => {
    const config = { apiKey: 'test-key', apiUrl: 'https://api.test.com' };
    const gateway = new BasePaymentGateway(config);

    expect(gateway.config).toEqual(config);
  });

  test('tokenize throws not implemented error', async () => {
    await expect(gateway.tokenize({ number: '4242424242424242' }))
      .rejects
      .toThrow("Method 'tokenize' must be implemented");
  });

  test('processPayment throws not implemented error', async () => {
    await expect(gateway.processPayment({ amount: 1000 }))
      .rejects
      .toThrow("Method 'processPayment' must be implemented");
  });

  test('getPaymentStatus throws not implemented error', async () => {
    await expect(gateway.getPaymentStatus('txn_123'))
      .rejects
      .toThrow("Method 'getPaymentStatus' must be implemented");
  });

  test('validate throws not implemented error', () => {
    expect(() => gateway.validate({ number: '4242424242424242' }))
      .toThrow("Method 'validate' must be implemented");
  });

  test('getSupportedMethods throws not implemented error', () => {
    expect(() => gateway.getSupportedMethods())
      .toThrow("Method 'getSupportedMethods' must be implemented");
  });

  test('config is accessible', () => {
    expect(gateway.config).toBeDefined();
    expect(gateway.config.apiKey).toBe('test-key');
  });

  test('can be instantiated without config', () => {
    const emptyGateway = new BasePaymentGateway();
    expect(emptyGateway.config).toBeUndefined();
  });
});
