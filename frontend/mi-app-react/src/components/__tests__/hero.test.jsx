import { render, screen } from '@testing-library/react';
import { Hero } from '../hero';

describe('Hero Component', () => {
  test('renders hero section', () => {
    const { container } = render(<Hero />);
    const section = container.querySelector('section');
    expect(section).toHaveClass('hero-section');
  });

  test('renders new arrivals badge', () => {
    render(<Hero />);
    expect(screen.getByText('New Arrivals 2025')).toBeInTheDocument();
  });

  test('renders hero title', () => {
    render(<Hero />);
    expect(screen.getByText('Discover the Future of Tech')).toBeInTheDocument();
  });

  test('renders hero title as h1', () => {
    render(<Hero />);
    const title = screen.getByText('Discover the Future of Tech');
    expect(title.tagName).toBe('H1');
  });

  test('renders hero description', () => {
    render(<Hero />);
    expect(
      screen.getByText(/Premium electronics and gadgets curated for those who demand the best/i)
    ).toBeInTheDocument();
  });

  test('mentions free shipping in description', () => {
    render(<Hero />);
    expect(screen.getByText(/Free shipping on orders over \$99/i)).toBeInTheDocument();
  });

  test('renders Shop Now button', () => {
    render(<Hero />);
    const shopButton = screen.getByRole('link', { name: /shop now/i });
    expect(shopButton).toBeInTheDocument();
  });

  test('Shop Now button links to products section', () => {
    render(<Hero />);
    const shopButton = screen.getByRole('link', { name: /shop now/i });
    expect(shopButton).toHaveAttribute('href', '#products');
  });

  test('renders View Deals button', () => {
    render(<Hero />);
    expect(screen.getByRole('button', { name: /view deals/i })).toBeInTheDocument();
  });

  test('renders hero image', () => {
    render(<Hero />);
    const image = screen.getByAltText('Featured tech products');
    expect(image).toBeInTheDocument();
  });

  test('hero image has correct src', () => {
    render(<Hero />);
    const image = screen.getByAltText('Featured tech products');
    expect(image).toHaveAttribute('src', '/premium-tech-gadgets-collection-headphones-smartwa.jpg');
  });

  test('renders ArrowRight icon in Shop Now button', () => {
    render(<Hero />);
    const shopButton = screen.getByRole('link', { name: /shop now/i });
    expect(shopButton.querySelector('svg')).toBeInTheDocument();
  });

  test('both buttons are rendered', () => {
    render(<Hero />);
    const shopLink = screen.getByRole('link', { name: /shop now/i });
    const dealsButton = screen.getByRole('button', { name: /view deals/i });
    expect(shopLink).toBeInTheDocument();
    expect(dealsButton).toBeInTheDocument();
  });

  test('Shop Now link is rendered as a link element', () => {
    render(<Hero />);
    const shopButton = screen.getByRole('link', { name: /shop now/i });
    expect(shopButton.tagName).toBe('A');
  });

  test('View Deals button has large size', () => {
    render(<Hero />);
    const dealsButton = screen.getByRole('button', { name: /view deals/i });
    expect(dealsButton).toHaveClass('btn-size-lg');
  });

  test('View Deals button has outline variant', () => {
    render(<Hero />);
    const dealsButton = screen.getByRole('button', { name: /view deals/i });
    expect(dealsButton).toHaveClass('btn-outline');
  });

  test('renders badge wrapper with correct class', () => {
    const { container } = render(<Hero />);
    const badgeWrapper = container.querySelector('.hero-badge-wrapper');
    expect(badgeWrapper).toBeInTheDocument();
  });

  test('renders hero grid layout', () => {
    const { container } = render(<Hero />);
    const grid = container.querySelector('.hero-grid');
    expect(grid).toBeInTheDocument();
  });

  test('renders hero content section', () => {
    const { container } = render(<Hero />);
    const content = container.querySelector('.hero-content');
    expect(content).toBeInTheDocument();
  });

  test('renders hero image wrapper', () => {
    const { container } = render(<Hero />);
    const imageWrapper = container.querySelector('.hero-image-wrapper');
    expect(imageWrapper).toBeInTheDocument();
  });
});
