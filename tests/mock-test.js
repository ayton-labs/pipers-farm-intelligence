#!/usr/bin/env node
/**
 * Mock test runner for testing without real API credentials
 * Uses mock data files to simulate API responses
 */

import fs from 'fs/promises';
import path from 'path';

console.log('🧪 Running mock tests...\n');

async function testMockData() {
  const tests = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Test 1: Check project structure
  console.log('1. Checking project structure...');
  tests.total++;
  try {
    const dirs = ['src', 'config', 'docs', 'tests'];
    for (const dir of dirs) {
      await fs.access(dir);
    }
    console.log('   ✅ All required directories exist\n');
    tests.passed++;
  } catch (error) {
    console.log('   ❌ Missing directories\n');
    tests.failed++;
  }

  // Test 2: Check agent files
  console.log('2. Checking agent files...');
  tests.total++;
  try {
    const agents = [
      'src/agents/finance-agent.js',
      'src/agents/operations-agent.js',
      'src/agents/marketing-agent.js',
      'src/agents/executive-agent.js'
    ];
    for (const agent of agents) {
      await fs.access(agent);
    }
    console.log('   ✅ All agent files present\n');
    tests.passed++;
  } catch (error) {
    console.log('   ❌ Missing agent files\n');
    tests.failed++;
  }

  // Test 3: Check integration clients
  console.log('3. Checking integration clients...');
  tests.total++;
  try {
    const clients = [
      'src/integrations/shopify/client.js',
      'src/integrations/orderwise/client.js',
      'src/integrations/klaviyo/client.js',
      'src/integrations/aptean/client.js'
    ];
    for (const client of clients) {
      await fs.access(client);
    }
    console.log('   ✅ All integration clients present\n');
    tests.passed++;
  } catch (error) {
    console.log('   ❌ Missing integration clients\n');
    tests.failed++;
  }

  // Test 4: Check configuration files
  console.log('4. Checking configuration files...');
  tests.total++;
  try {
    await fs.access('config/thresholds.json');
    await fs.access('.env.example');
    console.log('   ✅ Configuration files present\n');
    tests.passed++;
  } catch (error) {
    console.log('   ❌ Missing configuration files\n');
    tests.failed++;
  }

  // Test 5: Check documentation
  console.log('5. Checking documentation...');
  tests.total++;
  try {
    const docs = [
      'README.md',
      'QUICK_START.md',
      'PROJECT_SUMMARY.md',
      'docs/SETUP.md',
      'docs/API_GUIDE.md'
    ];
    for (const doc of docs) {
      await fs.access(doc);
    }
    console.log('   ✅ All documentation files present\n');
    tests.passed++;
  } catch (error) {
    console.log('   ❌ Missing documentation files\n');
    tests.failed++;
  }

  // Test 6: Load mock data
  console.log('6. Testing mock data loading...');
  tests.total++;
  try {
    const mockData = await fs.readFile('tests/mock-data/shopify-orders.json', 'utf-8');
    const orders = JSON.parse(mockData);
    console.log(`   ✅ Loaded ${orders.length} mock orders\n`);
    tests.passed++;
  } catch (error) {
    console.log('   ❌ Could not load mock data\n');
    tests.failed++;
  }

  // Test 7: Validate thresholds
  console.log('7. Validating alert thresholds...');
  tests.total++;
  try {
    const thresholds = JSON.parse(await fs.readFile('config/thresholds.json', 'utf-8'));
    const required = ['finance', 'operations', 'marketing'];
    const hasAll = required.every(key => thresholds[key]);
    if (hasAll) {
      console.log('   ✅ All threshold categories configured\n');
      tests.passed++;
    } else {
      console.log('   ❌ Missing threshold categories\n');
      tests.failed++;
    }
  } catch (error) {
    console.log('   ❌ Could not validate thresholds\n');
    tests.failed++;
  }

  // Summary
  console.log('═'.repeat(60));
  console.log(`\n📊 Test Summary:\n`);
  console.log(`   Total Tests: ${tests.total}`);
  console.log(`   ✅ Passed: ${tests.passed}`);
  console.log(`   ❌ Failed: ${tests.failed}`);
  console.log(`   Success Rate: ${((tests.passed / tests.total) * 100).toFixed(1)}%\n`);

  if (tests.failed === 0) {
    console.log('🎉 All mock tests passed! Ready for API integration.\n');
    console.log('Next steps:');
    console.log('  1. Obtain API credentials');
    console.log('  2. Copy .env.example to .env');
    console.log('  3. Run: npm run test-connections\n');
    return 0;
  } else {
    console.log('⚠️  Some tests failed. Please check the project structure.\n');
    return 1;
  }
}

testMockData().then(process.exit);
