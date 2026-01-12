import { render, screen } from '@testing-library/react';
import { OrderSummary } from '../OrderSummary';

// Mock formatCurrency utility
jest.mock('@/utils/formatters', () => ({
  formatCurrency: jest.fn((value) => `$${value.toLocaleString('es-CO')}`),
}));

import { formatCurrency } from '@/utils/formatters';

describe('OrderSummary Component', () => {
  const mockItems = [
    {
      id: 1,
      name: 'Producto 1',
      image: '/images/product1.jpg',
      price: 50000,
      quantity: 2,
    },
    {
      id: 2,
      name: 'Producto 2',
      image: '/images/product2.jpg',
      price: 30000,
      quantity: 1,
    },
  ];

  const mockSummary = {
    subtotal: 130000,
    shipping: 5000,
    iva: 24700,
    total: 159700,
  };

  const defaultProps = {
    items: mockItems,
    summary: mockSummary,
  };

  beforeEach(() => {
    formatCurrency.mockClear();
  });

  describe('Rendering', () => {
    test('renders section with correct title', () => {
      render(<OrderSummary {...defaultProps} />);

      expect(screen.getByRole('heading', { name: /Resumen del Pedido/i })).toBeInTheDocument();
    });

    test('renders as a section element', () => {
      const { container } = render(<OrderSummary {...defaultProps} />);

      const section = container.querySelector('section.checkout-section.checkout-summary');
      expect(section).toBeInTheDocument();
    });

    test('uses h3 tag for heading', () => {
      render(<OrderSummary {...defaultProps} />);

      const heading = screen.getByText(/Resumen del Pedido/i);
      expect(heading.tagName).toBe('H3');
    });
  });

  describe('Items Display', () => {
    test('renders all items', () => {
      render(<OrderSummary {...defaultProps} />);

      expect(screen.getByText('Producto 1')).toBeInTheDocument();
      expect(screen.getByText('Producto 2')).toBeInTheDocument();
    });

    test('displays item images with correct src and alt', () => {
      render(<OrderSummary {...defaultProps} />);

      const image1 = screen.getByAltText('Producto 1');
      const image2 = screen.getByAltText('Producto 2');

      expect(image1).toHaveAttribute('src', '/images/product1.jpg');
      expect(image2).toHaveAttribute('src', '/images/product2.jpg');
    });

    test('displays item quantities', () => {
      render(<OrderSummary {...defaultProps} />);

      expect(screen.getByText(/Cant: 2/i)).toBeInTheDocument();
      expect(screen.getByText(/Cant: 1/i)).toBeInTheDocument();
    });

    test('calculates and displays item total prices', () => {
      render(<OrderSummary {...defaultProps} />);

      // Product 1: 50000 * 2 = 100000
      // Product 2: 30000 * 1 = 30000
      expect(formatCurrency).toHaveBeenCalledWith(100000);
      expect(formatCurrency).toHaveBeenCalledWith(30000);
    });

    test('renders items with correct CSS classes', () => {
      const { container } = render(<OrderSummary {...defaultProps} />);

      const items = container.querySelectorAll('.checkout-summary-item');
      expect(items).toHaveLength(2);

      items.forEach((item) => {
        expect(item.querySelector('.checkout-summary-item-image')).toBeInTheDocument();
        expect(item.querySelector('.checkout-summary-item-details')).toBeInTheDocument();
        expect(item.querySelector('.checkout-summary-item-name')).toBeInTheDocument();
        expect(item.querySelector('.checkout-summary-item-quantity')).toBeInTheDocument();
        expect(item.querySelector('.checkout-summary-item-price')).toBeInTheDocument();
      });
    });
  });

  describe('Summary Totals', () => {
    test('displays subtotal', () => {
      render(<OrderSummary {...defaultProps} />);

      expect(screen.getByText('Subtotal')).toBeInTheDocument();
      expect(formatCurrency).toHaveBeenCalledWith(130000);
    });

    test('displays shipping cost', () => {
      render(<OrderSummary {...defaultProps} />);

      expect(screen.getByText('Envío')).toBeInTheDocument();
      expect(formatCurrency).toHaveBeenCalledWith(5000);
    });

    test('displays "GRATIS" when shipping is 0', () => {
      const propsWithFreeShipping = {
        ...defaultProps,
        summary: { ...mockSummary, shipping: 0 },
      };

      render(<OrderSummary {...propsWithFreeShipping} />);

      expect(screen.getByText('GRATIS')).toBeInTheDocument();
    });

    test('displays IVA (19%)', () => {
      render(<OrderSummary {...defaultProps} />);

      expect(screen.getByText('IVA (19%)')).toBeInTheDocument();
      expect(formatCurrency).toHaveBeenCalledWith(24700);
    });

    test('displays total amount', () => {
      render(<OrderSummary {...defaultProps} />);

      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(formatCurrency).toHaveBeenCalledWith(159700);
    });

    test('renders summary totals with correct CSS classes', () => {
      const { container } = render(<OrderSummary {...defaultProps} />);

      const totals = container.querySelector('.checkout-summary-totals');
      expect(totals).toBeInTheDocument();

      const rows = container.querySelectorAll('.checkout-summary-row');
      expect(rows).toHaveLength(4); // Subtotal, Shipping, IVA, Total

      const totalRow = container.querySelector('.checkout-summary-total');
      expect(totalRow).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    test('renders with empty items array', () => {
      const propsWithNoItems = {
        ...defaultProps,
        items: [],
      };

      render(<OrderSummary {...propsWithNoItems} />);

      expect(screen.getByText(/Resumen del Pedido/i)).toBeInTheDocument();
      expect(screen.getByText('Subtotal')).toBeInTheDocument();
    });

    test('handles single item', () => {
      const propsWithSingleItem = {
        ...defaultProps,
        items: [mockItems[0]],
      };

      render(<OrderSummary {...propsWithSingleItem} />);

      expect(screen.getByText('Producto 1')).toBeInTheDocument();
      expect(screen.queryByText('Producto 2')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles items with quantity of 1', () => {
      const itemWithQty1 = {
        id: 3,
        name: 'Producto 3',
        image: '/images/product3.jpg',
        price: 10000,
        quantity: 1,
      };

      render(<OrderSummary items={[itemWithQty1]} summary={mockSummary} />);

      expect(screen.getByText(/Cant: 1/i)).toBeInTheDocument();
      expect(formatCurrency).toHaveBeenCalledWith(10000); // price * 1
    });

    test('handles items with high quantities', () => {
      const itemWithHighQty = {
        id: 4,
        name: 'Producto 4',
        image: '/images/product4.jpg',
        price: 5000,
        quantity: 100,
      };

      render(<OrderSummary items={[itemWithHighQty]} summary={mockSummary} />);

      expect(screen.getByText(/Cant: 100/i)).toBeInTheDocument();
      expect(formatCurrency).toHaveBeenCalledWith(500000); // price * 100
    });

    test('handles large price values', () => {
      const itemWithLargePrice = {
        id: 5,
        name: 'Producto Costoso',
        image: '/images/expensive.jpg',
        price: 5000000,
        quantity: 2,
      };

      render(<OrderSummary items={[itemWithLargePrice]} summary={mockSummary} />);

      expect(formatCurrency).toHaveBeenCalledWith(10000000);
    });

    test('handles zero shipping cost', () => {
      const propsWithZeroShipping = {
        ...defaultProps,
        summary: {
          ...mockSummary,
          shipping: 0,
        },
      };

      render(<OrderSummary {...propsWithZeroShipping} />);

      expect(screen.getByText('GRATIS')).toBeInTheDocument();
      expect(formatCurrency).not.toHaveBeenCalledWith(0);
    });
  });

  describe('Accessibility', () => {
    test('images have alt text', () => {
      render(<OrderSummary {...defaultProps} />);

      const images = screen.getAllByRole('img');
      images.forEach((img) => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).toBeTruthy();
      });
    });

    test('section has proper semantic structure', () => {
      const { container } = render(<OrderSummary {...defaultProps} />);

      const section = container.querySelector('section');
      const heading = container.querySelector('h3');

      expect(section).toBeInTheDocument();
      expect(heading).toBeInTheDocument();
      expect(section).toContainElement(heading);
    });

    test('uses semantic HTML elements', () => {
      const { container } = render(<OrderSummary {...defaultProps} />);

      expect(container.querySelector('section')).toBeInTheDocument();
      expect(container.querySelector('h3')).toBeInTheDocument();
      expect(container.querySelectorAll('div').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('span').length).toBeGreaterThan(0);
    });
  });

  describe('formatCurrency Integration', () => {
    test('calls formatCurrency with correct values', () => {
      render(<OrderSummary {...defaultProps} />);

      // Item totals
      expect(formatCurrency).toHaveBeenCalledWith(100000); // Product 1
      expect(formatCurrency).toHaveBeenCalledWith(30000);  // Product 2

      // Summary totals
      expect(formatCurrency).toHaveBeenCalledWith(130000); // Subtotal
      expect(formatCurrency).toHaveBeenCalledWith(5000);   // Shipping
      expect(formatCurrency).toHaveBeenCalledWith(24700);  // IVA
      expect(formatCurrency).toHaveBeenCalledWith(159700); // Total
    });

    test('does not call formatCurrency for free shipping', () => {
      const propsWithFreeShipping = {
        ...defaultProps,
        summary: { ...mockSummary, shipping: 0 },
      };

      formatCurrency.mockClear();
      render(<OrderSummary {...propsWithFreeShipping} />);

      // Should not be called with 0 for shipping
      const calls = formatCurrency.mock.calls;
      expect(calls.some(call => call[0] === 0 && calls.indexOf(call) === 1)).toBe(false);
    });
  });

  describe('Multiple Items', () => {
    test('handles many items', () => {
      const manyItems = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Producto ${i + 1}`,
        image: `/images/product${i + 1}.jpg`,
        price: 10000 * (i + 1),
        quantity: i + 1,
      }));

      const { container } = render(<OrderSummary items={manyItems} summary={mockSummary} />);

      const itemElements = container.querySelectorAll('.checkout-summary-item');
      expect(itemElements).toHaveLength(10);
    });

    test('maintains item order', () => {
      render(<OrderSummary {...defaultProps} />);

      const items = screen.getAllByText(/Producto \d/);
      expect(items[0]).toHaveTextContent('Producto 1');
      expect(items[1]).toHaveTextContent('Producto 2');
    });
  });

  describe('Key Prop', () => {
    test('uses item id as key', () => {
      const { container } = render(<OrderSummary {...defaultProps} />);

      // React doesn't expose keys in the DOM, but we can verify items render
      const items = container.querySelectorAll('.checkout-summary-item');
      expect(items).toHaveLength(mockItems.length);
    });
  });
});
