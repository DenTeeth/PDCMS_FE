/**
 * Test Script for Warehouse APIs 6.1 - 6.13
 * 
 * This script tests all warehouse APIs to verify they are working correctly.
 * Run with: npx tsx scripts/test-warehouse-apis.ts
 * 
 * APIs tested:
 * - 6.1: Inventory Summary
 * - 6.2: Item Batches
 * - 6.3: Expiring Alerts
 * - 6.4: Import Transaction (Create)
 * - 6.5: Export Transaction (Create)
 * - 6.6: Transaction History (List)
 * - 6.7: Transaction Detail
 * - 6.8: Item Masters (List)
 * - 6.9: Create Item Master
 * - 6.10: Update Item Master
 * - 6.11: Get Item Units
 * - 6.12: Convert Quantity
 * - 6.13: Get Suppliers with Metrics
 */

import axios from 'axios';

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const API_BASE = `${BASE_URL}/api/v1`;

// Authentication
let authToken: string = '';

// Test results
interface TestResult {
  api: string;
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  statusCode?: number;
  error?: string;
  responseTime?: number;
  data?: any;
}

const results: TestResult[] = [];

/**
 * Authenticate and get JWT token
 */
async function authenticate(username: string = 'admin', password: string = '123456'): Promise<string> {
  try {
    console.log(`🔐 Authenticating as ${username}...`);
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username,
      password,
    });

    // Handle different response structures
    if (response.data?.data?.token) {
      authToken = response.data.data.token;
      console.log('✅ Authentication successful');
      return authToken;
    } else if (response.data?.token) {
      authToken = response.data.token;
      console.log('✅ Authentication successful');
      return authToken;
    } else {
      throw new Error('No token in response');
    }
  } catch (error: any) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to make API calls
async function testAPI(
  api: string,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  data?: any,
  params?: any
): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = {
    api,
    endpoint,
    method,
    status: 'SKIP',
  };

  try {
    const config: any = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
    };

    if (params) {
      config.params = params;
    }

    if (data && (method === 'POST' || method === 'PUT')) {
      config.data = data;
    }

    const response = await axios(config);
    const responseTime = Date.now() - startTime;

    result.status = response.status >= 200 && response.status < 300 ? 'PASS' : 'FAIL';
    result.statusCode = response.status;
    result.responseTime = responseTime;
    result.data = response.data;

    // Check if response has expected structure
    if (method === 'GET') {
      if (response.data && typeof response.data === 'object') {
        result.status = 'PASS';
      }
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    result.status = 'FAIL';
    result.statusCode = error.response?.status;
    result.error = error.response?.data?.message || error.message;
    result.responseTime = responseTime;
  }

  return result;
}

// Test functions
async function testAPI_6_1() {
  console.log('\n📊 Testing API 6.1 - Inventory Summary');
  const result = await testAPI(
    '6.1',
    '/warehouse/summary',
    'GET',
    undefined,
    { page: 0, size: 10 }
  );
  results.push(result);
  console.log(`   Status: ${result.status} | Code: ${result.statusCode} | Time: ${result.responseTime}ms`);
  if (result.error) console.log(`   Error: ${result.error}`);
  if (result.statusCode === 500) {
    console.log('   ❌ Note: 500 Internal Server Error - BE issue, check BE logs.');
  } else if (result.data?.content) {
    console.log(`   ✅ Found ${result.data.content.length} items`);
  }
}

async function testAPI_6_2() {
  console.log('\n📦 Testing API 6.2 - Item Batches');
  
  // First, try to get a valid itemMasterId from API 6.8
  let validItemMasterId: number | null = null;
  
  try {
    const itemsResponse = await axios.get(`${API_BASE}/warehouse/items`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 0, size: 1 },
    });
    
    // Handle both PageResponse and array formats
    let items: any[] = [];
    if (itemsResponse.data?.content) {
      items = itemsResponse.data.content;
    } else if (Array.isArray(itemsResponse.data)) {
      items = itemsResponse.data;
    }
    
    if (items.length > 0) {
      validItemMasterId = items[0].itemMasterId || items[0].id;
      console.log(`   ℹ️  Using valid itemMasterId: ${validItemMasterId}`);
    }
  } catch (e) {
    console.log('   ⚠️  Could not fetch valid item ID, using default: 1');
  }
  
  const itemId = validItemMasterId || 1;
  const result = await testAPI(
    '6.2',
    `/warehouse/batches/${itemId}`,
    'GET'
  );
  results.push(result);
  console.log(`   Status: ${result.status} | Code: ${result.statusCode} | Time: ${result.responseTime}ms`);
  if (result.error) console.log(`   Error: ${result.error}`);
  if (result.statusCode === 404) {
    console.log(`   ⚠️  Note: Item ID ${itemId} not found. This is expected if no items exist.`);
  } else if (result.statusCode === 500) {
    console.log('   ❌ Note: 500 Internal Server Error - BE issue, not test data issue.');
  }
}

