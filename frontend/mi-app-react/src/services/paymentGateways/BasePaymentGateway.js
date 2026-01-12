/**
 * Base Payment Gateway Interface
 * All payment gateway adapters should implement this interface
 */
export class BasePaymentGateway {
  /**
   * Initialize the payment gateway
   * @param {Object} config - Gateway configuration
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * Tokenize payment method (e.g., credit card)
   * @param {Object} paymentData - Payment method data
   * @returns {Promise<string>} - Payment token
   */
  async tokenize(paymentData) {
    throw new Error("Method 'tokenize' must be implemented");
  }

  /**
   * Process payment
   * @param {Object} orderData - Order and payment data
   * @returns {Promise<Object>} - Payment result
   */
  async processPayment(orderData) {
    throw new Error("Method 'processPayment' must be implemented");
  }

  /**
   * Check payment status
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<string>} - Payment status
   */
  async getPaymentStatus(transactionId) {
    throw new Error("Method 'getPaymentStatus' must be implemented");
  }

  /**
   * Validate payment method data
   * @param {Object} paymentData - Payment method data
   * @returns {Object} - Validation result { valid: boolean, errors: Object }
   */
  validate(paymentData) {
    throw new Error("Method 'validate' must be implemented");
  }

  /**
   * Get supported payment methods
   * @returns {Array<string>} - List of supported payment methods
   */
  getSupportedMethods() {
    throw new Error("Method 'getSupportedMethods' must be implemented");
  }
}
