/**
 * ============================================================
 *  Menu API Service
 * ============================================================
 *  Handles all menu-related API calls.
 * ============================================================
 */

import axiosInstance from './axiosInstance';

export const menuAPI = {
  /**
   * Get all menu items
   */
  getAllMenuItems: async () => {
    try {
      const response = await axiosInstance.get('/menu');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch menu items:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get menu item by ID
   * @param {number} id - Menu item ID
   */
  getMenuItemById: async (id) => {
    try {
      const response = await axiosInstance.get(`/menu/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch menu item ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get menu items by category
   * @param {string} category - Category name
   */
  getByCategory: async (category) => {
    try {
      const response = await axiosInstance.get(`/menu/category/${category}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch menu items for category ${category}:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get available menu items
   */
  getAvailableItems: async () => {
    try {
      const response = await axiosInstance.get('/menu/available');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch available items:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Search menu items by name
   * @param {string} keyword - Search keyword
   */
  searchByName: async (keyword) => {
    try {
      const response = await axiosInstance.get('/menu/search', {
        params: { keyword },
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to search menu items for "${keyword}":`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Create new menu item (admin only)
   * @param {Object} menuItem - Menu item data
   * @param {File} file - Optional image file
   */
  createMenuItem: async (menuItem, file = null) => {
    try {
      const formData = new FormData();
      
      // Add menu item fields to formData
      Object.keys(menuItem).forEach(key => {
        formData.append(key, menuItem[key]);
      });
      
      // Add file if provided
      if (file) {
        formData.append('file', file);
      }

      const response = await axiosInstance.post('/menu', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create menu item:', error.response?.data || error.message);
      throw error;
    }
  },
};

export default menuAPI;