async function testAPI_6_3() {
  console.log('\n⏰ Testing API 6.3 - Expiring Alerts');
  const result = await testAPI(
    '6.3',
    '/warehouse/alerts/expiring',
    'GET',
    undefined,
    { days: 30, page: 0, size: 20 }
  );
  results.push(result);
  console.log(`   Status: ${result.status} | Code: ${result.statusCode} | Time: ${result.responseTime}ms`);
  if (result.error) console.log(`   Error: ${result.error}`);
  if (result.data?.stats) {
    console.log(`   Stats: ${result.data.stats.totalAlerts} alerts found`);
  }
}

async function testAPI_6_4() {
  console.log('\n📥 Testing API 6.4 - Import Transaction (Create)');
  
  // First, try to get valid IDs from API 6.8
  let validItemMasterId: number | null = null;
  let validSupplierId: number | null = null;
  let validUnitId: number | null = null;
  
  try {
    // Get first item from API 6.8
    const itemsResponse = await axios.get(`${API_BASE}/warehouse/items`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 0, size: 1 },
    });
    
    if (itemsResponse.data && itemsResponse.data.length > 0) {
      validItemMasterId = itemsResponse.data[0].id || itemsResponse.data[0].itemMasterId;
      console.log(`   ℹ️  Found valid itemMasterId: ${validItemMasterId}`);
      
      // Try to get units for this item (API 6.11)
      try {
        const unitsResponse = await axios.get(`${API_BASE}/warehouse/items/${validItemMasterId}/units`, {
          headers: { Authorization: `Bearer ${authToken}` },
          params: { status: 'active' },
        });
        
        // Handle GetItemUnitsResponse structure
        if (unitsResponse.data?.units && unitsResponse.data.units.length > 0) {
          // Prefer base unit for import transactions
          const baseUnit = unitsResponse.data.units.find((u: any) => u.isBaseUnit) || unitsResponse.data.units[0];
          validUnitId = baseUnit.unitId;
          console.log(`   ℹ️  Found valid unitId: ${validUnitId} (${baseUnit.unitName}${baseUnit.isBaseUnit ? ' - base unit' : ''})`);
        } else if (Array.isArray(unitsResponse.data) && unitsResponse.data.length > 0) {
          validUnitId = unitsResponse.data[0].unitId || unitsResponse.data[0].id;
          console.log(`   ℹ️  Found valid unitId: ${validUnitId}`);
        }
      } catch (e) {
        // Units endpoint may not exist or may fail
      }
    }
  } catch (e) {
    console.log('   ⚠️  Could not fetch valid item IDs, using defaults');
  }
  
  // Try to get suppliers from seed data (SUP-001, SUP-002, etc.)
  try {
    const suppliersResponse = await axios.get(`${API_BASE}/warehouse/suppliers`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 0, size: 10 },
    });
    
    // Handle both PageResponse and array formats
    let suppliers: any[] = [];
    if (suppliersResponse.data?.content) {
      suppliers = suppliersResponse.data.content;
    } else if (Array.isArray(suppliersResponse.data)) {
      suppliers = suppliersResponse.data;
    }
    
    // Try to find SUP-001 from seed data
    const sup001 = suppliers.find((s: any) => 
      s.supplierCode === 'SUP-001' || s.supplier_code === 'SUP-001'
    );
    
    if (sup001) {
      validSupplierId = sup001.supplierId || sup001.id;
      console.log(`   ℹ️  Found seed supplier SUP-001 (ID: ${validSupplierId})`);
    } else if (suppliers.length > 0) {
      validSupplierId = suppliers[0].supplierId || suppliers[0].id;
      console.log(`   ℹ️  Using first supplier ID: ${validSupplierId}`);
    }
  } catch (e) {
    // Suppliers endpoint may not exist
  }
  
  // Use valid IDs or defaults
  const testData = {
    transactionDate: new Date().toISOString().split('T')[0],
    supplierId: validSupplierId || 1,
    invoiceNumber: `TEST-INV-${Date.now()}`, // Unique invoice number
    notes: 'Test import transaction from test script',
    items: [
      {
        itemMasterId: validItemMasterId || 1,
        quantity: 10,
        unitId: validUnitId || 1,
        purchasePrice: 1000,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lotNumber: `TEST-LOT-${Date.now()}`,
      },
    ],
  };

  // According to LEGACY_CODE_CLEANUP_SUMMARY, API 6.4 is POST /api/v1/warehouse/import
  // But testing guide shows /api/v1/inventory/import - try both to be safe
  let result = await testAPI('6.4', '/warehouse/import', 'POST', testData);
  
  // If warehouse/import fails with 404, try inventory/import (may be legacy endpoint)
  if (result.statusCode === 404) {
    console.log('   ℹ️  /warehouse/import returned 404, trying /inventory/import (legacy?)...');
    result = await testAPI('6.4', '/inventory/import', 'POST', testData);
  }
  
  results.push(result);
  console.log(`   Status: ${result.status} | Code: ${result.statusCode} | Time: ${result.responseTime}ms`);
  if (result.error) console.log(`   Error: ${result.error}`);
  if (result.statusCode === 400) {
    console.log('   ⚠️  Note: 400 Bad Request - Test data validation failed (expected if IDs are invalid).');
  } else if (result.statusCode === 404) {
    console.log('   ⚠️  Note: 404 Not Found - Endpoint or resource not found.');
  } else if (result.statusCode === 500) {
    console.log('   ❌ Note: 500 Internal Server Error - BE issue, not test data issue.');
  }
}

