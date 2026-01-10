import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useCart } from '../useCart';
import cartReducer from '@/store/cartSlice';

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

describe('useCart', () => {
  test('returns empty cart initially', () => {
    const store = createMockStore();
    const { result } = renderHook(() => useCart(), {
      wrapper: wrapper(store),
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPrice).toBe(0);
  });

  test('adds item to cart', () => {
    const store = createMockStore();
    const { result } = renderHook(() => useCart(), {
      wrapper: wrapper(store),
    });

    const product = { id: 1, name: 'Product 1', price: 100 };

    act(() => {
      result.current.addToCart(product);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe(1);
    expect(result.current.totalItems).toBe(1);
  });

  test('removes item from cart', () => {
    const store = createMockStore({
      items: [{ id: 1, name: 'Product 1', price: 100, quantity: 1 }],
    });
    const { result } = renderHook(() => useCart(), {
      wrapper: wrapper(store),
    });

    act(() => {
      result.current.removeFromCart(1);
    });

    expect(result.current.items).toHaveLength(0);
  });

  test('updates item quantity', () => {
    const store = createMockStore({
      items: [{ id: 1, name: 'Product 1', price: 100, quantity: 1 }],
    });
    const { result } = renderHook(() => useCart(), {
      wrapper: wrapper(store),
    });

    act(() => {
      result.current.updateItemQuantity(1, 5);
    });

    expect(result.current.items[0].quantity).toBe(5);
  });

  test('increments item quantity', () => {
    const store = createMockStore({
      items: [{ id: 1, name: 'Product 1', price: 100, quantity: 2 }],
    });
    const { result } = renderHook(() => useCart(), {
      wrapper: wrapper(store),
    });

    act(() => {
      result.current.incrementQuantity(1);
    });

    expect(result.current.items[0].quantity).toBe(3);
  });

  test('decrements item quantity', () => {
    const store = createMockStore({
      items: [{ id: 1, name: 'Product 1', price: 100, quantity: 3 }],
    });
    const { result } = renderHook(() => useCart(), {
      wrapper: wrapper(store),
    });

    act(() => {
      result.current.decrementQuantity(1);
    });

    expect(result.current.items[0].quantity).toBe(2);
  });

  test('removes item when decrementing quantity to 0', () => {
    const store = createMockStore({
      items: [{ id: 1, name: 'Product 1', price: 100, quantity: 1 }],
    });
    const { result } = renderHook(() => useCart(), {
      wrapper: wrapper(store),
    });

    act(() => {
      result.current.decrementQuantity(1);
    });

    expect(result.current.items).toHaveLength(0);
  });

  test('empties cart', () => {
    const store = createMockStore({
      items: [
        { id: 1, name: 'Product 1', price: 100, quantity: 1 },
        { id: 2, name: 'Product 2', price: 200, quantity: 2 },
      ],
    });
    const { result } = renderHook(() => useCart(), {
      wrapper: wrapper(store),
    });

    act(() => {
      result.current.emptyCart();
    });

    expect(result.current.items).toHaveLength(0);
  });

  test('opens and closes cart', () => {
    const store = createMockStore();
    const { result } = renderHook(() => useCart(), {
      wrapper: wrapper(store),
    });

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.openCart();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.closeCart();
    });

    expect(result.current.isOpen).toBe(false);
  });

  test('toggles cart', () => {
    const store = createMockStore();
    const { result } = renderHook(() => useCart(), {
      wrapper: wrapper(store),
    });

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isOpen).toBe(false);
  });

  test('gets item quantity', () => {
    const store = createMockStore({
      items: [{ id: 1, name: 'Product 1', price: 100, quantity: 5 }],
    });
    const { result } = renderHook(() => useCart(), {
      wrapper: wrapper(store),
    });

    expect(result.current.getItemQuantity(1)).toBe(5);
    expect(result.current.getItemQuantity(999)).toBe(0);
  });

  test('checks if item is in cart', () => {
    const store = createMockStore({
      items: [{ id: 1, name: 'Product 1', price: 100, quantity: 1 }],
    });
    const { result } = renderHook(() => useCart(), {
      wrapper: wrapper(store),
    });

    expect(result.current.isInCart(1)).toBe(true);
    expect(result.current.isInCart(999)).toBe(false);
  });

  test('calculates cart summary', () => {
    const store = createMockStore({
      items: [
        { id: 1, name: 'Product 1', price: 100, quantity: 2 },
        { id: 2, name: 'Product 2', price: 50, quantity: 1 },
      ],
    });
    const { result } = renderHook(() => useCart(), {
      wrapper: wrapper(store),
    });

    const summary = result.current.getCartSummary();

    expect(summary.subtotal).toBe(250);
    expect(summary.shipping).toBe(0); // Free shipping over $250
    expect(summary.tax).toBeCloseTo(25, 2);
    expect(summary.total).toBeCloseTo(275, 2);
    expect(summary.itemCount).toBe(3);
    expect(summary.freeShipping).toBe(true);
    expect(summary.amountUntilFreeShipping).toBe(0);
  });

  test('calculates shipping cost when below threshold', () => {
    const store = createMockStore({
      items: [{ id: 1, name: 'Product 1', price: 100, quantity: 1 }],
    });
    const { result } = renderHook(() => useCart(), {
      wrapper: wrapper(store),
    });

    const summary = result.current.getCartSummary();

    expect(summary.subtotal).toBe(100);
    expect(summary.shipping).toBe(10);
    expect(summary.freeShipping).toBe(false);
    expect(summary.amountUntilFreeShipping).toBe(150);
  });

  test('calculates total price correctly', () => {
    const store = createMockStore({
      items: [
        { id: 1, name: 'Product 1', price: 50, quantity: 2 },
        { id: 2, name: 'Product 2', price: 75, quantity: 3 },
      ],
    });
    const { result } = renderHook(() => useCart(), {
      wrapper: wrapper(store),
    });

    expect(result.current.totalPrice).toBe(325);
    expect(result.current.totalItems).toBe(5);
  });
});
