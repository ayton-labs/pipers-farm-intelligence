# Piper's Farm Intelligence

> AI-powered business intelligence hub delivering automated daily and weekly reports from Shopify, Orderwise, Klaviyo, and Aptean SI.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Status](https://img.shields.io/badge/status-Phase%201%20Complete-success.svg)]()

## What It Does

Automatically generates business intelligence reports combining:
- **Sales & Margins** from Shopify
- **Stock Levels & Yields** from Orderwise and Aptean SI
- **Campaign Performance** from Klaviyo

**Result**: Daily digest at 7am + weekly summary every Friday, delivered via Slack/Email with actionable insights.

## Quick Start

**Get running in 15 minutes** → [QUICK_START.md](QUICK_START.md)

```bash
# 1. Clone and install
git clone https://github.com/ayton-labs/pipers-farm-intelligence.git
cd pipers-farm-intelligence
npm install

# 2. Configure
cp .env.example .env
# Edit .env with your API credentials

# 3. Test connections
npm run test-connections

# 4. Generate first report
npm run generate-daily
```

## Example Output

**Daily Slack Message (7:00 AM)**
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

See [full project summary](PROJECT_SUMMARY.md) for detailed examples and features.

## Documentation

- **[Quick Start Guide](QUICK_START.md)** - 15-minute setup
- **[Project Summary](PROJECT_SUMMARY.md)** - Complete overview and roadmap
- **[Setup Guide](docs/SETUP.md)** - Detailed installation
- **[API Guide](docs/API_GUIDE.md)** - Integration documentation
- **[Query Examples](docs/QUERY_EXAMPLES.md)** - Common use cases
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Problem resolution

## Project Structure

```
pipers-farm/
├── .claude/                    # Claude Code configuration
│   ├── agents/                # Agent definitions
│   │   ├── finance.md
│   │   ├── operations.md
│   │   ├── marketing.md
│   │   └── executive.md
│   ├── automations.yaml       # Scheduled automation config
│   └── mcp_config.json        # MCP server configurations
├── src/
│   ├── integrations/          # API integration code
│   │   ├── shopify/
│   │   ├── orderwise/
│   │   ├── klaviyo/
│   │   └── aptean/
│   ├── agents/                # Agent logic
│   └── utils/                 # Shared utilities
├── config/
│   ├── schemas/               # Data schema definitions
│   └── thresholds.json        # Alert thresholds
├── outputs/                   # Generated reports
│   ├── daily/
│   └── weekly/
├── docs/                      # Documentation
│   ├── SETUP.md
│   ├── API_GUIDE.md
│   └── QUERY_EXAMPLES.md
└── tests/                     # Test files
```

## Core Agents

### 1. Finance Agent
**Purpose**: Sales and margin analysis from Shopify
**Output**: Daily revenue, margin %, top products
**Frequency**: Daily at 7:00 AM

### 2. Operations Agent
**Purpose**: Stock levels and production yields
**Output**: Stock alerts, yield %, warehouse dispatch status
**Frequency**: Daily at 7:00 AM

### 3. Marketing Agent
**Purpose**: Campaign performance and attribution
**Output**: Email CTR, revenue attribution, campaign ROI
**Frequency**: Weekly (Friday 3:00 PM for full report)

### 4. Executive Agent (Piper HQ)
**Purpose**: Aggregated summary for leadership
**Output**: Combined digest with key metrics and actions
**Frequency**: Daily + Weekly summaries

## Data Sources

| System | Integration | Key Metrics |
|--------|-------------|-------------|
| Shopify | REST API | Orders, revenue, products, margins |
| Orderwise | REST API | Stock levels, dispatch, open POs |
| Aptean SI | CSV/API | Yields, production batches, waste % |
| Klaviyo | REST API | Campaign performance, click/open rates |

## Automation Schedule

- **Daily Digest**: 7:00 AM (Mon-Sat)
  - Finance, Operations, and partial Marketing data
  - Slack message to #executive-summary

- **Weekly Summary**: Friday 3:00 PM
  - Full report including Klaviyo campaigns
  - Email/PDF to leadership team

## Example Output

```
Piper's Farm Daily Report – 7:00 AM
• Sales: £84,210 (+5% vs yesterday)
• Stock: £610k (turkeys 72% sold)
• Yield: 83.6% (−0.4% WoW)
• Campaign CTR: 2.9% (+0.4%)
→ Actions: Reorder turkeys by Thursday; Finance to approve PO #1387.
```

## Features

✅ **Automated Reporting**
- Daily digest at 7:00 AM (Mon-Sat)
- Weekly summary every Friday 3:00 PM
- Multi-format outputs (JSON, Markdown, Slack)

✅ **Intelligent Agents**
- Finance Agent: Sales and margin analysis
- Operations Agent: Stock alerts and production yields
- Marketing Agent: Campaign performance and ROI
- Executive Agent: Aggregated summaries with action items

✅ **Smart Alerting**
- Revenue drops, margin warnings, stock reorder alerts
- Low yield notifications, dispatch delays
- Campaign performance insights
- Prioritized action items

✅ **Multi-Platform**
- Slack notifications
- Email reports (optional)
- JSON/Markdown files for dashboards

## System Architecture

```
┌─────────────────────────────────────────┐
│  Data Sources                           │
│  • Shopify (Sales, Orders, Products)    │
│  • Orderwise (Stock, Dispatch, POs)     │
│  • Klaviyo (Campaigns, Email Metrics)   │
│  • Aptean SI (Production Yields)        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Intelligent Agents                     │
│  Finance • Operations • Marketing       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Executive Agent                        │
│  Aggregates + Generates Action Items    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Outputs                                │
│  Slack • Email • JSON • Markdown        │
└─────────────────────────────────────────┘
```

## Commands

```bash
# Test all API connections
npm run test-connections

# Generate daily report
npm run generate-daily

# Generate weekly summary
npm run generate-weekly

# Generate for specific date
node src/cli/generate-daily-report.js 2024-01-10
```

## Implementation Roadmap

**Phase 1: Foundation** (Complete ✅)
- All API integrations built
- 4 intelligent agents operational
- Automated reporting system
- Complete documentation

**Phase 2: Extensions** (Future)
- Sage integration for finance automation
- Predictive stock forecasting
- Interactive MCP servers for conversational queries
- Extended agents (Purchasing, Customer Service, HR)
- Data warehouse for historical analytics

See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for the full 6-week deployment plan.

## Technology Stack

- **Runtime**: Node.js 20+
- **APIs**: REST (Shopify, Orderwise, Klaviyo, Aptean)
- **Scheduling**: Cron / Task Scheduler
- **Notifications**: Slack webhooks, SMTP email
- **Data**: JSON, Markdown, CSV

## Contributing

This is a private project for Piper's Farm. For issues or feature requests, contact the development team.

## License

Proprietary - Piper's Farm Ltd.

## Credits

Built with [Claude Code](https://claude.com/claude-code) - AI-powered development assistant.

---

**Status**: Phase 1 Complete - Ready for Deployment
**Repository**: https://github.com/ayton-labs/pipers-farm-intelligence
**Next Step**: Follow [QUICK_START.md](QUICK_START.md) to get running in 15 minutes
