/**
 * ============================================================
 *  Order API Service
 * ============================================================
 *  Handles all order-related API calls.
 * ============================================================
 */

import axiosInstance from './axiosInstance';

export const orderAPI = {
  /**
   * Place a new order
   * @param {Object} orderData - Order details
   * @param {number} orderData.tableId - Table ID
   * @param {Array} orderData.items - Order items [{ menuItemId, quantity }]
   * @param {string} orderData.notes - Optional special notes
   */
  placeOrder: async (orderData) => {
    try {
      const response = await axiosInstance.post('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Failed to place order:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get all orders
   */
  getAllOrders: async () => {
    try {
      const response = await axiosInstance.get('/orders');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch orders:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get order by ID
   * @param {number} id - Order ID
   */
  getOrderById: async (id) => {
    try {
      const response = await axiosInstance.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch order ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get orders by table ID
   * @param {number} tableId - Table ID
   */
  getOrdersByTable: async (tableId) => {
    try {
      const response = await axiosInstance.get(`/orders/table/${tableId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch orders for table ${tableId}:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Update order status
   * @param {number} id - Order ID
   * @param {string} status - New status (PENDING, PREPARING, READY, DELIVERED)
   */
  updateOrderStatus: async (id, status) => {
    try {
      const response = await axiosInstance.patch(`/orders/${id}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to update order ${id} status:`, error.response?.data || error.message);
      throw error;
    }
  },

  getDeliveredHistory: async (hours = 24) => {
    
    try {
      const response = await axiosInstance.get('/orders/history', {  // ✅ axiosInstance + correct path
        params: { hours }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch delivered history:', error.response?.data || error.message);
      throw error;
    }
  },
};

export default orderAPI;
