/**
 * Operations Agent
 * Analyzes stock levels and production yields
 * Generates daily stock alerts, yield %, and warehouse dispatch status
 */

import OrderwiseClient from '../integrations/orderwise/client.js';
import ApteanClient from '../integrations/aptean/client.js';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import fs from 'fs/promises';
import path from 'path';

class OperationsAgent {
  constructor() {
    this.orderwise = new OrderwiseClient();
    this.aptean = new ApteanClient();
    this.thresholds = null;
  }

  async loadThresholds() {
    const thresholdsPath = path.join(process.cwd(), 'config', 'thresholds.json');
    const content = await fs.readFile(thresholdsPath, 'utf-8');
    this.thresholds = JSON.parse(content).operations;
  }

  /**
   * Generate daily operations report
   * @param {Date} date - Date to generate report for
   * @returns {Promise<Object>} Operations report
   */
  async generateDailyReport(date = new Date()) {
    await this.loadThresholds();

    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    // Fetch data from all sources
    const [stockSummary, yieldSummary, dispatchMetrics, openPOs] = await Promise.all([
      this.orderwise.getStockSummary(),
      this.aptean.getYieldSummary(subDays(date, 6), date), // Last 7 days for yield
      this.orderwise.getDispatchMetrics(date),
      this.orderwise.getOpenPurchaseOrders(),
    ]);

    // Build report
    const report = {
      date: date.toISOString().split('T')[0],
      stock: {
        total_value: stockSummary.total_stock_value,
        total_items: stockSummary.total_items,
        items_below_reorder: stockSummary.items_below_reorder,
        reorder_alerts: stockSummary.alerts.slice(0, 10), // Top 10 alerts
      },
      production: {
        total_batches: yieldSummary.total_batches,
        average_yield_percentage: yieldSummary.average_yield_percentage,
        waste_percentage: yieldSummary.waste_percentage,
        yield_by_product: Object.entries(yieldSummary.by_product_type).reduce((acc, [type, data]) => {
          acc[type] = {
            batches: data.batches,
            yield_percentage: data.yield_pct,
          };
          return acc;
        }, {}),
        yield_alerts: yieldSummary.alerts.slice(0, 5), // Top 5 yield alerts
      },
      warehouse: {
        total_dispatches: dispatchMetrics.total_dispatches,
        completed: dispatchMetrics.completed,
        pending: dispatchMetrics.pending,
        completion_rate: dispatchMetrics.total_dispatches > 0
          ? (dispatchMetrics.completed / dispatchMetrics.total_dispatches) * 100
          : 0,
      },
      purchase_orders: openPOs.slice(0, 10).map(po => ({
        po_number: po.po_number,
        supplier: po.supplier,
        value: po.total_value,
        expected_date: po.expected_date,
      })),
      alerts: [],
    };

    // Generate alerts
    this.generateAlerts(report);

    return report;
  }

