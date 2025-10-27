/**
 * Marketing Agent
 * Analyzes campaign performance from Klaviyo
 * Generates email CTR, revenue attribution, and campaign ROI reports
 */

import KlaviyoClient from '../integrations/klaviyo/client.js';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import fs from 'fs/promises';
import path from 'path';

class MarketingAgent {
  constructor() {
    this.klaviyo = new KlaviyoClient();
    this.thresholds = null;
  }

  async loadThresholds() {
    const thresholdsPath = path.join(process.cwd(), 'config', 'thresholds.json');
    const content = await fs.readFile(thresholdsPath, 'utf-8');
    this.thresholds = JSON.parse(content).marketing;
  }

  /**
   * Generate weekly marketing report
   * @param {Date} endDate - End date of reporting period
   * @returns {Promise<Object>} Marketing report
   */
  async generateWeeklyReport(endDate = new Date()) {
    await this.loadThresholds();

    const startDate = startOfDay(subDays(endDate, 6)); // Last 7 days
    const end = endOfDay(endDate);

    // Get previous week for comparison
    const prevStartDate = startOfDay(subDays(startDate, 7));
    const prevEndDate = endOfDay(subDays(endDate, 7));

    const [currentSummary, previousSummary] = await Promise.all([
      this.klaviyo.getPerformanceSummary(startDate, end),
      this.klaviyo.getPerformanceSummary(prevStartDate, prevEndDate),
    ]);

    // Calculate trends
    const openRateTrend = this.calculateTrend(
      currentSummary.average_open_rate,
      previousSummary.average_open_rate
    );
    const clickRateTrend = this.calculateTrend(
      currentSummary.average_click_rate,
      previousSummary.average_click_rate
    );
    const revenueTrend = this.calculateTrend(
      currentSummary.total_revenue,
      previousSummary.total_revenue
    );

    // Build report
    const report = {
      date: endDate.toISOString().split('T')[0],
      period: 'weekly',
      campaigns: {
        total_campaigns: currentSummary.total_campaigns,
        total_recipients: currentSummary.total_recipients,
        average_open_rate: currentSummary.average_open_rate,
        average_click_rate: currentSummary.average_click_rate,
        total_revenue: currentSummary.total_revenue,
        roi: currentSummary.total_revenue > 0 ? (currentSummary.total_revenue / currentSummary.total_campaigns) * 100 : 0,
      },
      top_campaigns: currentSummary.top_campaigns,
      performance_trends: {
        open_rate_trend: openRateTrend,
        click_rate_trend: clickRateTrend,
        revenue_trend: revenueTrend,
      },
      comparison: {
        previous_week_open_rate: previousSummary.average_open_rate,
        previous_week_click_rate: previousSummary.average_click_rate,
        previous_week_revenue: previousSummary.total_revenue,
      },
      alerts: [],
    };

    // Generate alerts
    this.generateAlerts(report);

    return report;
  }

  /**
   * Generate daily marketing snapshot (lighter version)
   * @param {Date} date - Date to generate report for
   * @returns {Promise<Object>} Daily marketing snapshot
   */
  async generateDailySnapshot(date = new Date()) {
    await this.loadThresholds();

    const startDate = startOfDay(subDays(date, 1)); // Yesterday
    const endDate = endOfDay(subDays(date, 1));

    const summary = await this.klaviyo.getPerformanceSummary(startDate, endDate);

    return {
      date: date.toISOString().split('T')[0],
      period: 'daily',
      campaigns_sent: summary.total_campaigns,
      average_open_rate: summary.average_open_rate,
      average_click_rate: summary.average_click_rate,
      revenue_attributed: summary.total_revenue,
    };
  }

  /**
   * Calculate trend direction
   * @param {number} current - Current value
   * @param {number} previous - Previous value
   * @returns {string} Trend direction
   */
  calculateTrend(current, previous) {
    if (previous === 0) return 'stable';
    const change = ((current - previous) / previous) * 100;
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }

