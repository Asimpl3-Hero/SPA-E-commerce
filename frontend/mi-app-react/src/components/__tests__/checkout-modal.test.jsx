import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CheckoutModal } from '../checkout-modal';
import cartReducer from '../../store/cartSlice';
import * as checkoutService from '../../services/checkoutService';

// Mock the checkout service
jest.mock('../../services/checkoutService');

// Mock fetch for Wompi API
global.fetch = jest.fn();

describe('CheckoutModal', () => {
  let store;

  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        cart: cartReducer,
      },
      preloadedState: {
        cart: {
          items: [
            {
              id: 1,
              name: 'Test Product',
              price: 100,
              quantity: 2,
              image: 'https://example.com/image.jpg',
            },
          ],
        },
      },
    });

    // Reset all mocks
    jest.clearAllMocks();
    mockOnClose.mockClear();
    mockOnSuccess.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderCheckoutModal = (isOpen = true) => {
    return render(
      <Provider store={store}>
        <CheckoutModal
          isOpen={isOpen}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      </Provider>
    );
  };

  describe('Rendering', () => {
    test('renders modal when isOpen is true', () => {
      renderCheckoutModal(true);
      expect(screen.getByText('Checkout with Wompi')).toBeInTheDocument();
    });

    test('does not render modal when isOpen is false', () => {
      renderCheckoutModal(false);
      expect(screen.queryByText('Checkout with Wompi')).not.toBeInTheDocument();
    });

    test('renders order summary with cart items', () => {
      renderCheckoutModal();
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Qty: 2')).toBeInTheDocument();
    });

    test('renders customer information section', () => {
      renderCheckoutModal();
      expect(screen.getByText('Customer Information')).toBeInTheDocument();
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    });

    test('renders payment information section', () => {
      renderCheckoutModal();
      expect(screen.getByText('Payment Information')).toBeInTheDocument();
      expect(screen.getByText('Select Payment Method *')).toBeInTheDocument();
    });

    test('displays empty cart message when no items', () => {
      store = configureStore({
        reducer: { cart: cartReducer },
        preloadedState: { cart: { items: [] } },
      });

      render(
        <Provider store={store}>
          <CheckoutModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
        </Provider>
      );

      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    });
  });

  describe('Close functionality', () => {
    test('calls onClose when close button is clicked', () => {
      renderCheckoutModal();
      const closeButton = screen.getByLabelText('Close checkout');
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('calls onClose when backdrop is clicked', () => {
      renderCheckoutModal();
      const backdrop = screen.getByText('Checkout with Wompi').closest('.checkout-modal-backdrop');
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('calls onClose when Cancel button is clicked', () => {
      renderCheckoutModal();
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Payment method selection', () => {
    test('defaults to CARD payment method', () => {
      renderCheckoutModal();
      expect(screen.getByText('Card Number *')).toBeInTheDocument();
    });

    test('switches to NEQUI payment method', () => {
      renderCheckoutModal();
      const nequiButton = screen.getByText('Nequi');
      fireEvent.click(nequiButton);
      expect(screen.getByText('Nequi Phone Number *')).toBeInTheDocument();
    });

    test('displays test card information for CARD method', () => {
      renderCheckoutModal();
      expect(screen.getByText(/4242 4242 4242 4242/)).toBeInTheDocument();
    });

    test('displays test Nequi numbers when NEQUI selected', () => {
      renderCheckoutModal();
      const nequiButton = screen.getByText('Nequi');
      fireEvent.click(nequiButton);
      expect(screen.getByText(/3991111111/)).toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    test('shows error when customer info is missing', async () => {
      renderCheckoutModal();
      const submitButton = screen.getByText('Complete Payment');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please fill in all customer information/i)).toBeInTheDocument();
      });
    });

    test('shows error when card info is missing', async () => {
      renderCheckoutModal();

      // Fill customer info
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'john@test.com' },
      });
      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: '+573001234567' },
      });

      const submitButton = screen.getByText('Complete Payment');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please fill in all card information/i)).toBeInTheDocument();
      });
    });

    test('shows error for invalid card number length', async () => {
      renderCheckoutModal();

      // Fill all fields
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'john@test.com' },
      });
      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: '+573001234567' },
      });
      fireEvent.change(screen.getByLabelText(/card number/i), {
        target: { value: '1234' }, // Too short
      });
      fireEvent.change(screen.getByLabelText(/card holder/i), {
        target: { value: 'JOHN DOE' },
      });
      fireEvent.change(screen.getByLabelText(/exp\. month/i), {
        target: { value: '12' },
      });
      fireEvent.change(screen.getByLabelText(/exp\. year/i), {
        target: { value: '28' },
      });
      fireEvent.change(screen.getByLabelText(/cvc/i), {
        target: { value: '123' },
      });

      const submitButton = screen.getByText('Complete Payment');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid card number/i)).toBeInTheDocument();
      });
    });

    test('shows error for invalid CVC', async () => {
      renderCheckoutModal();

      // Fill all fields with invalid CVC
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'john@test.com' },
      });
      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: '+573001234567' },
      });
      fireEvent.change(screen.getByLabelText(/card number/i), {
        target: { value: '4242424242424242' },
      });
      fireEvent.change(screen.getByLabelText(/card holder/i), {
        target: { value: 'JOHN DOE' },
      });
      fireEvent.change(screen.getByLabelText(/exp\. month/i), {
        target: { value: '12' },
      });
      fireEvent.change(screen.getByLabelText(/exp\. year/i), {
        target: { value: '28' },
      });
      fireEvent.change(screen.getByLabelText(/cvc/i), {
        target: { value: '12' }, // Too short
      });

      const submitButton = screen.getByText('Complete Payment');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid cvc/i)).toBeInTheDocument();
      });
    });

    test('shows error for invalid Nequi phone length', async () => {
      renderCheckoutModal();

      // Switch to Nequi
      const nequiButton = screen.getByText('Nequi');
      fireEvent.click(nequiButton);

      // Fill customer info
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'john@test.com' },
      });
      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: '+573001234567' },
      });
      fireEvent.change(screen.getByLabelText(/nequi phone number/i), {
        target: { value: '123' }, // Too short
      });

      const submitButton = screen.getByText('Complete Payment');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/nequi phone number must be 10 digits/i)).toBeInTheDocument();
      });
    });
  });

  describe('Card type detection', () => {
    test('detects Visa card', () => {
      renderCheckoutModal();
      const cardInput = screen.getByLabelText(/card number/i);

      fireEvent.change(cardInput, {
        target: { value: '4242424242424242' },
      });

      expect(screen.getByText('Visa')).toBeInTheDocument();
    });

    test('detects Mastercard', () => {
      renderCheckoutModal();
      const cardInput = screen.getByLabelText(/card number/i);

      fireEvent.change(cardInput, {
        target: { value: '5555555555554444' },
      });

      expect(screen.getByText('Mastercard')).toBeInTheDocument();
    });
  });

  describe('Card tokenization and payment', () => {
    test('tokenizes card and creates order successfully', async () => {
      // Mock Wompi tokenization API
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: 'tok_test_12345',
          },
        }),
      });

      // Mock checkout service
      checkoutService.createOrder.mockResolvedValueOnce({
        success: true,
        order: {
          id: 1,
          reference: 'ORDER-123',
          status: 'approved',
        },
        transaction: {
          id: 'txn_123',
          status: 'APPROVED',
        },
      });

      renderCheckoutModal();

      // Fill customer info
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'john@test.com' },
      });
      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: '+573001234567' },
      });

      // Fill card info
      fireEvent.change(screen.getByLabelText(/card number/i), {
        target: { value: '4242424242424242' },
      });
      fireEvent.change(screen.getByLabelText(/card holder/i), {
        target: { value: 'JOHN DOE' },
      });
      fireEvent.change(screen.getByLabelText(/exp\. month/i), {
        target: { value: '12' },
      });
      fireEvent.change(screen.getByLabelText(/exp\. year/i), {
        target: { value: '28' },
      });
      fireEvent.change(screen.getByLabelText(/cvc/i), {
        target: { value: '123' },
      });

      const submitButton = screen.getByText('Complete Payment');
      fireEvent.click(submitButton);

      // Should show processing state
      await waitFor(() => {
        expect(screen.getByText('Processing Payment...')).toBeInTheDocument();
      });

      // Should call tokenization API
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://sandbox.wompi.co/v1/tokens/cards',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: expect.stringContaining('4242424242424242'),
          })
        );
      });

      // Should call createOrder with correct data
      await waitFor(() => {
        expect(checkoutService.createOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            customer_email: 'john@test.com',
            customer_name: 'John Doe',
            customer_phone: '+573001234567',
            payment_method: expect.objectContaining({
              type: 'CARD',
              token: 'tok_test_12345',
            }),
            items: expect.arrayContaining([
              expect.objectContaining({
                product_id: 1,
                name: 'Test Product',
                quantity: 2,
              }),
            ]),
          })
        );
      });

      // Should call onSuccess
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith('ORDER-123');
      });

      // Should close modal
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('handles tokenization error', async () => {
      // Mock failed tokenization
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            reason: 'Invalid card number',
          },
        }),
      });

      renderCheckoutModal();

      // Fill all fields
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'john@test.com' },
      });
      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: '+573001234567' },
      });
      fireEvent.change(screen.getByLabelText(/card number/i), {
        target: { value: '4242424242424242' },
      });
      fireEvent.change(screen.getByLabelText(/card holder/i), {
        target: { value: 'JOHN DOE' },
      });
      fireEvent.change(screen.getByLabelText(/exp\. month/i), {
        target: { value: '12' },
      });
      fireEvent.change(screen.getByLabelText(/exp\. year/i), {
        target: { value: '28' },
      });
      fireEvent.change(screen.getByLabelText(/cvc/i), {
        target: { value: '123' },
      });

      const submitButton = screen.getByText('Complete Payment');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid card number/i)).toBeInTheDocument();
      });
    });

    test('handles order creation error', async () => {
      // Mock successful tokenization
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: 'tok_test_12345' },
        }),
      });

      // Mock failed order creation
      checkoutService.createOrder.mockRejectedValueOnce(
        new Error('Failed to create order')
      );

      renderCheckoutModal();

      // Fill all fields
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'john@test.com' },
      });
      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: '+573001234567' },
      });
      fireEvent.change(screen.getByLabelText(/card number/i), {
        target: { value: '4242424242424242' },
      });
      fireEvent.change(screen.getByLabelText(/card holder/i), {
        target: { value: 'JOHN DOE' },
      });
      fireEvent.change(screen.getByLabelText(/exp\. month/i), {
        target: { value: '12' },
      });
      fireEvent.change(screen.getByLabelText(/exp\. year/i), {
        target: { value: '28' },
      });
      fireEvent.change(screen.getByLabelText(/cvc/i), {
        target: { value: '123' },
      });

      const submitButton = screen.getByText('Complete Payment');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to create order/i)).toBeInTheDocument();
      });
    });
  });

  describe('Input formatting', () => {
    test('formats card number with spaces', () => {
      renderCheckoutModal();
      const cardInput = screen.getByLabelText(/card number/i);

      fireEvent.change(cardInput, {
        target: { value: '4242424242424242' },
      });

      expect(cardInput.value).toBe('4242 4242 4242 4242');
    });

    test('converts card holder to uppercase', () => {
      renderCheckoutModal();
      const holderInput = screen.getByLabelText(/card holder/i);

      fireEvent.change(holderInput, {
        target: { value: 'john doe' },
      });

      expect(holderInput.value).toBe('JOHN DOE');
    });

    test('restricts month input to valid values', () => {
      renderCheckoutModal();
      const monthInput = screen.getByLabelText(/exp\. month/i);

      fireEvent.change(monthInput, {
        target: { value: '13' }, // Invalid month
      });

      expect(monthInput.value).toBe('1'); // Should only accept first digit
    });

    test('limits CVC to 4 digits', () => {
      renderCheckoutModal();
      const cvcInput = screen.getByLabelText(/cvc/i);

      fireEvent.change(cvcInput, {
        target: { value: '12345' },
      });

      expect(cvcInput.value).toBe('1234');
    });

    test('limits Nequi phone to 10 digits', () => {
      renderCheckoutModal();

      // Switch to Nequi
      const nequiButton = screen.getByText('Nequi');
      fireEvent.click(nequiButton);

      const phoneInput = screen.getByLabelText(/nequi phone number/i);

      fireEvent.change(phoneInput, {
        target: { value: '12345678901' }, // 11 digits
      });

      expect(phoneInput.value).toBe('1234567890'); // Should limit to 10
    });
  });

  describe('Nequi payment flow', () => {
    test('creates order with Nequi payment method', async () => {
      checkoutService.createOrder.mockResolvedValueOnce({
        success: true,
        order: {
          id: 1,
          reference: 'ORDER-456',
          status: 'processing',
        },
      });

      renderCheckoutModal();

      // Switch to Nequi
      const nequiButton = screen.getByText('Nequi');
      fireEvent.click(nequiButton);

      // Fill customer info
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'Jane Doe' },
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'jane@test.com' },
      });
      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: '+573007654321' },
      });
      fireEvent.change(screen.getByLabelText(/nequi phone number/i), {
        target: { value: '3991111111' },
      });

      const submitButton = screen.getByText('Complete Payment');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(checkoutService.createOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            payment_method: expect.objectContaining({
              type: 'NEQUI',
              phone_number: '3991111111',
            }),
          })
        );
      });
    });
  });
});
