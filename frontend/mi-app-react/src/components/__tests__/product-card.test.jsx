import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ProductCard } from '../product-card';
import cartReducer from '@/store/cartSlice';

const mockProduct = {
  id: 1,
  name: 'Test Product',
  price: 99000,
  originalPrice: 149000,
  rating: 4.5,
  reviews: 100,
  category: 'Electronics',
  badge: { text: 'New', variant: 'new' },
  image: '/test-image.jpg',
  description: 'Test product description',
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
  return render(<Provider store={store}>{component}</Provider>);
};

describe('ProductCard Component', () => {
  test('renders product information correctly', () => {
    renderWithStore(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.000')).toBeInTheDocument();
    expect(screen.getByText('$149.000')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(100)')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Test product description')).toBeInTheDocument();
  });

  test('renders badge when provided', () => {
    renderWithStore(<ProductCard product={mockProduct} />);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  test('renders product without badge', () => {
    const productWithoutBadge = { ...mockProduct, badge: null };
    renderWithStore(<ProductCard product={productWithoutBadge} />);
    expect(screen.queryByText('New')).not.toBeInTheDocument();
  });

  test('renders product without original price', () => {
    const productWithoutOriginalPrice = { ...mockProduct, originalPrice: null };
    renderWithStore(<ProductCard product={productWithoutOriginalPrice} />);
    expect(screen.queryByText('$149.000')).not.toBeInTheDocument();
  });

  test('renders product image with correct alt text', () => {
    renderWithStore(<ProductCard product={mockProduct} />);
    const image = screen.getByAltText('Test Product');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-image.jpg');
  });

  test('calls onOpenModal when card is clicked', () => {
    const handleOpenModal = jest.fn();
    renderWithStore(
      <ProductCard product={mockProduct} onOpenModal={handleOpenModal} />
    );

    const card = screen.getByText('Test Product').closest('.product-card');
    fireEvent.click(card);

    expect(handleOpenModal).toHaveBeenCalledTimes(1);
    expect(handleOpenModal).toHaveBeenCalledWith(mockProduct);
  });

  test('does not call onOpenModal when onOpenModal is not provided', () => {
    renderWithStore(<ProductCard product={mockProduct} />);
    const card = screen.getByText('Test Product').closest('.product-card');
    expect(() => fireEvent.click(card)).not.toThrow();
  });

  test('adds product to cart when Add button is clicked', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <ProductCard product={mockProduct} />
      </Provider>
    );

    const addButton = screen.getByRole('button', { name: /añadir/i });
    fireEvent.click(addButton);

    const state = store.getState();
    expect(state.cart.items).toHaveLength(1);
    expect(state.cart.items[0].id).toBe(mockProduct.id);
  });

  test('stops propagation when Add button is clicked', () => {
    const handleOpenModal = jest.fn();
    renderWithStore(
      <ProductCard product={mockProduct} onOpenModal={handleOpenModal} />
    );

    const addButton = screen.getByRole('button', { name: /añadir/i });
    fireEvent.click(addButton);

    expect(handleOpenModal).not.toHaveBeenCalled();
  });

  test('shows "Añadido" feedback after adding to cart', async () => {
    jest.useFakeTimers();

    renderWithStore(<ProductCard product={mockProduct} />);

    const addButton = screen.getByRole('button', { name: /añadir/i });
    fireEvent.click(addButton);

    expect(screen.getByText('Añadido')).toBeInTheDocument();

    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByText('Añadir')).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  test('renders correct button state based on isAdded', () => {
    renderWithStore(<ProductCard product={mockProduct} />);

    const addButton = screen.getByRole('button', { name: /añadir/i });

    expect(addButton).toHaveTextContent('Añadir');

    fireEvent.click(addButton);

    expect(screen.getByText('Añadido')).toBeInTheDocument();
  });

  test('handles products with placeholder image', () => {
    const productWithoutImage = { ...mockProduct, image: null };
    renderWithStore(<ProductCard product={productWithoutImage} />);

    const image = screen.getByAltText('Test Product');
    expect(image).toHaveAttribute('src', '/placeholder.svg');
  });

  test('formats reviews count with locale string', () => {
    const productWithManyReviews = { ...mockProduct, reviews: 1500 };
    renderWithStore(<ProductCard product={productWithManyReviews} />);

    expect(screen.getByText('(1,500)')).toBeInTheDocument();
  });
});
