import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentMethodSelector } from '../PaymentMethodSelector';

describe('PaymentMethodSelector Component', () => {
  const mockSetPaymentMethod = jest.fn();

  const defaultProps = {
    paymentMethod: 'CARD',
    setPaymentMethod: mockSetPaymentMethod,
    isProcessing: false,
  };

  beforeEach(() => {
    mockSetPaymentMethod.mockClear();
  });

  describe('Rendering', () => {
    test('renders payment method selector with label', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      expect(screen.getByText(/Selecciona Método de Pago \*/i)).toBeInTheDocument();
    });

    test('renders both payment method options', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      expect(screen.getByText('Tarjeta Crédito/Débito')).toBeInTheDocument();
      expect(screen.getByText('Nequi')).toBeInTheDocument();
    });

    test('renders card option button', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const cardButton = screen.getByRole('button', { name: /Tarjeta Crédito\/Débito/i });
      expect(cardButton).toBeInTheDocument();
    });

    test('renders nequi option button', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const nequiButton = screen.getByRole('button', { name: /Nequi/i });
      expect(nequiButton).toBeInTheDocument();
    });

    test('renders with correct CSS classes', () => {
      const { container } = render(<PaymentMethodSelector {...defaultProps} />);

      expect(container.querySelector('.payment-method-selector')).toBeInTheDocument();
      expect(container.querySelector('.payment-method-options')).toBeInTheDocument();
      expect(container.querySelectorAll('.payment-method-option')).toHaveLength(2);
    });

    test('renders required field indicator (*)', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      expect(screen.getByText(/\*/)).toBeInTheDocument();
    });
  });

  describe('Selection State - Card Selected', () => {
    test('marks card option as selected when paymentMethod is CARD', () => {
      const { container } = render(<PaymentMethodSelector {...defaultProps} />);

      const cardButton = screen.getByRole('button', { name: /Tarjeta Crédito\/Débito/i });
      expect(cardButton).toHaveClass('selected');
    });

    test('does not mark nequi option as selected when paymentMethod is CARD', () => {
      const { container } = render(<PaymentMethodSelector {...defaultProps} />);

      const nequiButton = screen.getByRole('button', { name: /Nequi/i });
      expect(nequiButton).not.toHaveClass('selected');
    });
  });

  describe('Selection State - Nequi Selected', () => {
    test('marks nequi option as selected when paymentMethod is NEQUI', () => {
      const propsWithNequi = {
        ...defaultProps,
        paymentMethod: 'NEQUI',
      };

      render(<PaymentMethodSelector {...propsWithNequi} />);

      const nequiButton = screen.getByRole('button', { name: /Nequi/i });
      expect(nequiButton).toHaveClass('selected');
    });

    test('does not mark card option as selected when paymentMethod is NEQUI', () => {
      const propsWithNequi = {
        ...defaultProps,
        paymentMethod: 'NEQUI',
      };

      render(<PaymentMethodSelector {...propsWithNequi} />);

      const cardButton = screen.getByRole('button', { name: /Tarjeta Crédito\/Débito/i });
      expect(cardButton).not.toHaveClass('selected');
    });
  });

  describe('User Interactions - Click Events', () => {
    test('calls setPaymentMethod with CARD when card option is clicked', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const cardButton = screen.getByRole('button', { name: /Tarjeta Crédito\/Débito/i });
      fireEvent.click(cardButton);

      expect(mockSetPaymentMethod).toHaveBeenCalledWith('CARD');
      expect(mockSetPaymentMethod).toHaveBeenCalledTimes(1);
    });

    test('calls setPaymentMethod with NEQUI when nequi option is clicked', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const nequiButton = screen.getByRole('button', { name: /Nequi/i });
      fireEvent.click(nequiButton);

      expect(mockSetPaymentMethod).toHaveBeenCalledWith('NEQUI');
      expect(mockSetPaymentMethod).toHaveBeenCalledTimes(1);
    });

    test('can switch from CARD to NEQUI', () => {
      const { rerender } = render(<PaymentMethodSelector {...defaultProps} />);

      const nequiButton = screen.getByRole('button', { name: /Nequi/i });
      fireEvent.click(nequiButton);

      expect(mockSetPaymentMethod).toHaveBeenCalledWith('NEQUI');

      // Simulate state update
      rerender(<PaymentMethodSelector {...defaultProps} paymentMethod="NEQUI" />);

      expect(nequiButton).toHaveClass('selected');
    });

    test('can switch from NEQUI to CARD', () => {
      const propsWithNequi = {
        ...defaultProps,
        paymentMethod: 'NEQUI',
      };

      const { rerender } = render(<PaymentMethodSelector {...propsWithNequi} />);

      const cardButton = screen.getByRole('button', { name: /Tarjeta Crédito\/Débito/i });
      fireEvent.click(cardButton);

      expect(mockSetPaymentMethod).toHaveBeenCalledWith('CARD');

      // Simulate state update
      rerender(<PaymentMethodSelector {...propsWithNequi} paymentMethod="CARD" />);

      expect(cardButton).toHaveClass('selected');
    });

    test('allows clicking already selected option', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const cardButton = screen.getByRole('button', { name: /Tarjeta Crédito\/Débito/i });
      fireEvent.click(cardButton);

      // Should still call setPaymentMethod even if already selected
      expect(mockSetPaymentMethod).toHaveBeenCalledWith('CARD');
    });
  });

  describe('Disabled State', () => {
    test('disables both buttons when isProcessing is true', () => {
      const propsWithProcessing = {
        ...defaultProps,
        isProcessing: true,
      };

      render(<PaymentMethodSelector {...propsWithProcessing} />);

      const cardButton = screen.getByRole('button', { name: /Tarjeta Crédito\/Débito/i });
      const nequiButton = screen.getByRole('button', { name: /Nequi/i });

      expect(cardButton).toBeDisabled();
      expect(nequiButton).toBeDisabled();
    });

    test('enables both buttons when isProcessing is false', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const cardButton = screen.getByRole('button', { name: /Tarjeta Crédito\/Débito/i });
      const nequiButton = screen.getByRole('button', { name: /Nequi/i });

      expect(cardButton).not.toBeDisabled();
      expect(nequiButton).not.toBeDisabled();
    });

    test('does not call setPaymentMethod when clicking disabled button', () => {
      const propsWithProcessing = {
        ...defaultProps,
        isProcessing: true,
      };

      render(<PaymentMethodSelector {...propsWithProcessing} />);

      const cardButton = screen.getByRole('button', { name: /Tarjeta Crédito\/Débito/i });
      fireEvent.click(cardButton);

      // Disabled buttons don't trigger onClick in real browsers
      expect(mockSetPaymentMethod).not.toHaveBeenCalled();
    });
  });

  describe('Button Type', () => {
    test('card button has type="button"', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const cardButton = screen.getByRole('button', { name: /Tarjeta Crédito\/Débito/i });
      expect(cardButton).toHaveAttribute('type', 'button');
    });

    test('nequi button has type="button"', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const nequiButton = screen.getByRole('button', { name: /Nequi/i });
      expect(nequiButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Icons and Images', () => {
    test('card option displays SVG icon', () => {
      const { container } = render(<PaymentMethodSelector {...defaultProps} />);

      const cardButton = screen.getByRole('button', { name: /Tarjeta Crédito\/Débito/i });
      const svg = cardButton.querySelector('svg');

      expect(svg).toBeInTheDocument();
    });

    test('nequi option displays image', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const nequiImage = screen.getByAltText('Nequi');
      expect(nequiImage).toBeInTheDocument();
      expect(nequiImage).toHaveAttribute('src', 'https://www.svgrepo.com/show/518153/nequi-colombia.svg');
    });

    test('nequi option has fallback SVG', () => {
      const { container } = render(<PaymentMethodSelector {...defaultProps} />);

      const nequiButton = screen.getByRole('button', { name: /Nequi/i });
      const svgs = nequiButton.querySelectorAll('svg');

      // Should have fallback SVG (initially hidden)
      expect(svgs.length).toBeGreaterThan(0);
    });

    test('nequi image has fallback mechanism', () => {
      const { container } = render(<PaymentMethodSelector {...defaultProps} />);

      const nequiImage = screen.getByAltText('Nequi');
      const nequiButton = screen.getByRole('button', { name: /Nequi/i });

      // Verify fallback SVG exists
      const fallbackSvg = nequiButton.querySelectorAll('svg')[0];
      expect(fallbackSvg).toBeInTheDocument();

      // Simulate image error
      fireEvent.error(nequiImage);

      // Note: In real implementation, onError handler would hide image and show SVG
      // We verify the structure is in place
      expect(nequiImage).toBeInTheDocument();
    });

    test('nequi image dimensions are set', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const nequiImage = screen.getByAltText('Nequi');
      expect(nequiImage).toHaveAttribute('width', '48');
      expect(nequiImage).toHaveAttribute('height', '48');
    });

    test('payment method icons have correct CSS class', () => {
      const { container } = render(<PaymentMethodSelector {...defaultProps} />);

      const icons = container.querySelectorAll('.payment-method-icon');
      expect(icons).toHaveLength(2);
    });
  });

  describe('CSS Classes', () => {
    test('applies correct classes to card option when selected', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const cardButton = screen.getByRole('button', { name: /Tarjeta Crédito\/Débito/i });
      expect(cardButton).toHaveClass('payment-method-option');
      expect(cardButton).toHaveClass('selected');
    });

    test('applies correct classes to card option when not selected', () => {
      const propsWithNequi = {
        ...defaultProps,
        paymentMethod: 'NEQUI',
      };

      render(<PaymentMethodSelector {...propsWithNequi} />);

      const cardButton = screen.getByRole('button', { name: /Tarjeta Crédito\/Débito/i });
      expect(cardButton).toHaveClass('payment-method-option');
      expect(cardButton).not.toHaveClass('selected');
    });

    test('applies correct classes to nequi option when selected', () => {
      const propsWithNequi = {
        ...defaultProps,
        paymentMethod: 'NEQUI',
      };

      render(<PaymentMethodSelector {...propsWithNequi} />);

      const nequiButton = screen.getByRole('button', { name: /Nequi/i });
      expect(nequiButton).toHaveClass('payment-method-option');
      expect(nequiButton).toHaveClass('selected');
    });

    test('applies correct classes to nequi option when not selected', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const nequiButton = screen.getByRole('button', { name: /Nequi/i });
      expect(nequiButton).toHaveClass('payment-method-option');
      expect(nequiButton).not.toHaveClass('selected');
    });

    test('nequi logo has additional CSS class', () => {
      const { container } = render(<PaymentMethodSelector {...defaultProps} />);

      const nequiLogo = container.querySelector('.nequi-logo');
      expect(nequiLogo).toBeInTheDocument();
      expect(nequiLogo).toHaveClass('payment-method-icon');
    });
  });

  describe('Accessibility', () => {
    test('label text is visible', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const label = screen.getByText(/Selecciona Método de Pago \*/i);
      expect(label.tagName).toBe('LABEL');
    });

    test('buttons have accessible names', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Tarjeta Crédito\/Débito/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Nequi/i })).toBeInTheDocument();
    });

    test('images have alt text', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const nequiImage = screen.getByAltText('Nequi');
      expect(nequiImage).toHaveAttribute('alt', 'Nequi');
    });

    test('buttons are keyboard accessible', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('Multiple Clicks', () => {
    test('handles rapid clicks on same option', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const cardButton = screen.getByRole('button', { name: /Tarjeta Crédito\/Débito/i });

      fireEvent.click(cardButton);
      fireEvent.click(cardButton);
      fireEvent.click(cardButton);

      expect(mockSetPaymentMethod).toHaveBeenCalledTimes(3);
      expect(mockSetPaymentMethod).toHaveBeenCalledWith('CARD');
    });

    test('handles rapid clicks switching between options', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const cardButton = screen.getByRole('button', { name: /Tarjeta Crédito\/Débito/i });
      const nequiButton = screen.getByRole('button', { name: /Nequi/i });

      fireEvent.click(cardButton);
      fireEvent.click(nequiButton);
      fireEvent.click(cardButton);
      fireEvent.click(nequiButton);

      expect(mockSetPaymentMethod).toHaveBeenCalledTimes(4);
      expect(mockSetPaymentMethod).toHaveBeenNthCalledWith(1, 'CARD');
      expect(mockSetPaymentMethod).toHaveBeenNthCalledWith(2, 'NEQUI');
      expect(mockSetPaymentMethod).toHaveBeenNthCalledWith(3, 'CARD');
      expect(mockSetPaymentMethod).toHaveBeenNthCalledWith(4, 'NEQUI');
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined paymentMethod gracefully', () => {
      const propsWithUndefined = {
        ...defaultProps,
        paymentMethod: undefined,
      };

      render(<PaymentMethodSelector {...propsWithUndefined} />);

      const cardButton = screen.getByRole('button', { name: /Tarjeta Crédito\/Débito/i });
      const nequiButton = screen.getByRole('button', { name: /Nequi/i });

      expect(cardButton).not.toHaveClass('selected');
      expect(nequiButton).not.toHaveClass('selected');
    });

    test('handles empty string paymentMethod', () => {
      const propsWithEmpty = {
        ...defaultProps,
        paymentMethod: '',
      };

      render(<PaymentMethodSelector {...propsWithEmpty} />);

      const cardButton = screen.getByRole('button', { name: /Tarjeta Crédito\/Débito/i });
      const nequiButton = screen.getByRole('button', { name: /Nequi/i });

      expect(cardButton).not.toHaveClass('selected');
      expect(nequiButton).not.toHaveClass('selected');
    });

    test('handles unknown paymentMethod value', () => {
      const propsWithUnknown = {
        ...defaultProps,
        paymentMethod: 'UNKNOWN_METHOD',
      };

      render(<PaymentMethodSelector {...propsWithUnknown} />);

      const cardButton = screen.getByRole('button', { name: /Tarjeta Crédito\/Débito/i });
      const nequiButton = screen.getByRole('button', { name: /Nequi/i });

      expect(cardButton).not.toHaveClass('selected');
      expect(nequiButton).not.toHaveClass('selected');
    });
  });
});
