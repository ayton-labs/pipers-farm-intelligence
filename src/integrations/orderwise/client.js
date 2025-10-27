/**
 * Orderwise API Client
 * Handles stock levels, warehouse dispatch, and purchase orders
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ORDERWISE_API_URL = process.env.ORDERWISE_API_URL;
const ORDERWISE_API_KEY = process.env.ORDERWISE_API_KEY;
const ORDERWISE_USERNAME = process.env.ORDERWISE_USERNAME;
const ORDERWISE_PASSWORD = process.env.ORDERWISE_PASSWORD;

class OrderwiseClient {
  constructor() {
    this.baseURL = ORDERWISE_API_URL;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ORDERWISE_API_KEY}`,
      },
    });
  }

  /**
   * Authenticate with Orderwise API
   * @returns {Promise<string>} Access token
   */
  async authenticate() {
    try {
      const response = await this.client.post('/auth/token', {
        username: ORDERWISE_USERNAME,
        password: ORDERWISE_PASSWORD,
      });

      this.client.defaults.headers['Authorization'] = `Bearer ${response.data.access_token}`;
      return response.data.access_token;
    } catch (error) {
      console.error('Error authenticating with Orderwise:', error.message);
      throw error;
    }
  }

  /**
   * Get current stock levels
   * @returns {Promise<Array>} Stock level data
   */
  async getStockLevels() {
    try {
      const response = await this.client.get('/stock/levels');

      const stockData = response.data.map(item => ({
        product_code: item.product_code,
        product_name: item.product_name,
        quantity_available: item.quantity_available,
        quantity_allocated: item.quantity_allocated,
        quantity_on_order: item.quantity_on_order,
        reorder_level: item.reorder_level,
        location: item.location,
        value: item.unit_cost * item.quantity_available,
      }));

      return stockData;
    } catch (error) {
      console.error('Error fetching Orderwise stock levels:', error.message);
      throw error;
    }
  }

  /**
   * Get stock summary metrics
   * @returns {Promise<Object>} Stock summary
   */
  async getStockSummary() {
    const stockLevels = await this.getStockLevels();

    const summary = {
      total_stock_value: 0,
      total_items: stockLevels.length,
      items_below_reorder: 0,
      stock_by_category: {},
      alerts: [],
    };

    stockLevels.forEach(item => {
      summary.total_stock_value += item.value;

      // Check for items below reorder level
      if (item.quantity_available < item.reorder_level) {
        summary.items_below_reorder++;
        summary.alerts.push({
          product: item.product_name,
          current: item.quantity_available,
          reorder_level: item.reorder_level,
          on_order: item.quantity_on_order,
        });
      }
    });

    return summary;
  }

  /**
   * Get open purchase orders
   * @returns {Promise<Array>} Purchase orders
   */
  async getOpenPurchaseOrders() {
    try {
      const response = await this.client.get('/purchase-orders', {
        params: { status: 'open' }
      });

      return response.data.map(po => ({
        po_number: po.po_number,
        supplier: po.supplier_name,
        total_value: po.total_value,
        expected_date: po.expected_delivery_date,
        items_count: po.line_items?.length || 0,
      }));
    } catch (error) {
      console.error('Error fetching purchase orders:', error.message);
      throw error;
    }
  }

  /**
   * Get warehouse dispatch status
   * @param {Date} date - Date to check dispatches
   * @returns {Promise<Object>} Dispatch metrics
   */
  async getDispatchMetrics(date) {
    try {
      const response = await this.client.get('/warehouse/dispatches', {
        params: {
          date: date.toISOString().split('T')[0]
        }
      });

      const dispatches = response.data;

      return {
        total_dispatches: dispatches.length,
        completed: dispatches.filter(d => d.status === 'completed').length,
        pending: dispatches.filter(d => d.status === 'pending').length,
        in_progress: dispatches.filter(d => d.status === 'in_progress').length,
        total_items_dispatched: dispatches.reduce((sum, d) => sum + d.items_count, 0),
      };
    } catch (error) {
      console.error('Error fetching dispatch metrics:', error.message);
      throw error;
    }
  }
}

export default OrderwiseClient;
