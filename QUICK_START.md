# Quick Start Guide - Piper's Farm Intelligence

Get your AI Control Hub running in 15 minutes.

## Prerequisites

- Node.js 20+ installed ([download here](https://nodejs.org/))
- API access to: Shopify, Orderwise, Klaviyo, Aptean SI

## Step 1: Clone & Install (2 minutes)

```bash
git clone https://github.com/ayton-labs/pipers-farm-intelligence.git
cd pipers-farm-intelligence
npm install
```

## Step 2: Configure APIs (10 minutes)

### Create your .env file

```bash
cp .env.example .env
```

### Add your credentials to .env

Open `.env` and fill in these required fields:

```env
# Shopify (get from: Admin > Apps > Develop apps)
SHOPIFY_STORE_URL=pipersfarm.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx

# Orderwise (contact your account manager)
ORDERWISE_API_URL=https://api.orderwise.co.uk
ORDERWISE_API_KEY=your_api_key
ORDERWISE_USERNAME=your_username
ORDERWISE_PASSWORD=your_password

# Klaviyo (Settings > API Keys > Create Private Key)
KLAVIYO_PRIVATE_KEY=pk_xxxxxxxxxxxxx

# Aptean SI (contact support OR set CSV path)
APTEAN_INTEGRATION_METHOD=API
APTEAN_API_URL=https://your-instance.aptean.com/api
APTEAN_API_KEY=your_api_key
```

**Don't have all credentials yet?** That's OK - the system will work with what you have and skip missing integrations.

## Step 3: Test Connections (1 minute)

```bash
npm run test-connections
```

Expected output:
```
✅ Shopify
✅ Orderwise
✅ Klaviyo
✅ Aptean

4/4 systems connected successfully
```

If any fail, double-check the credentials in `.env`.

## Step 4: Generate Your First Report (2 minutes)

```bash
npm run generate-daily
```

This will:
1. Fetch data from all connected systems
2. Generate finance and operations reports
3. Save to `outputs/daily/[date]_digest.md`
4. Print summary to console

### View the report

```bash
# View today's report
cat outputs/daily/$(ls -t outputs/daily/ | head -1)

# Or open in your editor
code outputs/daily/$(ls -t outputs/daily/ | head -1)
```

## What You'll See

```
# Piper's Farm Daily Executive Digest
**Monday, January 15, 2024**

## Executive Summary

### 💰 Finance
- **Total Revenue**: £84,210.50
- **Change**: 🟢 ↑ 5.2% vs previous daily
- **Total Orders**: 145
- **Average Order Value**: £581.45

## Margins
- **Gross Margin**: £33,684.20
- **Margin %**: 40.0%

## Top Products
1. **Christmas Turkey Box** - 72 units, £21,600.00
2. **Beef Ribeye Steak** - 156 units, £18,720.00
...

### 🏭 Operations
- **Total Stock Value**: £610,000
- **Items Below Reorder**: 12

### 📋 Action Items
1. 🔴 **[OPERATIONS]** Reorder 3 critical items: Turkey Crowns, Beef Ribeye
2. 🟡 **[FINANCE]** Approve pending POs: PO-1387, PO-1392
```

## Optional: Set Up Slack Notifications

### Get Slack webhook URL

1. Go to https://api.slack.com/apps
2. Create new app → "From scratch"
3. Enable "Incoming Webhooks"
4. Add webhook for `#executive-summary` channel
5. Copy the webhook URL

### Add to .env

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00/B00/XXX
SLACK_CHANNEL_EXECUTIVE=#executive-summary
```

### Test it

```bash
npm run generate-daily
```

You should now receive a Slack message in your channel!

## Set Up Automation (Optional)

### Linux/macOS - Cron

```bash
# Edit crontab
crontab -e

# Add this line (adjust path):
0 7 * * 1-6 cd /path/to/pipers-farm-intelligence && npm run generate-daily
```

### Windows - Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily at 7:00 AM
4. Action: Start a program
   - Program: `node`
   - Arguments: `src/cli/generate-daily-report.js`
   - Start in: `C:\path\to\pipers-farm-intelligence`

## Next Steps

### Daily Workflow
- Check Slack at 7am for daily report
- Review action items
- Check `outputs/daily/` for detailed breakdown

### Weekly Workflow
- Run weekly report: `npm run generate-weekly`
- Review full marketing performance
- Analyze trends and patterns

### Customize
- Edit `config/thresholds.json` to adjust alert levels
- Modify report schedules in cron/Task Scheduler
- Add team members to Slack channels

## Common Commands

```bash
# Test all API connections
npm run test-connections

# Generate daily report
npm run generate-daily

# Generate weekly summary
npm run generate-weekly

# Generate for specific date
node src/cli/generate-daily-report.js 2024-01-10

# Generate weekly ending on specific date
node src/cli/generate-weekly-report.js 2024-01-14
```

## Troubleshooting

### "Cannot find module"
```bash
npm install
```

### "API connection failed"
- Check credentials in `.env`
- See [docs/SETUP.md](docs/SETUP.md) for detailed API setup
- Run `npm run test-connections` to identify which API is failing

### "No data found"
- Verify you have orders/campaigns in the date range
- Try a specific date with known data:
  ```bash
  node src/cli/generate-daily-report.js 2024-01-10
  ```

### Slack messages not appearing
- Test webhook URL directly:
  ```bash
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"Test"}' \
    YOUR_WEBHOOK_URL
  ```
- Check channel name includes `#`

## Get Help

- **Setup Issues**: [docs/SETUP.md](docs/SETUP.md)
- **API Problems**: [docs/API_GUIDE.md](docs/API_GUIDE.md)
- **Common Errors**: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- **Examples**: [docs/QUERY_EXAMPLES.md](docs/QUERY_EXAMPLES.md)

## Repository

https://github.com/ayton-labs/pipers-farm-intelligence

---

**You're all set!** Your AI Control Hub is now generating automated business intelligence reports.

Daily reports will appear in `outputs/daily/` and Slack (if configured).

For the full 6-week implementation plan, see [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md).
