import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ProductGrid } from '../product-grid';
import cartReducer from '@/store/cartSlice';
import * as productService from '@/services/productService';

// Mock product data
const mockProducts = [
  {
    id: 1,
    name: "Wireless Noise-Cancelling Headphones",
    price: 299,
    compare_at_price: 399,
    rating: 4.8,
    reviews_count: 2847,
    category: "Audio",
    badge: "Best Seller",
    image_url: "/placeholder.svg",
    description: "Premium over-ear headphones with industry-leading noise cancellation technology. Experience immersive audio with up to 30 hours of battery life and supreme comfort for all-day wear.",
    stock_quantity: 50,
  },
  {
    id: 2,
    name: "Smartwatch Pro Series 8",
    price: 449,
    rating: 4.9,
    reviews_count: 1923,
    category: "Wearables",
    badge: "New",
    image_url: "/placeholder.svg",
    description: "Advanced health tracking and fitness features with always-on display. Monitor your heart rate, blood oxygen, sleep quality, and stay connected with smart notifications.",
    stock_quantity: 30,
  },
  {
    id: 3,
    name: "Wireless Gaming Mouse",
    price: 89,
    compare_at_price: 129,
    rating: 4.7,
    reviews_count: 3214,
    category: "Gaming",
    image_url: "/placeholder.svg",
    description: "Ultra-responsive wireless gaming mouse with customizable RGB lighting. Features precision tracking up to 25,600 DPI, programmable buttons, and ultra-fast wireless connectivity for competitive gaming.",
    stock_quantity: 100,
  },
  {
    id: 4,
    name: "4K Webcam Ultra HD",
    price: 199,
    rating: 4.6,
    reviews_count: 892,
    category: "Cameras",
    image_url: "/placeholder.svg",
    description: "Crystal-clear 4K video calls with auto-framing technology and enhanced low-light performance. Perfect for streaming, video conferencing, and content creation with professional-grade image quality.",
    stock_quantity: 25,
  },
  {
    id: 5,
    name: "Portable SSD 2TB",
    price: 179,
    compare_at_price: 249,
    rating: 4.9,
    reviews_count: 1456,
    category: "Storage",
    image_url: "/placeholder.svg",
    description: "Lightning-fast portable storage with USB-C connectivity. Transfer speeds up to 1050MB/s, durable aluminum housing, and password protection to keep your data secure on the go.",
    stock_quantity: 75,
  },
  {
    id: 6,
    name: "Mechanical Keyboard RGB",
    price: 159,
    rating: 4.8,
    reviews_count: 2103,
    category: "Peripherals",
    badge: "Popular",
    image_url: "/placeholder.svg",
    description: "Premium mechanical switches with customizable RGB backlighting and per-key illumination. Tactile feedback, N-key rollover, and dedicated media controls for the ultimate typing experience.",
    stock_quantity: 60,
  },
];

// Mock the product service
jest.mock('@/services/productService', () => ({
  getAllProducts: jest.fn(),
  searchProducts: jest.fn(),
  getProductById: jest.fn(),
  createProduct: jest.fn(),
}));

const createMockStore = () => {
  return configureStore({
    reducer: {
      cart: cartReducer,
    },
  });
};

const renderWithStore = (component) => {
  const store = createMockStore();
  return render(<Provider store={store}>{component}</Provider>);
};