async function testAPI_6_5() {
  console.log('\n📤 Testing API 6.5 - Export Transaction (Create)');
  
  // First, try to get valid IDs from API 6.8
  let validItemMasterId: number | null = null;
  let validUnitId: number | null = null;
  
  try {
    const itemsResponse = await axios.get(`${API_BASE}/warehouse/items`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 0, size: 1 },
    });
    
    // Handle both PageResponse and array formats
    let items: any[] = [];
    if (itemsResponse.data?.content) {
      items = itemsResponse.data.content;
    } else if (Array.isArray(itemsResponse.data)) {
      items = itemsResponse.data;
    }
    
    if (items.length > 0) {
      validItemMasterId = items[0].itemMasterId || items[0].id;
      console.log(`   ℹ️  Found valid itemMasterId: ${validItemMasterId}`);
      
      // Try to get units for this item (API 6.11)
      try {
        const unitsResponse = await axios.get(`${API_BASE}/warehouse/items/${validItemMasterId}/units`, {
          headers: { Authorization: `Bearer ${authToken}` },
          params: { status: 'active' },
        });
        
        // Handle GetItemUnitsResponse structure
        if (unitsResponse.data?.units && unitsResponse.data.units.length > 0) {
          validUnitId = unitsResponse.data.units[0].unitId;
          console.log(`   ℹ️  Found valid unitId: ${validUnitId} (${unitsResponse.data.units[0].unitName})`);
        } else if (Array.isArray(unitsResponse.data) && unitsResponse.data.length > 0) {
          validUnitId = unitsResponse.data[0].unitId || unitsResponse.data[0].id;
          console.log(`   ℹ️  Found valid unitId: ${validUnitId}`);
        }
      } catch (e) {
        // Units endpoint may not exist
      }
    }
  } catch (e) {
    console.log('   ⚠️  Could not fetch valid item IDs, using defaults');
  }
  
  const testData = {
    transactionDate: new Date().toISOString().split('T')[0],
    exportType: 'USAGE',
    notes: 'Test export transaction from test script',
    items: [
      {
        itemMasterId: validItemMasterId || 1,
        quantity: 5,
        unitId: validUnitId || 1,
      },
    ],
  };

  const result = await testAPI('6.5', '/inventory/export', 'POST', testData);
  results.push(result);
  console.log(`   Status: ${result.status} | Code: ${result.statusCode} | Time: ${result.responseTime}ms`);
  if (result.error) console.log(`   Error: ${result.error}`);
  if (result.statusCode === 400) {
    console.log('   ⚠️  Note: 400 Bad Request - Test data validation failed or stock unavailable (expected).');
  } else if (result.statusCode === 404) {
    console.log('   ⚠️  Note: 404 Not Found - Endpoint or resource not found.');
  } else if (result.statusCode === 500) {
    console.log('   ❌ Note: 500 Internal Server Error - BE issue, not test data issue.');
  }
}

