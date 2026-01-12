import { render, screen, fireEvent } from '@testing-library/react';
import { CardForm } from '../CardForm';

// Mock wompi config to avoid import.meta.env issues in tests
jest.mock('@/config/wompi', () => ({
  WOMPI_TEST_DATA: {
    CARD: {
      number: '4242 4242 4242 4242',
      cvc: 'Any 3 digits',
      expiration: 'Any future date',
    },
  },
}));

import { WOMPI_TEST_DATA } from '@/config/wompi';

describe('CardForm Component', () => {
  const mockSetCardData = jest.fn();
  const mockOnCardNumberChange = jest.fn();

  const defaultProps = {
    cardData: {
      number: '',
      cvc: '',
      exp_month: '',
      exp_year: '',
      card_holder: '',
    },
    setCardData: mockSetCardData,
    cardType: null,
    onCardNumberChange: mockOnCardNumberChange,
    isProcessing: false,
  };

  beforeEach(() => {
    mockSetCardData.mockClear();
    mockOnCardNumberChange.mockClear();
  });

  describe('Rendering', () => {
    test('renders all form fields', () => {
      render(<CardForm {...defaultProps} />);

      expect(screen.getByLabelText(/Número de Tarjeta/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Titular de la Tarjeta/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Mes de Exp/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Año de Exp/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/CVC/i)).toBeInTheDocument();
    });

    test('displays card type badge when cardType is provided', () => {
      const propsWithCardType = {
        ...defaultProps,
        cardType: { name: 'VISA', icon: 'visa-icon' },
      };

      render(<CardForm {...propsWithCardType} />);
      expect(screen.getByText('VISA')).toBeInTheDocument();
    });

    test('displays test card information', () => {
      render(<CardForm {...defaultProps} />);

      expect(screen.getByText(/Tarjetas de Prueba/i)).toBeInTheDocument();
      expect(screen.getByText(WOMPI_TEST_DATA.CARD.number)).toBeInTheDocument();
    });

    test('shows correct placeholders', () => {
      render(<CardForm {...defaultProps} />);

      expect(screen.getByPlaceholderText('4242 4242 4242 4242')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('JUAN PEREZ')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('MM')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('AA')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('123')).toBeInTheDocument();
    });
  });

  describe('Card Number Input', () => {
    test('calls onCardNumberChange when card number is entered', () => {
      render(<CardForm {...defaultProps} />);

      const cardNumberInput = screen.getByPlaceholderText('4242 4242 4242 4242');
      fireEvent.change(cardNumberInput, { target: { value: '4242424242424242' } });

      expect(mockOnCardNumberChange).toHaveBeenCalledWith('4242424242424242');
    });

    test('displays current card number value', () => {
      const propsWithCardNumber = {
        ...defaultProps,
        cardData: { ...defaultProps.cardData, number: '4242 4242 4242 4242' },
      };

      render(<CardForm {...propsWithCardNumber} />);
      expect(screen.getByDisplayValue('4242 4242 4242 4242')).toBeInTheDocument();
    });

    test('limits card number to 19 characters', () => {
      render(<CardForm {...defaultProps} />);

      const cardNumberInput = screen.getByPlaceholderText('4242 4242 4242 4242');
      expect(cardNumberInput).toHaveAttribute('maxLength', '19');
    });
  });

  describe('Card Holder Input', () => {
    test('converts card holder name to uppercase', () => {
      render(<CardForm {...defaultProps} />);

      const cardHolderInput = screen.getByPlaceholderText('JUAN PEREZ');
      fireEvent.change(cardHolderInput, { target: { value: 'john doe' } });

      expect(mockSetCardData).toHaveBeenCalledWith({
        ...defaultProps.cardData,
        card_holder: 'JOHN DOE',
      });
    });

    test('displays current card holder value', () => {
      const propsWithCardHolder = {
        ...defaultProps,
        cardData: { ...defaultProps.cardData, card_holder: 'JUAN PEREZ' },
      };

      render(<CardForm {...propsWithCardHolder} />);
      expect(screen.getByDisplayValue('JUAN PEREZ')).toBeInTheDocument();
    });
  });

  describe('Expiration Month Input', () => {
    test('accepts valid month values (01-12)', () => {
      render(<CardForm {...defaultProps} />);

      const monthInput = screen.getByPlaceholderText('MM');
      fireEvent.change(monthInput, { target: { value: '12' } });

      expect(mockSetCardData).toHaveBeenCalledWith({
        ...defaultProps.cardData,
        exp_month: '12',
      });
    });

    test('rejects month values greater than 12', () => {
      render(<CardForm {...defaultProps} />);

      const monthInput = screen.getByPlaceholderText('MM');
      fireEvent.change(monthInput, { target: { value: '13' } });

      expect(mockSetCardData).not.toHaveBeenCalled();
    });

    test('removes non-numeric characters from month', () => {
      render(<CardForm {...defaultProps} />);

      const monthInput = screen.getByPlaceholderText('MM');
      fireEvent.change(monthInput, { target: { value: '1a2' } });

      expect(mockSetCardData).toHaveBeenCalledWith({
        ...defaultProps.cardData,
        exp_month: '12',
      });
    });

    test('limits month to 2 characters', () => {
      render(<CardForm {...defaultProps} />);

      const monthInput = screen.getByPlaceholderText('MM');
      expect(monthInput).toHaveAttribute('maxLength', '2');
    });
  });

  describe('Expiration Year Input', () => {
    test('accepts numeric year values', () => {
      render(<CardForm {...defaultProps} />);

      const yearInput = screen.getByPlaceholderText('AA');
      fireEvent.change(yearInput, { target: { value: '25' } });

      expect(mockSetCardData).toHaveBeenCalledWith({
        ...defaultProps.cardData,
        exp_year: '25',
      });
    });

    test('removes non-numeric characters from year', () => {
      render(<CardForm {...defaultProps} />);

      const yearInput = screen.getByPlaceholderText('AA');
      fireEvent.change(yearInput, { target: { value: '2a5' } });

      expect(mockSetCardData).toHaveBeenCalledWith({
        ...defaultProps.cardData,
        exp_year: '25',
      });
    });

    test('limits year to 2 characters', () => {
      render(<CardForm {...defaultProps} />);

      const yearInput = screen.getByPlaceholderText('AA');
      expect(yearInput).toHaveAttribute('maxLength', '2');
    });
  });

  describe('CVC Input', () => {
    test('accepts numeric CVC values', () => {
      render(<CardForm {...defaultProps} />);

      const cvcInput = screen.getByPlaceholderText('123');
      fireEvent.change(cvcInput, { target: { value: '123' } });

      expect(mockSetCardData).toHaveBeenCalledWith({
        ...defaultProps.cardData,
        cvc: '123',
      });
    });

    test('removes non-numeric characters from CVC', () => {
      render(<CardForm {...defaultProps} />);

      const cvcInput = screen.getByPlaceholderText('123');
      fireEvent.change(cvcInput, { target: { value: '1a2b3' } });

      expect(mockSetCardData).toHaveBeenCalledWith({
        ...defaultProps.cardData,
        cvc: '123',
      });
    });

    test('limits CVC to 4 characters', () => {
      render(<CardForm {...defaultProps} />);

      const cvcInput = screen.getByPlaceholderText('123');
      expect(cvcInput).toHaveAttribute('maxLength', '4');
    });
  });

  describe('Disabled State', () => {
    test('disables all inputs when isProcessing is true', () => {
      const propsWithProcessing = {
        ...defaultProps,
        isProcessing: true,
      };

      render(<CardForm {...propsWithProcessing} />);

      expect(screen.getByPlaceholderText('4242 4242 4242 4242')).toBeDisabled();
      expect(screen.getByPlaceholderText('JUAN PEREZ')).toBeDisabled();
      expect(screen.getByPlaceholderText('MM')).toBeDisabled();
      expect(screen.getByPlaceholderText('AA')).toBeDisabled();
      expect(screen.getByPlaceholderText('123')).toBeDisabled();
    });

    test('enables all inputs when isProcessing is false', () => {
      render(<CardForm {...defaultProps} />);

      expect(screen.getByPlaceholderText('4242 4242 4242 4242')).not.toBeDisabled();
      expect(screen.getByPlaceholderText('JUAN PEREZ')).not.toBeDisabled();
      expect(screen.getByPlaceholderText('MM')).not.toBeDisabled();
      expect(screen.getByPlaceholderText('AA')).not.toBeDisabled();
      expect(screen.getByPlaceholderText('123')).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    test('all inputs have associated labels', () => {
      render(<CardForm {...defaultProps} />);

      const cardNumberInput = screen.getByLabelText(/Número de Tarjeta/i);
      const cardHolderInput = screen.getByLabelText(/Titular de la Tarjeta/i);
      const monthInput = screen.getByLabelText(/Mes de Exp/i);
      const yearInput = screen.getByLabelText(/Año de Exp/i);
      const cvcInput = screen.getByLabelText(/CVC/i);

      expect(cardNumberInput).toHaveAttribute('id', 'card-number');
      expect(cardHolderInput).toHaveAttribute('id', 'card-holder');
      expect(monthInput).toHaveAttribute('id', 'exp-month');
      expect(yearInput).toHaveAttribute('id', 'exp-year');
      expect(cvcInput).toHaveAttribute('id', 'cvc');
    });
  });
});
