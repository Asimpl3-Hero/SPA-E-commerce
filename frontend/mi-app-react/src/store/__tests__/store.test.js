import { store } from '../store';
import { addItem, removeItem, clearCart, toggleCart, setCartOpen } from '../cartSlice';

describe('Redux Store', () => {
  test('store is defined', () => {
    expect(store).toBeDefined();
  });

  test('store has getState method', () => {
    expect(store.getState).toBeDefined();
    expect(typeof store.getState).toBe('function');
  });

  test('store has dispatch method', () => {
    expect(store.dispatch).toBeDefined();
    expect(typeof store.dispatch).toBe('function');
  });

  test('store has subscribe method', () => {
    expect(store.subscribe).toBeDefined();
    expect(typeof store.subscribe).toBe('function');
  });

  test('initial state has cart property', () => {
    const state = store.getState();
    expect(state.cart).toBeDefined();
  });

  test('initial cart state is correct', () => {
    const state = store.getState();
    expect(state.cart.items).toEqual([]);
    expect(state.cart.isOpen).toBe(false);
  });

  test('can dispatch addItem action', () => {
    const product = { id: 1, name: 'Test Product', price: 100 };
    store.dispatch(addItem(product));

    const state = store.getState();
    expect(state.cart.items).toHaveLength(1);
    expect(state.cart.items[0].id).toBe(1);
  });

  test('can dispatch removeItem action', () => {
    store.dispatch(addItem({ id: 2, name: 'Product 2', price: 200 }));
    const stateBefore = store.getState();
    const lengthBefore = stateBefore.cart.items.length;

    store.dispatch(removeItem(2));

    const stateAfter = store.getState();
    expect(stateAfter.cart.items.length).toBe(lengthBefore - 1);
  });

  test('can dispatch clearCart action', () => {
    store.dispatch(addItem({ id: 3, name: 'Product 3', price: 300 }));
    store.dispatch(clearCart());

    const state = store.getState();
    expect(state.cart.items).toEqual([]);
  });

  test('can dispatch toggleCart action', () => {
    const stateBefore = store.getState();
    const isOpenBefore = stateBefore.cart.isOpen;

    store.dispatch(toggleCart());

    const stateAfter = store.getState();
    expect(stateAfter.cart.isOpen).toBe(!isOpenBefore);
  });

  test('can dispatch setCartOpen action', () => {
    store.dispatch(setCartOpen(true));
    expect(store.getState().cart.isOpen).toBe(true);

    store.dispatch(setCartOpen(false));
    expect(store.getState().cart.isOpen).toBe(false);
  });

  test('subscribe notifies listeners on state change', () => {
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);

    store.dispatch(addItem({ id: 4, name: 'Product 4', price: 400 }));

    expect(listener).toHaveBeenCalled();

    unsubscribe();
  });

  test('unsubscribe stops notifications', () => {
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    listener.mockClear();

    store.dispatch(addItem({ id: 5, name: 'Product 5', price: 500 }));

    expect(listener).not.toHaveBeenCalled();
  });

  test('multiple dispatches update state correctly', () => {
    store.dispatch(clearCart());

    store.dispatch(addItem({ id: 6, name: 'Product 6', price: 100 }));
    store.dispatch(addItem({ id: 7, name: 'Product 7', price: 200 }));
    store.dispatch(addItem({ id: 8, name: 'Product 8', price: 300 }));

    const state = store.getState();
    expect(state.cart.items).toHaveLength(3);
  });

  test('state is immutable', () => {
    const stateBefore = store.getState();
    const cartBefore = stateBefore.cart;

    store.dispatch(addItem({ id: 9, name: 'Product 9', price: 900 }));

    const stateAfter = store.getState();
    const cartAfter = stateAfter.cart;

    expect(cartBefore).not.toBe(cartAfter);
  });
});
