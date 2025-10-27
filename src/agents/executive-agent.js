/**
 * Executive Agent (Piper HQ)
 * Aggregates all sub-agent summaries into daily/weekly executive digest
 * Generates high-level overview for leadership with key actions
 */

import FinanceAgent from './finance-agent.js';
import OperationsAgent from './operations-agent.js';
import MarketingAgent from './marketing-agent.js';
import { format } from 'date-fns';

class ExecutiveAgent {
  constructor() {
    this.financeAgent = new FinanceAgent();
    this.operationsAgent = new OperationsAgent();
    this.marketingAgent = new MarketingAgent();
  }

  /**
   * Generate daily executive digest
   * @param {Date} date - Date to generate report for
   * @returns {Promise<Object>} Executive digest
   */
  async generateDailyDigest(date = new Date()) {
    // Fetch all reports in parallel
    const [financeReport, operationsReport, marketingSnapshot] = await Promise.all([
      this.financeAgent.generateDailyReport(date),
      this.operationsAgent.generateDailyReport(date),
      this.marketingAgent.generateDailySnapshot(date),
    ]);

    // Aggregate all alerts
    const allAlerts = [
      ...(financeReport.alerts || []),
      ...(operationsReport.alerts || []),
    ];

    // Sort alerts by severity
    const criticalAlerts = allAlerts.filter(a => a.severity === 'critical');
    const warningAlerts = allAlerts.filter(a => a.severity === 'warning');

    // Generate action items
    const actions = this.generateActionItems(financeReport, operationsReport);

    const digest = {
      date: date.toISOString().split('T')[0],
      type: 'daily',
      summary: {
        sales: {
          revenue: financeReport.sales.total_revenue,
          change_percentage: financeReport.sales.revenue_change_percentage,
          orders: financeReport.sales.total_orders,
        },
        stock: {
          value: operationsReport.stock.total_value,
          items_to_reorder: operationsReport.stock.items_below_reorder,
        },
        production: {
          yield_percentage: operationsReport.production.average_yield_percentage,
          batches: operationsReport.production.total_batches,
        },
        marketing: {
          campaigns_sent: marketingSnapshot.campaigns_sent,
          average_ctr: marketingSnapshot.average_click_rate,
        },
      },
      alerts: {
        critical: criticalAlerts,
        warning: warningAlerts,
      },
      actions: actions,
      reports: {
        finance: financeReport,
        operations: operationsReport,
        marketing: marketingSnapshot,
      },
    };

    return digest;
  }

  /**
   * Generate weekly executive summary
   * @param {Date} endDate - End date of week
   * @returns {Promise<Object>} Weekly executive summary
   */
  async generateWeeklySummary(endDate = new Date()) {
    // Fetch all reports in parallel
    const [financeReport, operationsReport, marketingReport] = await Promise.all([
      this.financeAgent.generateWeeklyReport(endDate),
      this.operationsAgent.generateDailyReport(endDate), // Operations is still daily
      this.marketingAgent.generateWeeklyReport(endDate),
    ]);

    const allAlerts = [
      ...(financeReport.alerts || []),
      ...(operationsReport.alerts || []),
      ...(marketingReport.alerts || []),
    ];

    const criticalAlerts = allAlerts.filter(a => a.severity === 'critical');
    const warningAlerts = allAlerts.filter(a => a.severity === 'warning');

    const actions = this.generateActionItems(financeReport, operationsReport, marketingReport);

    const summary = {
      date: endDate.toISOString().split('T')[0],
      type: 'weekly',
      summary: {
        sales: {
          revenue: financeReport.sales.total_revenue,
          change_percentage: financeReport.sales.revenue_change_percentage,
          orders: financeReport.sales.total_orders,
          margin_percentage: financeReport.margins.margin_percentage,
        },
        stock: {
          value: operationsReport.stock.total_value,
          items_to_reorder: operationsReport.stock.items_below_reorder,
        },
        production: {
          yield_percentage: operationsReport.production.average_yield_percentage,
          waste_percentage: operationsReport.production.waste_percentage,
        },
        marketing: {
          campaigns: marketingReport.campaigns.total_campaigns,
          open_rate: marketingReport.campaigns.average_open_rate,
          click_rate: marketingReport.campaigns.average_click_rate,
          revenue: marketingReport.campaigns.total_revenue,
        },
      },
      alerts: {
        critical: criticalAlerts,
        warning: warningAlerts,
      },
      actions: actions,
      reports: {
        finance: financeReport,
        operations: operationsReport,
        marketing: marketingReport,
      },
    };

    return summary;
  }

