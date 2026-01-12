import { render, screen, fireEvent } from '@testing-library/react';

// Mock config to avoid import.meta.env issues
jest.mock('@/config/wompi', () => ({
  WOMPI_CONFIG: {
    API_URL: 'https://api-sandbox.co.uat.wompi.dev/v1',
    PUBLIC_KEY: 'pub_stagtest_test',
    BACKEND_URL: 'http://localhost:4567/api/checkout',
    SCRIPT_URL: 'https://checkout.wompi.co/widget.js',
  },
  WOMPI_TEST_DATA: {
    CARD: {
      number: '4242 4242 4242 4242',
      cvc: 'Any 3 digits',
      expiration: 'Any future date',
    },
    NEQUI: {
      approved: '3991111111',
      declined: '3992222222',
    },
  },
}));

// Mock hooks BEFORE importing component
jest.mock('@/hooks/useCart');
jest.mock('@/hooks/useUnifiedCheckout');

import { CheckoutModal } from '../checkout-modal';
import { useCart } from '@/hooks/useCart';
import { useUnifiedCheckout } from '@/hooks/useUnifiedCheckout';

// Mock child components
jest.mock('../checkout/OrderSummary', () => ({
  OrderSummary: ({ items, summary }) => (
    <div data-testid="order-summary">
      <div>Items: {items.length}</div>
      <div>Total: {summary.total}</div>
    </div>
  ),
}));

jest.mock('../checkout/CustomerForm', () => ({
  CustomerForm: ({ customerData, setCustomerData, isProcessing }) => (
    <div data-testid="customer-form">
      <input
        data-testid="customer-name"
        value={customerData.name}
        onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
        disabled={isProcessing}
      />
    </div>
  ),
}));

jest.mock('../checkout/PaymentMethodSelector', () => ({
  PaymentMethodSelector: ({ paymentMethod, setPaymentMethod, isProcessing }) => (
    <div data-testid="payment-method-selector">
      <button
        onClick={() => setPaymentMethod('CARD')}
        disabled={isProcessing}
        data-selected={paymentMethod === 'CARD'}
      >
        Card
      </button>
      <button
        onClick={() => setPaymentMethod('NEQUI')}
        disabled={isProcessing}
        data-selected={paymentMethod === 'NEQUI'}
      >
        Nequi
      </button>
    </div>
  ),
}));

jest.mock('../checkout/CardForm', () => ({
  CardForm: ({ cardData, setCardData, isProcessing }) => (
    <div data-testid="card-form">
      <input
        data-testid="card-number"
        value={cardData.number}
        onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
        disabled={isProcessing}
      />
    </div>
  ),
}));

jest.mock('../checkout/NequiForm', () => ({
  NequiForm: ({ nequiPhone, setNequiPhone, isProcessing }) => (
    <div data-testid="nequi-form">
      <input
        data-testid="nequi-phone"
        value={nequiPhone}
        onChange={(e) => setNequiPhone(e.target.value)}
        disabled={isProcessing}
      />
    </div>
  ),
}));

jest.mock('../ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, type }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} type={type}>
      {children}
    </button>
  ),
}));

jest.mock('../ui/alert', () => ({
  Alert: ({ isOpen, type, title, message, onClose }) =>
    isOpen ? (
      <div data-testid="alert" data-type={type}>
        <h3>{title}</h3>
        <p>{message}</p>
        <button onClick={onClose}>Close Alert</button>
      </div>
    ) : null,
}));

