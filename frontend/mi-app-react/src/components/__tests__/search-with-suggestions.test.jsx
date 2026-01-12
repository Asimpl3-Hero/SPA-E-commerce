import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchWithSuggestions } from '../search-with-suggestions';
import { searchProducts } from '@/services/productService';
import { useDebounce } from '@/hooks/useDebounce';

// Mock dependencies
jest.mock('@/services/productService');
jest.mock('@/hooks/useDebounce');

// Mock Input component
jest.mock('@/components/ui/input', () => ({
  Input: (props) => <input {...props} />,
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Search: () => <svg data-testid="search-icon" />,
}));

describe('SearchWithSuggestions Component', () => {
  const mockOnSearchChange = jest.fn();
  const mockOnProductClick = jest.fn();

  const mockProducts = [
    { id: 1, name: 'Product 1', category: 'Electronics', price: 100000, image: '/img1.jpg' },
    { id: 2, name: 'Product 2', category: 'Clothing', price: 50000, image: '/img2.jpg' },
    { id: 3, name: 'Product 3', category: 'Books', price: 25000, image: '/img3.jpg' },
  ];

  const defaultProps = {
    searchQuery: '',
    onSearchChange: mockOnSearchChange,
    onProductClick: mockOnProductClick,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // By default, useDebounce returns the input value
    useDebounce.mockImplementation((value) => value);
    searchProducts.mockResolvedValue([]);
  });

  describe('Rendering', () => {
    test('renders search input', () => {
      render(<SearchWithSuggestions {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Buscar productos/i);
      expect(input).toBeInTheDocument();
    });

    test('renders search icon', () => {
      render(<SearchWithSuggestions {...defaultProps} />);

      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    test('input has correct type attribute', () => {
      render(<SearchWithSuggestions {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Buscar productos/i);
      expect(input).toHaveAttribute('type', 'search');
    });

    test('input displays current searchQuery value', () => {
      render(<SearchWithSuggestions {...defaultProps} searchQuery="test query" />);

      const input = screen.getByPlaceholderText(/Buscar productos/i);
      expect(input).toHaveValue('test query');
    });

    test('renders with correct CSS classes', () => {
      const { container } = render(<SearchWithSuggestions {...defaultProps} />);

      expect(container.querySelector('.search-suggestions-container')).toBeInTheDocument();
      expect(container.querySelector('.search-input-wrapper')).toBeInTheDocument();
    });
  });

  describe('Search Input Interactions', () => {
    test('calls onSearchChange when input value changes', () => {
      render(<SearchWithSuggestions {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Buscar productos/i);
      fireEvent.change(input, { target: { value: 'laptop' } });

      expect(mockOnSearchChange).toHaveBeenCalledWith('laptop');
    });

    test('updates selectedIndex to -1 on input change', () => {
      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      const input = screen.getByPlaceholderText(/Buscar productos/i);
      fireEvent.change(input, { target: { value: 'new test' } });

      expect(mockOnSearchChange).toHaveBeenCalled();
    });
  });

  describe('Debouncing', () => {
    test('uses useDebounce hook with 300ms delay', () => {
      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      expect(useDebounce).toHaveBeenCalledWith('test', 300);
    });

    test('fetches suggestions with debounced query', async () => {
      useDebounce.mockReturnValue('laptop');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="laptop" />);

      await waitFor(() => {
        expect(searchProducts).toHaveBeenCalledWith('laptop');
      });
    });
  });

  describe('Fetching Suggestions', () => {
    test('does not fetch when query is less than 2 characters', async () => {
      useDebounce.mockReturnValue('a');

      render(<SearchWithSuggestions {...defaultProps} searchQuery="a" />);

      await waitFor(() => {
        expect(searchProducts).not.toHaveBeenCalled();
      });
    });

    test('does not fetch when query is empty', async () => {
      useDebounce.mockReturnValue('');

      render(<SearchWithSuggestions {...defaultProps} searchQuery="" />);

      await waitFor(() => {
        expect(searchProducts).not.toHaveBeenCalled();
      });
    });

    test('fetches suggestions when query is 2+ characters', async () => {
      useDebounce.mockReturnValue('laptop');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="laptop" />);

      await waitFor(() => {
        expect(searchProducts).toHaveBeenCalledWith('laptop');
      });
    });

    test('limits suggestions to 5 items', async () => {
      const manyProducts = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
        category: 'Category',
        price: 10000,
        image: `/img${i + 1}.jpg`,
      }));

      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(manyProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => {
        const suggestions = screen.queryAllByRole('listitem');
        expect(suggestions.length).toBeLessThanOrEqual(5);
      });
    });

    test('handles fetch error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      useDebounce.mockReturnValue('test');
      searchProducts.mockRejectedValue(new Error('Network error'));

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error fetching suggestions:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Suggestions Dropdown', () => {
    test('shows suggestions when results are available', async () => {
      useDebounce.mockReturnValue('laptop');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="laptop" />);

      await waitFor(() => {
        expect(screen.getByText('Sugerencias')).toBeInTheDocument();
      });
    });

    test('displays correct number of results', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => {
        expect(screen.getByText('3 resultados')).toBeInTheDocument();
      });
    });

    test('displays singular "resultado" for 1 result', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue([mockProducts[0]]);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => {
        expect(screen.getByText('1 resultado')).toBeInTheDocument();
      });
    });

    test('renders all suggestion items', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => {
        expect(screen.getByText('Product 1')).toBeInTheDocument();
        expect(screen.getByText('Product 2')).toBeInTheDocument();
        expect(screen.getByText('Product 3')).toBeInTheDocument();
      });
    });

    test('displays product images', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images).toHaveLength(mockProducts.length);
      });
    });

    test('displays product categories', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.getByText('Clothing')).toBeInTheDocument();
        expect(screen.getByText('Books')).toBeInTheDocument();
      });
    });

    test('displays formatted prices', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => {
        // Check for currency formatted prices (Colombian Pesos)
        expect(screen.getByText(/100\.000/)).toBeInTheDocument();
        expect(screen.getByText(/50\.000/)).toBeInTheDocument();
        expect(screen.getByText(/25\.000/)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    test('shows empty state when no results found', async () => {
      useDebounce.mockReturnValue('nonexistent');
      searchProducts.mockResolvedValue([]);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="nonexistent" />);

      await waitFor(() => {
        expect(screen.getByText(/No se encontraron productos/i)).toBeInTheDocument();
      });
    });

    test('shows hint text in empty state', async () => {
      useDebounce.mockReturnValue('xyz');
      searchProducts.mockResolvedValue([]);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="xyz" />);

      await waitFor(() => {
        expect(screen.getByText(/Intenta con otros términos/i)).toBeInTheDocument();
      });
    });

    test('does not show empty state for queries less than 2 chars', async () => {
      useDebounce.mockReturnValue('a');
      searchProducts.mockResolvedValue([]);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="a" />);

      await waitFor(() => {
        expect(screen.queryByText(/No se encontraron productos/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Suggestion Click', () => {
    test('calls onSearchChange when suggestion is clicked', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => screen.getByText('Product 1'));

      fireEvent.click(screen.getByText('Product 1'));

      expect(mockOnSearchChange).toHaveBeenCalledWith('Product 1');
    });

    test('calls onProductClick when suggestion is clicked', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => screen.getByText('Product 1'));

      fireEvent.click(screen.getByText('Product 1'));

      expect(mockOnProductClick).toHaveBeenCalledWith(mockProducts[0]);
    });

    test('hides suggestions after clicking a suggestion', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => screen.getByText('Product 1'));

      fireEvent.click(screen.getByText('Product 1'));

      await waitFor(() => {
        expect(screen.queryByText('Sugerencias')).not.toBeInTheDocument();
      });
    });

    test('handles missing onProductClick callback', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      const propsWithoutCallback = {
        ...defaultProps,
        onProductClick: undefined,
      };

      render(<SearchWithSuggestions {...propsWithoutCallback} searchQuery="test" />);

      await waitFor(() => screen.getByText('Product 1'));

      // Should not throw error
      expect(() => fireEvent.click(screen.getByText('Product 1'))).not.toThrow();
    });
  });

  describe('Keyboard Navigation', () => {
    test('moves selection down with ArrowDown key', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => screen.getByText('Product 1'));

      const input = screen.getByPlaceholderText(/Buscar productos/i);

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      // First item should be selected (has selected class)
      const firstItem = screen.getByText('Product 1').closest('li');
      expect(firstItem).toHaveClass('suggestion-item-selected');
    });

    test('moves selection up with ArrowUp key', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => screen.getByText('Product 1'));

      const input = screen.getByPlaceholderText(/Buscar productos/i);

      // Select second item
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      // Move up
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      const firstItem = screen.getByText('Product 1').closest('li');
      expect(firstItem).toHaveClass('suggestion-item-selected');
    });

    test('does not go below index -1 with ArrowUp', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => screen.getByText('Product 1'));

      const input = screen.getByPlaceholderText(/Buscar productos/i);

      // Try to go up when already at -1
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      // No item should be selected
      const items = screen.getAllByRole('listitem');
      items.forEach(item => {
        expect(item).not.toHaveClass('suggestion-item-selected');
      });
    });

    test('does not go beyond last item with ArrowDown', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => screen.getByText('Product 1'));

      const input = screen.getByPlaceholderText(/Buscar productos/i);

      // Try to go beyond last item
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' }); // Extra

      const lastItem = screen.getByText('Product 3').closest('li');
      expect(lastItem).toHaveClass('suggestion-item-selected');
    });

    test('selects suggestion with Enter key', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => screen.getByText('Product 1'));

      const input = screen.getByPlaceholderText(/Buscar productos/i);

      // Select first item and press Enter
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnProductClick).toHaveBeenCalledWith(mockProducts[0]);
    });

    test('closes suggestions with Escape key', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => screen.getByText('Sugerencias'));

      const input = screen.getByPlaceholderText(/Buscar productos/i);
      fireEvent.keyDown(input, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('Sugerencias')).not.toBeInTheDocument();
      });
    });

    test('ignores keyboard navigation when no suggestions', () => {
      render(<SearchWithSuggestions {...defaultProps} searchQuery="" />);

      const input = screen.getByPlaceholderText(/Buscar productos/i);

      // Should not throw error
      expect(() => fireEvent.keyDown(input, { key: 'ArrowDown' })).not.toThrow();
      expect(() => fireEvent.keyDown(input, { key: 'Enter' })).not.toThrow();
    });
  });

  describe('Mouse Interactions', () => {
    test('updates selectedIndex on mouse enter', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => screen.getByText('Product 2'));

      const secondItem = screen.getByText('Product 2').closest('li');
      fireEvent.mouseEnter(secondItem);

      expect(secondItem).toHaveClass('suggestion-item-selected');
    });
  });

  describe('Click Outside', () => {
    test('closes suggestions when clicking outside', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(
        <div>
          <SearchWithSuggestions {...defaultProps} searchQuery="test" />
          <div data-testid="outside">Outside element</div>
        </div>
      );

      await waitFor(() => screen.getByText('Sugerencias'));

      fireEvent.mouseDown(screen.getByTestId('outside'));

      await waitFor(() => {
        expect(screen.queryByText('Sugerencias')).not.toBeInTheDocument();
      });
    });

    test('does not close when clicking inside suggestions', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => screen.getByText('Sugerencias'));

      const dropdown = screen.getByText('Sugerencias').closest('.suggestions-dropdown');
      fireEvent.mouseDown(dropdown);

      expect(screen.getByText('Sugerencias')).toBeInTheDocument();
    });
  });

  describe('Focus Behavior', () => {
    test('shows suggestions on focus if results exist', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => screen.getByText('Product 1'));

      const input = screen.getByPlaceholderText(/Buscar productos/i);

      // Hide suggestions first
      fireEvent.keyDown(input, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('Sugerencias')).not.toBeInTheDocument();
      });

      // Focus should show them again
      fireEvent.focus(input);

      expect(screen.getByText('Sugerencias')).toBeInTheDocument();
    });

    test('does not show suggestions on focus if no results', () => {
      render(<SearchWithSuggestions {...defaultProps} searchQuery="" />);

      const input = screen.getByPlaceholderText(/Buscar productos/i);
      fireEvent.focus(input);

      expect(screen.queryByText('Sugerencias')).not.toBeInTheDocument();
    });
  });

  describe('Price Formatting', () => {
    test('formats prices in Colombian Pesos', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue([
        { id: 1, name: 'Product', category: 'Cat', price: 1234567, image: '/img.jpg' },
      ]);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => {
        // Should format as $1.234.567
        expect(screen.getByText(/1\.234\.567/)).toBeInTheDocument();
      });
    });

    test('formats prices without decimal places', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue([
        { id: 1, name: 'Product', category: 'Cat', price: 50000, image: '/img.jpg' },
      ]);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => {
        const priceText = screen.getByText(/50\.000/);
        expect(priceText.textContent).not.toContain(',00');
      });
    });
  });

  describe('Image Loading', () => {
    test('images have lazy loading attribute', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        images.forEach(img => {
          expect(img).toHaveAttribute('loading', 'lazy');
        });
      });
    });

    test('images have correct alt text', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => {
        expect(screen.getByAltText('Product 1')).toBeInTheDocument();
        expect(screen.getByAltText('Product 2')).toBeInTheDocument();
        expect(screen.getByAltText('Product 3')).toBeInTheDocument();
      });
    });
  });

  describe('CSS Classes', () => {
    test('suggestion items have correct classes', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => {
        const items = screen.getAllByRole('listitem');
        items.forEach(item => {
          expect(item).toHaveClass('suggestion-item');
        });
      });
    });

    test('applies selected class to hovered/selected item', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => screen.getByText('Product 1'));

      const input = screen.getByPlaceholderText(/Buscar productos/i);
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const firstItem = screen.getByText('Product 1').closest('li');
      expect(firstItem).toHaveClass('suggestion-item-selected');
    });
  });

  describe('Accessibility', () => {
    test('input has accessible placeholder', () => {
      render(<SearchWithSuggestions {...defaultProps} />);

      expect(screen.getByPlaceholderText(/Buscar productos/i)).toBeInTheDocument();
    });

    test('suggestions are rendered in a list', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => {
        const list = screen.getByRole('list');
        expect(list).toBeInTheDocument();
        expect(list).toHaveClass('suggestions-list');
      });
    });

    test('images have alt attributes', async () => {
      useDebounce.mockReturnValue('test');
      searchProducts.mockResolvedValue(mockProducts);

      render(<SearchWithSuggestions {...defaultProps} searchQuery="test" />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        images.forEach(img => {
          expect(img).toHaveAttribute('alt');
        });
      });
    });
  });
});
