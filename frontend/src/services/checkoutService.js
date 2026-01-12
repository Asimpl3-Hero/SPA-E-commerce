import { API_URL } from '@/constants/api';

/**
 * Checkout Service
 * Handles all API calls related to checkout and payments
 */

/**
 * Creates an order
 * @param {Object} orderData - Order information
 * @returns {Promise<Object>} Created order
 */
export const createOrder = async (orderData) => {
  try {
    const response = await fetch(`${API_URL}/checkout/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

/**
 * Processes a payment
 * @param {Object} paymentData - Payment information
 * @returns {Promise<Object>} Payment result
 */
export const processPayment = async (paymentData) => {
  try {
    const response = await fetch(`${API_URL}/checkout/process-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process payment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};

/**
 * Gets an order by reference
 * @param {string} reference - Order reference
 * @returns {Promise<Object>} Order details
 */
export const getOrderByReference = async (reference) => {
  try {
    const response = await fetch(`${API_URL}/checkout/order/${reference}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting order:', error);
    throw error;
  }
};

/**
 * Gets Wompi acceptance token
 * @returns {Promise<Object>} Acceptance token
 */
export const getAcceptanceToken = async () => {
  try {
    const response = await fetch(`${API_URL}/checkout/acceptance-token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get acceptance token');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting acceptance token:', error);
    throw error;
  }
};
