/**
 * Aptean SI API Client
 * Handles production yields, batches, and waste tracking
 * Supports both REST API and CSV import methods
 */

import axios from 'axios';
import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';

dotenv.config();

const APTEAN_INTEGRATION_METHOD = process.env.APTEAN_INTEGRATION_METHOD || 'API';
const APTEAN_API_URL = process.env.APTEAN_API_URL;
const APTEAN_API_KEY = process.env.APTEAN_API_KEY;
const APTEAN_CSV_EXPORT_PATH = process.env.APTEAN_CSV_EXPORT_PATH;

class ApteanClient {
  constructor() {
    this.method = APTEAN_INTEGRATION_METHOD;

    if (this.method === 'API') {
      this.baseURL = APTEAN_API_URL;
      this.client = axios.create({
        baseURL: this.baseURL,
        headers: {
          'Authorization': `Bearer ${APTEAN_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
    }
  }

  /**
   * Get production yields for a date range
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Array>} Yield data
   */
  async getYieldData(startDate, endDate) {
    if (this.method === 'API') {
      return this._getYieldDataAPI(startDate, endDate);
    } else {
      return this._getYieldDataCSV(startDate, endDate);
    }
  }

  /**
   * Get yield data via REST API
   * @private
   */
  async _getYieldDataAPI(startDate, endDate) {
    try {
      const response = await this.client.get('/production/yields', {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        }
      });

      return response.data.map(item => ({
        batch_id: item.batch_id,
        product_type: item.product_type,
        input_weight: item.input_weight_kg,
        output_weight: item.output_weight_kg,
        yield_percentage: (item.output_weight_kg / item.input_weight_kg) * 100,
        waste_weight: item.waste_weight_kg,
        production_date: item.production_date,
      }));
    } catch (error) {
      console.error('Error fetching Aptean yield data (API):', error.message);
      throw error;
    }
  }

  /**
   * Get yield data from CSV export
   * @private
   */
  async _getYieldDataCSV(startDate, endDate) {
    try {
      // Construct expected CSV filename (adjust based on Aptean export naming)
      const filename = `${APTEAN_CSV_EXPORT_PATH}/yields_export.csv`;

      const fileContent = await fs.readFile(filename, 'utf-8');
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      });

      // Filter by date range
      const filtered = records.filter(record => {
        const recordDate = new Date(record.production_date);
        return recordDate >= startDate && recordDate <= endDate;
      });

      return filtered.map(record => ({
        batch_id: record.batch_id,
        product_type: record.product_type,
        input_weight: parseFloat(record.input_weight_kg),
        output_weight: parseFloat(record.output_weight_kg),
        yield_percentage: (parseFloat(record.output_weight_kg) / parseFloat(record.input_weight_kg)) * 100,
        waste_weight: parseFloat(record.waste_weight_kg || 0),
        production_date: record.production_date,
      }));
    } catch (error) {
      console.error('Error fetching Aptean yield data (CSV):', error.message);
      throw error;
    }
  }

  /**
   * Get yield summary metrics
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Object>} Yield summary
   */
  async getYieldSummary(startDate, endDate) {
    const yields = await this.getYieldData(startDate, endDate);

    const summary = {
      total_batches: yields.length,
      total_input_weight: 0,
      total_output_weight: 0,
      total_waste_weight: 0,
      average_yield_percentage: 0,
      waste_percentage: 0,
      by_product_type: {},
      alerts: [],
    };

    yields.forEach(item => {
      summary.total_input_weight += item.input_weight;
      summary.total_output_weight += item.output_weight;
      summary.total_waste_weight += item.waste_weight;

      // Track by product type
      if (!summary.by_product_type[item.product_type]) {
        summary.by_product_type[item.product_type] = {
          batches: 0,
          input: 0,
          output: 0,
          waste: 0,
          yield_pct: 0,
        };
      }

      const typeData = summary.by_product_type[item.product_type];
      typeData.batches++;
      typeData.input += item.input_weight;
      typeData.output += item.output_weight;
      typeData.waste += item.waste_weight;

      // Check for low yield alerts (< 80%)
      if (item.yield_percentage < 80) {
        summary.alerts.push({
          batch_id: item.batch_id,
          product_type: item.product_type,
          yield_percentage: item.yield_percentage,
          date: item.production_date,
        });
      }
    });

    // Calculate overall metrics
    if (summary.total_input_weight > 0) {
      summary.average_yield_percentage = (summary.total_output_weight / summary.total_input_weight) * 100;
      summary.waste_percentage = (summary.total_waste_weight / summary.total_input_weight) * 100;
    }

    // Calculate yield percentage by product type
    Object.keys(summary.by_product_type).forEach(type => {
      const typeData = summary.by_product_type[type];
      typeData.yield_pct = (typeData.output / typeData.input) * 100;
    });

    return summary;
  }

  /**
   * Get production batches
   * @param {Date} date
   * @returns {Promise<Array>} Production batches
   */
  async getProductionBatches(date) {
    if (this.method === 'API') {
      try {
        const response = await this.client.get('/production/batches', {
          params: {
            date: date.toISOString().split('T')[0],
          }
        });

        return response.data;
      } catch (error) {
        console.error('Error fetching production batches:', error.message);
        throw error;
      }
    } else {
      // CSV method would require similar logic to yield data
      return [];
    }
  }
}

export default ApteanClient;