  /**
   * Generate alerts based on thresholds
   * @param {Object} report - Marketing report
   */
  generateAlerts(report) {
    // Open rate alerts
    if (report.campaigns.average_open_rate < this.thresholds.open_rate_critical) {
      report.alerts.push({
        type: 'low_open_rate',
        message: `Average open rate critically low at ${report.campaigns.average_open_rate.toFixed(1)}%`,
        severity: 'critical',
      });
    } else if (report.campaigns.average_open_rate < this.thresholds.open_rate_warning) {
      report.alerts.push({
        type: 'low_open_rate',
        message: `Average open rate below target at ${report.campaigns.average_open_rate.toFixed(1)}%`,
        severity: 'warning',
      });
    }

    // Click rate alerts
    if (report.campaigns.average_click_rate < this.thresholds.click_rate_critical) {
      report.alerts.push({
        type: 'low_click_rate',
        message: `Average click rate critically low at ${report.campaigns.average_click_rate.toFixed(1)}%`,
        severity: 'critical',
      });
    } else if (report.campaigns.average_click_rate < this.thresholds.click_rate_warning) {
      report.alerts.push({
        type: 'low_click_rate',
        message: `Average click rate below target at ${report.campaigns.average_click_rate.toFixed(1)}%`,
        severity: 'warning',
      });
    }

    // High performing campaign highlight
    if (report.top_campaigns.length > 0 && report.top_campaigns[0].revenue > 1000) {
      report.alerts.push({
        type: 'high_performing_campaign',
        message: `Top campaign "${report.top_campaigns[0].name}" generated £${report.top_campaigns[0].revenue.toFixed(2)}`,
        severity: 'info',
      });
    }

    // Trend alerts
    if (report.performance_trends.open_rate_trend === 'down') {
      report.alerts.push({
        type: 'trend_alert',
        message: `Open rate trending down compared to previous week`,
        severity: 'info',
      });
    }

    if (report.performance_trends.click_rate_trend === 'down') {
      report.alerts.push({
        type: 'trend_alert',
        message: `Click rate trending down compared to previous week`,
        severity: 'info',
      });
    }
  }

  /**
   * Format report as markdown
   * @param {Object} report - Marketing report
   * @returns {string} Markdown formatted report
   */
  formatAsMarkdown(report) {
    let markdown = `# Marketing Report - ${report.date}\n\n`;

    markdown += `## Campaign Performance (${report.period})\n`;
    markdown += `- **Total Campaigns**: ${report.campaigns.total_campaigns}\n`;
    markdown += `- **Total Recipients**: ${report.campaigns.total_recipients.toLocaleString()}\n`;
    markdown += `- **Average Open Rate**: ${report.campaigns.average_open_rate.toFixed(1)}% `;
    markdown += `${this.getTrendEmoji(report.performance_trends?.open_rate_trend)}\n`;
    markdown += `- **Average Click Rate**: ${report.campaigns.average_click_rate.toFixed(1)}% `;
    markdown += `${this.getTrendEmoji(report.performance_trends?.click_rate_trend)}\n`;
    markdown += `- **Revenue Attributed**: £${report.campaigns.total_revenue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} `;
    markdown += `${this.getTrendEmoji(report.performance_trends?.revenue_trend)}\n\n`;

    if (report.top_campaigns && report.top_campaigns.length > 0) {
      markdown += `## Top Campaigns\n`;
      report.top_campaigns.forEach((campaign, index) => {
        markdown += `${index + 1}. **${campaign.name}**\n`;
        markdown += `   - Revenue: £${campaign.revenue.toFixed(2)}\n`;
        markdown += `   - Open Rate: ${campaign.open_rate.toFixed(1)}%\n`;
        markdown += `   - Click Rate: ${campaign.click_rate.toFixed(1)}%\n`;
      });
      markdown += `\n`;
    }

    if (report.comparison) {
      markdown += `## Week-over-Week Comparison\n`;
      markdown += `- Open Rate: ${report.comparison.previous_week_open_rate.toFixed(1)}% → ${report.campaigns.average_open_rate.toFixed(1)}%\n`;
      markdown += `- Click Rate: ${report.comparison.previous_week_click_rate.toFixed(1)}% → ${report.campaigns.average_click_rate.toFixed(1)}%\n`;
      markdown += `- Revenue: £${report.comparison.previous_week_revenue.toFixed(2)} → £${report.campaigns.total_revenue.toFixed(2)}\n\n`;
    }

    if (report.alerts && report.alerts.length > 0) {
      markdown += `## ⚠️ Alerts & Insights\n`;
      report.alerts.forEach(alert => {
        const emoji = alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️';
        markdown += `${emoji} ${alert.message}\n`;
      });
    }

    return markdown;
  }

  /**
   * Get emoji for trend
   * @param {string} trend - Trend direction
   * @returns {string} Emoji
   */
  getTrendEmoji(trend) {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '➡️';
  }
}

export default MarketingAgent;
