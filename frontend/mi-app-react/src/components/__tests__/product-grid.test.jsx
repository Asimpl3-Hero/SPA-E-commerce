import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ProductGrid } from '../product-grid';
import cartReducer from '@/store/cartSlice';

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

describe('ProductGrid Component', () => {
  test('renders featured products header when no search query', () => {
    renderWithStore(<ProductGrid searchQuery="" />);
    expect(screen.getByText('Featured Products')).toBeInTheDocument();
    expect(
      screen.getByText('Discover our latest collection of premium electronics')
    ).toBeInTheDocument();
  });

  test('renders all products when no search query', () => {
    renderWithStore(<ProductGrid searchQuery="" />);
    expect(screen.getByText('Wireless Noise-Cancelling Headphones')).toBeInTheDocument();
    expect(screen.getByText('Smartwatch Pro Series 8')).toBeInTheDocument();
    expect(screen.getByText('Wireless Gaming Mouse')).toBeInTheDocument();
    expect(screen.getByText('4K Webcam Ultra HD')).toBeInTheDocument();
    expect(screen.getByText('Portable SSD 2TB')).toBeInTheDocument();
    expect(screen.getByText('Mechanical Keyboard RGB')).toBeInTheDocument();
  });

  test('filters products by name', () => {
    renderWithStore(<ProductGrid searchQuery="headphones" />);
    expect(screen.getByText('Search Results')).toBeInTheDocument();
    expect(screen.getByText('Found 1 product')).toBeInTheDocument();
    expect(screen.getByText('Wireless Noise-Cancelling Headphones')).toBeInTheDocument();
    expect(screen.queryByText('Smartwatch Pro Series 8')).not.toBeInTheDocument();
  });

  test('filters products by category', () => {
    renderWithStore(<ProductGrid searchQuery="gaming" />);
    expect(screen.getByText('Search Results')).toBeInTheDocument();
    expect(screen.getByText('Found 1 product')).toBeInTheDocument();
    expect(screen.getByText('Wireless Gaming Mouse')).toBeInTheDocument();
  });

  test('filters products by description', () => {
    renderWithStore(<ProductGrid searchQuery="health tracking" />);
    expect(screen.getByText('Smartwatch Pro Series 8')).toBeInTheDocument();
  });

  test('displays empty state when no products match search', () => {
    renderWithStore(<ProductGrid searchQuery="nonexistent product" />);
    expect(screen.getByText('Search Results')).toBeInTheDocument();
    expect(screen.getByText('Found 0 products')).toBeInTheDocument();
    expect(
      screen.getByText('No products found matching "nonexistent product"')
    ).toBeInTheDocument();
  });

  test('search is case insensitive', () => {
    renderWithStore(<ProductGrid searchQuery="HEADPHONES" />);
    expect(screen.getByText('Wireless Noise-Cancelling Headphones')).toBeInTheDocument();
  });

  test('displays correct plural form for product count', () => {
    renderWithStore(<ProductGrid searchQuery="headphones" />);
    expect(screen.getByText('Found 1 product')).toBeInTheDocument();

    renderWithStore(<ProductGrid searchQuery="wireless" />);
    expect(screen.getByText('Found 2 products')).toBeInTheDocument();
  });

  test('opens product modal when product card is clicked', () => {
    renderWithStore(<ProductGrid searchQuery="" />);

    const productCard = screen.getByText('Wireless Noise-Cancelling Headphones').closest('.product-card');
    fireEvent.click(productCard);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveTextContent('Premium over-ear headphones with industry-leading noise cancellation technology');
  });

  test('closes modal when close button is clicked', () => {
    renderWithStore(<ProductGrid searchQuery="" />);

    const productCard = screen.getByText('Smartwatch Pro Series 8').closest('.product-card');
    fireEvent.click(productCard);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /close modal/i });
    fireEvent.click(closeButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('updates filtered products when search query changes', () => {
    const { rerender } = renderWithStore(<ProductGrid searchQuery="" />);
    expect(screen.getAllByRole('img')).toHaveLength(6);

    rerender(
      <Provider store={createMockStore()}>
        <ProductGrid searchQuery="audio" />
      </Provider>
    );
    expect(screen.getByText('Found 1 product')).toBeInTheDocument();
    expect(screen.getByText('Wireless Noise-Cancelling Headphones')).toBeInTheDocument();
  });
});
