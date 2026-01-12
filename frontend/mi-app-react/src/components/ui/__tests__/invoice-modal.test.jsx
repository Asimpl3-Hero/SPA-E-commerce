import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { InvoiceModal } from '../invoice-modal';

describe('InvoiceModal Component', () => {
  const mockInvoiceData = {
    orderReference: 'ORD-12345',
    date: '2024-01-15',
    items: [
      {
        name: 'Product 1',
        quantity: 2,
        price: 50000,
      },
      {
        name: 'Product 2',
        quantity: 1,
        price: 30000,
      },
    ],
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+57 300 123 4567',
      address: 'Calle 123 #45-67, Bogotá',
    },
    payment: {
      method: 'Tarjeta de Crédito',
      reference: 'PAY-ABC123',
      last4: '4242',
    },
    summary: {
      subtotal: 130000,
      iva: 24700,
      shipping: 0,
      total: 154700,
    },
  };

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    invoiceData: mockInvoiceData,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    document.body.style.overflow = '';
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    document.body.style.overflow = '';
    jest.restoreAllMocks();
  });

  test('renders invoice modal when isOpen is true and invoiceData is provided', () => {
    render(<InvoiceModal {...defaultProps} />);

    expect(screen.getByText('Factura de Compra')).toBeInTheDocument();
    expect(screen.getByText('Orden #ORD-12345')).toBeInTheDocument();
  });

  test('does not render when isOpen is false', () => {
    const { container } = render(
      <InvoiceModal {...defaultProps} isOpen={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  test('does not render when invoiceData is null', () => {
    const { container } = render(
      <InvoiceModal {...defaultProps} invoiceData={null} />
    );

    expect(container.firstChild).toBeNull();
  });

  test('locks body scroll when modal is open', () => {
    render(<InvoiceModal {...defaultProps} />);

    expect(document.body.style.overflow).toBe('hidden');
  });

  test('unlocks body scroll when modal closes', () => {
    const { unmount } = render(<InvoiceModal {...defaultProps} />);

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('unset');
  });

  test('displays invoice date', () => {
    render(<InvoiceModal {...defaultProps} />);

    expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    expect(screen.getByText('Fecha')).toBeInTheDocument();
  });

  test('displays payment method', () => {
    render(<InvoiceModal {...defaultProps} />);

    expect(screen.getByText('Tarjeta de Crédito')).toBeInTheDocument();
    expect(screen.getByText('Método de Pago')).toBeInTheDocument();
  });

  test('displays approved status', () => {
    render(<InvoiceModal {...defaultProps} />);

    expect(screen.getByText('Aprobado')).toBeInTheDocument();
  });

  test('displays customer information', () => {
    render(<InvoiceModal {...defaultProps} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('+57 300 123 4567')).toBeInTheDocument();
    expect(screen.getByText('Calle 123 #45-67, Bogotá')).toBeInTheDocument();
  });

  test('displays all items in the invoice', () => {
    render(<InvoiceModal {...defaultProps} />);

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
  });

  test('displays item quantities', () => {
    render(<InvoiceModal {...defaultProps} />);

    const rows = screen.getAllByRole('row');
    const product1Row = rows.find(row => row.textContent.includes('Product 1'));
    const product2Row = rows.find(row => row.textContent.includes('Product 2'));

    expect(product1Row.textContent).toContain('2');
    expect(product2Row.textContent).toContain('1');
  });

  test('displays formatted prices', () => {
    render(<InvoiceModal {...defaultProps} />);

    const rows = screen.getAllByRole('row');
    const bodyRows = rows.slice(1); // Skip header row

    expect(bodyRows[0].textContent).toContain('50,000');
    expect(bodyRows[1].textContent).toContain('30,000');
  });

  test('displays summary totals', () => {
    render(<InvoiceModal {...defaultProps} />);

    const summarySection = document.querySelector('.invoice-summary');
    expect(summarySection.textContent).toContain('130,000'); // Subtotal
    expect(summarySection.textContent).toContain('24,700'); // IVA
    expect(summarySection.textContent).toContain('154,700'); // Total
  });

  test('displays "Gratis" when shipping is 0', () => {
    render(<InvoiceModal {...defaultProps} />);

    expect(screen.getByText('Gratis')).toBeInTheDocument();
  });

  test('displays shipping cost when not free', () => {
    const dataWithShipping = {
      ...mockInvoiceData,
      summary: { ...mockInvoiceData.summary, shipping: 10000 },
    };

    render(<InvoiceModal {...defaultProps} invoiceData={dataWithShipping} />);

    const summarySection = document.querySelector('.invoice-summary');
    expect(summarySection.textContent).toContain('10,000');
  });

  test('displays payment reference', () => {
    render(<InvoiceModal {...defaultProps} />);

    expect(screen.getByText('PAY-ABC123')).toBeInTheDocument();
  });

  test('displays masked card number when last4 is provided', () => {
    render(<InvoiceModal {...defaultProps} />);

    expect(screen.getByText('•••• •••• •••• 4242')).toBeInTheDocument();
  });

  test('does not display card number when last4 is not provided', () => {
    const dataWithoutCard = {
      ...mockInvoiceData,
      payment: { ...mockInvoiceData.payment, last4: null },
    };

    render(<InvoiceModal {...defaultProps} invoiceData={dataWithoutCard} />);

    expect(screen.queryByText(/•••• •••• •••• /)).not.toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', async () => {
    const handleClose = jest.fn();

    render(<InvoiceModal {...defaultProps} onClose={handleClose} />);

    const closeButton = screen.getByLabelText('Close invoice');

    act(() => {
      fireEvent.click(closeButton);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  test('calls onClose when clicking overlay', async () => {
    const handleClose = jest.fn();

    render(<InvoiceModal {...defaultProps} onClose={handleClose} />);

    const overlay = document.querySelector('.invoice-modal-overlay');

    act(() => {
      fireEvent.click(overlay);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  test('does not close when clicking modal content', () => {
    const handleClose = jest.fn();

    render(<InvoiceModal {...defaultProps} onClose={handleClose} />);

    const modalContent = document.querySelector('.invoice-modal');

    fireEvent.click(modalContent);

    expect(handleClose).not.toHaveBeenCalled();
  });

  test('calls window.print when print button is clicked', () => {
    const printMock = jest.fn();
    window.print = printMock;

    render(<InvoiceModal {...defaultProps} />);

    const printButton = screen.getByText('Imprimir');
    fireEvent.click(printButton);

    expect(printMock).toHaveBeenCalledTimes(1);
  });

  test('logs to console when download button is clicked', () => {
    const consoleLogSpy = jest.spyOn(console, 'log');

    render(<InvoiceModal {...defaultProps} />);

    const downloadButton = screen.getByText('Descargar PDF');
    fireEvent.click(downloadButton);

    expect(consoleLogSpy).toHaveBeenCalledWith('Download invoice as PDF');
  });

  test('applies closing class when closing', () => {
    const { rerender } = render(<InvoiceModal {...defaultProps} />);

    const closeButton = screen.getByLabelText('Close invoice');

    act(() => {
      fireEvent.click(closeButton);
    });

    const modal = document.querySelector('.invoice-modal');
    expect(modal).toHaveClass('closing');

    const overlay = document.querySelector('.invoice-modal-overlay');
    expect(overlay).toHaveClass('closing');
  });

  test('renders all invoice sections', () => {
    render(<InvoiceModal {...defaultProps} />);

    expect(screen.getByText('Información del Cliente')).toBeInTheDocument();
    expect(screen.getByText('Productos')).toBeInTheDocument();
    expect(screen.getByText('Información de Pago')).toBeInTheDocument();
  });

  test('renders footer note', () => {
    render(<InvoiceModal {...defaultProps} />);

    expect(
      screen.getByText(
        'Gracias por tu compra. Si tienes alguna pregunta, contáctanos.'
      )
    ).toBeInTheDocument();
  });

  test('renders both action buttons', () => {
    render(<InvoiceModal {...defaultProps} />);

    expect(screen.getByText('Imprimir')).toBeInTheDocument();
    expect(screen.getByText('Descargar PDF')).toBeInTheDocument();
  });

  test('calculates item totals correctly', () => {
    render(<InvoiceModal {...defaultProps} />);

    const rows = screen.getAllByRole('row');
    const bodyRows = rows.slice(1); // Skip header row

    // Product 1: 2 × $50,000 = $100,000
    expect(bodyRows[0].textContent).toContain('100,000');
    // Product 2: 1 × $30,000 = $30,000
    expect(bodyRows[1].textContent).toContain('30,000');
  });

  test('handles missing onClose callback gracefully', async () => {
    render(<InvoiceModal {...defaultProps} onClose={undefined} />);

    const closeButton = screen.getByLabelText('Close invoice');

    act(() => {
      fireEvent.click(closeButton);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should not throw error
  });

  test('applies visible class when modal is open', () => {
    render(<InvoiceModal {...defaultProps} />);

    const overlay = document.querySelector('.invoice-modal-overlay');
    const modal = document.querySelector('.invoice-modal');

    expect(overlay).toHaveClass('visible');
    expect(modal).toHaveClass('visible');
  });
});
