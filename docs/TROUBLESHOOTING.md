# Troubleshooting Guide

Common issues and solutions for the Piper's Farm AI Control Hub.

## Installation Issues

### Error: `Cannot find module 'axios'`

**Cause**: Dependencies not installed

**Solution**:
```bash
npm install
```

### Error: `Node version too old`

**Cause**: Requires Node.js 20+

**Solution**:
```bash
# Check version
node --version

# If < 20, install latest:
# macOS (with Homebrew)
brew install node

# Windows (download from nodejs.org)
# Or use nvm:
nvm install 20
nvm use 20
```

## API Connection Issues

### Shopify: 401 Unauthorized

**Possible Causes**:
1. Invalid access token
2. Token doesn't have required scopes
3. Wrong store URL

**Solutions**:

Check your `.env`:
```env
# Should look like:
SHOPIFY_STORE_URL=pipersfarm.myshopify.com  # No https://
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx     # Must start with shpat_
```

Verify API scopes in Shopify Admin:
1. Go to Apps → Develop apps
2. Click your app → API credentials
3. Ensure scopes include:
   - `read_orders`
   - `read_products`
   - `read_inventory`

### Shopify: 429 Too Many Requests

**Cause**: Exceeded rate limit (2 req/sec on Basic plan)

**Solution**:
- The client automatically retries with backoff
- If persistent, upgrade Shopify plan or reduce query frequency

### Orderwise: 403 Forbidden

**Possible Causes**:
1. API key expired
2. Wrong credentials
3. IP address not whitelisted

**Solutions**:

Re-authenticate:
```javascript
import OrderwiseClient from './src/integrations/orderwise/client.js';

const client = new OrderwiseClient();
try {
  await client.authenticate();
  console.log('✅ Authentication successful');
} catch (error) {
  console.error('❌ Auth failed:', error.message);
}
```

Contact Orderwise support to:
- Verify API key is active
- Check IP whitelist includes your server
- Confirm account has API access enabled

### Klaviyo: Invalid API Key

**Cause**: Using Public Key instead of Private Key

**Solution**:

Check `.env` - you need the **Private API Key**:
```env
# WRONG (this is public key):
KLAVIYO_PRIVATE_KEY=pk_xxxxx

# CORRECT (this is private key):
KLAVIYO_PRIVATE_KEY=pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Get the correct key:
1. Klaviyo → Settings → API Keys
2. Create a **Private API Key**
3. Ensure it has scopes: `Campaigns:Read`, `Metrics:Read`

### Aptean: File Not Found (CSV method)

**Cause**: Export path incorrect or files not generated

**Solutions**:

Check export path:
```bash
# Verify directory exists
ls -la /path/to/exports

