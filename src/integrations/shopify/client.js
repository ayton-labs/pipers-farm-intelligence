/**
 * Shopify API Client
 * Handles all Shopify Admin REST API interactions
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-01';

class ShopifyClient {
  constructor() {
    this.baseURL = `https://${SHOPIFY_STORE_URL}/admin/api/${SHOPIFY_API_VERSION}`;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get orders within a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Array of orders
   */
  async getOrders(startDate, endDate) {
    try {
      const params = {
        status: 'any',
        created_at_min: startDate.toISOString(),
        created_at_max: endDate.toISOString(),
        limit: 250,
      };

      const response = await this.client.get('/orders.json', { params });
      return response.data.orders;
    } catch (error) {
      console.error('Error fetching Shopify orders:', error.message);
      throw error;
    }
  }

  /**
   * Get sales metrics for a date range
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Object>} Sales metrics
   */
  async getSalesMetrics(startDate, endDate) {
    const orders = await this.getOrders(startDate, endDate);

    const metrics = {
      total_orders: orders.length,
      total_revenue: 0,
      total_cost: 0,
      total_margin: 0,
      margin_percentage: 0,
      top_products: {},
      average_order_value: 0,
    };

    orders.forEach(order => {
      // Sum revenue
      const revenue = parseFloat(order.total_price || 0);
      metrics.total_revenue += revenue;

      // Calculate cost and margin from line items
      order.line_items?.forEach(item => {
        const quantity = item.quantity;
        const price = parseFloat(item.price);
        const cost = parseFloat(item.variant?.compare_at_price || item.price * 0.6); // Fallback if cost not available

        const itemRevenue = quantity * price;
        const itemCost = quantity * cost;

        metrics.total_cost += itemCost;

        // Track top products
        const productName = item.name;
        if (!metrics.top_products[productName]) {
          metrics.top_products[productName] = {
            quantity: 0,
            revenue: 0,
          };
        }
        metrics.top_products[productName].quantity += quantity;
        metrics.top_products[productName].revenue += itemRevenue;
      });
    });

    // Calculate margin
    metrics.total_margin = metrics.total_revenue - metrics.total_cost;
    metrics.margin_percentage = metrics.total_revenue > 0
      ? (metrics.total_margin / metrics.total_revenue) * 100
      : 0;

    // Calculate average order value
    metrics.average_order_value = metrics.total_orders > 0
      ? metrics.total_revenue / metrics.total_orders
      : 0;

    // Sort top products by revenue
    metrics.top_products = Object.entries(metrics.top_products)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 10)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});

    return metrics;
  }

  /**
   * Get product inventory levels
   * @returns {Promise<Array>} Product inventory data
   */
  async getInventoryLevels() {
    try {
      const response = await this.client.get('/products.json', {
        params: { limit: 250 }
      });

      const products = response.data.products;
      const inventory = products.map(product => ({
        id: product.id,
        title: product.title,
        variants: product.variants.map(variant => ({
          id: variant.id,
          title: variant.title,
          sku: variant.sku,
          inventory_quantity: variant.inventory_quantity,
          price: variant.price,
        })),
      }));

      return inventory;
    } catch (error) {
      console.error('Error fetching Shopify inventory:', error.message);
      throw error;
    }
  }

  /**
   * Get customer count and metrics
   * @returns {Promise<Object>} Customer metrics
   */
  async getCustomerMetrics() {
    try {
      const response = await this.client.get('/customers/count.json');
      return {
        total_customers: response.data.count,
      };
    } catch (error) {
      console.error('Error fetching customer metrics:', error.message);
      throw error;
    }
  }
}

export default ShopifyClient;
