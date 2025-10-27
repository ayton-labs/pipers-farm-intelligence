#!/usr/bin/env node
/**
 * API Data Inspector
 * Fetches and saves sample data from each connected API
 * Shows actual data structures for schema adaptation
 */

import ShopifyClient from '../src/integrations/shopify/client.js';
import OrderwiseClient from '../src/integrations/orderwise/client.js';
import KlaviyoClient from '../src/integrations/klaviyo/client.js';
import ApteanClient from '../src/integrations/aptean/client.js';
import { subDays } from 'date-fns';
import fs from 'fs/promises';
import path from 'path';

const OUTPUT_DIR = 'data-samples';

async function ensureOutputDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

async function inspectShopify() {
  console.log('\n📦 Inspecting Shopify API...');
  try {
    const client = new ShopifyClient();
    const yesterday = subDays(new Date(), 1);

    // Get sample orders
    const orders = await client.getOrders(yesterday, new Date());

    if (orders.length === 0) {
      console.log('   ⚠️  No orders found for yesterday');
      // Try last 7 days
      const weekAgo = subDays(new Date(), 7);
      const olderOrders = await client.getOrders(weekAgo, new Date());

      if (olderOrders.length > 0) {
        await fs.writeFile(
          path.join(OUTPUT_DIR, 'shopify-orders-sample.json'),
          JSON.stringify(olderOrders.slice(0, 3), null, 2)
        );
        console.log(`   ✅ Saved ${olderOrders.length} sample orders (last 7 days)`);

        // Show sample structure
        console.log('\n   Sample order structure:');
        const sample = olderOrders[0];
        console.log('   {');
        Object.keys(sample).forEach(key => {
          const value = sample[key];
          const type = Array.isArray(value) ? 'Array' : typeof value;
          console.log(`     ${key}: ${type}`);
        });
        console.log('   }');
      }
    } else {
      await fs.writeFile(
        path.join(OUTPUT_DIR, 'shopify-orders-sample.json'),
        JSON.stringify(orders.slice(0, 3), null, 2)
      );
      console.log(`   ✅ Saved ${orders.length} sample orders`);

      // Show structure
      console.log('\n   Sample order structure:');
      const sample = orders[0];
      console.log('   {');
      Object.keys(sample).forEach(key => {
        const value = sample[key];
        const type = Array.isArray(value) ? 'Array' : typeof value;
        console.log(`     ${key}: ${type}`);
      });
      console.log('   }');
    }

    // Get inventory sample
    const inventory = await client.getInventoryLevels();
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'shopify-inventory-sample.json'),
      JSON.stringify(inventory.slice(0, 5), null, 2)
    );
    console.log(`   ✅ Saved ${inventory.length} inventory items`);

    return true;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return false;
  }
}

async function inspectOrderwise() {
  console.log('\n📊 Inspecting Orderwise API...');
  try {
    const client = new OrderwiseClient();
    await client.authenticate();

    const stockLevels = await client.getStockLevels();

    await fs.writeFile(
      path.join(OUTPUT_DIR, 'orderwise-stock-sample.json'),
      JSON.stringify(stockLevels.slice(0, 10), null, 2)
    );
    console.log(`   ✅ Saved ${stockLevels.length} stock items`);

    // Show structure
    console.log('\n   Sample stock item structure:');
    const sample = stockLevels[0];
    console.log('   {');
    Object.keys(sample).forEach(key => {
      const value = sample[key];
      const type = typeof value;
      console.log(`     ${key}: ${type}`);
    });
    console.log('   }');

    // Get PO sample
    const pos = await client.getOpenPurchaseOrders();
    if (pos.length > 0) {
      await fs.writeFile(
        path.join(OUTPUT_DIR, 'orderwise-pos-sample.json'),
        JSON.stringify(pos.slice(0, 5), null, 2)
      );
      console.log(`   ✅ Saved ${pos.length} purchase orders`);
    }

    return true;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return false;
  }
}

async function inspectKlaviyo() {
  console.log('\n📧 Inspecting Klaviyo API...');
  try {
    const client = new KlaviyoClient();
    const weekAgo = subDays(new Date(), 7);

    const campaigns = await client.getCampaignMetrics(weekAgo, new Date());

    await fs.writeFile(
      path.join(OUTPUT_DIR, 'klaviyo-campaigns-sample.json'),
      JSON.stringify(campaigns.slice(0, 5), null, 2)
    );
    console.log(`   ✅ Saved ${campaigns.length} campaigns`);

    // Show structure
    if (campaigns.length > 0) {
      console.log('\n   Sample campaign structure:');
      const sample = campaigns[0];
      console.log('   {');
      Object.keys(sample).forEach(key => {
        const value = sample[key];
        const type = typeof value === 'object' ? 'Object' : typeof value;
        console.log(`     ${key}: ${type}`);
      });
      console.log('   }');
    }

    return true;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return false;
  }
}

async function inspectAptean() {
  console.log('\n🏭 Inspecting Aptean SI...');
  try {
    const client = new ApteanClient();
    const weekAgo = subDays(new Date(), 7);

    const yields = await client.getYieldData(weekAgo, new Date());

    await fs.writeFile(
      path.join(OUTPUT_DIR, 'aptean-yields-sample.json'),
      JSON.stringify(yields.slice(0, 10), null, 2)
    );
    console.log(`   ✅ Saved ${yields.length} yield records`);

    // Show structure
    if (yields.length > 0) {
      console.log('\n   Sample yield structure:');
      const sample = yields[0];
      console.log('   {');
      Object.keys(sample).forEach(key => {
        const value = sample[key];
        const type = typeof value;
        console.log(`     ${key}: ${type}`);
      });
      console.log('   }');
    }

    return true;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 API Data Inspector');
  console.log('This will fetch sample data from each connected API\n');
  console.log('Sample data will be saved to:', OUTPUT_DIR);

  await ensureOutputDir();

  const results = {
    shopify: await inspectShopify(),
    orderwise: await inspectOrderwise(),
    klaviyo: await inspectKlaviyo(),
    aptean: await inspectAptean(),
  };

  console.log('\n' + '═'.repeat(60));
  console.log('\n📋 Inspection Summary:\n');

  Object.entries(results).forEach(([system, success]) => {
    const status = success ? '✅' : '❌';
    const name = system.charAt(0).toUpperCase() + system.slice(1);
    console.log(`${status} ${name}`);
  });

  const successCount = Object.values(results).filter(r => r).length;
  console.log(`\n${successCount}/4 systems inspected successfully\n`);

  if (successCount > 0) {
    console.log('📁 Sample data saved to:');
    console.log(`   ${path.resolve(OUTPUT_DIR)}\n`);
    console.log('Next steps:');
    console.log('1. Review the JSON files to see actual data structures');
    console.log('2. Compare with expected schemas in config/schemas/');
    console.log('3. Update field mappings in config/field-mappings.json');
    console.log('4. Test with: npm run generate-daily\n');
  }
}

main().catch(console.error);
