/**
 * ============================================================
 *  Auth API Service
 * ============================================================
 *  Handles all authentication-related API calls.
 * ============================================================
 */

import axiosInstance from './axiosInstance';

export const authAPI = {
  /**
   * Login with username and password
   * @param {string} username
   * @param {string} password
   * @returns {Promise} { token, user: { role, tableNumber, displayName } }
   */
  login: async (username, password) => {
    try {
      const response = await axiosInstance.post('/auth/login', {
        username,
        password,
      });
      const { token, user } = response.data;
      
      // Store JWT token and user session
      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(user));
      
      // Add token to future requests
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return response.data;
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Register a new customer
   * @param {string} username
   * @param {string} email
   * @param {string} password
   * @returns {Promise} { token, user: { role, tableNumber, displayName } }
   */
  register: async (username, email, password) => {
    try {
      const response = await axiosInstance.post('/auth/register', {
        username,
        email,
        password,
      });
      const { token, user } = response.data;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(user));
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Logout current user
   */
  logout: async () => {
    try {
      await axiosInstance.post('/auth/logout');
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      delete axiosInstance.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Logout failed:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Change password
   * @param {string} oldPassword
   * @param {string} newPassword
   */
  changePassword: async (oldPassword, newPassword) => {
    try {
      const response = await axiosInstance.post('/auth/change-password', {
        oldPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      console.error('Password change failed:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Restore token from localStorage on app startup
   */
  restoreToken: () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  },
};

export default authAPI;
