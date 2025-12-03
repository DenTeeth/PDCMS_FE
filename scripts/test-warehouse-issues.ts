/**
 * Test Script for Warehouse Issues Verification
 * 
 * Tests specific issues:
 * - Issue #27: API 6.6 - Transaction List không trả về totalValue
 * - Issue #28: API - Transaction Stats endpoint trả về 400 INVALID_PARAMETER_TYPE
 * 
 * Usage:
 *   npx tsx scripts/test-warehouse-issues.ts
 */

import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';
let authToken: string = '';

async function login(username: string = 'admin', password: string = '123456'): Promise<string> {
  const response = await axios.post(`${API_BASE}/auth/login`, { username, password });
  authToken = response.data.token || response.data.data?.token || response.data.accessToken;
  console.log(`✅ Logged in as ${username}`);
  return authToken;
}

async function testIssue27() {
  console.log('\n📋 Testing Issue #27: API 6.6 - Transaction List totalValue');
  console.log('─'.repeat(60));

  try {
    const response = await axios.get(`${API_BASE}/warehouse/transactions`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 0, size: 10 },
    });

    const data = response.data;
    const transactions = data.content || data.data || [];

    console.log(`✅ API 6.6 returned ${transactions.length} transactions`);
    console.log(`\n📊 Response Structure:`);
    console.log(`   - Has 'content': ${!!data.content}`);
    console.log(`   - Has 'data': ${!!data.data}`);
    console.log(`   - Total elements: ${data.totalElements || 'N/A'}`);

    if (transactions.length > 0) {
      const firstTx = transactions[0];
      console.log(`\n📋 First Transaction Fields:`);
      console.log(`   - transactionId: ${firstTx.transactionId || firstTx.id || 'N/A'}`);
      console.log(`   - transactionCode: ${firstTx.transactionCode || firstTx.code || 'N/A'}`);
      console.log(`   - transactionType: ${firstTx.transactionType || firstTx.type || 'N/A'}`);
      console.log(`   - status: ${firstTx.status || 'N/A'}`);
      console.log(`   - totalValue: ${firstTx.totalValue !== undefined ? firstTx.totalValue : '❌ MISSING'}`);
      console.log(`   - totalAmount: ${firstTx.totalAmount !== undefined ? firstTx.totalAmount : 'N/A'}`);
      console.log(`   - totalCost: ${firstTx.totalCost !== undefined ? firstTx.totalCost : 'N/A'}`);

      // Check all transactions for totalValue
      const hasTotalValue = transactions.some((tx: any) => tx.totalValue !== undefined);
      const missingTotalValue = transactions.filter((tx: any) => tx.totalValue === undefined);

      console.log(`\n🔍 Analysis:`);
      console.log(`   - Transactions with totalValue: ${transactions.filter((tx: any) => tx.totalValue !== undefined).length}`);
      console.log(`   - Transactions missing totalValue: ${missingTotalValue.length}`);

      if (missingTotalValue.length > 0) {
        console.log(`\n❌ Issue #27 CONFIRMED: Some transactions missing totalValue`);
        console.log(`   Missing in transactions: ${missingTotalValue.map((tx: any) => tx.transactionId || tx.id).join(', ')}`);
        return false;
      } else {
        console.log(`\n✅ Issue #27 RESOLVED: All transactions have totalValue`);
        return true;
      }
    } else {
      console.log(`\n⚠️  No transactions found to test`);
      return null;
    }
  } catch (error: any) {
    console.log(`\n❌ Error testing Issue #27:`);
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Error: ${error.response?.data || error.message}`);
    return false;
  }
}

async function testIssue28() {
  console.log('\n📋 Testing Issue #28: Transaction Stats - INVALID_PARAMETER_TYPE');
  console.log('─'.repeat(60));

  try {
    // Test 1: GET without params
    console.log(`\n🔍 Test 1: GET /warehouse/transactions/stats (no params)`);
    try {
      const response1 = await axios.get(`${API_BASE}/warehouse/transactions/stats`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      console.log(`   ✅ Status: ${response1.status}`);
      console.log(`   📊 Response:`, JSON.stringify(response1.data, null, 2));
      return true;
    } catch (error1: any) {
      console.log(`   ❌ Status: ${error1.response?.status}`);
      console.log(`   Error: ${JSON.stringify(error1.response?.data || error1.message, null, 2)}`);

      // Test 2: With different param formats
      console.log(`\n🔍 Test 2: GET /warehouse/transactions/stats?startDate=2025-01-01&endDate=2025-12-31`);
      try {
        const response2 = await axios.get(`${API_BASE}/warehouse/transactions/stats`, {
          headers: { Authorization: `Bearer ${authToken}` },
          params: {
            startDate: '2025-01-01',
            endDate: '2025-12-31',
          },
        });
        console.log(`   ✅ Status: ${response2.status}`);
        console.log(`   📊 Response:`, JSON.stringify(response2.data, null, 2));
        return true;
      } catch (error2: any) {
        console.log(`   ❌ Status: ${error2.response?.status}`);
        const errorData = error2.response?.data;
        console.log(`   Error:`, JSON.stringify(errorData, null, 2));

        if (error2.response?.status === 400 && errorData?.error?.includes('INVALID_PARAMETER_TYPE')) {
          console.log(`\n❌ Issue #28 CONFIRMED: 400 INVALID_PARAMETER_TYPE`);
          console.log(`   Error message: ${errorData.message || errorData.error}`);
          return false;
        } else {
          console.log(`\n⚠️  Different error than expected`);
          return null;
        }
      }
    }
  } catch (error: any) {
    console.log(`\n❌ Unexpected error:`);
    console.log(`   ${error.message}`);
    return false;
  }
}

