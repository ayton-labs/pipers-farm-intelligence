# Testing Guide - Piper's Farm Intelligence

Complete guide for testing the system with and without API credentials.

## Testing Phases

### Phase 1: Mock Testing (No API Keys Required)

Test the system structure and logic before having API credentials.

#### Run Mock Tests

```bash
# Install dependencies
npm install

# Run mock structure test
node tests/mock-test.js
```

**What this tests:**
- Project structure is complete
- All agent files exist
- Integration clients are present
- Configuration files are valid
- Documentation is complete

**Expected output:**
```
✅ All mock tests passed! Ready for API integration.
```

---

### Phase 2: Single System Testing (With 1 API Key)

Start with the easiest system to get credentials for (usually Shopify).

#### Test Shopify Only

1. **Get Shopify credentials** (5 minutes)
   - Admin → Apps → Develop apps
   - Create app with `read_orders`, `read_products` scopes
   - Get access token

2. **Configure minimal .env**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with ONLY Shopify credentials:
   ```env
   SHOPIFY_STORE_URL=pipersfarm.myshopify.com
   SHOPIFY_ACCESS_TOKEN=shpat_xxxxx
   ```

3. **Test Shopify connection**
   ```bash
   node tests/test-shopify-only.js
   ```

4. **Generate Finance report only**
   ```bash
   node tests/test-finance-agent.js
   ```

**What you'll see:**
- Actual sales data from your Shopify store
- Top products list
- Margin calculations (if costs are configured)

**Common issues:**
- ❌ `401 Unauthorized` → Check access token
- ❌ `No data found` → Verify you have recent orders
- ⚠️  `Margins showing 0%` → Shopify costs not configured (normal - see docs)

---

### Phase 3: Progressive Integration Testing

Add one system at a time, test each before moving to the next.

#### Recommended Order:

**1. Shopify** (Easiest)
- Usually already have admin access
- Fast approval process
- Real-time data

**2. Klaviyo** (Easy)
- Self-service API keys
- Takes 2 minutes to generate
- No approval needed

**3. Orderwise** (Medium)
- May need to contact account manager
- Could take 1-2 weeks for API access
- Test with CSV export as fallback

**4. Aptean SI** (Varies)
- Depends on your Aptean setup
- May need IT support
- CSV export method available as backup

#### Testing Each System

```bash
# Test Shopify
node tests/test-connections.js --shopify

# Test Klaviyo
node tests/test-connections.js --klaviyo

# Test Orderwise
node tests/test-connections.js --orderwise

# Test Aptean
node tests/test-connections.js --aptean

# Test all systems
npm run test-connections
```

---

### Phase 4: Agent Testing (With 2+ APIs)

Once you have at least 2 systems connected, test the agents.

#### Test Individual Agents

```bash
# Finance Agent (needs Shopify)
node tests/test-finance-agent.js

# Operations Agent (needs Orderwise + Aptean)
node tests/test-operations-agent.js

# Marketing Agent (needs Klaviyo)
node tests/test-marketing-agent.js

# Executive Agent (needs all or most)
node tests/test-executive-agent.js
```

#### Test Report Generation

```bash
# Generate daily report (uses available systems)
npm run generate-daily

# Check output
cat outputs/daily/$(ls -t outputs/daily/ | head -1)
```

**Validation checklist:**
- [ ] Numbers match your source systems
- [ ] Dates are correct
- [ ] Alerts trigger appropriately
- [ ] Action items make sense
- [ ] No errors in console

---

### Phase 5: Notification Testing

Test Slack and email delivery.

#### Test Slack (Quick)

1. **Get webhook URL** (2 minutes)
   - https://api.slack.com/apps
   - Create app → Incoming Webhooks
   - Copy webhook URL

2. **Add to .env**
   ```env
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX
   SLACK_CHANNEL_EXECUTIVE=#test-channel
   ```

3. **Send test message**
   ```bash
   curl -X POST -H 'Content-type: application/json' \
     --data '{"text":"Test from Pipers Farm Intelligence"}' \
     $SLACK_WEBHOOK_URL
   ```

4. **Test with real report**
   ```bash
   npm run generate-daily
   ```

   Check your Slack channel for the message.

#### Test Email (Optional)

Email requires nodemailer setup - see [docs/SETUP.md](docs/SETUP.md) for configuration.

---

### Phase 6: Automation Testing

Test scheduled execution.

#### Manual Schedule Test

```bash
# Test daily report generation
npm run generate-daily

# Wait for it to complete
# Check:
# 1. Slack message arrived
# 2. Files created in outputs/daily/
# 3. No errors in console
```

