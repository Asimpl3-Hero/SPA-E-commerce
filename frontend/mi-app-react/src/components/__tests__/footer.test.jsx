import { render, screen } from '@testing-library/react';
import { Footer } from '../footer';

describe('Footer Component', () => {
  test('renders brand name', () => {
    render(<Footer />);
    expect(screen.getByText('TechVault')).toBeInTheDocument();
  });

  test('renders brand description', () => {
    render(<Footer />);
    expect(screen.getByText('Premium electronics for those who demand the best.')).toBeInTheDocument();
  });

  test('renders Shop section title', () => {
    render(<Footer />);
    expect(screen.getByText('Shop')).toBeInTheDocument();
  });

  test('renders all Shop links', () => {
    render(<Footer />);
    expect(screen.getByText('All Products')).toBeInTheDocument();
    expect(screen.getByText('New Arrivals')).toBeInTheDocument();
    expect(screen.getByText('Best Sellers')).toBeInTheDocument();
    expect(screen.getByText('Sale')).toBeInTheDocument();
  });

  test('renders Support section title', () => {
    render(<Footer />);
    expect(screen.getByText('Support')).toBeInTheDocument();
  });

  test('renders all Support links', () => {
    render(<Footer />);
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
    expect(screen.getByText('FAQs')).toBeInTheDocument();
    expect(screen.getByText('Shipping')).toBeInTheDocument();
    expect(screen.getByText('Returns')).toBeInTheDocument();
  });

  test('renders Company section title', () => {
    render(<Footer />);
    expect(screen.getByText('Company')).toBeInTheDocument();
  });

  test('renders all Company links', () => {
    render(<Footer />);
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Careers')).toBeInTheDocument();
    expect(screen.getByText('Press')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
  });

  test('renders copyright text', () => {
    render(<Footer />);
    expect(screen.getByText(/© 2025 TechVault. All rights reserved./i)).toBeInTheDocument();
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
    expect(screen.getByText('Shop')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
  });

  test('Shop section has 4 links', () => {
    const { container } = render(<Footer />);
    const shopSection = screen.getByText('Shop').closest('div');
    const links = shopSection.querySelectorAll('a');
    expect(links.length).toBe(4);
  });

  test('Support section has 4 links', () => {
    const { container } = render(<Footer />);
    const supportSection = screen.getByText('Support').closest('div');
    const links = supportSection.querySelectorAll('a');
    expect(links.length).toBe(4);
  });

  test('Company section has 4 links', () => {
    const { container } = render(<Footer />);
    const companySection = screen.getByText('Company').closest('div');
    const links = companySection.querySelectorAll('a');
    expect(links.length).toBe(4);
  });
});
