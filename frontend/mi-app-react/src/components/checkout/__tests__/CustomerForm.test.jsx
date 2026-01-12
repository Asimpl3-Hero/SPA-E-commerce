import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerForm } from '../CustomerForm';

describe('CustomerForm Component', () => {
  const mockSetCustomerData = jest.fn();

  const defaultProps = {
    customerData: {
      name: '',
      email: '',
      phone: '',
    },
    setCustomerData: mockSetCustomerData,
    isProcessing: false,
  };

  beforeEach(() => {
    mockSetCustomerData.mockClear();
  });

  describe('Rendering', () => {
    test('renders section with correct title', () => {
      render(<CustomerForm {...defaultProps} />);

      expect(screen.getByText('Información del Cliente')).toBeInTheDocument();
    });

    test('renders all form fields', () => {
      render(<CustomerForm {...defaultProps} />);

      expect(screen.getByLabelText(/Nombre Completo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Correo Electrónico/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Teléfono/i)).toBeInTheDocument();
    });

    test('shows correct placeholders', () => {
      render(<CustomerForm {...defaultProps} />);

      expect(screen.getByPlaceholderText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('juan@ejemplo.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('+573001234567')).toBeInTheDocument();
    });

    test('renders required field indicators (*)', () => {
      render(<CustomerForm {...defaultProps} />);

      expect(screen.getByText('Nombre Completo *')).toBeInTheDocument();
      expect(screen.getByText('Correo Electrónico *')).toBeInTheDocument();
      expect(screen.getByText('Teléfono *')).toBeInTheDocument();
    });
  });

  describe('Name Input', () => {
    test('calls setCustomerData when name is entered', () => {
      render(<CustomerForm {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('Juan Pérez');
      fireEvent.change(nameInput, { target: { value: 'María García' } });

      expect(mockSetCustomerData).toHaveBeenCalledWith({
        ...defaultProps.customerData,
        name: 'María García',
      });
    });

    test('displays current name value', () => {
      const propsWithName = {
        ...defaultProps,
        customerData: { ...defaultProps.customerData, name: 'Juan Pérez' },
      };

      render(<CustomerForm {...propsWithName} />);
      expect(screen.getByDisplayValue('Juan Pérez')).toBeInTheDocument();
    });

    test('allows empty name value', () => {
      const propsWithName = {
        ...defaultProps,
        customerData: { ...defaultProps.customerData, name: 'Juan Pérez' },
      };

      render(<CustomerForm {...propsWithName} />);

      const nameInput = screen.getByPlaceholderText('Juan Pérez');
      fireEvent.change(nameInput, { target: { value: '' } });

      expect(mockSetCustomerData).toHaveBeenCalledWith({
        ...propsWithName.customerData,
        name: '',
      });
    });

    test('accepts names with special characters', () => {
      render(<CustomerForm {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('Juan Pérez');
      fireEvent.change(nameInput, { target: { value: 'José María O\'Brien-García' } });

      expect(mockSetCustomerData).toHaveBeenCalledWith({
        ...defaultProps.customerData,
        name: 'José María O\'Brien-García',
      });
    });
  });

  describe('Email Input', () => {
    test('calls setCustomerData when email is entered', () => {
      render(<CustomerForm {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('juan@ejemplo.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(mockSetCustomerData).toHaveBeenCalledWith({
        ...defaultProps.customerData,
        email: 'test@example.com',
      });
    });

    test('displays current email value', () => {
      const propsWithEmail = {
        ...defaultProps,
        customerData: { ...defaultProps.customerData, email: 'juan@ejemplo.com' },
      };

      render(<CustomerForm {...propsWithEmail} />);
      expect(screen.getByDisplayValue('juan@ejemplo.com')).toBeInTheDocument();
    });

    test('has correct input type for email', () => {
      render(<CustomerForm {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('juan@ejemplo.com');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('accepts valid email formats', () => {
      render(<CustomerForm {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('juan@ejemplo.com');
      const validEmails = [
        'user@domain.com',
        'user.name@domain.co',
        'user+tag@domain.com',
        'user123@sub.domain.com',
      ];

      validEmails.forEach(email => {
        fireEvent.change(emailInput, { target: { value: email } });
        expect(mockSetCustomerData).toHaveBeenCalledWith({
          ...defaultProps.customerData,
          email,
        });
      });
    });
  });

  describe('Phone Input', () => {
    test('calls setCustomerData when phone is entered', () => {
      render(<CustomerForm {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('+573001234567');
      fireEvent.change(phoneInput, { target: { value: '+573001234567' } });

      expect(mockSetCustomerData).toHaveBeenCalledWith({
        ...defaultProps.customerData,
        phone: '+573001234567',
      });
    });

    test('displays current phone value', () => {
      const propsWithPhone = {
        ...defaultProps,
        customerData: { ...defaultProps.customerData, phone: '+573001234567' },
      };

      render(<CustomerForm {...propsWithPhone} />);
      expect(screen.getByDisplayValue('+573001234567')).toBeInTheDocument();
    });

    test('has correct input type for phone', () => {
      render(<CustomerForm {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('+573001234567');
      expect(phoneInput).toHaveAttribute('type', 'tel');
    });

    test('accepts phone numbers with different formats', () => {
      render(<CustomerForm {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('+573001234567');
      const phoneFormats = [
        '+573001234567',
        '3001234567',
        '+57 300 123 4567',
        '(300) 123-4567',
      ];

      phoneFormats.forEach(phone => {
        fireEvent.change(phoneInput, { target: { value: phone } });
        expect(mockSetCustomerData).toHaveBeenCalledWith({
          ...defaultProps.customerData,
          phone,
        });
      });
    });
  });

  describe('Disabled State', () => {
    test('disables all inputs when isProcessing is true', () => {
      const propsWithProcessing = {
        ...defaultProps,
        isProcessing: true,
      };

      render(<CustomerForm {...propsWithProcessing} />);

      expect(screen.getByPlaceholderText('Juan Pérez')).toBeDisabled();
      expect(screen.getByPlaceholderText('juan@ejemplo.com')).toBeDisabled();
      expect(screen.getByPlaceholderText('+573001234567')).toBeDisabled();
    });

    test('enables all inputs when isProcessing is false', () => {
      render(<CustomerForm {...defaultProps} />);

      expect(screen.getByPlaceholderText('Juan Pérez')).not.toBeDisabled();
      expect(screen.getByPlaceholderText('juan@ejemplo.com')).not.toBeDisabled();
      expect(screen.getByPlaceholderText('+573001234567')).not.toBeDisabled();
    });

    test('inputs are disabled when processing', () => {
      const propsWithProcessing = {
        ...defaultProps,
        isProcessing: true,
      };

      render(<CustomerForm {...propsWithProcessing} />);

      const nameInput = screen.getByPlaceholderText('Juan Pérez');

      // Verify that input is disabled (browser prevents user interaction)
      expect(nameInput).toBeDisabled();

      // Note: fireEvent can still trigger onChange on disabled inputs in tests,
      // but in real browser, disabled inputs cannot be changed by users
    });
  });

  describe('Accessibility', () => {
    test('all inputs have associated labels with correct htmlFor', () => {
      render(<CustomerForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nombre Completo/i);
      const emailInput = screen.getByLabelText(/Correo Electrónico/i);
      const phoneInput = screen.getByLabelText(/Teléfono/i);

      expect(nameInput).toHaveAttribute('id', 'customer-name');
      expect(emailInput).toHaveAttribute('id', 'customer-email');
      expect(phoneInput).toHaveAttribute('id', 'customer-phone');
    });

    test('section has proper semantic structure', () => {
      const { container } = render(<CustomerForm {...defaultProps} />);

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveClass('checkout-section');
    });

    test('heading uses h3 tag', () => {
      render(<CustomerForm {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Información del Cliente');
    });
  });

  describe('Form Data Updates', () => {
    test('updates only the changed field', () => {
      const existingData = {
        name: 'Juan Pérez',
        email: 'juan@ejemplo.com',
        phone: '+573001234567',
      };

      const propsWithData = {
        ...defaultProps,
        customerData: existingData,
      };

      render(<CustomerForm {...propsWithData} />);

      const emailInput = screen.getByPlaceholderText('juan@ejemplo.com');
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

      expect(mockSetCustomerData).toHaveBeenCalledWith({
        name: 'Juan Pérez',
        email: 'new@example.com',
        phone: '+573001234567',
      });
    });

    test('handles multiple rapid changes', () => {
      render(<CustomerForm {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('Juan Pérez');

      fireEvent.change(nameInput, { target: { value: 'J' } });
      fireEvent.change(nameInput, { target: { value: 'Ju' } });
      fireEvent.change(nameInput, { target: { value: 'Jua' } });

      expect(mockSetCustomerData).toHaveBeenCalledTimes(3);
      expect(mockSetCustomerData).toHaveBeenLastCalledWith({
        ...defaultProps.customerData,
        name: 'Jua',
      });
    });
  });
});
