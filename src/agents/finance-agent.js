/**
 * Finance Agent
 * Analyzes sales and margin data from Shopify
 * Generates daily revenue, margin %, and top products report
 */

import ShopifyClient from '../integrations/shopify/client.js';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import fs from 'fs/promises';
import path from 'path';

class FinanceAgent {
  constructor() {
    this.shopify = new ShopifyClient();
    this.thresholds = null;
  }

  async loadThresholds() {
    const thresholdsPath = path.join(process.cwd(), 'config', 'thresholds.json');
    const content = await fs.readFile(thresholdsPath, 'utf-8');
    this.thresholds = JSON.parse(content).finance;
  }

  /**
   * Generate daily finance report
   * @param {Date} date - Date to generate report for (defaults to yesterday)
   * @returns {Promise<Object>} Finance report
   */
  async generateDailyReport(date = subDays(new Date(), 1)) {
    await this.loadThresholds();

    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    // Get previous day for comparison
    const prevStartDate = startOfDay(subDays(date, 1));
    const prevEndDate = endOfDay(subDays(date, 1));

    // Fetch current and previous day metrics
    const [currentMetrics, previousMetrics] = await Promise.all([
      this.shopify.getSalesMetrics(startDate, endDate),
      this.shopify.getSalesMetrics(prevStartDate, prevEndDate),
    ]);

    // Calculate changes
    const revenueChange = currentMetrics.total_revenue - previousMetrics.total_revenue;
    const revenueChangePercentage = previousMetrics.total_revenue > 0
      ? (revenueChange / previousMetrics.total_revenue) * 100
      : 0;

    const aovChange = currentMetrics.average_order_value - previousMetrics.average_order_value;
    const aovChangePercentage = previousMetrics.average_order_value > 0
      ? (aovChange / previousMetrics.average_order_value) * 100
      : 0;

    // Build report
    const report = {
      date: date.toISOString().split('T')[0],
      period: 'daily',
      sales: {
        total_revenue: currentMetrics.total_revenue,
        total_orders: currentMetrics.total_orders,
        average_order_value: currentMetrics.average_order_value,
        previous_period_revenue: previousMetrics.total_revenue,
        revenue_change: revenueChange,
        revenue_change_percentage: revenueChangePercentage,
        aov_change_percentage: aovChangePercentage,
      },
      margins: {
        total_cost: currentMetrics.total_cost,
        gross_margin: currentMetrics.total_margin,
        margin_percentage: currentMetrics.margin_percentage,
      },
      top_products: Object.entries(currentMetrics.top_products).map(([name, data]) => ({
        name,
        quantity_sold: data.quantity,
        revenue: data.revenue,
      })),
      alerts: [],
    };

    // Generate alerts based on thresholds
    this.generateAlerts(report);

    return report;
  }

  /**
   * Generate weekly finance report
   * @param {Date} endDate - End date of week
   * @returns {Promise<Object>} Weekly finance report
   */
  async generateWeeklyReport(endDate = new Date()) {
    await this.loadThresholds();

    const startDate = startOfDay(subDays(endDate, 6)); // Last 7 days
    const end = endOfDay(endDate);

    // Get previous week for comparison
    const prevStartDate = startOfDay(subDays(startDate, 7));
    const prevEndDate = endOfDay(subDays(endDate, 7));

    const [currentMetrics, previousMetrics] = await Promise.all([
      this.shopify.getSalesMetrics(startDate, end),
      this.shopify.getSalesMetrics(prevStartDate, prevEndDate),
    ]);

    const revenueChange = currentMetrics.total_revenue - previousMetrics.total_revenue;
    const revenueChangePercentage = previousMetrics.total_revenue > 0
      ? (revenueChange / previousMetrics.total_revenue) * 100
      : 0;

    const report = {
      date: endDate.toISOString().split('T')[0],
      period: 'weekly',
      sales: {
        total_revenue: currentMetrics.total_revenue,
        total_orders: currentMetrics.total_orders,
        average_order_value: currentMetrics.average_order_value,
        previous_period_revenue: previousMetrics.total_revenue,
        revenue_change: revenueChange,
        revenue_change_percentage: revenueChangePercentage,
      },
      margins: {
        total_cost: currentMetrics.total_cost,
        gross_margin: currentMetrics.total_margin,
        margin_percentage: currentMetrics.margin_percentage,
      },
      top_products: Object.entries(currentMetrics.top_products).map(([name, data]) => ({
        name,
        quantity_sold: data.quantity,
        revenue: data.revenue,
      })),
      alerts: [],
    };

    this.generateAlerts(report);

    return report;
  }