#### Cron/Scheduler Dry Run

**macOS/Linux:**
```bash
# Test cron command manually
cd /full/path/to/pipers-farm-intelligence && npm run generate-daily
```

**Windows:**
```batch
# Test Task Scheduler command
cd C:\path\to\pipers-farm-intelligence
npm run generate-daily
```

If this works, the scheduled version will work.

---

## Testing Checklist

Use this checklist to track testing progress:

### Pre-API Testing
- [ ] `npm install` completes successfully
- [ ] `node tests/mock-test.js` passes all tests
- [ ] All documentation files are readable
- [ ] Project structure matches docs

### API Integration Testing
- [ ] Shopify credentials obtained and tested
- [ ] Klaviyo credentials obtained and tested
- [ ] Orderwise credentials obtained and tested
- [ ] Aptean credentials obtained and tested
- [ ] `npm run test-connections` shows all green

### Data Validation Testing
- [ ] Shopify sales numbers match admin panel
- [ ] Stock levels match Orderwise
- [ ] Campaign metrics match Klaviyo dashboard
- [ ] Yield data matches Aptean reports
- [ ] Alert thresholds are appropriate

### Report Generation Testing
- [ ] Daily report generates without errors
- [ ] Weekly report generates without errors
- [ ] Reports contain expected data
- [ ] Action items are relevant
- [ ] Output files are created correctly

### Notification Testing
- [ ] Slack webhook configured
- [ ] Test message sends to Slack
- [ ] Daily report posts to Slack
- [ ] Message formatting is correct
- [ ] Email works (if configured)

### Automation Testing
- [ ] Manual command works from terminal
- [ ] Scheduled task configured
- [ ] First automated run succeeds
- [ ] Subsequent runs work reliably

---

## Troubleshooting Tests

### If `npm install` fails

```bash
# Check Node version (needs 20+)
node --version

# Clear cache and retry
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### If connection test fails

```bash
# Test with debug mode
DEBUG=true npm run test-connections

# Test one system at a time
node -e "import('./src/integrations/shopify/client.js').then(m => new m.default().getCustomerMetrics().then(console.log))"
```

### If reports show wrong data

1. **Check date range**
   ```bash
   # Generate for known good date
   node src/cli/generate-daily-report.js 2024-01-15
   ```

2. **Check raw API response**
   ```javascript
   import ShopifyClient from './src/integrations/shopify/client.js';
   const client = new ShopifyClient();
   const orders = await client.getOrders(yesterday, today);
   console.log(JSON.stringify(orders, null, 2));
   ```

3. **Verify thresholds**
   ```bash
   cat config/thresholds.json
   ```

---

## Expected Timeline Per Phase

| Phase | Time Required | Can Start Without APIs? |
|-------|--------------|------------------------|
| Phase 1: Mock Testing | 10 minutes | ✅ Yes |
| Phase 2: Single System | 1-2 days | Needs 1 API key |
| Phase 3: Progressive Integration | 1-4 weeks | Needs API keys |
| Phase 4: Agent Testing | 2-3 days | Needs 2+ APIs |
| Phase 5: Notifications | 1 day | Optional |
| Phase 6: Automation | 1-2 days | Final step |

**Total realistic timeline:** 3-6 weeks depending on API access speed.

---

## What to Test Once Live

### Daily Checks (First Week)
- [ ] Report arrives at 7am
- [ ] Numbers are accurate
- [ ] Alerts are appropriate
- [ ] Action items are actionable

### Weekly Checks (First Month)
- [ ] Weekly report arrives Friday 3pm
- [ ] Klaviyo data is correct
- [ ] Trends are visible
- [ ] Team is using the reports

### Monthly Review
- [ ] Adjust alert thresholds based on experience
- [ ] Add/remove metrics as needed
- [ ] Gather team feedback
- [ ] Document any custom queries

---

## Support During Testing

If you encounter issues during testing:

1. **Check [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** first
2. **Run with debug mode**: `DEBUG=true npm run generate-daily`
3. **Collect diagnostics**: `npm run test-connections > diagnostics.txt 2>&1`
4. **Check the specific integration docs** in [docs/API_GUIDE.md](docs/API_GUIDE.md)

---

## Success Criteria

You'll know testing is complete when:

✅ All 4 API connections test successfully
✅ Daily report generates accurate data
✅ Weekly report includes all metrics
✅ Slack notifications arrive on time
✅ Alert thresholds trigger appropriately
✅ Team can interpret and act on reports
✅ Automated schedule runs reliably

**Then you're ready for production!** 🚀
