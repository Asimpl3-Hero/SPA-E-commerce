import cartReducer, {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  toggleCart,
  setCartOpen,
  selectCartItems,
  selectIsCartOpen,
  selectTotalItems,
  selectCartTotal,
} from '../cartSlice';

describe('cartSlice', () => {
  const initialState = {
    items: [],
    isOpen: false,
  };

  describe('reducer', () => {
    test('should return initial state', () => {
      expect(cartReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    describe('addItem', () => {
      test('adds new item to empty cart', () => {
        const product = { id: 1, name: 'Product 1', price: 100 };
        const state = cartReducer(initialState, addItem(product));

        expect(state.items).toHaveLength(1);
        expect(state.items[0]).toEqual({ ...product, quantity: 1 });
      });

      test('increments quantity when adding existing item', () => {
        const product = { id: 1, name: 'Product 1', price: 100 };
        const existingState = {
          items: [{ ...product, quantity: 2 }],
          isOpen: false,
        };
        const state = cartReducer(existingState, addItem(product));

        expect(state.items).toHaveLength(1);
        expect(state.items[0].quantity).toBe(3);
      });

      test('adds multiple different items', () => {
        const product1 = { id: 1, name: 'Product 1', price: 100 };
        const product2 = { id: 2, name: 'Product 2', price: 200 };

        let state = cartReducer(initialState, addItem(product1));
        state = cartReducer(state, addItem(product2));

        expect(state.items).toHaveLength(2);
        expect(state.items[0].id).toBe(1);
        expect(state.items[1].id).toBe(2);
      });

      test('preserves item properties when adding', () => {
        const product = {
          id: 1,
          name: 'Product 1',
          price: 100,
          image: '/test.jpg',
          category: 'Electronics',
        };
        const state = cartReducer(initialState, addItem(product));

        expect(state.items[0]).toEqual({ ...product, quantity: 1 });
      });
    });

    describe('removeItem', () => {
      test('removes item from cart', () => {
        const existingState = {
          items: [
            { id: 1, name: 'Product 1', price: 100, quantity: 1 },
            { id: 2, name: 'Product 2', price: 200, quantity: 1 },
          ],
          isOpen: false,
        };
        const state = cartReducer(existingState, removeItem(1));

        expect(state.items).toHaveLength(1);
        expect(state.items[0].id).toBe(2);
      });

      test('does nothing when removing non-existent item', () => {
        const existingState = {
          items: [{ id: 1, name: 'Product 1', price: 100, quantity: 1 }],
          isOpen: false,
        };
        const state = cartReducer(existingState, removeItem(999));

        expect(state.items).toHaveLength(1);
        expect(state.items[0].id).toBe(1);
      });

      test('can remove all items one by one', () => {
        const existingState = {
          items: [
            { id: 1, name: 'Product 1', price: 100, quantity: 1 },
            { id: 2, name: 'Product 2', price: 200, quantity: 1 },
          ],
          isOpen: false,
        };

        let state = cartReducer(existingState, removeItem(1));
        expect(state.items).toHaveLength(1);

        state = cartReducer(state, removeItem(2));
        expect(state.items).toHaveLength(0);
      });
    });

    describe('updateQuantity', () => {
      test('updates item quantity', () => {
        const existingState = {
          items: [{ id: 1, name: 'Product 1', price: 100, quantity: 2 }],
          isOpen: false,
        };
        const state = cartReducer(
          existingState,
          updateQuantity({ id: 1, quantity: 5 })
        );

        expect(state.items[0].quantity).toBe(5);
      });

      test('removes item when quantity is set to 0', () => {
        const existingState = {
          items: [{ id: 1, name: 'Product 1', price: 100, quantity: 2 }],
          isOpen: false,
        };
        const state = cartReducer(
          existingState,
          updateQuantity({ id: 1, quantity: 0 })
        );

        expect(state.items).toHaveLength(0);
      });

      test('removes item when quantity is negative', () => {
        const existingState = {
          items: [{ id: 1, name: 'Product 1', price: 100, quantity: 2 }],
          isOpen: false,
        };
        const state = cartReducer(
          existingState,
          updateQuantity({ id: 1, quantity: -1 })
        );

        expect(state.items).toHaveLength(0);
      });

      test('does nothing when updating non-existent item', () => {
        const existingState = {
          items: [{ id: 1, name: 'Product 1', price: 100, quantity: 2 }],
          isOpen: false,
        };
        const state = cartReducer(
          existingState,
          updateQuantity({ id: 999, quantity: 5 })
        );

        expect(state.items).toHaveLength(1);
        expect(state.items[0].quantity).toBe(2);
      });

      test('can update quantity to 1', () => {
        const existingState = {
          items: [{ id: 1, name: 'Product 1', price: 100, quantity: 5 }],
          isOpen: false,
        };
        const state = cartReducer(
          existingState,
          updateQuantity({ id: 1, quantity: 1 })
        );

        expect(state.items[0].quantity).toBe(1);
      });
    });

    describe('clearCart', () => {
      test('clears all items from cart', () => {
        const existingState = {
          items: [
            { id: 1, name: 'Product 1', price: 100, quantity: 1 },
            { id: 2, name: 'Product 2', price: 200, quantity: 2 },
            { id: 3, name: 'Product 3', price: 300, quantity: 3 },
          ],
          isOpen: false,
        };
        const state = cartReducer(existingState, clearCart());

        expect(state.items).toHaveLength(0);
        expect(state.items).toEqual([]);
      });

      test('does nothing when cart is already empty', () => {
        const state = cartReducer(initialState, clearCart());

        expect(state.items).toHaveLength(0);
        expect(state.items).toEqual([]);
      });

      test('preserves isOpen state when clearing', () => {
        const existingState = {
          items: [{ id: 1, name: 'Product 1', price: 100, quantity: 1 }],
          isOpen: true,
        };
        const state = cartReducer(existingState, clearCart());

        expect(state.items).toHaveLength(0);
        expect(state.isOpen).toBe(true);
      });
    });

    describe('toggleCart', () => {
      test('toggles cart from closed to open', () => {
        const state = cartReducer(initialState, toggleCart());
        expect(state.isOpen).toBe(true);
      });

      test('toggles cart from open to closed', () => {
        const openState = { items: [], isOpen: true };
        const state = cartReducer(openState, toggleCart());
        expect(state.isOpen).toBe(false);
      });

      test('can toggle multiple times', () => {
        let state = cartReducer(initialState, toggleCart());
        expect(state.isOpen).toBe(true);

        state = cartReducer(state, toggleCart());
        expect(state.isOpen).toBe(false);

        state = cartReducer(state, toggleCart());
        expect(state.isOpen).toBe(true);
      });

      test('preserves items when toggling', () => {
        const existingState = {
          items: [{ id: 1, name: 'Product 1', price: 100, quantity: 1 }],
          isOpen: false,
        };
        const state = cartReducer(existingState, toggleCart());

        expect(state.items).toHaveLength(1);
        expect(state.isOpen).toBe(true);
      });
    });

    describe('setCartOpen', () => {
      test('sets cart to open', () => {
        const state = cartReducer(initialState, setCartOpen(true));
        expect(state.isOpen).toBe(true);
      });

      test('sets cart to closed', () => {
        const openState = { items: [], isOpen: true };
        const state = cartReducer(openState, setCartOpen(false));
        expect(state.isOpen).toBe(false);
      });

      test('can set to same state', () => {
        const state = cartReducer(initialState, setCartOpen(false));
        expect(state.isOpen).toBe(false);
      });

      test('preserves items when setting state', () => {
        const existingState = {
          items: [{ id: 1, name: 'Product 1', price: 100, quantity: 1 }],
          isOpen: false,
        };
        const state = cartReducer(existingState, setCartOpen(true));

        expect(state.items).toHaveLength(1);
        expect(state.isOpen).toBe(true);
      });
    });
  });

  describe('selectors', () => {
    describe('selectCartItems', () => {
      test('returns empty array for initial state', () => {
        const state = { cart: initialState };
        expect(selectCartItems(state)).toEqual([]);
      });

      test('returns cart items', () => {
        const state = {
          cart: {
            items: [
              { id: 1, name: 'Product 1', price: 100, quantity: 1 },
              { id: 2, name: 'Product 2', price: 200, quantity: 2 },
            ],
            isOpen: false,
          },
        };
        const items = selectCartItems(state);

        expect(items).toHaveLength(2);
        expect(items[0].id).toBe(1);
        expect(items[1].id).toBe(2);
      });
    });

    describe('selectIsCartOpen', () => {
      test('returns false for initial state', () => {
        const state = { cart: initialState };
        expect(selectIsCartOpen(state)).toBe(false);
      });

      test('returns true when cart is open', () => {
        const state = { cart: { items: [], isOpen: true } };
        expect(selectIsCartOpen(state)).toBe(true);
      });

      test('returns false when cart is closed', () => {
        const state = { cart: { items: [], isOpen: false } };
        expect(selectIsCartOpen(state)).toBe(false);
      });
    });

    describe('selectTotalItems', () => {
      test('returns 0 for empty cart', () => {
        const state = { cart: initialState };
        expect(selectTotalItems(state)).toBe(0);
      });

      test('returns total quantity of single item', () => {
        const state = {
          cart: {
            items: [{ id: 1, name: 'Product 1', price: 100, quantity: 5 }],
            isOpen: false,
          },
        };
        expect(selectTotalItems(state)).toBe(5);
      });

      test('returns sum of quantities for multiple items', () => {
        const state = {
          cart: {
            items: [
              { id: 1, name: 'Product 1', price: 100, quantity: 2 },
              { id: 2, name: 'Product 2', price: 200, quantity: 3 },
              { id: 3, name: 'Product 3', price: 300, quantity: 1 },
            ],
            isOpen: false,
          },
        };
        expect(selectTotalItems(state)).toBe(6);
      });

      test('handles item with quantity 1', () => {
        const state = {
          cart: {
            items: [{ id: 1, name: 'Product 1', price: 100, quantity: 1 }],
            isOpen: false,
          },
        };
        expect(selectTotalItems(state)).toBe(1);
      });
    });

    describe('selectCartTotal', () => {
      test('returns 0 for empty cart', () => {
        const state = { cart: initialState };
        expect(selectCartTotal(state)).toBe(0);
      });

      test('calculates total for single item', () => {
        const state = {
          cart: {
            items: [{ id: 1, name: 'Product 1', price: 100, quantity: 2 }],
            isOpen: false,
          },
        };
        expect(selectCartTotal(state)).toBe(200);
      });

      test('calculates total for multiple items', () => {
        const state = {
          cart: {
            items: [
              { id: 1, name: 'Product 1', price: 100, quantity: 2 },
              { id: 2, name: 'Product 2', price: 50, quantity: 3 },
              { id: 3, name: 'Product 3', price: 25, quantity: 4 },
            ],
            isOpen: false,
          },
        };
        expect(selectCartTotal(state)).toBe(450);
      });

      test('handles decimal prices', () => {
        const state = {
          cart: {
            items: [
              { id: 1, name: 'Product 1', price: 99.99, quantity: 1 },
              { id: 2, name: 'Product 2', price: 49.99, quantity: 2 },
            ],
            isOpen: false,
          },
        };
        expect(selectCartTotal(state)).toBeCloseTo(199.97, 2);
      });

      test('calculates correctly with quantity 1', () => {
        const state = {
          cart: {
            items: [{ id: 1, name: 'Product 1', price: 150, quantity: 1 }],
            isOpen: false,
          },
        };
        expect(selectCartTotal(state)).toBe(150);
      });
    });
  });

  describe('complex scenarios', () => {
    test('add, update, and remove workflow', () => {
      const product = { id: 1, name: 'Product 1', price: 100 };

      let state = cartReducer(initialState, addItem(product));
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(1);

      state = cartReducer(state, updateQuantity({ id: 1, quantity: 5 }));
      expect(state.items[0].quantity).toBe(5);

      state = cartReducer(state, removeItem(1));
      expect(state.items).toHaveLength(0);
    });

    test('add multiple items, clear, and verify empty', () => {
      let state = initialState;

      state = cartReducer(state, addItem({ id: 1, name: 'Product 1', price: 100 }));
      state = cartReducer(state, addItem({ id: 2, name: 'Product 2', price: 200 }));
      state = cartReducer(state, addItem({ id: 3, name: 'Product 3', price: 300 }));

      expect(state.items).toHaveLength(3);

      state = cartReducer(state, clearCart());
      expect(state.items).toHaveLength(0);
    });

    test('cart state persists across operations', () => {
      let state = initialState;

      state = cartReducer(state, setCartOpen(true));
      expect(state.isOpen).toBe(true);

      state = cartReducer(state, addItem({ id: 1, name: 'Product 1', price: 100 }));
      expect(state.isOpen).toBe(true);
      expect(state.items).toHaveLength(1);

      state = cartReducer(state, clearCart());
      expect(state.isOpen).toBe(true);
      expect(state.items).toHaveLength(0);
    });
  });
});
