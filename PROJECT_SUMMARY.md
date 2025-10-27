# Piper's Farm AI Control Hub - Project Summary

**Repository**: https://github.com/ayton-labs/pipers-farm-intelligence

## Project Overview

The Piper's Farm AI Control Hub is an automated business intelligence system that connects Shopify, Orderwise, Klaviyo, and Aptean SI to produce daily executive and departmental summaries.

**Goal**: Provide Harry and department heads with automatic reports on sales, stock, yield, and marketing performance, plus the ability to query the system for insights.

## What's Been Built (Phase 1 Foundation)

### ✅ Complete Infrastructure

1. **API Integration Modules**
   - [Shopify Client](src/integrations/shopify/client.js) - Sales, orders, products, margins
   - [Orderwise Client](src/integrations/orderwise/client.js) - Stock levels, dispatches, POs
   - [Klaviyo Client](src/integrations/klaviyo/client.js) - Email campaign performance
   - [Aptean SI Client](src/integrations/aptean/client.js) - Production yields, waste tracking

2. **Intelligent Agents**
   - [Finance Agent](src/agents/finance-agent.js) - Daily/weekly sales and margin analysis
   - [Operations Agent](src/agents/operations-agent.js) - Stock alerts and production yields
   - [Marketing Agent](src/agents/marketing-agent.js) - Campaign performance and ROI
   - [Executive Agent](src/agents/executive-agent.js) - Aggregated summaries with action items

3. **Reporting & Automation**
   - [Daily Report Generator](src/cli/generate-daily-report.js)
   - [Weekly Report Generator](src/cli/generate-weekly-report.js)
   - [Notification Service](src/utils/notification-service.js) - Slack & Email
   - [Connection Tester](tests/test-connections.js)

4. **Configuration & Schemas**
   - [Alert Thresholds](config/thresholds.json) - Customizable business rules
   - [Data Schemas](config/schemas/) - Structured output formats
   - [Environment Template](.env.example) - Easy setup

5. **Documentation**
   - [Setup Guide](docs/SETUP.md) - Step-by-step installation
   - [API Guide](docs/API_GUIDE.md) - Detailed integration docs
   - [Query Examples](docs/QUERY_EXAMPLES.md) - Common use cases
   - [Troubleshooting](docs/TROUBLESHOOTING.md) - Problem resolution

## Example Output

### Daily Slack Message (7:00 AM)
```
🌅 Piper's Farm Daily Report – Monday, January 15, 2024

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

### Weekly Summary (Friday 3:00 PM)
Full detailed report with:
- Revenue trends and top products
- Margin analysis
- Stock levels and reorder alerts
- Production yield breakdown by product type
- Email campaign performance
- ROI metrics
- Actionable insights

## Project Structure

```
pipers-farm/
├── src/
│   ├── integrations/          # API clients for each system
│   │   ├── shopify/
│   │   ├── orderwise/
│   │   ├── klaviyo/
│   │   └── aptean/
│   ├── agents/                # Business intelligence agents
│   │   ├── finance-agent.js
│   │   ├── operations-agent.js
│   │   ├── marketing-agent.js
│   │   └── executive-agent.js
│   ├── cli/                   # Command-line tools
│   └── utils/                 # Notification service
├── config/
│   ├── schemas/               # JSON schemas for outputs
│   └── thresholds.json        # Alert configuration
├── docs/                      # Complete documentation
├── tests/                     # Connection tests
├── outputs/                   # Generated reports (created on first run)
└── package.json
```

## Next Steps - Implementation Roadmap

### Week 1: Setup & Access ⬅️ START HERE
- [ ] Gather API credentials (Shopify, Orderwise, Klaviyo, Aptean)
- [ ] Copy `.env.example` to `.env` and fill in credentials
- [ ] Run `npm install`
- [ ] Run `npm run test-connections` to verify all APIs
- [ ] Configure alert thresholds in `config/thresholds.json`

**Deliverables**: All API connections verified and working

### Week 2: Core Agent Testing
- [ ] Generate first daily report: `npm run generate-daily`
- [ ] Review output in `outputs/daily/`
- [ ] Adjust thresholds based on your actual data
- [ ] Test weekly report: `npm run generate-weekly`
- [ ] Verify all metrics are accurate

**Deliverables**: Working daily and weekly reports with accurate data

### Week 3: Automation & Notifications
- [ ] Set up Slack webhooks
- [ ] Configure Slack channels (#executive-summary, #ops-daily, etc.)
- [ ] Test Slack notifications
- [ ] Set up email (optional)
- [ ] Schedule daily automation (cron or Task Scheduler)
- [ ] Schedule weekly automation (Friday 3pm)

**Deliverables**: Automated daily digest at 7am, Slack notifications working

### Week 4: Dashboard (Optional)
- [ ] Evaluate need for visual dashboard (Retool, Streamlit, etc.)
- [ ] Build prototype if needed
- [ ] Connect to JSON outputs from reports

**Deliverables**: Optional dashboard for visual trends

### Week 5: Departmental Rollout
- [ ] Share reports with Finance team
- [ ] Share with Operations team
- [ ] Share with Marketing team
- [ ] Gather feedback and adjust

**Deliverables**: All departments receiving relevant reports

### Week 6: Refinement & Training
- [ ] Fine-tune alert thresholds
- [ ] Document custom queries team wants
- [ ] Train Harry and team on using the system
- [ ] Document any custom modifications

**Deliverables**: Production-ready system with team trained

## Quick Start Commands

```bash
# Install dependencies
npm install

