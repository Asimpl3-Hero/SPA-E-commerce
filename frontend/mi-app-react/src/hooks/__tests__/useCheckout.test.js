import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useCheckout } from '../useCheckout';
import cartReducer from '@/store/cartSlice';
import { STORAGE_KEYS } from '@/constants/config';

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      cart: cartReducer,
    },
    preloadedState: {
      cart: {
        items: [],
        isOpen: false,
        ...initialState,
      },
    },
  });
};

const wrapper = (store) => ({ children }) => (
  <Provider store={store}>{children}</Provider>
);

describe('useCheckout', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('initializes with default form data', () => {
    const store = createMockStore();
    const { result } = renderHook(() => useCheckout(), {
      wrapper: wrapper(store),
    });

    expect(result.current.formData.email).toBe('');
    expect(result.current.formData.country).toBe('United States');
    expect(result.current.formData.shippingMethod).toBe('standard');
    expect(result.current.errors).toEqual({});
  });

  test('loads saved checkout data from localStorage', () => {
    const savedData = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '5551234567',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'United States',
      shippingMethod: 'express',
      paymentMethod: 'credit_card',
    };

    localStorage.setItem(STORAGE_KEYS.CHECKOUT_DATA, JSON.stringify(savedData));

    const store = createMockStore();
    const { result } = renderHook(() => useCheckout(), {
      wrapper: wrapper(store),
    });

    expect(result.current.formData).toEqual(savedData);
  });

  test('updates field value', () => {
    const store = createMockStore();
    const { result } = renderHook(() => useCheckout(), {
      wrapper: wrapper(store),
    });

    act(() => {
      result.current.updateField('email', 'test@example.com');
    });

    expect(result.current.formData.email).toBe('test@example.com');

    // Check localStorage was updated
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHECKOUT_DATA));
    expect(saved.email).toBe('test@example.com');
  });

  test('clears error when field is updated', () => {
    const store = createMockStore();
    const { result } = renderHook(() => useCheckout(), {
      wrapper: wrapper(store),
    });

    // Trigger validation to set errors
    act(() => {
      result.current.validateForm();
    });

    expect(result.current.errors.email).toBeDefined();

    // Update field should clear error
    act(() => {
      result.current.updateField('email', 'test@example.com');
    });

    expect(result.current.errors.email).toBeUndefined();
  });

  test('validates required fields', () => {
    const store = createMockStore();
    const { result } = renderHook(() => useCheckout(), {
      wrapper: wrapper(store),
    });

    act(() => {
      const isValid = result.current.validateForm();
      expect(isValid).toBe(false);
    });

    expect(result.current.errors.email).toBe('Email is required');
    expect(result.current.errors.firstName).toBe('First name is required');
    expect(result.current.errors.lastName).toBe('Last name is required');
    expect(result.current.errors.phone).toBe('Phone number is required');
    expect(result.current.errors.address).toBe('Address is required');
    expect(result.current.errors.city).toBe('City is required');
    expect(result.current.errors.state).toBe('State is required');
    expect(result.current.errors.zipCode).toBe('Zip code is required');
  });

  test('validates email format', () => {
    const store = createMockStore();
    const { result } = renderHook(() => useCheckout(), {
      wrapper: wrapper(store),
    });

    // Update all fields first, then validate
    act(() => {
      result.current.updateField('email', 'invalid-email');
      result.current.updateField('firstName', 'John');
      result.current.updateField('lastName', 'Doe');
      result.current.updateField('phone', '5551234567');
      result.current.updateField('address', '123 Main St');
      result.current.updateField('city', 'New York');
      result.current.updateField('state', 'NY');
      result.current.updateField('zipCode', '10001');
    });

    act(() => {
      result.current.validateForm();
    });

    expect(result.current.errors.email).toBe('Please enter a valid email address');
  });

  test('validates phone format', () => {
    const store = createMockStore();
    const { result } = renderHook(() => useCheckout(), {
      wrapper: wrapper(store),
    });

    // Fill other required fields first
    act(() => {
      result.current.updateField('email', 'test@example.com');
      result.current.updateField('firstName', 'John');
      result.current.updateField('lastName', 'Doe');
      result.current.updateField('phone', '123');
      result.current.updateField('address', '123 Main St');
      result.current.updateField('city', 'New York');
      result.current.updateField('state', 'NY');
      result.current.updateField('zipCode', '10001');
    });

    act(() => {
      result.current.validateForm();
    });

    expect(result.current.errors.phone).toBe(
      'Please enter a valid 10-digit phone number'
    );
  });

  test('validates zip code format', () => {
    const store = createMockStore();
    const { result } = renderHook(() => useCheckout(), {
      wrapper: wrapper(store),
    });

    // Fill other required fields first
    act(() => {
      result.current.updateField('email', 'test@example.com');
      result.current.updateField('firstName', 'John');
      result.current.updateField('lastName', 'Doe');
      result.current.updateField('phone', '5551234567');
      result.current.updateField('address', '123 Main St');
      result.current.updateField('city', 'New York');
      result.current.updateField('state', 'NY');
      result.current.updateField('zipCode', '123');
    });

    act(() => {
      result.current.validateForm();
    });

    expect(result.current.errors.zipCode).toBe('Please enter a valid zip code');
  });

  test('submits checkout with valid data', async () => {
    const store = createMockStore({
      items: [
        { id: 1, name: 'Product 1', price: 100, quantity: 2, image: '/test.jpg' },
      ],
    });

    const { result } = renderHook(() => useCheckout(), {
      wrapper: wrapper(store),
    });

    // Fill valid form data
    act(() => {
      result.current.updateField('email', 'test@example.com');
      result.current.updateField('firstName', 'John');
      result.current.updateField('lastName', 'Doe');
      result.current.updateField('phone', '5551234567');
      result.current.updateField('address', '123 Main St');
      result.current.updateField('city', 'New York');
      result.current.updateField('state', 'NY');
      result.current.updateField('zipCode', '10001');
    });

    let response;
    await act(async () => {
      response = await result.current.submitCheckout();
    });

    expect(response.success).toBe(true);
    expect(response.orderId).toBeDefined();
    expect(result.current.orderSuccess).toBe(true);
    expect(result.current.orderId).toBeDefined();
  });

  test('fails to submit with invalid data', async () => {
    const store = createMockStore({
      items: [{ id: 1, name: 'Product 1', price: 100, quantity: 1 }],
    });

    const { result } = renderHook(() => useCheckout(), {
      wrapper: wrapper(store),
    });

    let response;
    await act(async () => {
      response = await result.current.submitCheckout();
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe('Please fix the errors in the form');
  });

  test('fails to submit with empty cart', async () => {
    const store = createMockStore({ items: [] });

    const { result } = renderHook(() => useCheckout(), {
      wrapper: wrapper(store),
    });

    // Fill valid form data
    act(() => {
      result.current.updateField('email', 'test@example.com');
      result.current.updateField('firstName', 'John');
      result.current.updateField('lastName', 'Doe');
      result.current.updateField('phone', '5551234567');
      result.current.updateField('address', '123 Main St');
      result.current.updateField('city', 'New York');
      result.current.updateField('state', 'NY');
      result.current.updateField('zipCode', '10001');
    });

    let response;
    await act(async () => {
      response = await result.current.submitCheckout();
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe('Your cart is empty');
  });

  test('resets checkout form', () => {
    const store = createMockStore();
    const { result } = renderHook(() => useCheckout(), {
      wrapper: wrapper(store),
    });

    // Update some fields
    act(() => {
      result.current.updateField('email', 'test@example.com');
      result.current.updateField('firstName', 'John');
    });

    expect(result.current.formData.email).toBe('test@example.com');

    // Reset form
    act(() => {
      result.current.resetCheckout();
    });

    expect(result.current.formData.email).toBe('');
    expect(result.current.formData.firstName).toBe('');
    expect(result.current.errors).toEqual({});
    expect(localStorage.getItem(STORAGE_KEYS.CHECKOUT_DATA)).toBeNull();
  });

  test('gets order summary', () => {
    const store = createMockStore({
      items: [
        { id: 1, name: 'Product 1', price: 100, quantity: 2, image: '/test.jpg' },
        { id: 2, name: 'Product 2', price: 50, quantity: 1, image: '/test2.jpg' },
      ],
    });

    const { result } = renderHook(() => useCheckout(), {
      wrapper: wrapper(store),
    });

    act(() => {
      result.current.updateField('email', 'test@example.com');
      result.current.updateField('firstName', 'John');
      result.current.updateField('lastName', 'Doe');
    });

    const summary = result.current.getOrderSummary();

    expect(summary.items).toHaveLength(2);
    expect(summary.subtotal).toBe(250);
    expect(summary.customer.email).toBe('test@example.com');
    expect(summary.customer.name).toBe('John Doe');
  });

  test('has correct item count and total', () => {
    const store = createMockStore({
      items: [
        { id: 1, name: 'Product 1', price: 100, quantity: 2 },
        { id: 2, name: 'Product 2', price: 50, quantity: 1 },
      ],
    });

    const { result } = renderHook(() => useCheckout(), {
      wrapper: wrapper(store),
    });

    expect(result.current.hasItems).toBe(true);
    expect(result.current.itemCount).toBe(2);
    expect(result.current.total).toBe(250);
  });
});