async function testAPI_6_6() {
  console.log('\n📋 Testing API 6.6 - Transaction History (List)');
  const result = await testAPI(
    '6.6',
    '/warehouse/transactions',
    'GET',
    undefined,
    { page: 0, size: 10 }
  );
  results.push(result);
  console.log(`   Status: ${result.status} | Code: ${result.statusCode} | Time: ${result.responseTime}ms`);
  if (result.error) console.log(`   Error: ${result.error}`);
  if (result.data?.content) {
    console.log(`   Found ${result.data.content.length} transactions`);
  }
}

async function testAPI_6_7() {
  console.log('\n🔍 Testing API 6.7 - Transaction Detail');
  // Note: This requires an existing transaction ID
  const result = await testAPI('6.7', '/warehouse/transactions/1', 'GET');
  results.push(result);
  console.log(`   Status: ${result.status} | Code: ${result.statusCode} | Time: ${result.responseTime}ms`);
  if (result.error) console.log(`   Error: ${result.error}`);
  if (result.statusCode === 404) {
    console.log('   ⚠️  Note: Transaction ID 1 not found. This is expected if no transactions exist.');
  }
}

async function testAPI_6_8() {
  console.log('\n📦 Testing API 6.8 - Item Masters (List)');
  const result = await testAPI(
    '6.8',
    '/warehouse/items',
    'GET',
    undefined,
    { page: 0, size: 10 }
  );
  results.push(result);
  console.log(`   Status: ${result.status} | Code: ${result.statusCode} | Time: ${result.responseTime}ms`);
  if (result.error) console.log(`   Error: ${result.error}`);
  
  // Handle both PageResponse and array formats
  if (result.data?.content) {
    console.log(`   Found ${result.data.content.length} items (Total: ${result.data.totalElements || 'N/A'})`);
  } else if (Array.isArray(result.data)) {
    console.log(`   Found ${result.data.length} items`);
  }
}