  /**
   * Generate alerts based on thresholds
   * @param {Object} report - Finance report
   */
  generateAlerts(report) {
    // Revenue drop alert
    if (report.sales.revenue_change_percentage < -this.thresholds.revenue_drop_alert_percentage) {
      report.alerts.push({
        type: 'revenue_drop',
        message: `Revenue dropped by ${Math.abs(report.sales.revenue_change_percentage).toFixed(1)}% compared to previous period`,
        severity: 'warning',
      });
    }

    // Margin alerts
    if (report.margins.margin_percentage < this.thresholds.margin_critical_percentage) {
      report.alerts.push({
        type: 'margin_low',
        message: `Margin critically low at ${report.margins.margin_percentage.toFixed(1)}%`,
        severity: 'critical',
      });
    } else if (report.margins.margin_percentage < this.thresholds.margin_warning_percentage) {
      report.alerts.push({
        type: 'margin_low',
        message: `Margin below target at ${report.margins.margin_percentage.toFixed(1)}%`,
        severity: 'warning',
      });
    }

    // AOV drop alert
    if (report.sales.aov_change_percentage && report.sales.aov_change_percentage < -this.thresholds.aov_drop_alert_percentage) {
      report.alerts.push({
        type: 'aov_drop',
        message: `Average order value dropped by ${Math.abs(report.sales.aov_change_percentage).toFixed(1)}%`,
        severity: 'info',
      });
    }
  }

  /**
   * Format report as markdown
   * @param {Object} report - Finance report
   * @returns {string} Markdown formatted report
   */
  formatAsMarkdown(report) {
    const changeSymbol = report.sales.revenue_change_percentage >= 0 ? '↑' : '↓';
    const changeColor = report.sales.revenue_change_percentage >= 0 ? '🟢' : '🔴';

    let markdown = `# Finance Report - ${report.date}\n\n`;
    markdown += `## Sales Summary\n`;
    markdown += `- **Total Revenue**: £${report.sales.total_revenue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    markdown += `- **Change**: ${changeColor} ${changeSymbol} ${Math.abs(report.sales.revenue_change_percentage).toFixed(1)}% vs previous ${report.period}\n`;
    markdown += `- **Total Orders**: ${report.sales.total_orders}\n`;
    markdown += `- **Average Order Value**: £${report.sales.average_order_value.toFixed(2)}\n\n`;

    markdown += `## Margins\n`;
    markdown += `- **Gross Margin**: £${report.margins.gross_margin.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    markdown += `- **Margin %**: ${report.margins.margin_percentage.toFixed(1)}%\n\n`;

    markdown += `## Top Products\n`;
    report.top_products.slice(0, 5).forEach((product, index) => {
      markdown += `${index + 1}. **${product.name}** - ${product.quantity_sold} units, £${product.revenue.toFixed(2)}\n`;
    });

    if (report.alerts.length > 0) {
      markdown += `\n## ⚠️ Alerts\n`;
      report.alerts.forEach(alert => {
        const emoji = alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️';
        markdown += `${emoji} ${alert.message}\n`;
      });
    }

    return markdown;
  }
}

export default FinanceAgent;
