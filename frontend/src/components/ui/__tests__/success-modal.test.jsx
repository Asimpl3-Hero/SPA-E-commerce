import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SuccessModal } from '../success-modal';

describe('SuccessModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    orderReference: 'ORD-12345',
    onViewInvoice: jest.fn(),
    onContinueShopping: jest.fn(),
  };

  beforeEach(() => {
    jest.useFakeTimers();
    // Reset document body overflow
    document.body.style.overflow = '';
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    document.body.style.overflow = '';
  });

  test('renders modal when isOpen is true', () => {
    render(<SuccessModal {...defaultProps} />);

    expect(screen.getByText('¡Pago Exitoso!')).toBeInTheDocument();
    expect(screen.getByText('Tu orden ha sido procesada correctamente.')).toBeInTheDocument();
    expect(screen.getByText('ORD-12345')).toBeInTheDocument();
  });

  test('does not render when isOpen is false', () => {
    const { container } = render(
      <SuccessModal {...defaultProps} isOpen={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  test('displays order reference number', () => {
    render(<SuccessModal {...defaultProps} orderReference="ORD-99999" />);

    expect(screen.getByText('ORD-99999')).toBeInTheDocument();
    expect(screen.getByText('Número de Orden:')).toBeInTheDocument();
  });

  test('locks body scroll when modal is open', () => {
    render(<SuccessModal {...defaultProps} />);

    expect(document.body.style.overflow).toBe('hidden');
  });

  test('unlocks body scroll when modal closes', () => {
    const { unmount } = render(<SuccessModal {...defaultProps} />);

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('unset');
  });

  test('calls onViewInvoice when "Ver Factura" button is clicked', () => {
    const handleViewInvoice = jest.fn();

    render(
      <SuccessModal {...defaultProps} onViewInvoice={handleViewInvoice} />
    );

    const viewInvoiceButton = screen.getByLabelText('Ver factura de compra');
    fireEvent.click(viewInvoiceButton);

    expect(handleViewInvoice).toHaveBeenCalledTimes(1);
  });

  test('calls onContinueShopping and onClose when "Continuar Comprando" is clicked', async () => {
    const handleContinueShopping = jest.fn();
    const handleClose = jest.fn();

    render(
      <SuccessModal
        {...defaultProps}
        onContinueShopping={handleContinueShopping}
        onClose={handleClose}
      />
    );

    const continueButton = screen.getByLabelText('Continuar comprando');

    act(() => {
      fireEvent.click(continueButton);
    });

    expect(handleContinueShopping).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  test('handles missing onViewInvoice callback gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    render(
      <SuccessModal {...defaultProps} onViewInvoice={undefined} />
    );

    const viewInvoiceButton = screen.getByLabelText('Ver factura de compra');

    expect(() => {
      fireEvent.click(viewInvoiceButton);
    }).not.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(
      '⚠️ onViewInvoice callback not provided'
    );

    consoleSpy.mockRestore();
  });

  test('handles missing onContinueShopping callback gracefully', async () => {
    const handleClose = jest.fn();

    render(
      <SuccessModal
        {...defaultProps}
        onContinueShopping={undefined}
        onClose={handleClose}
      />
    );

    const continueButton = screen.getByLabelText('Continuar comprando');

    act(() => {
      fireEvent.click(continueButton);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  test('applies closing class when closing', () => {
    const { rerender } = render(<SuccessModal {...defaultProps} />);

    const continueButton = screen.getByLabelText('Continuar comprando');

    act(() => {
      fireEvent.click(continueButton);
    });

    const modal = screen.getByText('¡Pago Exitoso!').closest('.success-modal');
    expect(modal).toHaveClass('closing');

    const overlay = screen.getByText('¡Pago Exitoso!').closest('.success-modal-overlay');
    expect(overlay).toHaveClass('closing');
  });

  test('renders success icon SVG', () => {
    render(<SuccessModal {...defaultProps} />);

    const iconWrapper = document.querySelector('.success-modal-icon-wrapper');
    expect(iconWrapper).toBeInTheDocument();

    const svg = iconWrapper.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  test('renders both action buttons', () => {
    render(<SuccessModal {...defaultProps} />);

    expect(screen.getByLabelText('Ver factura de compra')).toBeInTheDocument();
    expect(screen.getByLabelText('Continuar comprando')).toBeInTheDocument();
  });

  test('displays confirmation message', () => {
    render(<SuccessModal {...defaultProps} />);

    expect(
      screen.getByText(
        'Te enviaremos un correo de confirmación con los detalles de tu compra.'
      )
    ).toBeInTheDocument();
  });

  test('handles rapid open/close transitions', async () => {
    const handleClose = jest.fn();
    const { rerender } = render(
      <SuccessModal {...defaultProps} isOpen={true} onClose={handleClose} />
    );

    expect(screen.getByText('¡Pago Exitoso!')).toBeInTheDocument();

    rerender(
      <SuccessModal {...defaultProps} isOpen={false} onClose={handleClose} />
    );

    expect(document.body.style.overflow).toBe('unset');
  });
});