async function testAPI_6_9() {
  console.log('\n➕ Testing API 6.9 - Create Item Master');
  
  // First, get a valid categoryId from seed data (CONSUMABLE category)
  let validCategoryId: number | null = null;
  try {
    const categoriesResponse = await axios.get(`${API_BASE}/inventory/categories`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    const categories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : categoriesResponse.data?.data || [];
    const consumableCategory = categories.find((cat: any) => 
      cat.categoryCode === 'CONSUMABLE' || 
      cat.category_code === 'CONSUMABLE' ||
      cat.categoryName?.includes('tiêu hao')
    );
    
    if (consumableCategory) {
      validCategoryId = consumableCategory.categoryId || consumableCategory.category_id || consumableCategory.id;
      console.log(`   ℹ️  Using category ID: ${validCategoryId} (CONSUMABLE)`);
    } else if (categories.length > 0) {
      validCategoryId = categories[0].categoryId || categories[0].category_id || categories[0].id;
      console.log(`   ℹ️  Using first category ID: ${validCategoryId}`);
    }
  } catch (e) {
    console.log('   ⚠️  Could not fetch categories, using default: 1');
  }
  
  // Note: This requires valid data including units array
  const testData = {
    itemCode: `TEST-${Date.now()}`,
    itemName: 'Test Item from Script',
    categoryId: validCategoryId || 1,
    warehouseType: 'NORMAL',
    minStockLevel: 10,
    maxStockLevel: 100,
    isPrescriptionRequired: false,
    defaultShelfLifeDays: 365,
    units: [
      {
        unitName: 'Cái',
        conversionRate: 1,
        isBaseUnit: true,
        displayOrder: 1,
        isDefaultImportUnit: false,
        isDefaultExportUnit: true,
      },
    ],
    notes: 'Test item created by API test script',
  };

  const result = await testAPI('6.9', '/warehouse/items', 'POST', testData);
  results.push(result);
  console.log(`   Status: ${result.status} | Code: ${result.statusCode} | Time: ${result.responseTime}ms`);
  if (result.error) console.log(`   Error: ${result.error}`);
  if (result.statusCode === 201) {
    console.log('   ✅ Item master created successfully');
    if (result.data?.itemMasterId) {
      console.log(`   Item ID: ${result.data.itemMasterId}`);
    }
  } else if (result.statusCode === 400) {
    console.log('   ⚠️  Note: 400 Bad Request - Check validation errors (categoryId, units, etc.)');
  } else if (result.statusCode === 404) {
    console.log('   ⚠️  Note: 404 Not Found - Endpoint or resource not found.');
  }
  
  // Return created item ID for use in other tests
  return result.statusCode === 201 ? result.data?.itemMasterId : null;
}

async function testAPI_6_10() {
  console.log('\n✏️  Testing API 6.10 - Update Item Master');
  
  // First, try to find an existing item from seed data (CON-GLOVE-01)
  let itemId: number | null = null;
  try {
    const itemsResponse = await axios.get(`${API_BASE}/warehouse/items`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 0, size: 20, search: 'CON-GLOVE' },
    });
    
    let items: any[] = [];
    if (itemsResponse.data?.content) {
      items = itemsResponse.data.content;
    } else if (Array.isArray(itemsResponse.data)) {
      items = itemsResponse.data;
    }
    
    const gloveItem = items.find((item: any) => item.itemCode === 'CON-GLOVE-01' || item.item_code === 'CON-GLOVE-01');
    if (gloveItem) {
      itemId = gloveItem.itemMasterId || gloveItem.id;
      console.log(`   ℹ️  Found seed item CON-GLOVE-01 with ID: ${itemId}`);
    } else if (items.length > 0) {
      itemId = items[0].itemMasterId || items[0].id;
      console.log(`   ℹ️  Using first available item ID: ${itemId}`);
    }
  } catch (e) {
    console.log('   ⚠️  Could not fetch items, will try to create new item');
  }
  
  // If no existing item found, create one
  if (!itemId) {
    try {
      // Get category ID
      let validCategoryId: number | null = null;
      try {
        const categoriesResponse = await axios.get(`${API_BASE}/inventory/categories`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const categories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : categoriesResponse.data?.data || [];
        if (categories.length > 0) {
          validCategoryId = categories[0].categoryId || categories[0].category_id || categories[0].id;
        }
      } catch (e) {}
      
      const createData = {
        itemCode: `TEST-UPDATE-${Date.now()}`,
        itemName: 'Test Item for Update',
        categoryId: validCategoryId || 1,
        warehouseType: 'NORMAL',
        minStockLevel: 10,
        maxStockLevel: 100,
        units: [
          {
            unitName: 'Cái',
            conversionRate: 1,
            isBaseUnit: true,
            displayOrder: 1,
          },
        ],
      };
      const createResult = await testAPI('6.9', '/warehouse/items', 'POST', createData);
      if (createResult.statusCode === 201 && createResult.data?.itemMasterId) {
        itemId = createResult.data.itemMasterId;
        console.log(`   ℹ️  Created test item ID: ${itemId}`);
      }
    } catch (e) {
      console.log('   ⚠️  Could not create test item');
    }
  }
  
  if (!itemId) {
    console.log('   ⚠️  No valid item ID found, skipping test');
    return;
  }
  
  if (!itemId) {
    console.log('   ⚠️  No valid item ID, skipping test');
    return;
  }
  
  const updateData = {
    itemName: 'Updated Test Item Name',
    warehouseType: 'NORMAL', // Required field
    minStockLevel: 20,
    maxStockLevel: 200,
    notes: 'Updated by test script',
  };

  const result = await testAPI('6.10', `/warehouse/items/${itemId}`, 'PUT', updateData);
  results.push(result);
  console.log(`   Status: ${result.status} | Code: ${result.statusCode} | Time: ${result.responseTime}ms`);
  if (result.error) console.log(`   Error: ${result.error}`);
  if (result.statusCode === 200) {
    console.log('   ✅ Item master updated successfully');
    if (result.data?.safetyLockApplied !== undefined) {
      console.log(`   Safety Lock Applied: ${result.data.safetyLockApplied}`);
    }
  } else if (result.statusCode === 409) {
    console.log('   ⚠️  Note: 409 Conflict - Safety Lock violation (expected if item has stock)');
  } else if (result.statusCode === 404) {
    console.log('   ⚠️  Note: 404 Not Found - Item not found.');
  }
}

