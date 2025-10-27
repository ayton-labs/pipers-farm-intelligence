# API Integration Guide

This document provides detailed information about each API integration in the Piper's Farm AI Control Hub.

## Overview

The system integrates with four primary data sources:

| System | Type | Data Retrieved | Update Frequency |
|--------|------|----------------|------------------|
| Shopify | REST API | Orders, revenue, products, margins | Real-time |
| Orderwise | REST API | Stock levels, dispatches, POs | Daily |
| Aptean SI | API/CSV | Production yields, waste | Daily |
| Klaviyo | REST API | Campaign performance | Weekly |

## Shopify Integration

### Client: `ShopifyClient`

**File**: `src/integrations/shopify/client.js`

### Methods

#### `getOrders(startDate, endDate)`
Retrieves all orders within a date range.

**Parameters**:
- `startDate` (Date): Start of date range
- `endDate` (Date): End of date range

**Returns**: Array of order objects

**Example**:
```javascript
import ShopifyClient from './src/integrations/shopify/client.js';
import { subDays } from 'date-fns';

const client = new ShopifyClient();
const yesterday = subDays(new Date(), 1);
const orders = await client.getOrders(yesterday, new Date());
```

#### `getSalesMetrics(startDate, endDate)`
Calculates aggregated sales metrics.

**Returns**:
```javascript
{
  total_orders: 145,
  total_revenue: 84210.50,
  total_cost: 50526.30,
  total_margin: 33684.20,
  margin_percentage: 40.0,
  average_order_value: 581.45,
  top_products: {
    "Christmas Turkey Box": {
      quantity: 72,
      revenue: 21600.00
    },
    // ... more products
  }
}
```

#### `getInventoryLevels()`
Retrieves current inventory for all products.

**Returns**: Array of products with variant inventory levels

### API Limits

- **Rate Limit**: 2 requests/second (Shopify Basic)
- **Max Results**: 250 per page
- **Pagination**: Automatic (handled by client)

### Common Issues

**Issue**: `401 Unauthorized`
- **Solution**: Check `SHOPIFY_ACCESS_TOKEN` is correct
- Verify API scopes include `read_orders` and `read_products`

**Issue**: Missing cost/margin data
- **Solution**: Shopify doesn't store cost by default
- Set `compare_at_price` on variants or configure inventory management

---

## Orderwise Integration

### Client: `OrderwiseClient`

**File**: `src/integrations/orderwise/client.js`

### Methods

#### `authenticate()`
Authenticates with Orderwise API and stores access token.

**Returns**: Access token (string)

**Note**: Called automatically by other methods

#### `getStockLevels()`
Retrieves current stock levels for all products.

**Returns**:
```javascript
[
  {
    product_code: "BEEF001",
    product_name: "Beef Ribeye Steak",
    quantity_available: 150,
    quantity_allocated: 25,
    quantity_on_order: 200,
    reorder_level: 100,
    location: "Warehouse A",
    value: 3750.00
  },
  // ... more items
]
```

#### `getStockSummary()`
Calculates aggregated stock metrics with alerts.

**Returns**:
```javascript
{
  total_stock_value: 610000,
  total_items: 347,
  items_below_reorder: 12,
  alerts: [
    {
      product: "Turkey Crowns",
      current: 45,
      reorder_level: 80,
      on_order: 100
    }
  ]
}
```

#### `getOpenPurchaseOrders()`
Lists all open/pending purchase orders.

#### `getDispatchMetrics(date)`
Retrieves warehouse dispatch statistics for a specific date.

### API Limits

- **Rate Limit**: 60 requests/minute
- **Token Expiry**: 24 hours
- **Max Results**: 500 per page

### Common Issues

**Issue**: `403 Forbidden`
- **Solution**: Re-authenticate using `authenticate()` method
- Check API key has correct permissions

**Issue**: Stock levels appear outdated
- **Solution**: Orderwise updates stock in real-time, but API may cache for 5 minutes
- Ensure warehouse staff are marking dispatches as complete

---

## Klaviyo Integration

### Client: `KlaviyoClient`

**File**: `src/integrations/klaviyo/client.js`

### Methods

#### `getCampaignMetrics(startDate, endDate)`
Retrieves all campaigns sent within date range with full metrics.

