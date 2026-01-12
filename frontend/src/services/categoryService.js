import { API_URL } from '@/constants/api';

/**
 * Category Service
 * Handles all API calls related to categories
 */

/**
 * Fetches all categories
 * @returns {Promise<Array>} Array of categories
 */
export const getAllCategories = async () => {
  try {
    const response = await fetch(`${API_URL}/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch categories');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};
