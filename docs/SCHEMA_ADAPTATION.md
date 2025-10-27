# Schema Adaptation Guide

When you connect to real APIs, the data structures may differ from what's expected. This guide helps you inspect, adapt, and clean the data.

## The Reality of API Integration

**Expected:** APIs return data in documented formats
**Reality:**
- Field names differ from documentation
- Some fields are missing or null
- Data types vary (strings vs numbers)
- Nested structures are deeper/shallower than expected
- Extra fields you don't need

**Solution:** Inspect real responses, then adapt your code.

---

## Step 1: Inspect Real API Responses

### Create a Data Inspector Tool

```bash
# Run this to see ACTUAL data from each API
node scripts/inspect-api-data.js
```

This will:
1. Fetch sample data from each connected API
2. Save raw responses to `data-samples/`
3. Show you the exact structure
4. Identify mismatches with current code

### Manual Inspection

```javascript
// For Shopify
import ShopifyClient from './src/integrations/shopify/client.js';
import { subDays } from 'date-fns';
import fs from 'fs/promises';

const client = new ShopifyClient();
const orders = await client.getOrders(subDays(new Date(), 1), new Date());

// Save raw response
await fs.writeFile(
  'data-samples/shopify-orders-raw.json',
  JSON.stringify(orders, null, 2)
);

console.log('Sample order structure:');
console.log(JSON.stringify(orders[0], null, 2));
```

Repeat for each system to see actual structure.

---

## Step 2: Common Schema Mismatches

### Shopify Issues

#### Issue 1: Missing Cost Data
**Expected:**
```javascript
variant: {
  compare_at_price: "72.00"  // Used as cost
}
```

**Reality:**
```javascript
variant: {
  compare_at_price: null  // Often not set
}
```

**Fix:** Use fallback margin percentage
```javascript
// In src/integrations/shopify/client.js
const cost = parseFloat(item.variant?.compare_at_price || item.price * 0.6);
// Adjust 0.6 (40% margin) to your actual margin
```

#### Issue 2: Different Field Names
**Expected:** `total_price`
**Reality:** Might be `current_total_price` or `subtotal_price`

**Fix:** Check multiple possible fields
```javascript
const revenue = parseFloat(
  order.total_price ||
  order.current_total_price ||
  order.subtotal_price ||
  0
);
```

### Orderwise Issues

#### Issue 1: Stock Location Format
**Expected:**
```javascript
{
  location: "Warehouse A"
}
```

**Reality:**
```javascript
{
  warehouse_code: "WH-01",
  location_id: 12345
}
```

**Fix:** Map to readable names
```javascript
const LOCATION_MAP = {
  'WH-01': 'Warehouse A',
  'WH-02': 'Cold Storage',
  'WH-03': 'Processing'
};

const location = LOCATION_MAP[item.warehouse_code] || item.warehouse_code;
```

#### Issue 2: Quantity Fields
**Expected:** `quantity_available`
**Reality:** Might be `available_stock`, `free_stock`, or `on_hand_stock`

**Fix:** Check field mapping with Orderwise support
```javascript
const available = item.quantity_available ||
                 item.available_stock ||
                 item.free_stock ||
                 0;
```

### Klaviyo Issues

#### Issue 1: Revenue Attribution
**Expected:** Direct revenue field per campaign
**Reality:** May require separate API calls or metrics lookup

**Fix:** Check Klaviyo's actual metric structure
```javascript
// May need to query metrics separately
const metrics = await this.client.get(`/campaigns/${campaignId}/metrics`);
```

#### Issue 2: Date Formats
**Expected:** ISO 8601 strings
**Reality:** Unix timestamps or other formats

**Fix:** Normalize dates
```javascript
const sendTime = typeof campaign.send_time === 'number'
  ? new Date(campaign.send_time * 1000)
  : new Date(campaign.send_time);
```

### Aptean SI Issues

#### Issue 1: CSV Column Names
**Expected:**
```csv
batch_id,product_type,input_weight_kg,...
```

**Reality:**
```csv
Batch ID,Product,Input Weight (kg),...
```

**Fix:** Map column headers
```javascript
const COLUMN_MAP = {
  'Batch ID': 'batch_id',
  'Product': 'product_type',
  'Input Weight (kg)': 'input_weight_kg'
};
```