  /**
   * Generate action items from reports
   * @param {Object} financeReport
   * @param {Object} operationsReport
   * @param {Object} marketingReport
   * @returns {Array} Action items
   */
  generateActionItems(financeReport, operationsReport, marketingReport = null) {
    const actions = [];

    // Stock reorder actions
    if (operationsReport.stock.items_below_reorder > 0) {
      const urgentItems = operationsReport.stock.reorder_alerts.slice(0, 3);
      if (urgentItems.length > 0) {
        actions.push({
          priority: 'high',
          department: 'operations',
          action: `Reorder ${urgentItems.length} critical items: ${urgentItems.map(i => i.product).join(', ')}`,
        });
      }
    }

    // Purchase order approval actions
    if (operationsReport.purchase_orders.length > 0) {
      const pendingPOs = operationsReport.purchase_orders.slice(0, 2);
      actions.push({
        priority: 'medium',
        department: 'finance',
        action: `Approve pending POs: ${pendingPOs.map(po => po.po_number).join(', ')}`,
      });
    }

    // Margin actions
    if (financeReport.margins.margin_percentage < 15) {
      actions.push({
        priority: 'high',
        department: 'finance',
        action: `Review pricing - margin at ${financeReport.margins.margin_percentage.toFixed(1)}%`,
      });
    }

    // Yield actions
    if (operationsReport.production.average_yield_percentage < 80) {
      actions.push({
        priority: 'high',
        department: 'operations',
        action: `Investigate low yield (${operationsReport.production.average_yield_percentage.toFixed(1)}%) - check production processes`,
      });
    }

    // Marketing actions
    if (marketingReport && marketingReport.campaigns.average_open_rate < 15) {
      actions.push({
        priority: 'medium',
        department: 'marketing',
        action: `Review email subject lines - open rate at ${marketingReport.campaigns.average_open_rate.toFixed(1)}%`,
      });
    }

    return actions;
  }

  /**
   * Format digest as Slack message (concise)
   * @param {Object} digest - Executive digest
   * @returns {string} Slack formatted message
   */
  formatAsSlackMessage(digest) {
    const dateStr = format(new Date(digest.date), 'EEEE, MMMM d, yyyy');
    const title = digest.type === 'daily' ? '🌅 Daily Report' : '📊 Weekly Summary';

    let message = `*Piper's Farm ${title}* – ${dateStr}\n\n`;

    // Key metrics
    const revenueEmoji = digest.summary.sales.change_percentage >= 0 ? '📈' : '📉';
    const revenueSign = digest.summary.sales.change_percentage >= 0 ? '+' : '';

    message += `*Key Metrics:*\n`;
    message += `• Sales: £${digest.summary.sales.revenue.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} `;
    message += `(${revenueSign}${digest.summary.sales.change_percentage.toFixed(1)}%) ${revenueEmoji}\n`;
    message += `• Stock: £${(digest.summary.stock.value / 1000).toFixed(0)}k`;
    if (digest.summary.stock.items_to_reorder > 0) {
      message += ` ⚠️ ${digest.summary.stock.items_to_reorder} items to reorder`;
    }
    message += `\n`;
    message += `• Yield: ${digest.summary.production.yield_percentage.toFixed(1)}%`;
    if (digest.summary.production.yield_percentage < 80) {
      message += ` 🔴`;
    }
    message += `\n`;

    if (digest.type === 'weekly' && digest.summary.marketing) {
      message += `• Campaign CTR: ${digest.summary.marketing.click_rate.toFixed(1)}%`;
      if (digest.summary.marketing.click_rate > 2.5) {
        message += ` 🎯`;
      }
      message += `\n`;
    }

    // Critical alerts
    if (digest.alerts.critical.length > 0) {
      message += `\n🚨 *Critical Alerts:*\n`;
      digest.alerts.critical.forEach(alert => {
        message += `• ${alert.message}\n`;
      });
    }

    // Actions
    if (digest.actions.length > 0) {
      message += `\n✅ *Action Items:*\n`;
      digest.actions.slice(0, 3).forEach(action => {
        message += `• [${action.department.toUpperCase()}] ${action.action}\n`;
      });
    }

    return message;
  }

  /**
   * Format digest as detailed markdown
   * @param {Object} digest - Executive digest
   * @returns {string} Markdown formatted report
   */
  formatAsMarkdown(digest) {
    const dateStr = format(new Date(digest.date), 'EEEE, MMMM d, yyyy');
    const title = digest.type === 'daily' ? 'Daily Executive Digest' : 'Weekly Executive Summary';

    let markdown = `# Piper's Farm ${title}\n`;
    markdown += `**${dateStr}**\n\n`;

    markdown += `## Executive Summary\n\n`;

    // Finance summary
    markdown += `### 💰 Finance\n`;
    markdown += this.financeAgent.formatAsMarkdown(digest.reports.finance);
    markdown += `\n---\n\n`;

    // Operations summary
    markdown += `### 🏭 Operations\n`;
    markdown += this.operationsAgent.formatAsMarkdown(digest.reports.operations);
    markdown += `\n---\n\n`;

    // Marketing summary (if weekly)
    if (digest.type === 'weekly' && digest.reports.marketing) {
      markdown += `### 📧 Marketing\n`;
      markdown += this.marketingAgent.formatAsMarkdown(digest.reports.marketing);
      markdown += `\n---\n\n`;
    }

    // Action items
    if (digest.actions.length > 0) {
      markdown += `## 📋 Action Items\n\n`;
      digest.actions.forEach((action, index) => {
        const priorityEmoji = action.priority === 'high' ? '🔴' : action.priority === 'medium' ? '🟡' : '🟢';
        markdown += `${index + 1}. ${priorityEmoji} **[${action.department.toUpperCase()}]** ${action.action}\n`;
      });
    }

    return markdown;
  }
}

export default ExecutiveAgent;