async function testAPI_6_11() {
  console.log('\n📏 Testing API 6.11 - Get Item Units');
  
  // Try to find item from seed data that has units (CON-GLOVE-01, CON-MASK-01, MED-SEPT-01, MAT-COMP-01)
  let validItemMasterId: number | null = null;
  const seedItemCodes = ['CON-GLOVE-01', 'CON-MASK-01', 'MED-SEPT-01', 'MAT-COMP-01', 'CON-NEEDLE-01'];
  
  try {
    const itemsResponse = await axios.get(`${API_BASE}/warehouse/items`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 0, size: 50 },
    });
    
    // Handle both PageResponse and array formats
    let items: any[] = [];
    if (itemsResponse.data?.content) {
      items = itemsResponse.data.content;
    } else if (Array.isArray(itemsResponse.data)) {
      items = itemsResponse.data;
    }
    
    // Try to find seed items that have units
    for (const seedCode of seedItemCodes) {
      const seedItem = items.find((item: any) => 
        item.itemCode === seedCode || item.item_code === seedCode
      );
      
      if (seedItem) {
        const testItemId = seedItem.itemMasterId || seedItem.id;
        if (!testItemId) continue;
        
        try {
          const unitsTest = await axios.get(`${API_BASE}/warehouse/items/${testItemId}/units`, {
            headers: { Authorization: `Bearer ${authToken}` },
            params: { status: 'active' },
          });
          
          if (unitsTest.data?.units && unitsTest.data.units.length > 0) {
            validItemMasterId = testItemId;
            console.log(`   ℹ️  Found seed item ${seedCode} with ${unitsTest.data.units.length} units (ID: ${testItemId})`);
            break;
          }
        } catch (e) {
          // Try next seed item
          continue;
        }
      }
    }
    
    // Fallback: try any item
    if (!validItemMasterId && items.length > 0) {
      for (const item of items.slice(0, 5)) {
        const testItemId = item.itemMasterId || item.id;
        if (!testItemId) continue;
        
        try {
          const unitsTest = await axios.get(`${API_BASE}/warehouse/items/${testItemId}/units`, {
            headers: { Authorization: `Bearer ${authToken}` },
            params: { status: 'active' },
          });
          
          if (unitsTest.data?.units && unitsTest.data.units.length > 0) {
            validItemMasterId = testItemId;
            console.log(`   ℹ️  Found item with units: ${testItemId}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }
  } catch (e) {
    console.log('   ⚠️  Could not fetch items, using default: 1');
  }
  
  const itemId = validItemMasterId || 1;
  
  // Test with default status (active)
  const result = await testAPI(
    '6.11',
    `/warehouse/items/${itemId}/units`,
    'GET',
    undefined,
    { status: 'active' }
  );
  results.push(result);
  console.log(`   Status: ${result.status} | Code: ${result.statusCode} | Time: ${result.responseTime}ms`);
  if (result.error) console.log(`   Error: ${result.error}`);
  if (result.statusCode === 200) {
    console.log('   ✅ Item units retrieved successfully');
    if (result.data?.units) {
      console.log(`   Found ${result.data.units.length} units`);
      if (result.data.baseUnit) {
        console.log(`   Base Unit: ${result.data.baseUnit.unitName} (ID: ${result.data.baseUnit.unitId})`);
      }
    }
  } else if (result.statusCode === 404) {
    console.log(`   ⚠️  Note: Item ID ${itemId} not found or has no units configured.`);
  } else if (result.statusCode === 410) {
    console.log(`   ⚠️  Note: Item ID ${itemId} is inactive (410 GONE).`);
  }
}

async function testAPI_6_12() {
  console.log('\n🔄 Testing API 6.12 - Convert Quantity Between Units');
  
  // Try to find item from seed data that has multiple units (CON-GLOVE-01 has 3 units)
  let validItemMasterId: number | null = null;
  let fromUnitId: number | null = null;
  let toUnitId: number | null = null;
  
  try {
    const itemsResponse = await axios.get(`${API_BASE}/warehouse/items`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 0, size: 50, search: 'CON-GLOVE' },
    });
    
    let items: any[] = [];
    if (itemsResponse.data?.content) {
      items = itemsResponse.data.content;
    } else if (Array.isArray(itemsResponse.data)) {
      items = itemsResponse.data;
    }
    
    // Try to find CON-GLOVE-01 (has 3 units: Hop, Cap, Chiec)
    const gloveItem = items.find((item: any) => 
      item.itemCode === 'CON-GLOVE-01' || item.item_code === 'CON-GLOVE-01'
    );
    
    if (gloveItem) {
      validItemMasterId = gloveItem.itemMasterId || gloveItem.id;
      console.log(`   ℹ️  Found seed item CON-GLOVE-01 (ID: ${validItemMasterId})`);
      
      // Get units for this item
      try {
        const unitsResponse = await axios.get(`${API_BASE}/warehouse/items/${validItemMasterId}/units`, {
          headers: { Authorization: `Bearer ${authToken}` },
          params: { status: 'active' },
        });
        
        if (unitsResponse.data?.units && unitsResponse.data.units.length >= 2) {
          // Use Hop (largest) → Chiec (base) for conversion
          const hopUnit = unitsResponse.data.units.find((u: any) => u.unitName === 'Hop' || u.unitName === 'Hộp');
          const chiecUnit = unitsResponse.data.units.find((u: any) => u.unitName === 'Chiec' || u.unitName === 'Chiếc' || u.isBaseUnit);
          
          if (hopUnit && chiecUnit) {
            fromUnitId = hopUnit.unitId;
            toUnitId = chiecUnit.unitId;
            console.log(`   ℹ️  Using units: ${hopUnit.unitName} (${fromUnitId}) → ${chiecUnit.unitName} (${toUnitId})`);
          } else {
            fromUnitId = unitsResponse.data.units[0].unitId;
            toUnitId = unitsResponse.data.units[1].unitId;
            console.log(`   ℹ️  Using units: ${unitsResponse.data.units[0].unitName} (${fromUnitId}) → ${unitsResponse.data.units[1].unitName} (${toUnitId})`);
          }
        } else if (unitsResponse.data?.units && unitsResponse.data.units.length === 1) {
          fromUnitId = unitsResponse.data.units[0].unitId;
          toUnitId = unitsResponse.data.units[0].unitId;
          console.log(`   ⚠️  Only 1 unit found, using same unit for conversion test`);
        }
      } catch (e) {
        console.log('   ⚠️  Could not fetch units for CON-GLOVE-01');
      }
    }
    
    // Fallback: try other seed items
    if (!fromUnitId || !toUnitId) {
      const fallbackCodes = ['CON-MASK-01', 'MED-SEPT-01', 'MAT-COMP-01'];
      for (const code of fallbackCodes) {
        const item = items.find((it: any) => it.itemCode === code || it.item_code === code);
        if (!item) continue;
        
        const testItemId = item.itemMasterId || item.id;
        try {
          const unitsResponse = await axios.get(`${API_BASE}/warehouse/items/${testItemId}/units`, {
            headers: { Authorization: `Bearer ${authToken}` },
            params: { status: 'active' },
          });
          
          if (unitsResponse.data?.units && unitsResponse.data.units.length >= 2) {
            validItemMasterId = testItemId;
            fromUnitId = unitsResponse.data.units[0].unitId;
            toUnitId = unitsResponse.data.units[1].unitId;
            console.log(`   ℹ️  Using ${code} with units: ${unitsResponse.data.units[0].unitName} → ${unitsResponse.data.units[1].unitName}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }
  } catch (e) {
    console.log('   ⚠️  Could not fetch items, will use defaults');
  }
  
  if (!fromUnitId || !toUnitId) {
    console.log('   ⚠️  No valid units found, skipping conversion tests');
    const skipResult: TestResult = {
      api: '6.12-GET',
      endpoint: '/warehouse/items/units/convert',
      method: 'GET',
      status: 'SKIP',
    };
    results.push(skipResult);
    return;
  }
  
  // Test GET endpoint (simple conversion)
  const getResult = await testAPI(
    '6.12-GET',
    '/warehouse/items/units/convert',
    'GET',
    undefined,
    { fromUnitId, toUnitId, quantity: 10 }
  );
  results.push(getResult);
  console.log(`   GET Status: ${getResult.status} | Code: ${getResult.statusCode} | Time: ${getResult.responseTime}ms`);
  if (getResult.error) console.log(`   Error: ${getResult.error}`);
  if (getResult.statusCode === 200) {
    console.log(`   ✅ Converted quantity: 10 → ${getResult.data}`);
  }
  
  // Test POST endpoint (batch conversion) - only if we have valid unit IDs
  if (fromUnitId && toUnitId && validItemMasterId) {
    const postData = {
      conversions: [
        {
          itemMasterId: validItemMasterId,
          fromUnitId,
          toUnitId,
          quantity: 10,
        },
      ],
      roundingMode: 'HALF_UP',
    };
    
    const postResult = await testAPI('6.12-POST', '/warehouse/items/units/convert', 'POST', postData);
    results.push(postResult);
    console.log(`   POST Status: ${postResult.status} | Code: ${postResult.statusCode} | Time: ${postResult.responseTime}ms`);
    if (postResult.error) console.log(`   Error: ${postResult.error}`);
    if (postResult.statusCode === 200) {
      console.log('   ✅ Batch conversion successful');
      if (postResult.data?.totalProcessed) {
        console.log(`   Processed: ${postResult.data.totalProcessed} conversions`);
      }
    } else if (postResult.statusCode === 400) {
      console.log('   ⚠️  Note: 400 Bad Request - Units may not belong to the item or validation failed.');
    }
  } else {
    console.log('   ⚠️  Skipping POST test - No valid unit IDs found');
    const skipResult: TestResult = {
      api: '6.12-POST',
      endpoint: '/warehouse/items/units/convert',
      method: 'POST',
      status: 'SKIP',
    };
    results.push(skipResult);
  }
}

async function testAPI_6_13() {
  console.log('\n📊 Testing API 6.13 - Get Suppliers with Metrics');
  
  const result = await testAPI(
    '6.13',
    '/warehouse/suppliers/list',
    'GET',
    undefined,
    {
      page: 0,
      size: 10,
      search: undefined,
      isBlacklisted: false,
      isActive: true,
      sortBy: 'totalOrders',
      sortDir: 'DESC',
    }
  );
  results.push(result);
  console.log(`   Status: ${result.status} | Code: ${result.statusCode} | Time: ${result.responseTime}ms`);
  if (result.error) console.log(`   Error: ${result.error}`);
  if (result.statusCode === 200) {
    console.log('   ✅ Suppliers with metrics retrieved successfully');
    if (result.data?.content) {
      console.log(`   Found ${result.data.content.length} suppliers`);
      if (result.data.content.length > 0) {
        const firstSupplier = result.data.content[0];
        console.log(`   First supplier: ${firstSupplier.supplierName || 'N/A'}`);
        if (firstSupplier.totalOrders !== undefined) {
          console.log(`   Total Orders: ${firstSupplier.totalOrders}`);
        }
        if (firstSupplier.lastOrderDate) {
          console.log(`   Last Order Date: ${firstSupplier.lastOrderDate}`);
        }
      }
    }
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Warehouse API Tests (6.1 - 6.13)');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📍 API Base: ${API_BASE}\n`);

  // Authenticate first
  try {
    await authenticate('admin', '123456');
    console.log(`✅ Using token: ${authToken.substring(0, 20)}...\n`);
  } catch (error) {
    console.error('❌ Authentication failed. Tests will run without token (may fail with 401).\n');
  }

  console.log('⚠️  Note: Some tests may fail if test data is invalid.');
  console.log('   This is expected behavior. Focus on status codes and response structure.\n');

  await testAPI_6_1();
  await testAPI_6_2();
  await testAPI_6_3();
  await testAPI_6_4();
  await testAPI_6_5();
  await testAPI_6_6();
  await testAPI_6_7();
  await testAPI_6_8();
  const createdItemId = await testAPI_6_9();
  await testAPI_6_10();
  await testAPI_6_11();
  await testAPI_6_12();
  await testAPI_6_13();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;

  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📈 Total: ${results.length}`);

  console.log('\n📋 Detailed Results:');
  console.log('-'.repeat(60));
  results.forEach((result) => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
    console.log(
      `${icon} API ${result.api} | ${result.method} ${result.endpoint} | Status: ${result.statusCode || 'N/A'} | Time: ${result.responseTime || 'N/A'}ms`
    );
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(60));

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});

