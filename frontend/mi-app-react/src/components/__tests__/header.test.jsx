import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Header } from '../header';
import cartReducer from '@/store/cartSlice';

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      cart: cartReducer,
    },
    preloadedState: initialState,
  });
};

const renderWithStore = (component, initialState) => {
  const store = createMockStore(initialState);
  return { store, ...render(<Provider store={store}>{component}</Provider>) };
};

describe('Header Component', () => {
  const mockOnSearchChange = jest.fn();

  beforeEach(() => {
    mockOnSearchChange.mockClear();
  });

  test('renders logo and brand name', () => {
    renderWithStore(<Header searchQuery="" onSearchChange={mockOnSearchChange} />);
    expect(screen.getByText('TechVault')).toBeInTheDocument();
  });

  test('renders desktop navigation links', () => {
    renderWithStore(<Header searchQuery="" onSearchChange={mockOnSearchChange} />);
    const links = screen.getAllByText('Products');
    expect(links[0]).toBeInTheDocument();
    expect(screen.getAllByText('Deals')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Support')[0]).toBeInTheDocument();
  });

  test('renders search input with placeholder', () => {
    renderWithStore(<Header searchQuery="" onSearchChange={mockOnSearchChange} />);
    const searchInputs = screen.getAllByPlaceholderText('Search products...');
    expect(searchInputs[0]).toBeInTheDocument();
  });

  test('displays search query value', () => {
    renderWithStore(<Header searchQuery="laptop" onSearchChange={mockOnSearchChange} />);
    const searchInputs = screen.getAllByDisplayValue('laptop');
    expect(searchInputs[0]).toBeInTheDocument();
  });

  test('calls onSearchChange when typing in search input', () => {
    renderWithStore(<Header searchQuery="" onSearchChange={mockOnSearchChange} />);
    const searchInput = screen.getAllByPlaceholderText('Search products...')[0];

    fireEvent.change(searchInput, { target: { value: 'keyboard' } });

    expect(mockOnSearchChange).toHaveBeenCalledTimes(1);
    expect(mockOnSearchChange).toHaveBeenCalledWith('keyboard');
  });

  test('renders cart button with aria-label', () => {
    renderWithStore(<Header searchQuery="" onSearchChange={mockOnSearchChange} />);
    const cartButton = screen.getByRole('button', { name: /open cart/i });
    expect(cartButton).toBeInTheDocument();
  });

  test('does not show cart badge when cart is empty', () => {
    renderWithStore(<Header searchQuery="" onSearchChange={mockOnSearchChange} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  test('shows cart badge with item count when cart has items', () => {
    const storeWithItems = {
      cart: {
        items: [
          { id: 1, name: 'Product 1', price: 100, quantity: 2 },
          { id: 2, name: 'Product 2', price: 200, quantity: 1 },
        ],
        isOpen: false,
      },
    };

    renderWithStore(<Header searchQuery="" onSearchChange={mockOnSearchChange} />, storeWithItems);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('toggles cart when cart button is clicked', () => {
    const { store } = renderWithStore(<Header searchQuery="" onSearchChange={mockOnSearchChange} />);
    const cartButton = screen.getByRole('button', { name: /open cart/i });

    expect(store.getState().cart.isOpen).toBe(false);

    fireEvent.click(cartButton);

    expect(store.getState().cart.isOpen).toBe(true);
  });

  test('renders mobile menu toggle button', () => {
    renderWithStore(<Header searchQuery="" onSearchChange={mockOnSearchChange} />);
    const menuButton = screen.getByRole('button', { name: /toggle menu/i });
    expect(menuButton).toBeInTheDocument();
  });

  test('mobile menu is hidden by default', () => {
    renderWithStore(<Header searchQuery="" onSearchChange={mockOnSearchChange} />);
    const mobileLinks = screen.queryAllByText('Products');
    // Desktop link exists, mobile should not
    expect(mobileLinks.length).toBe(1);
  });

  test('toggles mobile menu when menu button is clicked', () => {
    renderWithStore(<Header searchQuery="" onSearchChange={mockOnSearchChange} />);
    const menuButton = screen.getByRole('button', { name: /toggle menu/i });

    // Mobile menu should not be visible initially
    expect(screen.queryAllByText('Products').length).toBe(1);

    // Click to open
    fireEvent.click(menuButton);

    // Mobile menu should be visible (desktop + mobile = 2)
    expect(screen.queryAllByText('Products').length).toBe(2);

    // Click to close
    fireEvent.click(menuButton);

    // Mobile menu should be hidden again
    expect(screen.queryAllByText('Products').length).toBe(1);
  });

  test('renders mobile search input when menu is open', () => {
    renderWithStore(<Header searchQuery="" onSearchChange={mockOnSearchChange} />);
    const menuButton = screen.getByRole('button', { name: /toggle menu/i });

    fireEvent.click(menuButton);

    const searchInputs = screen.getAllByPlaceholderText('Search products...');
    expect(searchInputs.length).toBeGreaterThan(1);
  });

  test('mobile search input works correctly', () => {
    renderWithStore(<Header searchQuery="" onSearchChange={mockOnSearchChange} />);
    const menuButton = screen.getByRole('button', { name: /toggle menu/i });

    fireEvent.click(menuButton);

    const mobileSearchInput = screen.getAllByPlaceholderText('Search products...')[1];
    fireEvent.change(mobileSearchInput, { target: { value: 'mouse' } });

    expect(mockOnSearchChange).toHaveBeenCalledWith('mouse');
  });

  test('renders ShoppingCart icon', () => {
    renderWithStore(<Header searchQuery="" onSearchChange={mockOnSearchChange} />);
    const cartButton = screen.getByRole('button', { name: /open cart/i });
    expect(cartButton.querySelector('svg')).toBeInTheDocument();
  });

  test('renders Menu icon when mobile menu is closed', () => {
    renderWithStore(<Header searchQuery="" onSearchChange={mockOnSearchChange} />);
    const menuButton = screen.getByRole('button', { name: /toggle menu/i });
    expect(menuButton.querySelector('svg')).toBeInTheDocument();
  });

  test('renders X icon when mobile menu is open', () => {
    renderWithStore(<Header searchQuery="" onSearchChange={mockOnSearchChange} />);
    const menuButton = screen.getByRole('button', { name: /toggle menu/i });

    fireEvent.click(menuButton);

    expect(menuButton.querySelector('svg')).toBeInTheDocument();
  });
});
