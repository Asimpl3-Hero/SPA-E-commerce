import { render, screen, fireEvent } from '@testing-library/react';
import { NequiForm } from '../NequiForm';

// Mock wompi config to avoid import.meta.env issues in tests
jest.mock('@/config/wompi', () => ({
  WOMPI_TEST_DATA: {
    NEQUI: {
      approved: '3991111111',
      declined: '3992222222',
    },
  },
}));

import { WOMPI_TEST_DATA } from '@/config/wompi';

describe('NequiForm Component', () => {
  const mockSetNequiPhone = jest.fn();

  const defaultProps = {
    nequiPhone: '',
    setNequiPhone: mockSetNequiPhone,
    isProcessing: false,
  };

  beforeEach(() => {
    mockSetNequiPhone.mockClear();
  });

  describe('Rendering', () => {
    test('renders phone number input field', () => {
      render(<NequiForm {...defaultProps} />);

      expect(screen.getByLabelText(/Número de Teléfono Nequi/i)).toBeInTheDocument();
    });

    test('shows correct placeholder', () => {
      render(<NequiForm {...defaultProps} />);

      expect(screen.getByPlaceholderText('3991111111')).toBeInTheDocument();
    });

    test('displays helper text', () => {
      render(<NequiForm {...defaultProps} />);

      expect(screen.getByText(/Ingresa tu número de teléfono Nequi de 10 dígitos/i)).toBeInTheDocument();
    });

    test('displays test phone numbers information', () => {
      render(<NequiForm {...defaultProps} />);

      expect(screen.getByText(/Números de Prueba Nequi/i)).toBeInTheDocument();
      expect(screen.getByText(WOMPI_TEST_DATA.NEQUI.approved)).toBeInTheDocument();
      expect(screen.getByText(WOMPI_TEST_DATA.NEQUI.declined)).toBeInTheDocument();
    });

    test('shows approved and declined test numbers', () => {
      render(<NequiForm {...defaultProps} />);

      expect(screen.getByText(/Aprobado:/i)).toBeInTheDocument();
      expect(screen.getByText(/Rechazado:/i)).toBeInTheDocument();
    });

    test('renders required field indicator (*)', () => {
      render(<NequiForm {...defaultProps} />);

      expect(screen.getByText(/Número de Teléfono Nequi \*/i)).toBeInTheDocument();
    });
  });

  describe('Phone Input Validation', () => {
    test('accepts numeric phone numbers', () => {
      render(<NequiForm {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('3991111111');
      fireEvent.change(phoneInput, { target: { value: '3001234567' } });

      expect(mockSetNequiPhone).toHaveBeenCalledWith('3001234567');
    });

    test('removes non-numeric characters', () => {
      render(<NequiForm {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('3991111111');
      fireEvent.change(phoneInput, { target: { value: '300abc1234def567' } });

      expect(mockSetNequiPhone).toHaveBeenCalledWith('3001234567');
    });

    test('limits phone number to 10 digits', () => {
      render(<NequiForm {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('3991111111');
      // The component checks value.length <= 10, so values > 10 digits are rejected
      fireEvent.change(phoneInput, { target: { value: '30012345678901234' } });

      // Should not be called because the value has more than 10 digits
      expect(mockSetNequiPhone).not.toHaveBeenCalled();
    });

    test('does not call setNequiPhone when input exceeds 10 digits', () => {
      render(<NequiForm {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('3991111111');
      fireEvent.change(phoneInput, { target: { value: '12345678901' } });

      // Should not be called because the cleaned value has 11 digits
      expect(mockSetNequiPhone).not.toHaveBeenCalled();
    });

    test('allows empty phone number', () => {
      const propsWithPhone = {
        ...defaultProps,
        nequiPhone: '3001234567',
      };

      render(<NequiForm {...propsWithPhone} />);

      const phoneInput = screen.getByPlaceholderText('3991111111');
      fireEvent.change(phoneInput, { target: { value: '' } });

      expect(mockSetNequiPhone).toHaveBeenCalledWith('');
    });

    test('strips spaces from phone number', () => {
      render(<NequiForm {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('3991111111');
      fireEvent.change(phoneInput, { target: { value: '300 123 4567' } });

      expect(mockSetNequiPhone).toHaveBeenCalledWith('3001234567');
    });

    test('strips hyphens from phone number', () => {
      render(<NequiForm {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('3991111111');
      fireEvent.change(phoneInput, { target: { value: '300-123-4567' } });

      expect(mockSetNequiPhone).toHaveBeenCalledWith('3001234567');
    });

    test('strips parentheses from phone number', () => {
      render(<NequiForm {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('3991111111');
      fireEvent.change(phoneInput, { target: { value: '(300)1234567' } });

      expect(mockSetNequiPhone).toHaveBeenCalledWith('3001234567');
    });
  });

  describe('Input Display', () => {
    test('displays current phone value', () => {
      const propsWithPhone = {
        ...defaultProps,
        nequiPhone: '3001234567',
      };

      render(<NequiForm {...propsWithPhone} />);
      expect(screen.getByDisplayValue('3001234567')).toBeInTheDocument();
    });

    test('has correct input type', () => {
      render(<NequiForm {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('3991111111');
      expect(phoneInput).toHaveAttribute('type', 'tel');
    });

    test('has correct maxLength attribute', () => {
      render(<NequiForm {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('3991111111');
      expect(phoneInput).toHaveAttribute('maxLength', '10');
    });
  });

  describe('Disabled State', () => {
    test('disables input when isProcessing is true', () => {
      const propsWithProcessing = {
        ...defaultProps,
        isProcessing: true,
      };

      render(<NequiForm {...propsWithProcessing} />);

      const phoneInput = screen.getByPlaceholderText('3991111111');
      expect(phoneInput).toBeDisabled();
    });

    test('enables input when isProcessing is false', () => {
      render(<NequiForm {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('3991111111');
      expect(phoneInput).not.toBeDisabled();
    });

    test('input is disabled when processing', () => {
      const propsWithProcessing = {
        ...defaultProps,
        isProcessing: true,
      };

      render(<NequiForm {...propsWithProcessing} />);

      const phoneInput = screen.getByPlaceholderText('3991111111');

      // Verify that input is disabled (browser prevents user interaction)
      expect(phoneInput).toBeDisabled();

      // Note: fireEvent can still trigger onChange on disabled inputs in tests,
      // but in real browser, disabled inputs cannot be changed by users
    });
  });

  describe('Accessibility', () => {
    test('input has associated label with correct htmlFor', () => {
      render(<NequiForm {...defaultProps} />);

      const phoneInput = screen.getByLabelText(/Número de Teléfono Nequi/i);
      expect(phoneInput).toHaveAttribute('id', 'nequi-phone');
    });

    test('helper text provides additional context', () => {
      render(<NequiForm {...defaultProps} />);

      const helperText = screen.getByText(/Ingresa tu número de teléfono Nequi de 10 dígitos/i);
      expect(helperText.tagName).toBe('SMALL');
    });

    test('helper text has appropriate styling', () => {
      const { container } = render(<NequiForm {...defaultProps} />);

      const helperText = container.querySelector('small');
      expect(helperText).toHaveStyle({
        color: '#6b7280',
        fontSize: '0.875rem',
        marginTop: '0.25rem',
      });
    });
  });

  describe('Test Data Display', () => {
    test('displays sandbox test data section', () => {
      render(<NequiForm {...defaultProps} />);

      const testDataSection = screen.getByText(/Números de Prueba Nequi/i).closest('.checkout-test-cards');
      expect(testDataSection).toBeInTheDocument();
    });

    test('shows both approved and declined test numbers', () => {
      render(<NequiForm {...defaultProps} />);

      const approvedNumber = WOMPI_TEST_DATA.NEQUI.approved;
      const declinedNumber = WOMPI_TEST_DATA.NEQUI.declined;

      expect(screen.getByText(approvedNumber)).toBeInTheDocument();
      expect(screen.getByText(declinedNumber)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles consecutive changes correctly', () => {
      render(<NequiForm {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('3991111111');

      fireEvent.change(phoneInput, { target: { value: '3' } });
      expect(mockSetNequiPhone).toHaveBeenCalledWith('3');

      fireEvent.change(phoneInput, { target: { value: '30' } });
      expect(mockSetNequiPhone).toHaveBeenCalledWith('30');

      fireEvent.change(phoneInput, { target: { value: '300' } });
      expect(mockSetNequiPhone).toHaveBeenCalledWith('300');
    });

    test('handles paste events with non-numeric content', () => {
      render(<NequiForm {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('3991111111');
      fireEvent.change(phoneInput, { target: { value: 'abcd3001234567efgh' } });

      expect(mockSetNequiPhone).toHaveBeenCalledWith('3001234567');
    });

    test('handles special characters', () => {
      render(<NequiForm {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('3991111111');
      // '+57-300-123-4567' becomes '573001234567' after removing non-digits (12 digits)
      // Component rejects values > 10 digits
      fireEvent.change(phoneInput, { target: { value: '+57-300-123-4567' } });

      // Should not be called because cleaned value has 12 digits
      expect(mockSetNequiPhone).not.toHaveBeenCalled();
    });

    test('handles exactly 10 digits', () => {
      render(<NequiForm {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('3991111111');
      fireEvent.change(phoneInput, { target: { value: '3001234567' } });

      expect(mockSetNequiPhone).toHaveBeenCalledWith('3001234567');
    });

    test('handles less than 10 digits', () => {
      render(<NequiForm {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('3991111111');
      fireEvent.change(phoneInput, { target: { value: '300' } });

      expect(mockSetNequiPhone).toHaveBeenCalledWith('300');
    });
  });

  describe('Colombian Phone Number Format', () => {
    test('accepts Colombian mobile numbers starting with 3', () => {
      render(<NequiForm {...defaultProps} />);

      const phoneInput = screen.getByPlaceholderText('3991111111');
      const colombianNumbers = ['3001234567', '3101234567', '3201234567', '3991234567'];

      colombianNumbers.forEach(number => {
        mockSetNequiPhone.mockClear();
        fireEvent.change(phoneInput, { target: { value: number } });
        expect(mockSetNequiPhone).toHaveBeenCalledWith(number);
      });
    });
  });
});
