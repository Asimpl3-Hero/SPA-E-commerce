import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ProductModal } from '../product-modal';
import cartReducer from '@/store/cartSlice';

const mockProduct = {
  id: 1,
  name: 'Test Product',
  price: 99,
  originalPrice: 149,
  rating: 4.5,
  reviews: 100,
  category: 'Electronics',
  badge: { text: 'Sale', variant: 'sale' },
  image: '/test-image.jpg',
  description: 'This is a detailed test product description',
};

const createMockStore = () => {
  return configureStore({
    reducer: {
      cart: cartReducer,
    },
  });
};

const renderWithStore = (component) => {
  const store = createMockStore();
  return { store, ...render(<Provider store={store}>{component}</Provider>) };
};

describe('ProductModal Component', () => {
  test('renders nothing when isOpen is false', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <ProductModal product={mockProduct} isOpen={false} onClose={handleClose} />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('renders modal when isOpen is true', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <ProductModal product={mockProduct} isOpen={true} onClose={handleClose} />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('renders nothing when product is null', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <ProductModal product={null} isOpen={true} onClose={handleClose} />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('displays product information correctly', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <ProductModal product={mockProduct} isOpen={true} onClose={handleClose} />
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99')).toBeInTheDocument();
    expect(screen.getByText('$149')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('This is a detailed test product description')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(100 reviews)')).toBeInTheDocument();
  });

  test('displays badge when provided', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <ProductModal product={mockProduct} isOpen={true} onClose={handleClose} />
    );
    expect(screen.getByText('Sale')).toBeInTheDocument();
  });

  test('calculates and displays discount percentage', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <ProductModal product={mockProduct} isOpen={true} onClose={handleClose} />
    );
    expect(screen.getByText('Save 34%')).toBeInTheDocument();
  });

  test('closes modal when close button is clicked', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <ProductModal product={mockProduct} isOpen={true} onClose={handleClose} />
    );

    const closeButton = screen.getByRole('button', { name: /close modal/i });
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('closes modal when backdrop is clicked', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <ProductModal product={mockProduct} isOpen={true} onClose={handleClose} />
    );

    const backdrop = document.querySelector('.product-modal-backdrop');
    fireEvent.click(backdrop);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('closes modal when Escape key is pressed', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <ProductModal product={mockProduct} isOpen={true} onClose={handleClose} />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('increments quantity when plus button is clicked', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <ProductModal product={mockProduct} isOpen={true} onClose={handleClose} />
    );

    const incrementButton = screen.getByRole('button', { name: /increase quantity/i });
    expect(screen.getByText('1')).toBeInTheDocument();

    fireEvent.click(incrementButton);
    expect(screen.getByText('2')).toBeInTheDocument();

    fireEvent.click(incrementButton);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('decrements quantity when minus button is clicked', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <ProductModal product={mockProduct} isOpen={true} onClose={handleClose} />
    );

    const incrementButton = screen.getByRole('button', { name: /increase quantity/i });
    const decrementButton = screen.getByRole('button', { name: /decrease quantity/i });

    fireEvent.click(incrementButton);
    fireEvent.click(incrementButton);
    expect(screen.getByText('3')).toBeInTheDocument();

    fireEvent.click(decrementButton);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('does not decrement quantity below 1', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <ProductModal product={mockProduct} isOpen={true} onClose={handleClose} />
    );

    const decrementButton = screen.getByRole('button', { name: /decrease quantity/i });
    expect(screen.getByText('1')).toBeInTheDocument();

    fireEvent.click(decrementButton);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('updates total price based on quantity', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <ProductModal product={mockProduct} isOpen={true} onClose={handleClose} />
    );

    const incrementButton = screen.getByRole('button', { name: /increase quantity/i });

    expect(screen.getByText(/Add to Cart - \$99.00/i)).toBeInTheDocument();

    fireEvent.click(incrementButton);
    expect(screen.getByText(/Add to Cart - \$198.00/i)).toBeInTheDocument();

    fireEvent.click(incrementButton);
    expect(screen.getByText(/Add to Cart - \$297.00/i)).toBeInTheDocument();
  });

  test('adds product to cart with correct quantity', () => {
    const handleClose = jest.fn();
    const { store } = renderWithStore(
      <ProductModal product={mockProduct} isOpen={true} onClose={handleClose} />
    );

    const incrementButton = screen.getByRole('button', { name: /increase quantity/i });
    fireEvent.click(incrementButton);
    fireEvent.click(incrementButton);

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartButton);

    const state = store.getState();
    expect(state.cart.items).toHaveLength(1);
    expect(state.cart.items[0].quantity).toBe(3);
  });

  test('closes modal after adding to cart', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <ProductModal product={mockProduct} isOpen={true} onClose={handleClose} />
    );

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('opens cart drawer after adding to cart', () => {
    const handleClose = jest.fn();
    const { store } = renderWithStore(
      <ProductModal product={mockProduct} isOpen={true} onClose={handleClose} />
    );

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartButton);

    const state = store.getState();
    expect(state.cart.isOpen).toBe(true);
  });

  test('locks body scroll when modal is open', () => {
    const handleClose = jest.fn();
    const { rerender } = renderWithStore(
      <ProductModal product={mockProduct} isOpen={true} onClose={handleClose} />
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Provider store={createMockStore()}>
        <ProductModal product={mockProduct} isOpen={false} onClose={handleClose} />
      </Provider>
    );

    expect(document.body.style.overflow).toBe('');
  });
});
