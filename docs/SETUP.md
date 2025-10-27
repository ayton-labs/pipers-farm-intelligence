# Setup Guide - Piper's Farm AI Control Hub

This guide will walk you through setting up the Piper's Farm AI Control Hub from scratch.

## Prerequisites

- Node.js 20+ installed
- Access to Shopify, Orderwise, Klaviyo, and Aptean SI accounts
- Admin permissions to create API keys
- Slack workspace (optional, for notifications)

## Step 1: Install Dependencies

```bash
cd pipers-farm
npm install
```

## Step 2: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and fill in your API credentials for each system:

### Shopify Setup

1. Go to your Shopify admin panel
2. Navigate to: **Apps** → **Develop apps** → **Create an app**
3. Name it "Piper's Farm AI Hub"
4. Configure Admin API scopes:
   - `read_orders`
   - `read_products`
   - `read_inventory`
   - `read_customers`
5. Install the app and copy the **Admin API access token**
6. Add to `.env`:
```env
SHOPIFY_STORE_URL=pipersfarm.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx
SHOPIFY_API_VERSION=2024-01
```

### Orderwise Setup

1. Contact your Orderwise account manager to request API access
2. Request credentials with permissions for:
   - Stock levels (read)
   - Purchase orders (read)
   - Warehouse dispatches (read)
3. Add to `.env`:
```env
ORDERWISE_API_URL=https://api.orderwise.co.uk
ORDERWISE_API_KEY=your_api_key
ORDERWISE_USERNAME=your_username
ORDERWISE_PASSWORD=your_password
```

### Klaviyo Setup

1. Log in to Klaviyo
2. Go to: **Settings** → **API Keys**
3. Create a new **Private API Key** with permissions:
   - `Campaigns: Read`
   - `Metrics: Read`
4. Add to `.env`:
```env
KLAVIYO_PRIVATE_KEY=pk_xxxxxxxxxxxxx
```

### Aptean SI Setup

**Option A: REST API (Recommended)**

1. Contact Aptean support to enable API access
2. Request an API key with read permissions for production data
3. Add to `.env`:
```env
APTEAN_INTEGRATION_METHOD=API
APTEAN_API_URL=https://your-instance.aptean.com/api
APTEAN_API_KEY=your_api_key
```

**Option B: CSV Export**

1. Set up automated CSV exports from Aptean SI
2. Configure SFTP or local directory access
3. Add to `.env`:
```env
APTEAN_INTEGRATION_METHOD=CSV
APTEAN_CSV_EXPORT_PATH=/path/to/exports
APTEAN_CSV_SFTP_HOST=sftp.example.com
APTEAN_CSV_SFTP_USER=username
APTEAN_CSV_SFTP_PASSWORD=password
```

### Slack Setup (Optional)

1. Go to: https://api.slack.com/apps
2. Create a new app: **From scratch**
3. Name it "Piper's Farm AI Hub"
4. Enable **Incoming Webhooks**
5. Create webhooks for channels:
   - `#executive-summary`
   - `#ops-daily`
   - `#finance-daily`
   - `#marketing-daily`
6. Add to `.env`:
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00/B00/XXX
SLACK_CHANNEL_EXECUTIVE=#executive-summary
SLACK_CHANNEL_OPS=#ops-daily
SLACK_CHANNEL_FINANCE=#finance-daily
SLACK_CHANNEL_MARKETING=#marketing-daily
```

### Email Setup (Optional)

For Gmail:
```env
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_FROM=reports@pipersfarm.com
EMAIL_TO_EXECUTIVE=harry@pipersfarm.com
EMAIL_PASSWORD=your_app_password
```

**Note**: For Gmail, create an [App Password](https://support.google.com/accounts/answer/185833)

## Step 3: Test Connections

Run the connection test script:

```bash
npm run test-connections
```

This will verify that all API credentials are correct and working.

Expected output:
```
✅ Shopify
✅ Orderwise
✅ Klaviyo
✅ Aptean

4/4 systems connected successfully
```

If any tests fail, double-check the credentials in your `.env` file.

## Step 4: Generate Your First Report

### Daily Report

```bash
npm run generate-daily
```

This will:
1. Fetch data from Shopify, Orderwise, and Aptean
2. Generate finance and operations reports
3. Save reports to `outputs/daily/`
4. Send notifications to Slack (if configured)

### Weekly Report

```bash
npm run generate-weekly
```

This will include all daily metrics plus full Klaviyo campaign analysis.

## Step 5: Schedule Automation

### Using Cron (Linux/macOS)

Edit crontab:
```bash
crontab -e
```

Add these lines:
```bash
# Daily report at 7:00 AM (Mon-Sat)
0 7 * * 1-6 cd /path/to/pipers-farm && npm run generate-daily

# Weekly report on Friday at 3:00 PM
0 15 * * 5 cd /path/to/pipers-farm && npm run generate-weekly
```

### Using Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 7:00 AM
4. Action: Start a program
5. Program: `node`
6. Arguments: `src/cli/generate-daily-report.js`
7. Start in: `C:\path\to\pipers-farm`

Repeat for weekly report (Fridays at 3:00 PM).

### Using Claude Code Automations (Advanced)

Create `.claude/automations.yaml`:

```yaml
automations:
  - id: "daily-digest"
    schedule: "BEGIN:VEVENT\nRRULE:FREQ=DAILY;BYHOUR=7;BYMINUTE=0\nEND:VEVENT"
    command: "npm run generate-daily"

  - id: "weekly-summary"
    schedule: "BEGIN:VEVENT\nRRULE:FREQ=WEEKLY;BYDAY=FR;BYHOUR=15;BYMINUTE=0\nEND:VEVENT"
    command: "npm run generate-weekly"
```

## Step 6: Customize Thresholds

Edit `config/thresholds.json` to adjust alert levels:

```json
{
  "finance": {
    "revenue_drop_alert_percentage": 10,
    "margin_warning_percentage": 15
  },
  "operations": {
    "stock_value_warning": 500000,
    "yield_warning_percentage": 82
  },
  "marketing": {
    "open_rate_warning": 15,
    "click_rate_warning": 1.5
  }
}
```

## Troubleshooting

### "Authentication failed" errors

- **Shopify**: Verify your access token starts with `shpat_`
- **Orderwise**: Check username/password are correct
- **Klaviyo**: Ensure using **Private Key** not Public Key
- **Aptean**: Confirm API endpoint URL is correct

### "No data found" errors

- Check date ranges in reports
- Verify you have orders/campaigns in the specified period
- For Aptean CSV: Ensure export files are in correct location

### Slack notifications not sending

- Test webhook URL directly: `curl -X POST -H 'Content-type: application/json' --data '{"text":"Test"}' YOUR_WEBHOOK_URL`
- Verify webhook is for correct workspace
- Check channel names match (include #)

## Next Steps

- Read [API_GUIDE.md](API_GUIDE.md) for detailed API documentation
- See [QUERY_EXAMPLES.md](QUERY_EXAMPLES.md) for sample queries
- Review [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues

## Support

For issues or questions:
1. Check the troubleshooting guide
2. Review API credentials
3. Contact system administrators for API access issues
