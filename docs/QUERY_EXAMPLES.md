# Query Examples & Use Cases

This guide shows common queries and use cases for the Piper's Farm AI Control Hub.

## Daily Operations

### Morning Briefing (7:00 AM)

**What you'll receive**:
```
Piper's Farm Daily Report – Monday, January 15, 2024

Key Metrics:
• Sales: £84,210 (+5%) 📈
• Stock: £610k ⚠️ 12 items to reorder
• Yield: 83.6%
• Campaign CTR: 2.9% (+0.4%)

🚨 Critical Alerts:
• Stock value below target at £610,000

✅ Action Items:
• [OPERATIONS] Reorder 3 critical items: Turkey Crowns, Beef Ribeye, Pork Sausages
• [FINANCE] Approve pending POs: PO-1387, PO-1392
```

### Ad-hoc Queries

Run specific reports manually:

```bash
# Yesterday's sales
node src/cli/generate-daily-report.js

# Specific date
node src/cli/generate-daily-report.js 2024-01-10

# This week's summary
node src/cli/generate-weekly-report.js
```

## Finance Queries

### Question: "How were sales yesterday compared to last week?"

**Command**:
```javascript
import FinanceAgent from './src/agents/finance-agent.js';
import { subDays } from 'date-fns';

const agent = new FinanceAgent();
const yesterday = subDays(new Date(), 1);
const report = await agent.generateDailyReport(yesterday);

console.log(`Yesterday: £${report.sales.total_revenue.toFixed(2)}`);
console.log(`Change: ${report.sales.revenue_change_percentage.toFixed(1)}%`);
```

**Output**:
```
Yesterday: £84,210.50
Change: +5.2%
```

### Question: "What are our top-selling products this week?"

**Data Location**: `outputs/weekly/[date]_summary.json`

**Query**:
```javascript
import fs from 'fs/promises';

const weeklyReport = JSON.parse(
  await fs.readFile('outputs/weekly/2024-01-15_summary.json', 'utf-8')
);

const topProducts = weeklyReport.reports.finance.top_products;
console.table(topProducts.slice(0, 5));
```

**Output**:
```
┌─────┬───────────────────────┬──────────────┬───────────┐
│ idx │ name                  │ quantity_sold│ revenue   │
├─────┼───────────────────────┼──────────────┼───────────┤
│  0  │ Christmas Turkey Box  │     72       │ 21600.00  │
│  1  │ Beef Ribeye Steak     │    156       │ 18720.00  │
│  2  │ Premium Lamb Leg      │     89       │ 14240.00  │
│  3  │ Pork Sausage Pack     │    203       │ 10150.00  │
│  4  │ Chicken Breast        │    178       │  8900.00  │
└─────┴───────────────────────┴──────────────┴───────────┘
```

### Question: "What's our current margin percentage?"

**Quick Check**:
```bash
# Get latest daily report
cat outputs/daily/$(ls -t outputs/daily/ | head -1) | grep "Margin %"
```

**Output**:
```
- Margin %: 40.0%
```

## Operations Queries

### Question: "Which items need reordering?"

**Data Location**: Latest operations report

**Query**:
```javascript
import OperationsAgent from './src/agents/operations-agent.js';

const agent = new OperationsAgent();
const report = await agent.generateDailyReport();

console.log(`Items below reorder level: ${report.stock.items_below_reorder}`);
console.table(report.stock.reorder_alerts);
```

**Output**:
```
Items below reorder level: 12

┌─────┬─────────────────┬─────────┬──────────────┬──────────┐
│ idx │ product         │ current │ reorder_level│ on_order │
├─────┼─────────────────┼─────────┼──────────────┼──────────┤
│  0  │ Turkey Crowns   │   45    │      80      │   100    │
│  1  │ Beef Ribeye     │   62    │      75      │    50    │
│  2  │ Pork Sausages   │   88    │     100      │   150    │
└─────┴─────────────────┴─────────┴──────────────┴──────────┘
```

### Question: "What was our production yield this week?"

**Query**:
```javascript
import ApteanClient from './src/integrations/aptean/client.js';
import { subDays } from 'date-fns';

const client = new ApteanClient();
const summary = await client.getYieldSummary(
  subDays(new Date(), 7),
  new Date()
);

console.log(`Average yield: ${summary.average_yield_percentage.toFixed(1)}%`);
console.log(`Waste: ${summary.waste_percentage.toFixed(1)}%`);
console.log('\nBy product type:');
Object.entries(summary.by_product_type).forEach(([type, data]) => {
  console.log(`  ${type}: ${data.yield_pct.toFixed(1)}% (${data.batches} batches)`);
});
```

**Output**:
```
Average yield: 83.4%
Waste: 16.6%

By product type:
  Beef: 84.0% (12 batches)
  Pork: 82.1% (8 batches)
  Lamb: 85.3% (5 batches)
  Chicken: 81.8% (3 batches)
```

### Question: "How many dispatches are pending?"

**Quick Check**:
```bash
cat outputs/daily/$(ls -t outputs/daily/ | head -1) | grep -A 3 "Warehouse Dispatch"
```

**Output**:
```
## Warehouse Dispatch
- Total Dispatches: 87
- Completed: 79
- Pending: 8
- Completion Rate: 90.8%
```

## Marketing Queries

### Question: "How did last week's email campaigns perform?"

**Data Location**: `outputs/weekly/[date]_summary.json`

