import { render, screen } from '@testing-library/react';
import { Footer } from '../footer';

describe('Footer Component', () => {
  test('renders brand name', () => {
    render(<Footer />);
    expect(screen.getByText('TechVault')).toBeInTheDocument();
  });

  test('renders brand description', () => {
    render(<Footer />);
    expect(screen.getByText('Electrónicos premium para quienes exigen lo mejor.')).toBeInTheDocument();
  });

  test('renders Shop section title', () => {
    render(<Footer />);
    expect(screen.getByText('Tienda')).toBeInTheDocument();
  });

  test('renders all Shop links', () => {
    render(<Footer />);
    expect(screen.getByText('Todos los Productos')).toBeInTheDocument();
    expect(screen.getByText('Nuevos Ingresos')).toBeInTheDocument();
    expect(screen.getByText('Más Vendidos')).toBeInTheDocument();
    expect(screen.getByText('Ofertas')).toBeInTheDocument();
  });

  test('renders Support section title', () => {
    render(<Footer />);
    expect(screen.getByText('Soporte')).toBeInTheDocument();
  });

  test('renders all Support links', () => {
    render(<Footer />);
    expect(screen.getByText('Contáctanos')).toBeInTheDocument();
    expect(screen.getByText('Preguntas Frecuentes')).toBeInTheDocument();
    expect(screen.getByText('Envíos')).toBeInTheDocument();
    expect(screen.getByText('Devoluciones')).toBeInTheDocument();
  });

  test('renders Company section title', () => {
    render(<Footer />);
    expect(screen.getByText('Compañía')).toBeInTheDocument();
  });

  test('renders all Company links', () => {
    render(<Footer />);
    expect(screen.getByText('Acerca de')).toBeInTheDocument();
    expect(screen.getByText('Carreras')).toBeInTheDocument();
    expect(screen.getByText('Prensa')).toBeInTheDocument();
    expect(screen.getByText('Privacidad')).toBeInTheDocument();
  });

  test('renders copyright text', () => {
    render(<Footer />);
    expect(screen.getByText(/© 2025 TechVault. Todos los derechos reservados./i)).toBeInTheDocument();
  });

  test('all links have href attribute', () => {
    render(<Footer />);
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAttribute('href');
    });
  });

  test('renders footer element with correct class', () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('footer');
  });

  test('renders correct number of navigation sections', () => {
    render(<Footer />);
    expect(screen.getByText('Tienda')).toBeInTheDocument();
    expect(screen.getByText('Soporte')).toBeInTheDocument();
    expect(screen.getByText('Compañía')).toBeInTheDocument();
  });

  test('Shop section has 4 links', () => {
    const { container } = render(<Footer />);
    const shopSection = screen.getByText('Tienda').closest('div');
    const links = shopSection.querySelectorAll('a');
    expect(links.length).toBe(4);
  });

  test('Support section has 4 links', () => {
    const { container } = render(<Footer />);
    const supportSection = screen.getByText('Soporte').closest('div');
    const links = supportSection.querySelectorAll('a');
    expect(links.length).toBe(4);
  });

  test('Company section has 4 links', () => {
    const { container } = render(<Footer />);
    const companySection = screen.getByText('Compañía').closest('div');
    const links = companySection.querySelectorAll('a');
    expect(links.length).toBe(4);
  });
});
