# Piper's Farm AI Control Hub - Phase 1

**Project Vision**: Deploy a single Claude Code workspace that connects Shopify, Orderwise, Aptean SI, and Klaviyo to produce daily executive and departmental summaries.

## Quick Start

### Prerequisites
- Claude Desktop with MCP support
- API credentials for:
  - Shopify (Admin API)
  - Orderwise (REST API)
  - Klaviyo (REST API)
  - Aptean SI (API or CSV export)

### Setup
1. Copy `.env.example` to `.env` and add your API credentials
2. Review and customize agent configurations in `.claude/agents/`
3. Configure automation schedules in `.claude/automations.yaml`
4. Test connections: `npm run test-connections`

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

## Phase 1 Timeline (6 Weeks)

- **Week 1**: Setup & API Access ✓
- **Week 2**: Core Agent Configuration
- **Week 3**: Executive Agent + Daily Digest
- **Week 4**: Dashboard Prototype (Optional)
- **Week 5**: Departmental Reporting
- **Week 6**: Refinement & Training

## Next Steps

1. ✅ Confirm API credentials
2. ✅ Get Aptean SI export method confirmed
3. ⚙️ Configure MCP servers
4. 🚀 Test first agent (Finance)
5. 📊 Deploy daily automation

## Support & Documentation

- [Setup Guide](docs/SETUP.md)
- [API Integration Guide](docs/API_GUIDE.md)
- [Query Examples](docs/QUERY_EXAMPLES.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## Phase 2 Extensions (Future)

- Sage integration for finance automation
- Predictive stock forecasting
- Extended agents for Purchasing, Customer Service, HR
- Data warehouse for historical analytics
