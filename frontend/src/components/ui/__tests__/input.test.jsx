import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../input';

describe('Input Component', () => {
  test('renders input element', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  test('renders as an input element', () => {
    const { container } = render(<Input />);
    const input = container.querySelector('input');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  test('has default type of text', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'text');
  });

  test('accepts custom type prop', () => {
    render(<Input type="email" />);
    const input = document.querySelector('input[type="email"]');
    expect(input).toBeInTheDocument();
  });

  test('renders password input', () => {
    render(<Input type="password" />);
    const input = document.querySelector('input[type="password"]');
    expect(input).toBeInTheDocument();
  });

  test('renders number input', () => {
    render(<Input type="number" />);
    const input = document.querySelector('input[type="number"]');
    expect(input).toBeInTheDocument();
  });

  test('renders search input', () => {
    render(<Input type="search" />);
    const input = document.querySelector('input[type="search"]');
    expect(input).toBeInTheDocument();
  });

  test('has input-base class', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('input-base');
  });

  test('applies custom className', () => {
    render(<Input className="custom-input" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('input-base', 'custom-input');
  });

  test('applies multiple custom classes', () => {
    render(<Input className="class-1 class-2" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('input-base', 'class-1', 'class-2');
  });

  test('forwards ref to the input element', () => {
    const ref = { current: null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  test('accepts placeholder prop', () => {
    render(<Input placeholder="Enter text..." />);
    const input = screen.getByPlaceholderText('Enter text...');
    expect(input).toBeInTheDocument();
  });

  test('accepts value prop', () => {
    render(<Input value="Test value" readOnly />);
    const input = screen.getByDisplayValue('Test value');
    expect(input).toBeInTheDocument();
  });

  test('accepts defaultValue prop', () => {
    render(<Input defaultValue="Default text" />);
    const input = screen.getByDisplayValue('Default text');
    expect(input).toBeInTheDocument();
  });

  test('handles onChange event', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'New value' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  test('handles onFocus event', () => {
    const handleFocus = jest.fn();
    render(<Input onFocus={handleFocus} />);
    const input = screen.getByRole('textbox');

    fireEvent.focus(input);

    expect(handleFocus).toHaveBeenCalledTimes(1);
  });

  test('handles onBlur event', () => {
    const handleBlur = jest.fn();
    render(<Input onBlur={handleBlur} />);
    const input = screen.getByRole('textbox');

    fireEvent.blur(input);

    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  test('handles onKeyDown event', () => {
    const handleKeyDown = jest.fn();
    render(<Input onKeyDown={handleKeyDown} />);
    const input = screen.getByRole('textbox');

    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleKeyDown).toHaveBeenCalledTimes(1);
  });

  test('can be disabled', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  test('can be required', () => {
    render(<Input required />);
    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
  });

  test('can be readonly', () => {
    render(<Input readOnly />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
  });

  test('accepts name prop', () => {
    render(<Input name="username" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('name', 'username');
  });

  test('accepts id prop', () => {
    render(<Input id="email-input" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'email-input');
  });

  test('accepts aria-label prop', () => {
    render(<Input aria-label="Search input" />);
    const input = screen.getByLabelText('Search input');
    expect(input).toBeInTheDocument();
  });

  test('accepts aria-describedby prop', () => {
    render(<Input aria-describedby="helper-text" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'helper-text');
  });

  test('accepts maxLength prop', () => {
    render(<Input maxLength={10} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxLength', '10');
  });

  test('accepts minLength prop', () => {
    render(<Input minLength={5} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('minLength', '5');
  });

  test('accepts pattern prop', () => {
    render(<Input pattern="[0-9]*" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('pattern', '[0-9]*');
  });

  test('accepts autoComplete prop', () => {
    render(<Input autoComplete="email" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('autoComplete', 'email');
  });

  test('accepts autoFocus prop', () => {
    render(<Input autoFocus />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveFocus();
  });

  test('can be styled with style prop', () => {
    render(<Input style={{ width: '200px' }} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveStyle({ width: '200px' });
  });

  test('works without className prop', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('input-base');
    expect(input.className).toBe('input-base ');
  });

  test('has correct displayName', () => {
    expect(Input.displayName).toBe('Input');
  });

  test('allows typing text', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'Hello World' } });

    expect(input.value).toBe('Hello World');
  });

  test('controlled input updates on value change', () => {
    const { rerender } = render(<Input value="Initial" readOnly />);
    let input = screen.getByDisplayValue('Initial');
    expect(input.value).toBe('Initial');

    rerender(<Input value="Updated" readOnly />);
    input = screen.getByDisplayValue('Updated');
    expect(input.value).toBe('Updated');
  });

  test('uncontrolled input maintains its value', () => {
    render(<Input defaultValue="Default" />);
    const input = screen.getByRole('textbox');

    expect(input.value).toBe('Default');

    fireEvent.change(input, { target: { value: 'Changed' } });
    expect(input.value).toBe('Changed');
  });

  test('accepts data attributes', () => {
    render(<Input data-testid="test-input" data-custom="value" />);
    const input = screen.getByTestId('test-input');
    expect(input).toHaveAttribute('data-custom', 'value');
  });

  test('number input accepts min and max', () => {
    render(<Input type="number" min={0} max={100} />);
    const input = document.querySelector('input[type="number"]');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
  });

  test('number input accepts step', () => {
    render(<Input type="number" step={0.1} />);
    const input = document.querySelector('input[type="number"]');
    expect(input).toHaveAttribute('step', '0.1');
  });
});
