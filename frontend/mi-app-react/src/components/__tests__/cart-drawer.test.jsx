import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CartDrawer } from '../cart-drawer';
import cartReducer from '@/store/cartSlice';

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      cart: cartReducer,
    },
    preloadedState: initialState,
  });
};

const renderWithStore = (initialState) => {
  const store = createMockStore(initialState);
  return { store, ...render(<Provider store={store}><CartDrawer /></Provider>) };
};

describe('CartDrawer Component', () => {
  beforeEach(() => {
    document.body.style.overflow = 'unset';
  });

  afterEach(() => {
    document.body.style.overflow = 'unset';
  });

  test('renders nothing when cart is closed', () => {
    renderWithStore({
      cart: { items: [], isOpen: false },
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('renders drawer when cart is open', () => {
    renderWithStore({
      cart: { items: [], isOpen: true },
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('renders cart title', () => {
    renderWithStore({
      cart: { items: [], isOpen: true },
    });
    expect(screen.getByText('Your Cart')).toBeInTheDocument();
  });

  test('renders close button with aria-label', () => {
    renderWithStore({
      cart: { items: [], isOpen: true },
    });
    expect(screen.getByRole('button', { name: /close cart/i })).toBeInTheDocument();
  });

  test('closes drawer when close button is clicked', () => {
    const { store } = renderWithStore({
      cart: { items: [], isOpen: true },
    });

    const closeButton = screen.getByRole('button', { name: /close cart/i });
    fireEvent.click(closeButton);

    expect(store.getState().cart.isOpen).toBe(false);
  });

  test('closes drawer when backdrop is clicked', () => {
    const { store, container } = renderWithStore({
      cart: { items: [], isOpen: true },
    });

    const backdrop = container.querySelector('.cart-drawer-backdrop');
    fireEvent.click(backdrop);

    expect(store.getState().cart.isOpen).toBe(false);
  });

  test('locks body scroll when drawer is open', () => {
    renderWithStore({
      cart: { items: [], isOpen: true },
    });

    expect(document.body.style.overflow).toBe('hidden');
  });

  test('unlocks body scroll when drawer is closed', () => {
    const { rerender } = renderWithStore({
      cart: { items: [], isOpen: true },
    });

    expect(document.body.style.overflow).toBe('hidden');

    const newStore = createMockStore({ cart: { items: [], isOpen: false } });
    rerender(<Provider store={newStore}><CartDrawer /></Provider>);

    expect(document.body.style.overflow).toBe('unset');
  });

  test('renders empty state when cart has no items', () => {
    renderWithStore({
      cart: { items: [], isOpen: true },
    });

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue shopping/i })).toBeInTheDocument();
  });

  test('renders ShoppingBag icon in empty state', () => {
    const { container } = renderWithStore({
      cart: { items: [], isOpen: true },
    });

    const emptyIconWrapper = container.querySelector('.cart-drawer-empty-icon-wrapper');
    expect(emptyIconWrapper.querySelector('svg')).toBeInTheDocument();
  });

  test('closes drawer when Continue Shopping is clicked', () => {
    const { store } = renderWithStore({
      cart: { items: [], isOpen: true },
    });

    const continueButton = screen.getByRole('button', { name: /continue shopping/i });
    fireEvent.click(continueButton);

    expect(store.getState().cart.isOpen).toBe(false);
  });

  test('renders cart items when cart has items', () => {
    renderWithStore({
      cart: {
        items: [
          { id: 1, name: 'Product 1', price: 100, quantity: 2, image: '/product1.jpg' },
        ],
        isOpen: true,
      },
    });

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('renders multiple cart items', () => {
    renderWithStore({
      cart: {
        items: [
          { id: 1, name: 'Product 1', price: 100, quantity: 1, image: '/product1.jpg' },
          { id: 2, name: 'Product 2', price: 200, quantity: 2, image: '/product2.jpg' },
        ],
        isOpen: true,
      },
    });

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
  });

  test('renders product image with correct src and alt', () => {
    renderWithStore({
      cart: {
        items: [
          { id: 1, name: 'Test Product', price: 100, quantity: 1, image: '/test.jpg' },
        ],
        isOpen: true,
      },
    });

    const image = screen.getByAltText('Test Product');
    expect(image).toHaveAttribute('src', '/test.jpg');
  });

  test('renders placeholder image when no image is provided', () => {
    renderWithStore({
      cart: {
        items: [
          { id: 1, name: 'No Image Product', price: 100, quantity: 1 },
        ],
        isOpen: true,
      },
    });

    const image = screen.getByAltText('No Image Product');
    expect(image).toHaveAttribute('src', '/placeholder.svg');
  });

  test('increases quantity when plus button is clicked', () => {
    const { store } = renderWithStore({
      cart: {
        items: [
          { id: 1, name: 'Product 1', price: 100, quantity: 2, image: '/product1.jpg' },
        ],
        isOpen: true,
      },
    });

    const increaseButton = screen.getByRole('button', { name: /increase quantity/i });
    fireEvent.click(increaseButton);

    expect(store.getState().cart.items[0].quantity).toBe(3);
  });

  test('decreases quantity when minus button is clicked', () => {
    const { store } = renderWithStore({
      cart: {
        items: [
          { id: 1, name: 'Product 1', price: 100, quantity: 3, image: '/product1.jpg' },
        ],
        isOpen: true,
      },
    });

    const decreaseButton = screen.getByRole('button', { name: /decrease quantity/i });
    fireEvent.click(decreaseButton);

    expect(store.getState().cart.items[0].quantity).toBe(2);
  });

  test('removes item when quantity is decreased to 0', () => {
    const { store } = renderWithStore({
      cart: {
        items: [
          { id: 1, name: 'Product 1', price: 100, quantity: 1, image: '/product1.jpg' },
        ],
        isOpen: true,
      },
    });

    const decreaseButton = screen.getByRole('button', { name: /decrease quantity/i });
    fireEvent.click(decreaseButton);

    expect(store.getState().cart.items).toHaveLength(0);
  });

  test('removes item when Remove button is clicked', () => {
    const { store } = renderWithStore({
      cart: {
        items: [
          { id: 1, name: 'Product 1', price: 100, quantity: 2, image: '/product1.jpg' },
        ],
        isOpen: true,
      },
    });

    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);

    expect(store.getState().cart.items).toHaveLength(0);
  });

  test('renders subtotal correctly', () => {
    const { container } = renderWithStore({
      cart: {
        items: [
          { id: 1, name: 'Product 1', price: 100, quantity: 2, image: '/product1.jpg' },
          { id: 2, name: 'Product 2', price: 50, quantity: 1, image: '/product2.jpg' },
        ],
        isOpen: true,
      },
    });

    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    const subtotalValue = container.querySelector('.cart-drawer-subtotal-value');
    expect(subtotalValue).toHaveTextContent('$250.00');
  });

  test('shows free shipping when subtotal is $99 or more', () => {
    renderWithStore({
      cart: {
        items: [
          { id: 1, name: 'Product 1', price: 100, quantity: 1, image: '/product1.jpg' },
        ],
        isOpen: true,
      },
    });

    expect(screen.getByText('Shipping')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  test('shows $9.99 shipping when subtotal is less than $99', () => {
    renderWithStore({
      cart: {
        items: [
          { id: 1, name: 'Product 1', price: 50, quantity: 1, image: '/product1.jpg' },
        ],
        isOpen: true,
      },
    });

    expect(screen.getByText('Shipping')).toBeInTheDocument();
    expect(screen.getAllByText('$9.99')[0]).toBeInTheDocument();
  });

  test('calculates total correctly with free shipping', () => {
    const { container } = renderWithStore({
      cart: {
        items: [
          { id: 1, name: 'Product 1', price: 100, quantity: 1, image: '/product1.jpg' },
        ],
        isOpen: true,
      },
    });

    expect(screen.getByText('Total')).toBeInTheDocument();
    const totalSection = container.querySelector('.cart-drawer-total');
    expect(totalSection.querySelector('span:last-child')).toHaveTextContent('$100.00');
  });

  test('calculates total correctly with shipping cost', () => {
    const { container } = renderWithStore({
      cart: {
        items: [
          { id: 1, name: 'Product 1', price: 50, quantity: 1, image: '/product1.jpg' },
        ],
        isOpen: true,
      },
    });

    expect(screen.getByText('Total')).toBeInTheDocument();
    const totalSection = container.querySelector('.cart-drawer-total');
    expect(totalSection.querySelector('span:last-child')).toHaveTextContent('$59.99');
  });

  test('renders Checkout button', () => {
    renderWithStore({
      cart: {
        items: [
          { id: 1, name: 'Product 1', price: 100, quantity: 1, image: '/product1.jpg' },
        ],
        isOpen: true,
      },
    });

    expect(screen.getByRole('button', { name: /checkout/i })).toBeInTheDocument();
  });

  test('renders Clear Cart button', () => {
    renderWithStore({
      cart: {
        items: [
          { id: 1, name: 'Product 1', price: 100, quantity: 1, image: '/product1.jpg' },
        ],
        isOpen: true,
      },
    });

    expect(screen.getByRole('button', { name: /clear cart/i })).toBeInTheDocument();
  });

  test('clears all items when Clear Cart is clicked', () => {
    const { store } = renderWithStore({
      cart: {
        items: [
          { id: 1, name: 'Product 1', price: 100, quantity: 1, image: '/product1.jpg' },
          { id: 2, name: 'Product 2', price: 200, quantity: 2, image: '/product2.jpg' },
        ],
        isOpen: true,
      },
    });

    const clearButton = screen.getByRole('button', { name: /clear cart/i });
    fireEvent.click(clearButton);

    expect(store.getState().cart.items).toHaveLength(0);
  });

  test('renders quantity controls with correct icons', () => {
    const { container } = renderWithStore({
      cart: {
        items: [
          { id: 1, name: 'Product 1', price: 100, quantity: 2, image: '/product1.jpg' },
        ],
        isOpen: true,
      },
    });

    const decreaseButton = screen.getByRole('button', { name: /decrease quantity/i });
    const increaseButton = screen.getByRole('button', { name: /increase quantity/i });

    expect(decreaseButton.querySelector('svg')).toBeInTheDocument();
    expect(increaseButton.querySelector('svg')).toBeInTheDocument();
  });

  test('does not render footer when cart is empty', () => {
    renderWithStore({
      cart: { items: [], isOpen: true },
    });

    expect(screen.queryByText('Subtotal')).not.toBeInTheDocument();
    expect(screen.queryByText('Checkout')).not.toBeInTheDocument();
  });

  test('renders backdrop with aria-hidden', () => {
    const { container } = renderWithStore({
      cart: { items: [], isOpen: true },
    });

    const backdrop = container.querySelector('.cart-drawer-backdrop');
    expect(backdrop).toHaveAttribute('aria-hidden', 'true');
  });

  test('dialog has correct ARIA attributes', () => {
    renderWithStore({
      cart: { items: [], isOpen: true },
    });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'cart-title');
  });
});
