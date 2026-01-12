// Mock the config before importing
jest.mock('@/config/wompi');

import { BasePaymentGateway, WompiGateway } from '../index';

describe('Payment Gateways Index', () => {
  test('exports BasePaymentGateway', () => {
    expect(BasePaymentGateway).toBeDefined();
    expect(typeof BasePaymentGateway).toBe('function');
  });

  test('exports WompiGateway', () => {
    expect(WompiGateway).toBeDefined();
    expect(typeof WompiGateway).toBe('function');
  });

  test('BasePaymentGateway can be instantiated', () => {
    const gateway = new BasePaymentGateway({ test: 'config' });
    expect(gateway).toBeInstanceOf(BasePaymentGateway);
  });

  test('WompiGateway can be instantiated', () => {
    const gateway = new WompiGateway();
    expect(gateway).toBeInstanceOf(WompiGateway);
    expect(gateway).toBeInstanceOf(BasePaymentGateway);
  });

  test('WompiGateway extends BasePaymentGateway', () => {
    expect(WompiGateway.prototype instanceof BasePaymentGateway).toBe(true);
  });
});
