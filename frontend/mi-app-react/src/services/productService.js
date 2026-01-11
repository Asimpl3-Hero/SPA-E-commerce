import { API_URL } from '@/constants/api';

/**
 * Product Service
 * Handles all API calls related to products
 */

/**
 * Fetches all products with optional filters
 * @param {Object} filters - Filter options (category, min_price, max_price, sort_by, search)
 * @returns {Promise<Array>} Array of products
 */
export const getAllProducts = async (filters = {}) => {
  try {
    const params = new URLSearchParams();

    if (filters.category) params.append('category', filters.category);
    if (filters.min_price) params.append('min_price', filters.min_price);
    if (filters.max_price) params.append('max_price', filters.max_price);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.search) params.append('search', filters.search);

    const url = `${API_URL}/products${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch products');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

/**
 * Fetches a single product by ID
 * @param {string|number} id - Product ID
 * @returns {Promise<Object>} Product data
 */
export const getProductById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch product');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
};

/**
 * Searches products by query
 * @param {string} query - Search query
 * @param {string} category - Optional category filter
 * @returns {Promise<Array>} Array of matching products
 */
export const searchProducts = async (query, category = null) => {
  try {
    const params = new URLSearchParams();
    params.append('search', query);
    if (category) params.append('category', category);

    const response = await fetch(`${API_URL}/products?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to search products');
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

/**
 * Creates a new product (admin functionality)
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Created product
 */
export const createProduct = async (productData) => {
  try {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create product');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};