  /**
   * Generate alerts based on thresholds
   * @param {Object} report - Operations report
   */
  generateAlerts(report) {
    // Stock value alerts
    if (report.stock.total_value < this.thresholds.stock_value_critical) {
      report.alerts.push({
        type: 'stock_value_low',
        message: `Stock value critically low at £${report.stock.total_value.toLocaleString()}`,
        severity: 'critical',
      });
    } else if (report.stock.total_value < this.thresholds.stock_value_warning) {
      report.alerts.push({
        type: 'stock_value_low',
        message: `Stock value below target at £${report.stock.total_value.toLocaleString()}`,
        severity: 'warning',
      });
    }

    // Reorder alerts
    if (report.stock.items_below_reorder > 0) {
      report.alerts.push({
        type: 'reorder_required',
        message: `${report.stock.items_below_reorder} items below reorder level`,
        severity: 'warning',
      });
    }

    // Yield alerts
    if (report.production.average_yield_percentage < this.thresholds.yield_critical_percentage) {
      report.alerts.push({
        type: 'yield_low',
        message: `Average yield critically low at ${report.production.average_yield_percentage.toFixed(1)}%`,
        severity: 'critical',
      });
    } else if (report.production.average_yield_percentage < this.thresholds.yield_warning_percentage) {
      report.alerts.push({
        type: 'yield_low',
        message: `Average yield below target at ${report.production.average_yield_percentage.toFixed(1)}%`,
        severity: 'warning',
      });
    }

    // Waste alerts
    if (report.production.waste_percentage > this.thresholds.waste_critical_percentage) {
      report.alerts.push({
        type: 'waste_high',
        message: `Waste percentage critically high at ${report.production.waste_percentage.toFixed(1)}%`,
        severity: 'critical',
      });
    } else if (report.production.waste_percentage > this.thresholds.waste_warning_percentage) {
      report.alerts.push({
        type: 'waste_high',
        message: `Waste percentage above target at ${report.production.waste_percentage.toFixed(1)}%`,
        severity: 'warning',
      });
    }

    // Dispatch completion alerts
    if (report.warehouse.completion_rate < this.thresholds.dispatch_completion_warning) {
      report.alerts.push({
        type: 'dispatch_delayed',
        message: `Dispatch completion rate at ${report.warehouse.completion_rate.toFixed(1)}%`,
        severity: 'warning',
      });
    }
  }

  /**
   * Format report as markdown
   * @param {Object} report - Operations report
   * @returns {string} Markdown formatted report
   */
  formatAsMarkdown(report) {
    let markdown = `# Operations Report - ${report.date}\n\n`;

    markdown += `## Stock Summary\n`;
    markdown += `- **Total Stock Value**: £${report.stock.total_value.toLocaleString('en-GB')}\n`;
    markdown += `- **Total Items**: ${report.stock.total_items}\n`;
    markdown += `- **Items Below Reorder**: ${report.stock.items_below_reorder}\n\n`;

    if (report.stock.reorder_alerts.length > 0) {
      markdown += `### 🔔 Reorder Alerts (Top 10)\n`;
      report.stock.reorder_alerts.forEach(alert => {
        markdown += `- **${alert.product}**: ${alert.current} units (reorder at ${alert.reorder_level}, ${alert.on_order} on order)\n`;
      });
      markdown += `\n`;
    }

    markdown += `## Production & Yields\n`;
    markdown += `- **Total Batches** (last 7 days): ${report.production.total_batches}\n`;
    markdown += `- **Average Yield**: ${report.production.average_yield_percentage.toFixed(1)}%\n`;
    markdown += `- **Waste**: ${report.production.waste_percentage.toFixed(1)}%\n\n`;

    if (Object.keys(report.production.yield_by_product).length > 0) {
      markdown += `### Yield by Product Type\n`;
      Object.entries(report.production.yield_by_product).forEach(([type, data]) => {
        markdown += `- **${type}**: ${data.yield_percentage.toFixed(1)}% (${data.batches} batches)\n`;
      });
      markdown += `\n`;
    }

    markdown += `## Warehouse Dispatch\n`;
    markdown += `- **Total Dispatches**: ${report.warehouse.total_dispatches}\n`;
    markdown += `- **Completed**: ${report.warehouse.completed}\n`;
    markdown += `- **Pending**: ${report.warehouse.pending}\n`;
    markdown += `- **Completion Rate**: ${report.warehouse.completion_rate.toFixed(1)}%\n\n`;

    if (report.purchase_orders.length > 0) {
      markdown += `## Open Purchase Orders\n`;
      report.purchase_orders.slice(0, 5).forEach(po => {
        markdown += `- **${po.po_number}** - ${po.supplier} - £${po.value.toLocaleString()} (Expected: ${po.expected_date})\n`;
      });
      markdown += `\n`;
    }

    if (report.alerts.length > 0) {
      markdown += `## ⚠️ Alerts\n`;
      report.alerts.forEach(alert => {
        const emoji = alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️';
        markdown += `${emoji} ${alert.message}\n`;
      });
    }

    return markdown;
  }
}

export default OperationsAgent;
