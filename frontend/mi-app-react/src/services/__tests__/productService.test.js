import { getAllProducts, getProductById, searchProducts, createProduct } from '../productService';
import { API_URL } from '@/constants/api';

// Mock fetch
global.fetch = jest.fn();

describe('productService', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('getAllProducts', () => {
    it('should fetch all products without filters', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', price: 100 },
        { id: 2, name: 'Product 2', price: 200 },
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts,
      });

      const result = await getAllProducts();

      expect(fetch).toHaveBeenCalledWith(`${API_URL}/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockProducts);
    });

    it('should fetch products with filters', async () => {
      const mockProducts = [{ id: 1, name: 'Filtered Product', price: 100 }];
      const filters = {
        category: 'electronics',
        min_price: 50,
        max_price: 150,
        sort_by: 'price',
        search: 'phone',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts,
      });

      const result = await getAllProducts(filters);

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/products?category=electronics&min_price=50&max_price=150&sort_by=price&search=phone`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockProducts);
    });

    it('should handle partial filters', async () => {
      const mockProducts = [{ id: 1, name: 'Product', price: 100 }];
      const filters = { category: 'books', search: 'fiction' };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts,
      });

      await getAllProducts(filters);

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/products?category=books&search=fiction`,
        expect.any(Object)
      );
    });

    it('should throw error when request fails', async () => {
      const errorMessage = 'Server error';
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      });

      await expect(getAllProducts()).rejects.toThrow(errorMessage);
    });

    it('should throw default error message when no error provided', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(getAllProducts()).rejects.toThrow('Failed to fetch products');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      fetch.mockRejectedValueOnce(networkError);

      await expect(getAllProducts()).rejects.toThrow('Network error');
    });
  });

  describe('getProductById', () => {
    it('should fetch a product by id', async () => {
      const mockProduct = { id: 1, name: 'Product 1', price: 100 };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct,
      });

      const result = await getProductById(1);

      expect(fetch).toHaveBeenCalledWith(`${API_URL}/products/1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should handle string id', async () => {
      const mockProduct = { id: '123', name: 'Product', price: 100 };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct,
      });

      await getProductById('123');

      expect(fetch).toHaveBeenCalledWith(`${API_URL}/products/123`, expect.any(Object));
    });

    it('should throw error when product not found', async () => {
      const errorMessage = 'Product not found';
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      });

      await expect(getProductById(999)).rejects.toThrow(errorMessage);
    });

    it('should throw default error message when no error provided', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(getProductById(1)).rejects.toThrow('Failed to fetch product');
    });
  });

  describe('searchProducts', () => {
    it('should search products by query', async () => {
      const mockProducts = [{ id: 1, name: 'Search Result', price: 100 }];
      const query = 'laptop';

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts,
      });

      const result = await searchProducts(query);

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/products?search=laptop`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockProducts);
    });

    it('should search products with category filter', async () => {
      const mockProducts = [{ id: 1, name: 'Laptop', price: 500 }];
      const query = 'laptop';
      const category = 'electronics';

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts,
      });

      const result = await searchProducts(query, category);

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/products?search=laptop&category=electronics`,
        expect.any(Object)
      );
      expect(result).toEqual(mockProducts);
    });

    it('should handle null category', async () => {
      const mockProducts = [];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts,
      });

      await searchProducts('test', null);

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/products?search=test`,
        expect.any(Object)
      );
    });

    it('should throw error when search fails', async () => {
      const errorMessage = 'Search failed';
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      });

      await expect(searchProducts('test')).rejects.toThrow(errorMessage);
    });

    it('should throw default error message when no error provided', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(searchProducts('test')).rejects.toThrow('Failed to search products');
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Product',
        price: 100,
        category: 'electronics',
        description: 'A new product',
      };
      const createdProduct = { id: 1, ...productData };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createdProduct,
      });

      const result = await createProduct(productData);

      expect(fetch).toHaveBeenCalledWith(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      expect(result).toEqual(createdProduct);
    });

    it('should throw error when creation fails', async () => {
      const errorMessage = 'Validation error';
      const productData = { name: 'Invalid Product' };

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      });

      await expect(createProduct(productData)).rejects.toThrow(errorMessage);
    });

    it('should throw default error message when no error provided', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(createProduct({})).rejects.toThrow('Failed to create product');
    });

    it('should handle network errors during creation', async () => {
      const networkError = new Error('Network failure');
      fetch.mockRejectedValueOnce(networkError);

      await expect(createProduct({ name: 'Test' })).rejects.toThrow('Network failure');
    });
  });
});
