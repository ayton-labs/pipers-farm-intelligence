/**
 * Klaviyo API Client
 * Handles email campaign performance and attribution
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const KLAVIYO_PRIVATE_KEY = process.env.KLAVIYO_PRIVATE_KEY;

class KlaviyoClient {
  constructor() {
    this.baseURL = 'https://a.klaviyo.com/api';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
        'revision': '2024-02-15',
      },
    });
  }

  /**
   * Get campaign performance metrics
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Array>} Campaign metrics
   */
  async getCampaignMetrics(startDate, endDate) {
    try {
      const campaignsResponse = await this.client.get('/campaigns', {
        params: {
          'filter': `greater-than(send_time,${startDate.toISOString()}),less-than(send_time,${endDate.toISOString()})`,
        }
      });

      const campaigns = campaignsResponse.data.data;
      const metricsPromises = campaigns.map(campaign => this.getCampaignStats(campaign.id));
      const allMetrics = await Promise.all(metricsPromises);

      return campaigns.map((campaign, index) => ({
        id: campaign.id,
        name: campaign.attributes.name,
        send_time: campaign.attributes.send_time,
        metrics: allMetrics[index],
      }));
    } catch (error) {
      console.error('Error fetching Klaviyo campaigns:', error.message);
      throw error;
    }
  }

  /**
   * Get statistics for a specific campaign
   * @param {string} campaignId
   * @returns {Promise<Object>} Campaign stats
   */
  async getCampaignStats(campaignId) {
    try {
      const response = await this.client.get(`/campaign-recipient-estimations/${campaignId}`);
      const data = response.data.data.attributes;

      return {
        recipients: data.estimated_recipient_count || 0,
        opens: data.total_opens || 0,
        unique_opens: data.unique_opens || 0,
        clicks: data.total_clicks || 0,
        unique_clicks: data.unique_clicks || 0,
        open_rate: data.open_rate || 0,
        click_rate: data.click_rate || 0,
        revenue: data.attributed_revenue || 0,
      };
    } catch (error) {
      console.error(`Error fetching stats for campaign ${campaignId}:`, error.message);
      return {
        recipients: 0,
        opens: 0,
        unique_opens: 0,
        clicks: 0,
        unique_clicks: 0,
        open_rate: 0,
        click_rate: 0,
        revenue: 0,
      };
    }
  }

  /**
   * Get aggregated campaign performance summary
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Object>} Performance summary
   */
  async getPerformanceSummary(startDate, endDate) {
    const campaigns = await this.getCampaignMetrics(startDate, endDate);

    const summary = {
      total_campaigns: campaigns.length,
      total_recipients: 0,
      total_opens: 0,
      total_clicks: 0,
      total_revenue: 0,
      average_open_rate: 0,
      average_click_rate: 0,
      top_campaigns: [],
    };

    campaigns.forEach(campaign => {
      summary.total_recipients += campaign.metrics.recipients;
      summary.total_opens += campaign.metrics.unique_opens;
      summary.total_clicks += campaign.metrics.unique_clicks;
      summary.total_revenue += campaign.metrics.revenue;
    });

    // Calculate averages
    if (campaigns.length > 0) {
      summary.average_open_rate = campaigns.reduce((sum, c) => sum + c.metrics.open_rate, 0) / campaigns.length;
      summary.average_click_rate = campaigns.reduce((sum, c) => sum + c.metrics.click_rate, 0) / campaigns.length;
    }

    // Get top 5 campaigns by revenue
    summary.top_campaigns = campaigns
      .sort((a, b) => b.metrics.revenue - a.metrics.revenue)
      .slice(0, 5)
      .map(c => ({
        name: c.name,
        revenue: c.metrics.revenue,
        open_rate: c.metrics.open_rate,
        click_rate: c.metrics.click_rate,
      }));

    return summary;
  }

  /**
   * Get flow performance (automated sequences)
   * @returns {Promise<Array>} Flow metrics
   */
  async getFlowMetrics() {
    try {
      const response = await this.client.get('/flows');
      const flows = response.data.data;

      return flows.map(flow => ({
        id: flow.id,
        name: flow.attributes.name,
        status: flow.attributes.status,
        created: flow.attributes.created,
        // Note: Flow-specific metrics require additional API calls
      }));
    } catch (error) {
      console.error('Error fetching Klaviyo flows:', error.message);
      throw error;
    }
  }
}

export default KlaviyoClient;
