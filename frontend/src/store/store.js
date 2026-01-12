import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import { STORAGE_KEYS } from '@/constants/config';

/**
 * Load cart state from localStorage
 */
const loadCartFromStorage = () => {
  try {
    const serializedCart = localStorage.getItem(STORAGE_KEYS.CART);
    if (serializedCart === null) {
      return undefined;
    }
    return JSON.parse(serializedCart);
  } catch (err) {
    console.error('Error loading cart from localStorage:', err);
    return undefined;
  }
};

/**
 * Save cart state to localStorage
 */
const saveCartToStorage = (cartState) => {
  try {
    const serializedCart = JSON.stringify(cartState);
    localStorage.setItem(STORAGE_KEYS.CART, serializedCart);
  } catch (err) {
    console.error('Error saving cart to localStorage:', err);
  }
};

/**
 * Redux store with cart persistence
 */
export const store = configureStore({
  reducer: {
    cart: cartReducer,
  },
  preloadedState: {
    cart: loadCartFromStorage(),
  },
});

/**
 * Subscribe to store changes and persist cart state
 */
store.subscribe(() => {
  const state = store.getState();
  saveCartToStorage(state.cart);
});