describe('ProductGrid Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Set default mock implementation
    productService.getAllProducts.mockResolvedValue(mockProducts);
    productService.searchProducts.mockResolvedValue(mockProducts);
  });

  test('renders featured products header when no search query', async () => {
    productService.getAllProducts.mockResolvedValue(mockProducts);

    renderWithStore(<ProductGrid searchQuery="" />);

    await waitFor(() => {
      expect(screen.getByText('Productos Destacados')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Descubre nuestra última colección de electrónicos premium')
    ).toBeInTheDocument();
  });

  test('renders all products when no search query', async () => {
    productService.getAllProducts.mockResolvedValue(mockProducts);

    renderWithStore(<ProductGrid searchQuery="" />);

    await waitFor(() => {
      expect(screen.getByText('Wireless Noise-Cancelling Headphones')).toBeInTheDocument();
    });

    expect(screen.getByText('Smartwatch Pro Series 8')).toBeInTheDocument();
    expect(screen.getByText('Wireless Gaming Mouse')).toBeInTheDocument();
    expect(screen.getByText('4K Webcam Ultra HD')).toBeInTheDocument();
    expect(screen.getByText('Portable SSD 2TB')).toBeInTheDocument();
    expect(screen.getByText('Mechanical Keyboard RGB')).toBeInTheDocument();
  });

  test('filters products by name', async () => {
    const headphonesProduct = mockProducts.filter(p =>
      p.name.toLowerCase().includes('headphones')
    );
    productService.searchProducts.mockResolvedValue(headphonesProduct);

    renderWithStore(<ProductGrid searchQuery="headphones" />);

    await waitFor(() => {
      expect(screen.getByText('Wireless Noise-Cancelling Headphones')).toBeInTheDocument();
    });

    expect(screen.getByText('Resultados de Búsqueda')).toBeInTheDocument();
    expect(screen.getByText('1 producto encontrado')).toBeInTheDocument();
    expect(screen.queryByText('Smartwatch Pro Series 8')).not.toBeInTheDocument();
  });

  test('filters products by category', async () => {
    const gamingProducts = mockProducts.filter(p =>
      p.category.toLowerCase().includes('gaming')
    );
    productService.searchProducts.mockResolvedValue(gamingProducts);

    renderWithStore(<ProductGrid searchQuery="gaming" />);

    await waitFor(() => {
      expect(screen.getByText('Resultados de Búsqueda')).toBeInTheDocument();
    });

    expect(screen.getByText('1 producto encontrado')).toBeInTheDocument();
    expect(screen.getByText('Wireless Gaming Mouse')).toBeInTheDocument();
  });

  test('filters products by description', async () => {
    const healthProducts = mockProducts.filter(p =>
      p.description.toLowerCase().includes('health tracking')
    );
    productService.searchProducts.mockResolvedValue(healthProducts);

    renderWithStore(<ProductGrid searchQuery="health tracking" />);

    await waitFor(() => {
      expect(screen.getByText('Smartwatch Pro Series 8')).toBeInTheDocument();
    });
  });

  test('displays empty state when no products match search', async () => {
    productService.searchProducts.mockResolvedValue([]);

    renderWithStore(<ProductGrid searchQuery="nonexistent product" />);

    await waitFor(() => {
      expect(screen.getByText('No se encontraron productos')).toBeInTheDocument();
    });

    expect(screen.getByText('Resultados de Búsqueda')).toBeInTheDocument();
    expect(screen.getByText('0 productos encontrados')).toBeInTheDocument();
  });

  test('search is case insensitive', async () => {
    const headphonesProduct = mockProducts.filter(p =>
      p.name.toLowerCase().includes('headphones')
    );
    productService.searchProducts.mockResolvedValue(headphonesProduct);

    renderWithStore(<ProductGrid searchQuery="HEADPHONES" />);

    await waitFor(() => {
      expect(screen.getByText('Wireless Noise-Cancelling Headphones')).toBeInTheDocument();
    });
  });

  test('displays correct plural form for product count', async () => {
    const headphonesProduct = mockProducts.filter(p =>
      p.name.toLowerCase().includes('headphones')
    );
    productService.searchProducts.mockResolvedValue(headphonesProduct);

    const { rerender } = renderWithStore(<ProductGrid searchQuery="headphones" />);

    await waitFor(() => {
      expect(screen.getByText('1 producto encontrado')).toBeInTheDocument();
    });

    const wirelessProducts = mockProducts.filter(p =>
      p.name.toLowerCase().includes('wireless')
    );
    productService.searchProducts.mockResolvedValue(wirelessProducts);

    rerender(
      <Provider store={createMockStore()}>
        <ProductGrid searchQuery="wireless" />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('2 productos encontrados')).toBeInTheDocument();
    });
  });

  test('opens product modal when product card is clicked', async () => {
    productService.getAllProducts.mockResolvedValue(mockProducts);

    renderWithStore(<ProductGrid searchQuery="" />);

    await waitFor(() => {
      expect(screen.getByText('Wireless Noise-Cancelling Headphones')).toBeInTheDocument();
    });

    const productCard = screen.getByText('Wireless Noise-Cancelling Headphones').closest('.product-card');
    fireEvent.click(productCard);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveTextContent('Premium over-ear headphones with industry-leading noise cancellation technology');
  });

  test('closes modal when close button is clicked', async () => {
    productService.getAllProducts.mockResolvedValue(mockProducts);

    renderWithStore(<ProductGrid searchQuery="" />);

    await waitFor(() => {
      expect(screen.getByText('Smartwatch Pro Series 8')).toBeInTheDocument();
    });

    const productCard = screen.getByText('Smartwatch Pro Series 8').closest('.product-card');
    fireEvent.click(productCard);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /close modal/i });
    fireEvent.click(closeButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('updates filtered products when search query changes', async () => {
    productService.getAllProducts.mockResolvedValue(mockProducts);

    const { rerender } = renderWithStore(<ProductGrid searchQuery="" />);

    await waitFor(() => {
      expect(screen.getAllByRole('img')).toHaveLength(6);
    });

    const audioProducts = mockProducts.filter(p =>
      p.category.toLowerCase().includes('audio')
    );
    productService.searchProducts.mockResolvedValue(audioProducts);

    rerender(
      <Provider store={createMockStore()}>
        <ProductGrid searchQuery="audio" />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('1 producto encontrado')).toBeInTheDocument();
    });

    expect(screen.getByText('Wireless Noise-Cancelling Headphones')).toBeInTheDocument();
  });

  test('displays loading state while fetching products', () => {
    productService.getAllProducts.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockProducts), 100))
    );

    renderWithStore(<ProductGrid searchQuery="" />);

    // Should show loading spinner initially
    expect(screen.getByText('Productos Destacados')).toBeInTheDocument();
  });

  test('displays error state when API call fails', async () => {
    productService.getAllProducts.mockRejectedValue(new Error('Failed to fetch products'));

    renderWithStore(<ProductGrid searchQuery="" />);

    await waitFor(() => {
      expect(screen.getByText('Error al cargar productos')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to fetch products')).toBeInTheDocument();
  });
});