#### Issue 2: Units
**Expected:** All weights in kg
**Reality:** Mix of kg, lbs, or no units

**Fix:** Convert to standard units
```javascript
const inputWeight = item.unit === 'lbs'
  ? parseFloat(item.input_weight) * 0.453592
  : parseFloat(item.input_weight);
```

---

## Step 3: Data Cleaning Utilities

### Create Data Cleaners

Create `src/utils/data-cleaners.js`:

```javascript
/**
 * Data cleaning utilities for normalizing API responses
 */

/**
 * Safely parse float with fallback
 */
export function safeFloat(value, fallback = 0) {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Safely parse integer with fallback
 */
export function safeInt(value, fallback = 0) {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Normalize date to ISO string
 */
export function normalizeDate(date) {
  if (!date) return null;

  // Handle Unix timestamp
  if (typeof date === 'number') {
    return new Date(date * 1000).toISOString();
  }

  // Handle date string
  return new Date(date).toISOString();
}

/**
 * Get nested object property safely
 */
export function safeGet(obj, path, fallback = null) {
  return path.split('.').reduce((current, prop) =>
    current?.[prop], obj
  ) ?? fallback;
}

/**
 * Normalize price to GBP float
 */
export function normalizePrice(price, currency = 'GBP') {
  const amount = safeFloat(price);

  // Handle different currencies if needed
  if (currency === 'USD') {
    return amount * 0.79; // Approximate conversion
  }

  return amount;
}

/**
 * Normalize product name (trim, title case)
 */
export function normalizeProductName(name) {
  if (!name) return 'Unknown Product';

  return name
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Check if value is valid (not null, undefined, or empty string)
 */
export function isValid(value) {
  return value !== null && value !== undefined && value !== '';
}
```

### Use Cleaners in Integration Clients

Example in Shopify client:

```javascript
import { safeFloat, safeGet, normalizeDate, normalizePrice } from '../utils/data-cleaners.js';

// In getSalesMetrics()
orders.forEach(order => {
  const revenue = normalizePrice(
    safeGet(order, 'total_price', 0)
  );

  const createdAt = normalizeDate(order.created_at);

  // ... rest of processing
});
```

---

## Step 4: Schema Validation

### Validate Data Before Processing

Create `src/utils/validators.js`:

```javascript
/**
 * Validate order structure
 */
export function validateOrder(order) {
  const errors = [];

  if (!order.id) errors.push('Missing order ID');
  if (!order.created_at) errors.push('Missing created_at');
  if (!order.total_price && order.total_price !== 0) {
    errors.push('Missing total_price');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate stock item structure
 */
export function validateStockItem(item) {
  const errors = [];

  if (!item.product_code && !item.sku) {
    errors.push('Missing product identifier');
  }
  if (item.quantity_available === undefined) {
    errors.push('Missing quantity');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Log validation errors
 */
export function logValidationErrors(context, data, validator) {
  const result = validator(data);

  if (!result.valid) {
    console.warn(`⚠️  Validation errors in ${context}:`, result.errors);
    console.warn('   Data:', JSON.stringify(data, null, 2));
  }

  return result.valid;
}
```

Use in clients:

```javascript
import { validateOrder, logValidationErrors } from '../utils/validators.js';

orders.forEach(order => {
  if (!logValidationErrors('Shopify order', order, validateOrder)) {
    // Skip invalid orders or use defaults
    return;
  }

  // Process valid order
});
```

---

## Step 5: Field Mapping Configuration

### Create Centralized Field Maps

Create `config/field-mappings.json`:

```json
{
  "shopify": {
    "order": {
      "id": ["id", "order_id"],
      "total": ["total_price", "current_total_price", "subtotal_price"],
      "created": ["created_at", "date_created"],
      "status": ["financial_status", "payment_status"]
    },
    "product": {
      "id": ["id", "product_id"],
      "name": ["title", "name", "product_name"],
      "sku": ["sku", "product_code"]
    }
  },
  "orderwise": {
    "stock": {
      "available": ["quantity_available", "available_stock", "free_stock"],
      "allocated": ["quantity_allocated", "allocated_stock"],
      "location": ["location", "warehouse_code", "location_id"]
    }
  }
}
```

### Use Field Mapping Utility

Create `src/utils/field-mapper.js`:

