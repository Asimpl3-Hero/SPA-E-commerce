import { getAllCategories } from '../categoryService';
import { API_URL } from '@/constants/api';

// Mock fetch
global.fetch = jest.fn();

describe('categoryService', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('getAllCategories', () => {
    it('should fetch all categories successfully', async () => {
      const mockCategories = [
        { id: 1, name: 'Electronics', slug: 'electronics' },
        { id: 2, name: 'Books', slug: 'books' },
        { id: 3, name: 'Clothing', slug: 'clothing' },
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      const result = await getAllCategories();

      expect(fetch).toHaveBeenCalledWith(`${API_URL}/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockCategories);
    });

    it('should fetch empty array when no categories exist', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await getAllCategories();

      expect(result).toEqual([]);
    });

    it('should throw error when request fails', async () => {
      const errorMessage = 'Server error';
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      });

      await expect(getAllCategories()).rejects.toThrow(errorMessage);
    });

    it('should throw default error message when no error provided', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(getAllCategories()).rejects.toThrow('Failed to fetch categories');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network connection lost');
      fetch.mockRejectedValueOnce(networkError);

      await expect(getAllCategories()).rejects.toThrow('Network connection lost');
    });

    it('should be called with correct headers', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await getAllCategories();

      const [, options] = fetch.mock.calls[0];
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.method).toBe('GET');
    });

    it('should handle invalid JSON response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(getAllCategories()).rejects.toThrow('Invalid JSON');
    });
  });
});