# Check for yield files
ls -la /path/to/exports/*.csv
```

Verify `.env`:
```env
APTEAN_INTEGRATION_METHOD=CSV
APTEAN_CSV_EXPORT_PATH=/full/absolute/path/to/exports
```

Check Aptean export job:
- Confirm automated export is scheduled
- Check export runs successfully
- Verify file naming matches `yields_export.csv`

## Report Generation Issues

### Error: "No data found"

**Possible Causes**:
1. Date range has no orders/campaigns
2. API returned empty results
3. Filters excluding all data

**Solutions**:

Test with known good date:
```bash
# Use specific date with known data
node src/cli/generate-daily-report.js 2024-01-10
```

Check API responses manually:
```javascript
import ShopifyClient from './src/integrations/shopify/client.js';
import { subDays } from 'date-fns';

const client = new ShopifyClient();
const orders = await client.getOrders(subDays(new Date(), 1), new Date());
console.log(`Found ${orders.length} orders`);
```

### Reports missing cost/margin data

**Cause**: Shopify doesn't store product costs by default

**Solutions**:

**Option 1**: Set `compare_at_price` on variants
1. Shopify Admin → Products
2. Edit variant
3. Set "Compare at price" to your cost
4. Our code uses this if available

**Option 2**: Enable inventory cost tracking
1. Install Shopify inventory app
2. Import cost data
3. Update client to read from inventory records

**Option 3**: Hardcode margin percentage
Edit `config/thresholds.json`:
```json
{
  "finance": {
    "default_margin_percentage": 40
  }
}
```

### Weekly report missing Klaviyo data

**Cause**: Klaviyo metrics take 1-4 hours to populate after send

**Solution**:

Schedule weekly report for later in day:
```bash
# Instead of Friday 3pm, try Saturday 9am
# Or wait 24 hours after last campaign
```

For immediate data, use campaigns sent 24+ hours ago:
```javascript
// In marketing-agent.js, adjust date range:
const endDate = subDays(new Date(), 1);  // Yesterday instead of today
```

## Notification Issues

### Slack messages not appearing

**Possible Causes**:
1. Invalid webhook URL
2. Wrong channel name
3. Slack app permissions

**Solutions**:

Test webhook directly:
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test from Piper'\''s Farm"}' \
  YOUR_WEBHOOK_URL
```

Check `.env`:
```env
# URL should be complete webhook URL
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX

# Channel names need #
SLACK_CHANNEL_EXECUTIVE=#executive-summary
```

Verify Slack app:
1. Go to https://api.slack.com/apps
2. Select your app
3. Check "Incoming Webhooks" is enabled
4. Verify webhook URL matches `.env`

### Emails not sending

**Cause**: Email functionality requires nodemailer (not implemented by default)

**Solution**:

Install nodemailer:
```bash
npm install nodemailer
```

Update `src/utils/notification-service.js`:
```javascript
import nodemailer from 'nodemailer';

// In sendEmail method:
const transporter = nodemailer.createTransport({
  host: this.emailConfig.host,
  port: this.emailConfig.port,
  auth: {
    user: this.emailConfig.from,
    pass: this.emailConfig.password,
  },
});

await transporter.sendMail({
  from: this.emailConfig.from,
  to: to,
  subject: subject,
  text: body,
  html: markdownToHTML(body),  // Install markdown-it for this
});
```

For Gmail, use App Password:
1. Google Account → Security
2. 2-Step Verification → App passwords
3. Generate password for "Mail"
4. Use this in `.env` as `EMAIL_PASSWORD`

## Data Quality Issues

### Stock values seem incorrect

**Possible Causes**:
1. Unit cost not set in Orderwise
2. Currency mismatch
3. Allocated stock counted twice

**Solutions**:

Check Orderwise data:
```javascript
import OrderwiseClient from './src/integrations/orderwise/client.js';

const client = new OrderwiseClient();
const levels = await client.getStockLevels();

// Inspect first few items
console.table(levels.slice(0, 10));
```

Verify calculations:
- Stock value = `quantity_available × unit_cost`
- Should NOT include allocated stock
- Check unit costs are in GBP

### Yield percentages too high/low

**Possible Causes**:
1. Input/output weights in different units
2. Waste not included
3. Data entry errors in Aptean

**Solutions**:

Check raw yield data:
```javascript
import ApteanClient from './src/integrations/aptean/client.js';
import { subDays } from 'date-fns';

const client = new ApteanClient();
const yields = await client.getYieldData(subDays(new Date(), 7), new Date());

// Check a few batches
yields.slice(0, 5).forEach(batch => {
  console.log(`${batch.batch_id}: ${batch.input_weight}kg → ${batch.output_weight}kg = ${batch.yield_percentage.toFixed(1)}%`);
});
```

Verify in Aptean SI:
- Input weight = raw material weight
- Output weight = finished product weight
- Waste weight = input - output
- All weights in same units (kg)

### Campaign revenue attribution missing

**Cause**: Klaviyo-Shopify tracking not configured

**Solutions**:

1. **Verify Klaviyo integration**:
   - Shopify Admin → Apps → Klaviyo
   - Check "Track revenue" is enabled

2. **Check tracking code**:
   - Klaviyo → Settings → Integrations → Shopify
   - Verify store is connected
   - Test with a new campaign

3. **Wait for data**:
   - Revenue attribution takes 24-48 hours
   - For recent campaigns, data may not be available yet

## Automation Issues

### Cron job not running

**Check if cron is running**:
```bash
# macOS/Linux
sudo systemctl status cron

# Check your crontab
crontab -l
```

**Common issues**:

1. **Wrong paths**: Use absolute paths
```bash
# WRONG
0 7 * * * cd pipers-farm && npm run generate-daily

# CORRECT
0 7 * * 1-6 cd /full/path/to/pipers-farm && /usr/local/bin/npm run generate-daily
```

2. **Environment variables**: Cron doesn't load `.env`

Create wrapper script `scripts/run-daily.sh`:
```bash
#!/bin/bash
cd /path/to/pipers-farm
source .env
/usr/local/bin/node src/cli/generate-daily-report.js
```

Make executable and use in cron:
```bash
chmod +x scripts/run-daily.sh

# In crontab:
0 7 * * 1-6 /path/to/pipers-farm/scripts/run-daily.sh >> /tmp/pipers-farm.log 2>&1
```

3. **Check logs**:
```bash
tail -f /tmp/pipers-farm.log
```

### Windows Task Scheduler not running

**Common issues**:

1. **Task runs but fails silently**
   - Solution: Add logging to script
   - Check Task Scheduler history

2. **Permissions issues**
   - Run as administrator
   - Check user has access to node.exe

3. **Environment variables**
   - Create batch file that loads .env:
```batch
@echo off
cd C:\path\to\pipers-farm
call npm run generate-daily >> C:\logs\pipers-farm.log 2>&1
```

## Performance Issues

### Reports taking too long to generate

**Possible Causes**:
1. Large date ranges
2. Many products/orders
3. API rate limiting

**Solutions**:

**Optimize date ranges**:
```javascript
// Instead of:
const metrics = await shopify.getSalesMetrics(last30Days, today);

// Use:
const metrics = await shopify.getSalesMetrics(yesterday, today);
```

**Cache expensive operations**:
```javascript
// Store product list, refresh daily
const productCache = await cacheProducts();
```

**Run in parallel**:
```javascript
// Already implemented in agents:
const [finance, ops, marketing] = await Promise.all([
  financeAgent.generate(),
  opsAgent.generate(),
  marketingAgent.generate(),
]);
```

### High memory usage

**Cause**: Loading large datasets

**Solutions**:

**Limit result sets**:
```javascript
// In shopify client, add limit:
top_products: Object.entries(metrics.top_products)
  .slice(0, 50)  // Only keep top 50
```

**Stream large files**:
```javascript
// For CSV processing
import { pipeline } from 'stream/promises';
await pipeline(readStream, parseStream, processStream);
```

## Getting Help

### Enable debug logging

```bash
# Set in .env
DEBUG=true

# Or run with debug flag
DEBUG=true npm run generate-daily
```

### Collect diagnostic info

```bash
# Test all connections
npm run test-connections > diagnostics.txt 2>&1

# Check Node version
node --version >> diagnostics.txt

# Check environment
env | grep -E '(SHOPIFY|ORDERWISE|KLAVIYO|APTEAN)' >> diagnostics.txt
```

### Common log locations

- Reports: `outputs/daily/` and `outputs/weekly/`
- Cron logs: `/tmp/pipers-farm.log`
- System logs: `~/.pm2/logs/` (if using PM2)

### Contact Support

If issues persist:

1. Check this troubleshooting guide
2. Review [SETUP.md](SETUP.md) for configuration
3. Test individual components with [QUERY_EXAMPLES.md](QUERY_EXAMPLES.md)
4. Collect diagnostic info and error messages
5. Contact system administrator or Oliver

Include in support request:
- Error message (full stack trace)
- Command that failed
- Diagnostic output
- Relevant section of `.env` (hide secrets!)