**Query**:
```javascript
import fs from 'fs/promises';

const report = JSON.parse(
  await fs.readFile('outputs/weekly/2024-01-15_summary.json', 'utf-8')
);

const marketing = report.reports.marketing;
console.log(`Campaigns sent: ${marketing.campaigns.total_campaigns}`);
console.log(`Average open rate: ${marketing.campaigns.average_open_rate.toFixed(1)}%`);
console.log(`Average click rate: ${marketing.campaigns.average_click_rate.toFixed(1)}%`);
console.log(`Revenue attributed: £${marketing.campaigns.total_revenue.toFixed(2)}`);

console.log('\nTop campaigns:');
marketing.top_campaigns.forEach((campaign, i) => {
  console.log(`${i + 1}. ${campaign.name} - £${campaign.revenue.toFixed(2)}`);
});
```

**Output**:
```
Campaigns sent: 4
Average open rate: 18.2%
Average click rate: 3.1%
Revenue attributed: £18,450.25

Top campaigns:
1. Christmas Special - £8,200.00
2. Turkey Sale - £4,328.50
3. New Year Offers - £3,921.75
4. Weekly Newsletter - £2,000.00
```

### Question: "Are our email metrics improving?"

**Check trends** in weekly report:
```javascript
const report = JSON.parse(
  await fs.readFile('outputs/weekly/2024-01-15_summary.json', 'utf-8')
);

const trends = report.reports.marketing.performance_trends;
console.log(`Open rate: ${trends.open_rate_trend} ${trends.open_rate_trend === 'up' ? '📈' : '📉'}`);
console.log(`Click rate: ${trends.click_rate_trend} ${trends.click_rate_trend === 'up' ? '📈' : '📉'}`);
console.log(`Revenue: ${trends.revenue_trend} ${trends.revenue_trend === 'up' ? '📈' : '📉'}`);
```

## Executive Queries

### Question: "Give me a complete overview of the business today"

**Command**:
```bash
npm run generate-daily
```

This generates the full executive digest with:
- Sales performance
- Stock levels and alerts
- Production yields
- Marketing snapshot
- Action items

### Question: "What are the critical issues I need to address?"

**Query**:
```javascript
import ExecutiveAgent from './src/agents/executive-agent.js';

const agent = new ExecutiveAgent();
const digest = await agent.generateDailyDigest();

console.log('Critical Alerts:');
digest.alerts.critical.forEach(alert => {
  console.log(`🚨 ${alert.message}`);
});

console.log('\nWarning Alerts:');
digest.alerts.warning.forEach(alert => {
  console.log(`⚠️  ${alert.message}`);
});

console.log('\nAction Items:');
digest.actions.forEach((action, i) => {
  console.log(`${i + 1}. [${action.department.toUpperCase()}] ${action.action}`);
});
```

**Output**:
```
Critical Alerts:
🚨 Stock value critically low at £485,000

Warning Alerts:
⚠️  12 items below reorder level
⚠️  Average yield below target at 81.2%

Action Items:
1. [OPERATIONS] Reorder 3 critical items: Turkey Crowns, Beef Ribeye, Pork Sausages
2. [FINANCE] Approve pending POs: PO-1387, PO-1392
3. [OPERATIONS] Investigate low yield (81.2%) - check production processes
```

## Custom Date Ranges

### Last 30 days performance

```javascript
import ShopifyClient from './src/integrations/shopify/client.js';
import { subDays } from 'date-fns';

const client = new ShopifyClient();
const metrics = await client.getSalesMetrics(
  subDays(new Date(), 30),
  new Date()
);

console.log(`30-day revenue: £${metrics.total_revenue.toLocaleString()}`);
console.log(`Total orders: ${metrics.total_orders}`);
console.log(`Average margin: ${metrics.margin_percentage.toFixed(1)}%`);
```

### Compare two specific weeks

```javascript
import FinanceAgent from './src/agents/finance-agent.js';

const agent = new FinanceAgent();

const week1 = await agent.generateWeeklyReport(new Date('2024-01-07'));
const week2 = await agent.generateWeeklyReport(new Date('2024-01-14'));

console.log('Week 1:', week1.sales.total_revenue);
console.log('Week 2:', week2.sales.total_revenue);
console.log('Growth:', ((week2.sales.total_revenue / week1.sales.total_revenue - 1) * 100).toFixed(1) + '%');
```

## Automation Examples

### Send custom Slack alert for low stock

```javascript
import OperationsAgent from './src/agents/operations-agent.js';
import NotificationService from './src/utils/notification-service.js';

const opsAgent = new OperationsAgent();
const notifier = new NotificationService();

const report = await opsAgent.generateDailyReport();

if (report.stock.items_below_reorder > 5) {
  const message = `⚠️ *Stock Alert*: ${report.stock.items_below_reorder} items below reorder level!\n\n` +
    report.stock.reorder_alerts.slice(0, 5).map(item =>
      `• ${item.product}: ${item.current} units (reorder at ${item.reorder_level})`
    ).join('\n');

  await notifier.sendSlackMessage(message, '#ops-daily');
}
```

### Email weekly summary to department heads

```javascript
import ExecutiveAgent from './src/agents/executive-agent.js';
import NotificationService from './src/utils/notification-service.js';

const agent = new ExecutiveAgent();
const notifier = new NotificationService();

const summary = await agent.generateWeeklySummary();
const markdown = agent.formatAsMarkdown(summary);

await notifier.sendEmail({
  to: 'departments@pipersfarm.com',
  subject: `Weekly Summary - ${summary.date}`,
  body: markdown,
});
```

## Debugging & Troubleshooting

### Test individual system connections

```bash
# Test all systems
npm run test-connections

# Or test individually
node -e "import('./src/integrations/shopify/client.js').then(m => new m.default().getCustomerMetrics().then(console.log))"
```

### View raw API responses

Enable debug mode:
```bash
DEBUG=true npm run generate-daily
```

This will log all API requests and responses to console.

---

## Next Steps

- Review [SETUP.md](SETUP.md) for initial configuration
- See [API_GUIDE.md](API_GUIDE.md) for detailed API documentation
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
