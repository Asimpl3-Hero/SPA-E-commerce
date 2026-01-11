import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Home from '../App';
import cartReducer from '../store/cartSlice';

// Mock the components to avoid complex dependencies
jest.mock('../components/header', () => ({
  Header: ({ searchQuery, onSearchChange }) => (
    <header data-testid="header">
      <input
        data-testid="search-input"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search"
      />
    </header>
  ),
}));

jest.mock('../components/hero', () => ({
  Hero: () => <div data-testid="hero">Hero Component</div>,
}));

jest.mock('../components/product-grid', () => ({
  ProductGrid: ({ searchQuery }) => (
    <div data-testid="product-grid">
      Product Grid: {searchQuery || 'All Products'}
    </div>
  ),
}));

jest.mock('../components/cart-drawer', () => ({
  CartDrawer: () => <div data-testid="cart-drawer">Cart Drawer</div>,
}));

jest.mock('../components/footer', () => ({
  Footer: () => <footer data-testid="footer">Footer Component</footer>,
}));

describe('App (Home) Component', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        cart: cartReducer,
      },
    });
  });

  const renderApp = () => {
    return render(
      <Provider store={store}>
        <Home />
      </Provider>
    );
  };

  test('renders without crashing', () => {
    renderApp();
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  test('renders all main components', () => {
    renderApp();

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('product-grid')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('cart-drawer')).toBeInTheDocument();
  });

  test('has correct layout structure', () => {
    const { container } = renderApp();

    // Check for min-h-screen flex flex-col container
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('min-h-screen', 'flex', 'flex-col');

    // Check for main element with flex-1
    const mainElement = screen.getByRole('main');
    expect(mainElement).toHaveClass('flex-1');
  });

  test('manages search query state', () => {
    renderApp();

    const searchInput = screen.getByTestId('search-input');

    // Initially empty
    expect(searchInput.value).toBe('');
    expect(screen.getByText('Product Grid: All Products')).toBeInTheDocument();

    // Update search
    fireEvent.change(searchInput, { target: { value: 'headphones' } });

    expect(searchInput.value).toBe('headphones');
  });

  test('debounces search query before passing to ProductGrid', async () => {
    renderApp();

    const searchInput = screen.getByTestId('search-input');

    // Type search query
    fireEvent.change(searchInput, { target: { value: 'laptop' } });

    // Should still show "All Products" immediately (debounce not triggered yet)
    expect(screen.getByText('Product Grid: All Products')).toBeInTheDocument();

    // Wait for debounce (300ms)
    await waitFor(
      () => {
        expect(screen.getByText('Product Grid: laptop')).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  test('updates debounced search only after delay', async () => {
    renderApp();

    const searchInput = screen.getByTestId('search-input');

    // Type multiple times quickly
    fireEvent.change(searchInput, { target: { value: 'l' } });
    fireEvent.change(searchInput, { target: { value: 'la' } });
    fireEvent.change(searchInput, { target: { value: 'lap' } });
    fireEvent.change(searchInput, { target: { value: 'laptop' } });

    // Should not update immediately
    expect(screen.queryByText('Product Grid: laptop')).not.toBeInTheDocument();

    // Wait for debounce
    await waitFor(
      () => {
        expect(screen.getByText('Product Grid: laptop')).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  test('renders header with search functionality', () => {
    renderApp();
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  test('renders hero section in main content', () => {
    renderApp();
    const hero = screen.getByTestId('hero');
    const main = screen.getByRole('main');
    expect(main).toContainElement(hero);
  });

  test('renders product grid in main content', () => {
    renderApp();
    const productGrid = screen.getByTestId('product-grid');
    const main = screen.getByRole('main');
    expect(main).toContainElement(productGrid);
  });

  test('renders footer outside main content', () => {
    renderApp();
    const footer = screen.getByTestId('footer');
    const main = screen.getByRole('main');
    expect(main).not.toContainElement(footer);
  });

  test('renders cart drawer as floating component', () => {
    renderApp();
    const cartDrawer = screen.getByTestId('cart-drawer');
    const main = screen.getByRole('main');
    expect(main).not.toContainElement(cartDrawer);
  });

  test('clears search query', async () => {
    renderApp();

    const searchInput = screen.getByTestId('search-input');

    // Set search query
    fireEvent.change(searchInput, { target: { value: 'test' } });
    expect(searchInput.value).toBe('test');

    // Clear search query
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(searchInput.value).toBe('');

    // Wait for debounce
    await waitFor(
      () => {
        expect(screen.getByText('Product Grid: All Products')).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });
});
