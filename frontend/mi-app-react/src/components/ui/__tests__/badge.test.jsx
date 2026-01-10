import { render, screen } from '@testing-library/react';
import { Badge } from '../badge';

describe('Badge Component', () => {
  test('renders badge with default variant', () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText('Default Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge-base', 'badge-default');
  });

  test('renders badge with secondary variant', () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>);
    const badge = screen.getByText('Secondary Badge');
    expect(badge).toHaveClass('badge-base', 'badge-secondary');
  });

  test('renders badge with destructive variant', () => {
    render(<Badge variant="destructive">Destructive Badge</Badge>);
    const badge = screen.getByText('Destructive Badge');
    expect(badge).toHaveClass('badge-base', 'badge-destructive');
  });

  test('renders badge with outline variant', () => {
    render(<Badge variant="outline">Outline Badge</Badge>);
    const badge = screen.getByText('Outline Badge');
    expect(badge).toHaveClass('badge-base', 'badge-outline');
  });

  test('renders badge with success variant', () => {
    render(<Badge variant="success">Success Badge</Badge>);
    const badge = screen.getByText('Success Badge');
    expect(badge).toHaveClass('badge-base', 'badge-success');
  });

  test('renders badge with warning variant', () => {
    render(<Badge variant="warning">Warning Badge</Badge>);
    const badge = screen.getByText('Warning Badge');
    expect(badge).toHaveClass('badge-base', 'badge-warning');
  });

  test('renders badge with info variant', () => {
    render(<Badge variant="info">Info Badge</Badge>);
    const badge = screen.getByText('Info Badge');
    expect(badge).toHaveClass('badge-base', 'badge-info');
  });

  test('renders badge with new variant', () => {
    render(<Badge variant="new">New Badge</Badge>);
    const badge = screen.getByText('New Badge');
    expect(badge).toHaveClass('badge-base', 'badge-new');
  });

  test('renders badge with sale variant', () => {
    render(<Badge variant="sale">Sale Badge</Badge>);
    const badge = screen.getByText('Sale Badge');
    expect(badge).toHaveClass('badge-base', 'badge-sale');
  });

  test('applies custom className', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>);
    const badge = screen.getByText('Custom Badge');
    expect(badge).toHaveClass('badge-base', 'badge-default', 'custom-class');
  });

  test('forwards ref to the badge element', () => {
    const ref = { current: null };
    render(<Badge ref={ref}>Ref Badge</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
