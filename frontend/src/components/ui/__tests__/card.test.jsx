import { render, screen } from '@testing-library/react';
import { Card, CardContent } from '../card';

describe('Card Component', () => {
  test('renders card with children', () => {
    render(<Card>Test Content</Card>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('renders as a div element', () => {
    const { container } = render(<Card>Card</Card>);
    const card = container.firstChild;
    expect(card.tagName).toBe('DIV');
  });

  test('has base class', () => {
    const { container } = render(<Card>Card</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('card-base');
  });

  test('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Card</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('card-base', 'custom-class');
  });

  test('applies multiple custom classes', () => {
    const { container } = render(
      <Card className="class-1 class-2 class-3">Card</Card>
    );
    const card = container.firstChild;
    expect(card).toHaveClass('card-base', 'class-1', 'class-2', 'class-3');
  });

  test('forwards ref to the card element', () => {
    const ref = { current: null };
    render(<Card ref={ref}>Card</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  test('passes through additional props', () => {
    const { container } = render(
      <Card data-testid="card-test" aria-label="Test Card">
        Card
      </Card>
    );
    const card = container.firstChild;
    expect(card).toHaveAttribute('data-testid', 'card-test');
    expect(card).toHaveAttribute('aria-label', 'Test Card');
  });

  test('handles onClick event', () => {
    const handleClick = jest.fn();
    const { container } = render(<Card onClick={handleClick}>Card</Card>);
    const card = container.firstChild;

    card.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('can be styled with style prop', () => {
    const { container } = render(
      <Card style={{ backgroundColor: 'red' }}>Card</Card>
    );
    const card = container.firstChild;
    expect(card).toHaveAttribute('style');
    expect(card.style.backgroundColor).toBe('red');
  });

  test('renders nested content correctly', () => {
    render(
      <Card>
        <h1>Title</h1>
        <p>Description</p>
      </Card>
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  test('works without className prop', () => {
    const { container } = render(<Card>Card</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('card-base');
    expect(card.className).toBe('card-base ');
  });

  test('has correct displayName', () => {
    expect(Card.displayName).toBe('Card');
  });
});

describe('CardContent Component', () => {
  test('renders card content with children', () => {
    render(<CardContent>Content Text</CardContent>);
    expect(screen.getByText('Content Text')).toBeInTheDocument();
  });

  test('renders as a div element', () => {
    const { container } = render(<CardContent>Content</CardContent>);
    const content = container.firstChild;
    expect(content.tagName).toBe('DIV');
  });

  test('has card-content class', () => {
    const { container } = render(<CardContent>Content</CardContent>);
    const content = container.firstChild;
    expect(content).toHaveClass('card-content');
  });

  test('applies custom className', () => {
    const { container } = render(
      <CardContent className="custom-content">Content</CardContent>
    );
    const content = container.firstChild;
    expect(content).toHaveClass('card-content', 'custom-content');
  });

  test('forwards ref to the content element', () => {
    const ref = { current: null };
    render(<CardContent ref={ref}>Content</CardContent>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  test('passes through additional props', () => {
    const { container } = render(
      <CardContent data-testid="content-test" aria-label="Card Content">
        Content
      </CardContent>
    );
    const content = container.firstChild;
    expect(content).toHaveAttribute('data-testid', 'content-test');
    expect(content).toHaveAttribute('aria-label', 'Card Content');
  });

  test('works without className prop', () => {
    const { container } = render(<CardContent>Content</CardContent>);
    const content = container.firstChild;
    expect(content).toHaveClass('card-content');
    expect(content.className).toBe('card-content ');
  });

  test('has correct displayName', () => {
    expect(CardContent.displayName).toBe('CardContent');
  });

  test('renders nested elements', () => {
    render(
      <CardContent>
        <span>Nested</span>
        <div>Content</div>
      </CardContent>
    );
    expect(screen.getByText('Nested')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  test('can be used inside Card component', () => {
    render(
      <Card>
        <CardContent>
          <p>Card with content</p>
        </CardContent>
      </Card>
    );
    expect(screen.getByText('Card with content')).toBeInTheDocument();
  });
});

describe('Card and CardContent Integration', () => {
  test('Card and CardContent work together', () => {
    const { container } = render(
      <Card className="product-card">
        <CardContent className="product-content">
          <h2>Product Title</h2>
          <p>Product Description</p>
        </CardContent>
      </Card>
    );

    const card = container.querySelector('.card-base');
    const content = container.querySelector('.card-content');

    expect(card).toBeInTheDocument();
    expect(content).toBeInTheDocument();
    expect(card).toHaveClass('product-card');
    expect(content).toHaveClass('product-content');
  });

  test('multiple CardContent components in one Card', () => {
    render(
      <Card>
        <CardContent className="header">Header</CardContent>
        <CardContent className="body">Body</CardContent>
        <CardContent className="footer">Footer</CardContent>
      </Card>
    );

    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  test('both components forward refs correctly', () => {
    const cardRef = { current: null };
    const contentRef = { current: null };

    render(
      <Card ref={cardRef}>
        <CardContent ref={contentRef}>Test</CardContent>
      </Card>
    );

    expect(cardRef.current).toBeInstanceOf(HTMLDivElement);
    expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
    expect(cardRef.current).not.toBe(contentRef.current);
  });
});