describe('CheckoutModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockHandleCheckout = jest.fn();
  const mockSetError = jest.fn();
  const mockSetAlert = jest.fn();
  const mockSetPaymentMethod = jest.fn();
  const mockSetCustomerData = jest.fn();
  const mockSetCardData = jest.fn();
  const mockSetNequiPhone = jest.fn();
  const mockHandleCardNumberChange = jest.fn();

  const mockCartItems = [
    { id: 1, name: 'Product 1', price: 50000, quantity: 2, image: '/img1.jpg' },
    { id: 2, name: 'Product 2', price: 30000, quantity: 1, image: '/img2.jpg' },
  ];

  const mockSummary = {
    subtotal: 130000,
    shipping: 5000,
    iva: 24700,
    total: 159700,
  };

  const defaultUseCartReturn = {
    items: mockCartItems,
    getCartSummary: jest.fn(() => mockSummary),
    emptyCart: jest.fn(),
  };

  const defaultCheckoutState = {
    isProcessing: false,
    processingMessage: '',
    error: null,
    alert: { isOpen: false, type: 'info', title: '', message: '' },
    paymentMethod: 'CARD',
    cardData: { number: '', cvc: '', exp_month: '', exp_year: '', card_holder: '' },
    cardType: null,
    nequiPhone: '',
    customerData: { email: '', name: '', phone: '' },
    supportedMethods: ['CARD', 'NEQUI'],
    gateway: 'wompi',
  };

  const defaultCheckoutActions = {
    setError: mockSetError,
    setAlert: mockSetAlert,
    setPaymentMethod: mockSetPaymentMethod,
    setCardData: mockSetCardData,
    handleCardNumberChange: mockHandleCardNumberChange,
    setNequiPhone: mockSetNequiPhone,
    setCustomerData: mockSetCustomerData,
    handleCheckout: mockHandleCheckout,
  };

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
    gateway: 'wompi',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useCart.mockReturnValue(defaultUseCartReturn);
    useUnifiedCheckout.mockReturnValue({
      state: defaultCheckoutState,
      actions: defaultCheckoutActions,
    });
  });

  describe('Rendering', () => {
    test('returns null when isOpen is false', () => {
      const { container } = render(<CheckoutModal {...defaultProps} isOpen={false} />);
      expect(container.firstChild).toBeNull();
    });

    test('renders modal when isOpen is true', () => {
      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByText('Pago Seguro')).toBeInTheDocument();
    });

    test('renders modal header with title', () => {
      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByRole('heading', { name: /Pago Seguro/i })).toBeInTheDocument();
    });

    test('renders close button in header', () => {
      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByLabelText(/Cerrar pago/i)).toBeInTheDocument();
    });

    test('renders modal with correct backdrop', () => {
      const { container } = render(<CheckoutModal {...defaultProps} />);
      expect(container.querySelector('.checkout-modal-backdrop')).toBeInTheDocument();
    });

    test('renders modal body', () => {
      const { container } = render(<CheckoutModal {...defaultProps} />);
      expect(container.querySelector('.checkout-modal-body')).toBeInTheDocument();
    });
  });

  describe('Empty Cart State', () => {
    beforeEach(() => {
      useCart.mockReturnValue({
        ...defaultUseCartReturn,
        items: [],
      });
    });

    test('renders empty cart message when no items', () => {
      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByText(/Tu carrito está vacío/i)).toBeInTheDocument();
    });

    test('renders continue shopping button when cart is empty', () => {
      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByText(/Continuar Comprando/i)).toBeInTheDocument();
    });

    test('does not render checkout form when cart is empty', () => {
      render(<CheckoutModal {...defaultProps} />);
      expect(screen.queryByTestId('order-summary')).not.toBeInTheDocument();
      expect(screen.queryByTestId('customer-form')).not.toBeInTheDocument();
    });

    test('closes modal when continue shopping is clicked', () => {
      render(<CheckoutModal {...defaultProps} />);
      fireEvent.click(screen.getByText(/Continuar Comprando/i));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Child Components Rendering', () => {
    test('renders OrderSummary with correct props', () => {
      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByTestId('order-summary')).toBeInTheDocument();
      expect(screen.getByText(`Items: ${mockCartItems.length}`)).toBeInTheDocument();
      expect(screen.getByText(`Total: ${mockSummary.total}`)).toBeInTheDocument();
    });

    test('renders CustomerForm', () => {
      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByTestId('customer-form')).toBeInTheDocument();
    });

    test('renders PaymentMethodSelector', () => {
      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByTestId('payment-method-selector')).toBeInTheDocument();
    });

    test('renders CardForm when CARD payment method is selected', () => {
      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByTestId('card-form')).toBeInTheDocument();
    });

    test('does not render NequiForm when CARD payment method is selected', () => {
      render(<CheckoutModal {...defaultProps} />);
      expect(screen.queryByTestId('nequi-form')).not.toBeInTheDocument();
    });

    test('renders NequiForm when NEQUI payment method is selected', () => {
      useUnifiedCheckout.mockReturnValue({
        state: { ...defaultCheckoutState, paymentMethod: 'NEQUI' },
        actions: defaultCheckoutActions,
      });

      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByTestId('nequi-form')).toBeInTheDocument();
    });

    test('does not render CardForm when NEQUI payment method is selected', () => {
      useUnifiedCheckout.mockReturnValue({
        state: { ...defaultCheckoutState, paymentMethod: 'NEQUI' },
        actions: defaultCheckoutActions,
      });

      render(<CheckoutModal {...defaultProps} />);
      expect(screen.queryByTestId('card-form')).not.toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    test('displays error message when error state is present', () => {
      useUnifiedCheckout.mockReturnValue({
        state: { ...defaultCheckoutState, error: 'Payment failed' },
        actions: defaultCheckoutActions,
      });

      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByText('Payment failed')).toBeInTheDocument();
    });

    test('does not display error message when error is null', () => {
      render(<CheckoutModal {...defaultProps} />);
      const errorDiv = document.querySelector('.checkout-error');
      expect(errorDiv).not.toBeInTheDocument();
    });
  });

  describe('Alert Component', () => {
    test('renders Alert when alert.isOpen is true', () => {
      useUnifiedCheckout.mockReturnValue({
        state: {
          ...defaultCheckoutState,
          alert: {
            isOpen: true,
            type: 'success',
            title: 'Success',
            message: 'Payment completed',
          },
        },
        actions: defaultCheckoutActions,
      });

      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Payment completed')).toBeInTheDocument();
    });

    test('does not render Alert when alert.isOpen is false', () => {
      render(<CheckoutModal {...defaultProps} />);
      expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
    });

    test('calls setAlert when alert is closed', () => {
      useUnifiedCheckout.mockReturnValue({
        state: {
          ...defaultCheckoutState,
          alert: { isOpen: true, type: 'info', title: 'Info', message: 'Test message' },
        },
        actions: defaultCheckoutActions,
      });

      render(<CheckoutModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Close Alert'));
      expect(mockSetAlert).toHaveBeenCalledWith({
        isOpen: false,
        type: 'info',
        title: 'Info',
        message: 'Test message',
      });
    });
  });

  describe('Action Buttons', () => {
    test('renders Cancel button', () => {
      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
    });

    test('renders Completar Pago button', () => {
      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Completar Pago/i })).toBeInTheDocument();
    });

    test('Cancel button calls onClose and clears error', () => {
      render(<CheckoutModal {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

      expect(mockSetError).toHaveBeenCalledWith(null);
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('Completar Pago button calls handleCheckout', () => {
      render(<CheckoutModal {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /Completar Pago/i }));

      expect(mockHandleCheckout).toHaveBeenCalled();
    });

    test('both buttons are disabled when isProcessing is true', () => {
      useUnifiedCheckout.mockReturnValue({
        state: { ...defaultCheckoutState, isProcessing: true },
        actions: defaultCheckoutActions,
      });

      render(<CheckoutModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Procesando/i })).toBeDisabled();
    });

    test('both buttons are enabled when isProcessing is false', () => {
      render(<CheckoutModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Cancelar/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /Completar Pago/i })).not.toBeDisabled();
    });
  });

  describe('Processing State', () => {
    test('shows processing message when isProcessing is true', () => {
      useUnifiedCheckout.mockReturnValue({
        state: { ...defaultCheckoutState, isProcessing: true, processingMessage: 'Processing payment...' },
        actions: defaultCheckoutActions,
      });

      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByText('Processing payment...')).toBeInTheDocument();
    });

    test('shows default Procesando... when isProcessing is true and no message', () => {
      useUnifiedCheckout.mockReturnValue({
        state: { ...defaultCheckoutState, isProcessing: true },
        actions: defaultCheckoutActions,
      });

      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByText('Procesando...')).toBeInTheDocument();
    });

    test('shows Completar Pago when not processing', () => {
      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByText('Completar Pago')).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    test('clicking backdrop calls handleClose', () => {
      const { container } = render(<CheckoutModal {...defaultProps} />);
      const backdrop = container.querySelector('.checkout-modal-backdrop');

      fireEvent.click(backdrop);
      expect(mockSetError).toHaveBeenCalledWith(null);
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('clicking modal content does not close modal', () => {
      const { container } = render(<CheckoutModal {...defaultProps} />);
      const modal = container.querySelector('.checkout-modal');

      fireEvent.click(modal);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('clicking close button calls handleClose', () => {
      render(<CheckoutModal {...defaultProps} />);
      fireEvent.click(screen.getByLabelText(/Cerrar pago/i));

      expect(mockSetError).toHaveBeenCalledWith(null);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Hook Integration', () => {
    test('calls useCart hook', () => {
      render(<CheckoutModal {...defaultProps} />);
      expect(useCart).toHaveBeenCalled();
    });

    test('calls useUnifiedCheckout with correct params', () => {
      render(<CheckoutModal {...defaultProps} />);

      expect(useUnifiedCheckout).toHaveBeenCalledWith({
        gateway: 'wompi',
        items: mockCartItems,
        getCartSummary: expect.any(Function),
        emptyCart: expect.any(Function),
        onSuccess: mockOnSuccess,
      });
    });

    test('uses custom gateway when provided', () => {
      render(<CheckoutModal {...defaultProps} gateway="custom" />);

      expect(useUnifiedCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          gateway: 'custom',
        })
      );
    });

    test('defaults to wompi gateway when not provided', () => {
      const { gateway, ...propsWithoutGateway } = defaultProps;
      render(<CheckoutModal {...propsWithoutGateway} />);

      expect(useUnifiedCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          gateway: 'wompi',
        })
      );
    });
  });

  describe('Form State Management', () => {
    test('customer form receives correct props', () => {
      render(<CheckoutModal {...defaultProps} />);
      const customerInput = screen.getByTestId('customer-name');

      expect(customerInput).toHaveValue('');
      expect(customerInput).not.toBeDisabled();
    });

    test('customer form is disabled when processing', () => {
      useUnifiedCheckout.mockReturnValue({
        state: { ...defaultCheckoutState, isProcessing: true },
        actions: defaultCheckoutActions,
      });

      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByTestId('customer-name')).toBeDisabled();
    });

    test('card form is disabled when processing', () => {
      useUnifiedCheckout.mockReturnValue({
        state: { ...defaultCheckoutState, isProcessing: true },
        actions: defaultCheckoutActions,
      });

      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByTestId('card-number')).toBeDisabled();
    });

    test('nequi form is disabled when processing', () => {
      useUnifiedCheckout.mockReturnValue({
        state: { ...defaultCheckoutState, paymentMethod: 'NEQUI', isProcessing: true },
        actions: defaultCheckoutActions,
      });

      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByTestId('nequi-phone')).toBeDisabled();
    });
  });

  describe('Payment Section', () => {
    test('renders payment section header', () => {
      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByRole('heading', { name: /Información de Pago/i })).toBeInTheDocument();
    });

    test('payment section has correct semantic structure', () => {
      const { container } = render(<CheckoutModal {...defaultProps} />);
      const sections = container.querySelectorAll('section.checkout-section');
      expect(sections.length).toBeGreaterThan(0);
    });
  });

  describe('Visual Elements', () => {
    test('renders shopping cart icon in header', () => {
      const { container } = render(<CheckoutModal {...defaultProps} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    test('renders spinner icon when processing', () => {
      useUnifiedCheckout.mockReturnValue({
        state: { ...defaultCheckoutState, isProcessing: true },
        actions: defaultCheckoutActions,
      });

      const { container } = render(<CheckoutModal {...defaultProps} />);
      const spinnerSvg = Array.from(container.querySelectorAll('svg')).find(
        svg => svg.style.animation === 'spin 1s linear infinite'
      );
      expect(spinnerSvg).toBeInTheDocument();
    });

    test('renders checkmark icon when not processing', () => {
      const { container } = render(<CheckoutModal {...defaultProps} />);
      // Verify SVG exists in the Completar Pago button
      const payButton = screen.getByRole('button', { name: /Completar Pago/i });
      expect(payButton.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('close button has aria-label', () => {
      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByLabelText(/Cerrar pago/i)).toHaveAttribute('aria-label');
    });

    test('modal has proper heading hierarchy', () => {
      render(<CheckoutModal {...defaultProps} />);
      const h2 = screen.getByRole('heading', { level: 2, name: /Pago Seguro/i });
      const h3 = screen.getByRole('heading', { level: 3, name: /Información de Pago/i });

      expect(h2).toBeInTheDocument();
      expect(h3).toBeInTheDocument();
    });

    test('action buttons have appropriate types', () => {
      render(<CheckoutModal {...defaultProps} />);
      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      const payButton = screen.getByRole('button', { name: /Completar Pago/i });

      expect(cancelButton).toHaveAttribute('type', 'button');
      expect(payButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Edge Cases', () => {
    test('handles empty array items', () => {
      useCart.mockReturnValue({
        ...defaultUseCartReturn,
        items: [],
      });

      render(<CheckoutModal {...defaultProps} />);
      expect(screen.getByText(/Tu carrito está vacío/i)).toBeInTheDocument();
    });

    test('handles modal re-opening after closing', () => {
      const { rerender } = render(<CheckoutModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Pago Seguro')).not.toBeInTheDocument();

      rerender(<CheckoutModal {...defaultProps} isOpen={true} />);
      expect(screen.getByText('Pago Seguro')).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    test('modal has correct CSS classes', () => {
      const { container } = render(<CheckoutModal {...defaultProps} />);

      expect(container.querySelector('.checkout-modal-backdrop')).toBeInTheDocument();
      expect(container.querySelector('.checkout-modal')).toBeInTheDocument();
      expect(container.querySelector('.checkout-modal-header')).toBeInTheDocument();
      expect(container.querySelector('.checkout-modal-body')).toBeInTheDocument();
    });

    test('empty state has correct CSS class', () => {
      useCart.mockReturnValue({
        ...defaultUseCartReturn,
        items: [],
      });

      const { container } = render(<CheckoutModal {...defaultProps} />);
      expect(container.querySelector('.checkout-empty')).toBeInTheDocument();
    });

    test('error display has correct CSS class', () => {
      useUnifiedCheckout.mockReturnValue({
        state: { ...defaultCheckoutState, error: 'Test error' },
        actions: defaultCheckoutActions,
      });

      const { container } = render(<CheckoutModal {...defaultProps} />);
      expect(container.querySelector('.checkout-error')).toBeInTheDocument();
    });

    test('actions container has correct CSS class', () => {
      const { container } = render(<CheckoutModal {...defaultProps} />);
      expect(container.querySelector('.checkout-actions')).toBeInTheDocument();
    });
  });
});
