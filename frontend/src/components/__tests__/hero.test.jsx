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
    expect(screen.getByText('Edición 2026')).toBeInTheDocument();
  });

  test('renders hero title', () => {
    render(<Hero />);
    expect(screen.getByText('El siguiente nivel en innovación')).toBeInTheDocument();
  });

  test('renders hero title as h1', () => {
    render(<Hero />);
    const title = screen.getByText('El siguiente nivel en innovación');
    expect(title.tagName).toBe('H1');
  });

  test('renders hero description', () => {
    render(<Hero />);
    expect(
      screen.getByText(/Dispositivos diseñados para el presente, creados para el futuro/i)
    ).toBeInTheDocument();
  });

  test('mentions technology adaptation in description', () => {
    render(<Hero />);
    expect(screen.getByText(/Tecnología que se adapta a tu estilo de vida/i)).toBeInTheDocument();
  });

  test('renders Compra ahora button', () => {
    render(<Hero />);
    const shopButton = screen.getByRole('button', { name: /compra ahora/i });
    expect(shopButton).toBeInTheDocument();
  });

  test('renders Acerca de button', () => {
    render(<Hero />);
    const aboutButton = screen.getByRole('button', { name: /acerca de/i });
    expect(aboutButton).toBeInTheDocument();
  });

  test('both buttons are rendered', () => {
    render(<Hero />);
    const shopButton = screen.getByRole('button', { name: /compra ahora/i });
    const aboutButton = screen.getByRole('button', { name: /acerca de/i });
    expect(shopButton).toBeInTheDocument();
    expect(aboutButton).toBeInTheDocument();
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