# Test all API connections
npm run test-connections

# Generate daily report
npm run generate-daily

# Generate weekly summary
npm run generate-weekly

# Generate for specific date
node src/cli/generate-daily-report.js 2024-01-10
```

## Key Features

### Intelligent Alerting
- Revenue drops > 10%
- Margin below 15%
- Stock value < £500k
- Items below reorder level
- Yield < 82%
- Waste > 12%
- Email open rate < 15%
- Campaign CTR < 1.5%

### Automated Action Items
System automatically generates prioritized action items:
- Stock reorder recommendations
- PO approval reminders
- Margin review triggers
- Yield investigation alerts
- Marketing optimization suggestions

### Multi-Format Outputs
Every report is saved in 3 formats:
1. **JSON** - Machine readable, for dashboards/integrations
2. **Markdown** - Human readable, for documentation
3. **Slack** - Formatted for instant notifications

## Data Sources & Frequency

| System | Metrics | Update Frequency |
|--------|---------|------------------|
| **Shopify** | Revenue, orders, margins, products | Daily |
| **Orderwise** | Stock levels, dispatches, POs | Daily |
| **Aptean SI** | Yields, waste, production | Daily |
| **Klaviyo** | Campaigns, open/click rates, attribution | Weekly |

## Security & Best Practices

✅ All API credentials in `.env` (gitignored)
✅ HTTPS/TLS for all connections
✅ Read-only API permissions (no write access)
✅ Automatic retry with exponential backoff
✅ Comprehensive error handling
✅ Structured logging

## Customization

### Adjust Alert Thresholds
Edit `config/thresholds.json`:
```json
{
  "finance": {
    "revenue_drop_alert_percentage": 10,
    "margin_warning_percentage": 15
  },
  "operations": {
    "stock_value_warning": 500000,
    "yield_warning_percentage": 82
  }
}
```

### Add Custom Metrics
Extend any agent by adding methods:
```javascript
// In src/agents/finance-agent.js
async getCustomMetric() {
  // Your custom logic
}
```

### Change Report Schedule
Modify crontab or Task Scheduler:
```bash
# Daily at 8am instead of 7am
0 8 * * 1-6 cd /path/to/pipers-farm && npm run generate-daily
```

## Phase 2 Extensions (Future)

Once Phase 1 is stable (after 6 weeks):

1. **Sage Integration** - Full finance automation
2. **Predictive Analytics** - ML-based stock forecasting
3. **Customer Analytics** - Segment analysis and CLV
4. **Purchasing Automation** - Auto-generate POs
5. **Interactive MCP Servers** - Query system conversationally
6. **Data Warehouse** - Historical analytics and trends
7. **Extended Agents** - HR, Customer Service, Purchasing

## Support & Resources

- **Setup**: [docs/SETUP.md](docs/SETUP.md)
- **API Guide**: [docs/API_GUIDE.md](docs/API_GUIDE.md)
- **Examples**: [docs/QUERY_EXAMPLES.md](docs/QUERY_EXAMPLES.md)
- **Troubleshooting**: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- **Repository**: https://github.com/ayton-labs/pipers-farm-intelligence

## Technology Stack

- **Runtime**: Node.js 20+
- **APIs**: REST (Shopify, Orderwise, Klaviyo, Aptean)
- **Data Format**: JSON, Markdown
- **Notifications**: Slack webhooks, Email (SMTP)
- **Scheduling**: Cron (Linux/macOS) or Task Scheduler (Windows)
- **Dependencies**: axios, date-fns, csv-parse

## Success Metrics

After full deployment, you should see:

✅ Daily automated reports delivered by 7am
✅ Zero manual data collection required
✅ Actionable insights with prioritized tasks
✅ Early warning alerts for critical issues
✅ 80% time savings on reporting
✅ Faster decision-making across all departments

## Credits

Built with Claude Code - AI-powered development assistant
https://claude.com/claude-code

---

**Status**: Phase 1 Complete - Ready for Week 1 Implementation
**Next Action**: Gather API credentials and run setup (see Week 1 tasks above)