async function testAPI612POST() {
  console.log('\n📋 Testing API 6.12 POST - Convert Quantity (500 Error)');
  console.log('─'.repeat(60));

  try {
    // First, get a valid item with units
    const itemsResponse = await axios.get(`${API_BASE}/warehouse/items`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 0, size: 10 },
    });

    const items = itemsResponse.data?.content || itemsResponse.data?.data || [];
    if (items.length === 0) {
      console.log(`   ⚠️  No items found`);
      return null;
    }

    const testItem = items[0];
    const itemId = testItem.itemMasterId || testItem.id;

    console.log(`   ℹ️  Using item: ${testItem.itemName || testItem.item_name} (ID: ${itemId})`);

    // Get units for this item
    const unitsResponse = await axios.get(`${API_BASE}/warehouse/items/${itemId}/units`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const units = unitsResponse.data?.data || unitsResponse.data || [];
    console.log(`   ℹ️  Found ${units.length} units`);

    if (units.length < 2) {
      console.log(`   ⚠️  Item needs at least 2 units for conversion test`);
      return null;
    }

    const fromUnit = units[0];
    const toUnit = units[1];

    console.log(`   ℹ️  Converting from: ${fromUnit.unitName} (ID: ${fromUnit.unitId})`);
    console.log(`   ℹ️  Converting to: ${toUnit.unitName} (ID: ${toUnit.unitId})`);

    // Test POST conversion
    const requestBody = {
      conversions: [
        {
          itemMasterId: itemId,
          fromUnitId: fromUnit.unitId || fromUnit.id,
          toUnitId: toUnit.unitId || toUnit.id,
          quantity: 10,
        },
      ],
      roundingMode: 'HALF_UP',
    };

    console.log(`\n📤 Request:`, JSON.stringify(requestBody, null, 2));

    try {
      const response = await axios.post(`${API_BASE}/warehouse/items/units/convert`, requestBody, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📊 Response:`, JSON.stringify(response.data, null, 2));
      return true;
    } catch (error: any) {
      console.log(`   ❌ Status: ${error.response?.status}`);
      console.log(`   Error:`, JSON.stringify(error.response?.data || error.message, null, 2));
      return false;
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Warehouse Issues Verification Test');
  console.log('='.repeat(60));
  console.log(`📍 API Base: ${API_BASE}\n`);

  try {
    await login();

    const result27 = await testIssue27();
    const result28 = await testIssue28();
    const result612 = await testAPI612POST();

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`\nIssue #27 (API 6.6 totalValue): ${result27 === true ? '✅ RESOLVED' : result27 === false ? '❌ CONFIRMED' : '⚠️  SKIP'}`);
    console.log(`Issue #28 (Transaction Stats): ${result28 === true ? '✅ RESOLVED' : result28 === false ? '❌ CONFIRMED' : '⚠️  SKIP'}`);
    console.log(`API 6.12 POST (Convert): ${result612 === true ? '✅ WORKING' : result612 === false ? '❌ FAILED' : '⚠️  SKIP'}`);
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

runTests();