```javascript
import fs from 'fs/promises';

let fieldMappings = null;

async function loadMappings() {
  if (!fieldMappings) {
    const content = await fs.readFile('config/field-mappings.json', 'utf-8');
    fieldMappings = JSON.parse(content);
  }
  return fieldMappings;
}

/**
 * Get value from object using field mapping
 */
export async function getMappedField(obj, system, type, field) {
  const mappings = await loadMappings();
  const possibleFields = mappings[system]?.[type]?.[field] || [field];

  for (const fieldName of possibleFields) {
    if (obj[fieldName] !== undefined) {
      return obj[fieldName];
    }
  }

  return undefined;
}

/**
 * Map entire object using field mappings
 */
export async function mapObject(obj, system, type) {
  const mappings = await loadMappings();
  const typeMapping = mappings[system]?.[type];

  if (!typeMapping) return obj;

  const mapped = {};

  for (const [targetField, possibleFields] of Object.entries(typeMapping)) {
    for (const sourceField of possibleFields) {
      if (obj[sourceField] !== undefined) {
        mapped[targetField] = obj[sourceField];
        break;
      }
    }
  }

  return mapped;
}
```

Use in clients:

```javascript
import { getMappedField } from '../utils/field-mapper.js';

const total = await getMappedField(order, 'shopify', 'order', 'total');
const status = await getMappedField(order, 'shopify', 'order', 'status');
```

---

## Step 6: Adaptation Workflow

### When You Connect a New API:

1. **Capture Raw Response**
   ```bash
   node scripts/inspect-api-data.js --system shopify
   ```

2. **Compare with Expected Schema**
   ```bash
   node scripts/compare-schemas.js shopify data-samples/shopify-orders-raw.json
   ```

3. **Update Field Mappings**
   Edit `config/field-mappings.json` with actual field names

4. **Test with Real Data**
   ```bash
   npm run generate-daily
   ```

5. **Validate Output**
   Check `outputs/daily/` for accurate data

6. **Adjust and Iterate**
   Fine-tune cleaning logic and mappings

---

## Step 7: Common Adaptation Patterns

### Pattern 1: Multiple Sources for Same Data

Sometimes different systems provide overlapping data:

```javascript
// Stock level from Shopify OR Orderwise
const stockLevel = orderwiseStock?.quantity || shopifyInventory?.available || 0;

// Revenue from Shopify (authoritative) vs Klaviyo (attributed)
const totalRevenue = shopifyRevenue;  // Always trust Shopify for totals
const emailRevenue = klaviyoRevenue;  // Use for attribution
```

### Pattern 2: Data Enrichment

Combine data from multiple sources:

```javascript
// Enrich product with data from multiple systems
const enrichedProduct = {
  id: shopifyProduct.id,
  name: shopifyProduct.title,
  sku: shopifyProduct.sku,
  stock_level: orderwiseStock.available,  // From Orderwise
  recent_sales: shopifyMetrics.sales,      // From Shopify
  email_clicks: klaviyoMetrics.clicks      // From Klaviyo
};
```

### Pattern 3: Conflict Resolution

When data conflicts, establish precedence:

```javascript
// Order of trust for stock levels:
// 1. Orderwise (inventory system of record)
// 2. Aptean (production system)
// 3. Shopify (storefront, might lag)

const actualStock = orderwiseData?.stock ||
                   apteanData?.available ||
                   shopifyData?.inventory ||
                   0;
```

---

## Step 8: Documentation of Adaptations

### Keep Track of Changes

Create `config/api-adaptations.md`:

```markdown
# API Adaptations Log

## Shopify

### Date: 2024-01-15
**Issue:** `compare_at_price` not set on most variants
**Impact:** Cannot calculate actual costs/margins
**Solution:** Using 40% default margin in calculations
**File:** `src/integrations/shopify/client.js:45`
**TODO:** Import actual costs from accounting system

### Date: 2024-01-16
**Issue:** Order status uses `financial_status` not `payment_status`
**Impact:** Status filtering was broken
**Solution:** Updated field mapping
**File:** `config/field-mappings.json`

## Orderwise

### Date: 2024-01-20
**Issue:** Location codes are numeric IDs, not names
**Impact:** Reports show "12345" instead of "Warehouse A"
**Solution:** Added location mapping table
**File:** `src/integrations/orderwise/client.js:78`
```

This creates a knowledge base for your team.

---

## Tools I'll Create for You

Let me create inspection and comparison scripts:
