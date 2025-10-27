#!/usr/bin/env node
/**
 * Test API connections to all integrated systems
 * Run this script to verify API credentials are correct
 */

import ShopifyClient from '../src/integrations/shopify/client.js';
import OrderwiseClient from '../src/integrations/orderwise/client.js';
import KlaviyoClient from '../src/integrations/klaviyo/client.js';
import ApteanClient from '../src/integrations/aptean/client.js';
import { subDays } from 'date-fns';
import dotenv from 'dotenv';

dotenv.config();

async function testShopify() {
  console.log('\n📦 Testing Shopify connection...');
  try {
    const client = new ShopifyClient();
    const yesterday = subDays(new Date(), 1);
    const today = new Date();

    const metrics = await client.getSalesMetrics(yesterday, today);
    console.log('✅ Shopify connection successful');
    console.log(`   Found ${metrics.total_orders} orders`);
    console.log(`   Revenue: £${metrics.total_revenue.toFixed(2)}`);
    return true;
  } catch (error) {
    console.error('❌ Shopify connection failed:', error.message);
    console.error('   Check SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN in .env');
    return false;
  }
}

async function testOrderwise() {
  console.log('\n📊 Testing Orderwise connection...');
  try {
    const client = new OrderwiseClient();

    // Try to authenticate first
    await client.authenticate();

    const summary = await client.getStockSummary();
    console.log('✅ Orderwise connection successful');
    console.log(`   Stock value: £${summary.total_stock_value.toLocaleString()}`);
    console.log(`   Total items: ${summary.total_items}`);
    return true;
  } catch (error) {
    console.error('❌ Orderwise connection failed:', error.message);
    console.error('   Check ORDERWISE_API_URL, ORDERWISE_API_KEY, and credentials in .env');
    return false;
  }
}

async function testKlaviyo() {
  console.log('\n📧 Testing Klaviyo connection...');
  try {
    const client = new KlaviyoClient();
    const weekAgo = subDays(new Date(), 7);
    const today = new Date();

    const summary = await client.getPerformanceSummary(weekAgo, today);
    console.log('✅ Klaviyo connection successful');
    console.log(`   Campaigns found: ${summary.total_campaigns}`);
    console.log(`   Average open rate: ${summary.average_open_rate.toFixed(1)}%`);
    return true;
  } catch (error) {
    console.error('❌ Klaviyo connection failed:', error.message);
    console.error('   Check KLAVIYO_PRIVATE_KEY in .env');
    return false;
  }
}

async function testAptean() {
  console.log('\n🏭 Testing Aptean SI connection...');
  try {
    const client = new ApteanClient();
    const weekAgo = subDays(new Date(), 7);
    const today = new Date();

    const summary = await client.getYieldSummary(weekAgo, today);
    console.log('✅ Aptean SI connection successful');
    console.log(`   Method: ${process.env.APTEAN_INTEGRATION_METHOD || 'API'}`);
    console.log(`   Batches found: ${summary.total_batches}`);
    console.log(`   Average yield: ${summary.average_yield_percentage.toFixed(1)}%`);
    return true;
  } catch (error) {
    console.error('❌ Aptean SI connection failed:', error.message);
    console.error('   Check APTEAN_INTEGRATION_METHOD and credentials in .env');
    console.error('   If using CSV method, ensure APTEAN_CSV_EXPORT_PATH is correct');
    return false;
  }
}

async function main() {
  console.log('🔍 Testing API connections for Piper\'s Farm AI Control Hub\n');
  console.log('=' .repeat(60));

  const results = {
    shopify: await testShopify(),
    orderwise: await testOrderwise(),
    klaviyo: await testKlaviyo(),
    aptean: await testAptean(),
  };

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Connection Test Summary:\n');

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([system, success]) => {
    const status = success ? '✅' : '❌';
    const name = system.charAt(0).toUpperCase() + system.slice(1);
    console.log(`${status} ${name}`);
  });

  console.log(`\n${passed}/${total} systems connected successfully\n`);

  if (passed === total) {
    console.log('🎉 All systems operational! Ready to generate reports.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some systems failed to connect. Please check your .env configuration.\n');
    console.log('See docs/SETUP.md for detailed setup instructions.\n');
    process.exit(1);
  }
}

main();