**Returns**:
```javascript
[
  {
    id: "abc123",
    name: "Weekly Turkey Sale",
    send_time: "2024-01-15T10:00:00Z",
    metrics: {
      recipients: 5420,
      opens: 1084,
      unique_opens: 892,
      clicks: 163,
      unique_clicks: 134,
      open_rate: 16.4,
      click_rate: 2.5,
      revenue: 4328.50
    }
  }
]
```

#### `getPerformanceSummary(startDate, endDate)`
Aggregates campaign performance across date range.

**Returns**:
```javascript
{
  total_campaigns: 4,
  total_recipients: 21680,
  total_opens: 3560,
  total_clicks: 652,
  total_revenue: 18450.25,
  average_open_rate: 16.4,
  average_click_rate: 3.0,
  top_campaigns: [
    {
      name: "Christmas Special",
      revenue: 8200.00,
      open_rate: 22.1,
      click_rate: 4.2
    }
  ]
}
```

#### `getFlowMetrics()`
Retrieves automated flow (sequence) performance.

### API Limits

- **Rate Limit**: 10 requests/second (burst)
- **Daily Limit**: 1,000,000 requests
- **API Version**: 2024-02-15

### Common Issues

**Issue**: Revenue attribution missing
- **Solution**: Ensure Klaviyo tracking is installed on Shopify
- Check metric integration is active in Klaviyo settings

**Issue**: Campaign data delayed
- **Solution**: Klaviyo processes metrics with ~1 hour delay
- For real-time data, wait 2-4 hours after campaign send

---

## Aptean SI Integration

### Client: `ApteanClient`

**File**: `src/integrations/aptean/client.js`

### Integration Methods

Supports two integration methods:

1. **REST API** (recommended)
2. **CSV Export** (fallback)

Set via `APTEAN_INTEGRATION_METHOD` environment variable.

### Methods

#### `getYieldData(startDate, endDate)`
Retrieves production yield data.

**Returns**:
```javascript
[
  {
    batch_id: "B2024-0115",
    product_type: "Beef",
    input_weight: 250.5,
    output_weight: 208.9,
    yield_percentage: 83.4,
    waste_weight: 41.6,
    production_date: "2024-01-15"
  }
]
```

#### `getYieldSummary(startDate, endDate)`
Aggregates yield metrics with alerts.

**Returns**:
```javascript
{
  total_batches: 28,
  total_input_weight: 7012.3,
  total_output_weight: 5850.2,
  total_waste_weight: 1162.1,
  average_yield_percentage: 83.4,
  waste_percentage: 16.6,
  by_product_type: {
    "Beef": {
      batches: 12,
      input: 3001.2,
      output: 2521.0,
      waste: 480.2,
      yield_pct: 84.0
    }
  },
  alerts: [
    {
      batch_id: "B2024-0112",
      product_type: "Pork",
      yield_percentage: 78.2
    }
  ]
}
```

### CSV Format

If using CSV export method, ensure files follow this structure:

**Filename**: `yields_export.csv`

**Columns**:
```csv
batch_id,product_type,input_weight_kg,output_weight_kg,waste_weight_kg,production_date
B2024-0115,Beef,250.5,208.9,41.6,2024-01-15
```

### Common Issues

**Issue**: CSV file not found
- **Solution**: Check `APTEAN_CSV_EXPORT_PATH` points to correct directory
- Verify Aptean export job is running and creating files

**Issue**: Yield calculations seem incorrect
- **Solution**: Verify input/output weights are in same units (kg)
- Check waste weight is included in calculations

---

## Error Handling

All clients implement consistent error handling:

```javascript
try {
  const metrics = await client.getSalesMetrics(start, end);
} catch (error) {
  console.error('Error fetching metrics:', error.message);
  // error.response contains API response details
  // error.status contains HTTP status code
}
```

## Rate Limiting

The system implements automatic retry with exponential backoff for rate limit errors (429 status codes).

## Data Freshness

| System | Data Freshness | Cache Duration |
|--------|----------------|----------------|
| Shopify | Real-time | None |
| Orderwise | 5 minutes | 5 minutes |
| Klaviyo | 1-4 hours | None |
| Aptean | Daily batch | 24 hours |

## Security

- API keys are stored in `.env` (never commit to git)
- All connections use HTTPS/TLS
- Tokens are rotated automatically where supported
- Least-privilege access (read-only permissions)

## Testing APIs

Use the test script to verify all connections:

```bash
npm run test-connections
```

This performs a basic health check on each API integration.
