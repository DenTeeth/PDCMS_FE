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
    // Get detailed error message
    const errorData = error.response?.data;
    if (errorData) {
      if (errorData.message) {
        result.error = errorData.message;
      } else if (errorData.error) {
        result.error = errorData.error;
      } else if (typeof errorData === 'string') {
        result.error = errorData;
      } else {
        result.error = JSON.stringify(errorData);
      }
      // Store full error data for debugging
      result.data = errorData;
    } else {
      result.error = error.message;
    }
    result.responseTime = responseTime;
  }

  return result;
}

// Test functions
async function testAPI_6_1() {
  console.log('\n📊 Testing API 6.1 - Inventory Summary');
  // FE uses /inventory/summary (simple version) instead of /warehouse/summary
  const result = await testAPI(
    '6.1',
    '/inventory/summary',
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
  
  // Find an item with stock for export
  let itemWithStock: { itemMasterId: number; unitId: number; availableStock: number } | null = null;
  
  if (validItemMasterId) {
    try {
      const batchesResponse = await axios.get(`${API_BASE}/inventory/batches/${validItemMasterId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (Array.isArray(batchesResponse.data) && batchesResponse.data.length > 0) {
        const totalStock = batchesResponse.data.reduce((sum: number, batch: any) => {
          return sum + (batch.quantityOnHand || batch.quantity_on_hand || 0);
        }, 0);
        if (totalStock > 0) {
          itemWithStock = {
            itemMasterId: validItemMasterId,
            unitId: validUnitId || 1,
            availableStock: totalStock,
          };
          console.log(`   ℹ️  Item has stock: ${totalStock} units available`);
        } else {
          console.log(`   ⚠️  Item ${validItemMasterId} has no stock, searching for item with stock...`);
        }
      }
    } catch (e) {
      console.log('   ⚠️  Could not check stock for this item');
    }
  }
  
  // If current item has no stock, search for another item with stock
  if (!itemWithStock) {
    try {
      const itemsResponse = await axios.get(`${API_BASE}/warehouse/items`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { page: 0, size: 20 },
      });
      
      let items: any[] = [];
      if (itemsResponse.data?.content) {
        items = itemsResponse.data.content;
      } else if (Array.isArray(itemsResponse.data)) {
        items = itemsResponse.data;
      }
      
      // Try to find an item with stock
      for (const item of items.slice(0, 10)) {
        const testItemId = item.itemMasterId || item.id;
        if (!testItemId) continue;
        
        try {
          const batchesResponse = await axios.get(`${API_BASE}/inventory/batches/${testItemId}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          
          if (Array.isArray(batchesResponse.data) && batchesResponse.data.length > 0) {
            const totalStock = batchesResponse.data.reduce((sum: number, batch: any) => {
              return sum + (batch.quantityOnHand || batch.quantity_on_hand || 0);
            }, 0);
            
            if (totalStock > 0) {
              // Get unit for this item
              try {
                const unitsResponse = await axios.get(`${API_BASE}/warehouse/items/${testItemId}/units`, {
                  headers: { Authorization: `Bearer ${authToken}` },
                  params: { status: 'active' },
                });
                
                const units = unitsResponse.data?.units || [];
                if (units.length > 0) {
                  itemWithStock = {
                    itemMasterId: testItemId,
                    unitId: units[0].unitId,
                    availableStock: totalStock,
                  };
                  console.log(`   ℹ️  Found item ${testItemId} with stock: ${totalStock} units`);
                  break;
                }
              } catch (e) {
                continue;
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
    } catch (e) {
      console.log('   ⚠️  Could not search for items with stock');
    }
  }
  
  // Use LocalDateTime format (YYYY-MM-DDTHH:mm:ss) instead of just date
  const today = new Date();
  const transactionDateTime = `${today.toISOString().split('T')[0]}T00:00:00`;
  
  if (!itemWithStock) {
    console.log('   ⚠️  No items with stock found, will test with default item (may fail with INSUFFICIENT_STOCK)');
  }
  
  const testData = {
    transactionDate: transactionDateTime, // LocalDateTime format
    exportType: 'USAGE',
    notes: 'Test export transaction from test script',
    items: [
      {
        itemMasterId: itemWithStock?.itemMasterId || validItemMasterId || 1,
        quantity: itemWithStock ? Math.min(1, itemWithStock.availableStock) : 1, // Use 1 unit if stock exists
        unitId: itemWithStock?.unitId || validUnitId || 1,
      },
    ],
  };

  const result = await testAPI('6.5', '/inventory/export', 'POST', testData);
  results.push(result);
  console.log(`   Status: ${result.status} | Code: ${result.statusCode} | Time: ${result.responseTime}ms`);
  if (result.error) {
    console.log(`   Error: ${result.error}`);
    // Log full error response for debugging
    if (result.data && typeof result.data === 'object') {
      console.log(`   Error Details:`, JSON.stringify(result.data, null, 2));
    }
  }
  if (result.statusCode === 400) {
    console.log('   ⚠️  Note: 400 Bad Request - Check error details above for validation issues.');
  } else if (result.statusCode === 404) {
    console.log('   ⚠️  Note: 404 Not Found - Endpoint or resource not found.');
  } else if (result.statusCode === 500) {
    console.log('   ❌ Note: 500 Internal Server Error - BE issue, not test data issue.');
  } else if (result.statusCode === 201) {
    console.log('   ✅ Export transaction created successfully');
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
  
  // Get category ID for update
  let validCategoryId: number | null = null;
  try {
    const categoriesResponse = await axios.get(`${API_BASE}/inventory/categories`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const categories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : categoriesResponse.data?.data || [];
    if (categories.length > 0) {
      validCategoryId = categories[0].categoryId || categories[0].category_id || categories[0].id;
    }
  } catch (e) {
    console.log('   ⚠️  Could not fetch categories for update');
  }
  
  const updateData = {
    itemName: 'Updated Test Item Name',
    categoryId: validCategoryId || 1, // Required field
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
  
  // According to API_6.12_CONVERT_UNITS_COMPLETE.md test guide:
  // Item 1: Kim tiem nha khoa 27G x 1 inch
  // - Unit 1: Chiec (base, rate: 1) - toUnitId: 1
  // - Unit 2: Cap (rate: 2)
  // - Unit 3: Hop (rate: 200) - fromUnitId: 3
  // Test guide uses: itemMasterId: 1, fromUnitId: 3, toUnitId: 1, quantity: 2.5
  
  let validItemMasterId: number | null = null;
  let fromUnitId: number | null = null;
  let toUnitId: number | null = null;
  
  try {
    // First, try to find Item 1 (Kim tiem) as per test guide
    const itemsResponse = await axios.get(`${API_BASE}/warehouse/items`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 0, size: 50 },
    });
    
    let items: any[] = [];
    if (itemsResponse.data?.content) {
      items = itemsResponse.data.content;
    } else if (Array.isArray(itemsResponse.data)) {
      items = itemsResponse.data;
    }
    
    // Try to find Item 1 (Kim tiem nha khoa) - check by ID or name
    let testItem = items.find((item: any) => {
      const id = item.itemMasterId || item.id;
      const name = (item.itemName || item.item_name || '').toLowerCase();
      const code = (item.itemCode || item.item_code || '').toLowerCase();
      return id === 1 || name.includes('kim tiem') || name.includes('kim tiêm') || code.includes('kim');
    });
    
    // If not found, try CON-GLOVE-01 as fallback
    if (!testItem) {
      testItem = items.find((item: any) => 
        item.itemCode === 'CON-GLOVE-01' || item.item_code === 'CON-GLOVE-01'
      );
    }
    
    // If still not found, use first item with multiple units
    if (!testItem && items.length > 0) {
      testItem = items[0];
    }
    
    if (testItem) {
      validItemMasterId = testItem.itemMasterId || testItem.id;
      const itemName = testItem.itemName || testItem.item_name || 'Unknown';
      console.log(`   ℹ️  Found test item: ${itemName} (ID: ${validItemMasterId})`);
      
      // Get units for this item
      try {
        const unitsResponse = await axios.get(`${API_BASE}/warehouse/items/${validItemMasterId}/units`, {
          headers: { Authorization: `Bearer ${authToken}` },
          params: { status: 'active' },
        });
        
        if (unitsResponse.data?.units && unitsResponse.data.units.length >= 2) {
          // Log all units for debugging
          console.log(`   ℹ️  Available units:`, unitsResponse.data.units.map((u: any) => 
            `${u.unitName} (ID: ${u.unitId}, base: ${u.isBaseUnit}, rate: ${u.conversionRate})`
          ).join(', '));
          
          // According to test guide, find "Hop" (largest) and "Chiec" (base)
          const hopUnit = unitsResponse.data.units.find((u: any) => 
            (u.unitName || '').toLowerCase().includes('hop') || 
            (u.unitName || '').toLowerCase().includes('hộp')
          );
          const chiecUnit = unitsResponse.data.units.find((u: any) => 
            u.isBaseUnit || 
            (u.unitName || '').toLowerCase().includes('chiec') || 
            (u.unitName || '').toLowerCase().includes('chiếc')
          );
          
          if (hopUnit && chiecUnit && hopUnit.unitId !== chiecUnit.unitId) {
            fromUnitId = hopUnit.unitId;
            toUnitId = chiecUnit.unitId;
            console.log(`   ℹ️  Using units from test guide: ${hopUnit.unitName} (${fromUnitId}) → ${chiecUnit.unitName} (${toUnitId}, base)`);
          } else {
            // Fallback: use largest unit → base unit
            const sortedUnits = [...unitsResponse.data.units].sort((a: any, b: any) => {
              const orderA = a.displayOrder || 999;
              const orderB = b.displayOrder || 999;
              return orderA - orderB;
            });
            
            const largestUnit = sortedUnits[0];
            const baseUnit = sortedUnits.find((u: any) => u.isBaseUnit) || sortedUnits[sortedUnits.length - 1];
            
            if (largestUnit && baseUnit && largestUnit.unitId !== baseUnit.unitId) {
              fromUnitId = largestUnit.unitId;
              toUnitId = baseUnit.unitId;
              console.log(`   ℹ️  Using units: ${largestUnit.unitName} (${fromUnitId}) → ${baseUnit.unitName} (${toUnitId}, base)`);
            } else {
              // Last fallback: use first two units
              fromUnitId = sortedUnits[0].unitId;
              toUnitId = sortedUnits[1].unitId;
              console.log(`   ℹ️  Using first two units: ${sortedUnits[0].unitName} (${fromUnitId}) → ${sortedUnits[1].unitName} (${toUnitId})`);
            }
          }
        } else if (unitsResponse.data?.units && unitsResponse.data.units.length === 1) {
          fromUnitId = unitsResponse.data.units[0].unitId;
          toUnitId = unitsResponse.data.units[0].unitId;
          console.log(`   ⚠️  Only 1 unit found, using same unit for conversion test`);
        }
      } catch (e) {
        console.log(`   ⚠️  Could not fetch units for item ${validItemMasterId}`);
      }
    }
    
    // Final fallback: try other seed items
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
  // According to BE, POST endpoint is at /warehouse/items/units/convert (ItemMasterController)
  // But we need to verify the request structure matches BE expectations
  if (fromUnitId && toUnitId && validItemMasterId) {
    // Verify units belong to the same item
    try {
      const unitsCheck = await axios.get(`${API_BASE}/warehouse/items/${validItemMasterId}/units`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { status: 'active' },
      });
      
      const itemUnits = unitsCheck.data?.units || [];
      const fromUnit = itemUnits.find((u: any) => u.unitId === fromUnitId);
      const toUnit = itemUnits.find((u: any) => u.unitId === toUnitId);
      
      if (!fromUnit || !toUnit) {
        console.log('   ⚠️  Units do not belong to the same item, skipping POST test');
        const skipResult: TestResult = {
          api: '6.12-POST',
          endpoint: '/warehouse/items/units/convert',
          method: 'POST',
          status: 'SKIP',
        };
        results.push(skipResult);
        return;
      }
      
      console.log(`   ℹ️  Verified units belong to item ${validItemMasterId}: ${fromUnit.unitName} → ${toUnit.unitName}`);
    } catch (e) {
      console.log('   ⚠️  Could not verify units, proceeding anyway');
    }
    
    // According to API_6.12_CONVERT_UNITS_COMPLETE.md test guide:
    // Request structure: { conversions: [{ itemMasterId, fromUnitId, toUnitId, quantity }], roundingMode? }
    // Test guide example: itemMasterId: 1, fromUnitId: 3, toUnitId: 1, quantity: 2.5
    // BE expects: Long for IDs, Double for quantity
    // Validation: @NotNull, @Positive for all fields
    const postData = {
      conversions: [
        {
          itemMasterId: Number(validItemMasterId), // Ensure it's a number
          fromUnitId: Number(fromUnitId), // Ensure it's a number
          toUnitId: Number(toUnitId), // Ensure it's a number
          quantity: 2.5, // Double - Use decimal as shown in test guide (Example 1)
        },
      ],
      roundingMode: 'HALF_UP', // Optional, default is HALF_UP
    };
    
    console.log(`   ℹ️  POST Request (following test guide):`, JSON.stringify(postData, null, 2));
    console.log(`   ℹ️  Request types: itemMasterId=${typeof postData.conversions[0].itemMasterId}, fromUnitId=${typeof postData.conversions[0].fromUnitId}, toUnitId=${typeof postData.conversions[0].toUnitId}, quantity=${typeof postData.conversions[0].quantity}`);
    
    const postResult = await testAPI('6.12-POST', '/warehouse/items/units/convert', 'POST', postData);
    results.push(postResult);
    console.log(`   POST Status: ${postResult.status} | Code: ${postResult.statusCode} | Time: ${postResult.responseTime}ms`);
    if (postResult.error) {
      console.log(`   Error: ${postResult.error}`);
      // Log full error response for debugging
      if (postResult.data) {
        console.log(`   Error Details:`, JSON.stringify(postResult.data, null, 2));
      }
    }
    if (postResult.statusCode === 200) {
      console.log('   ✅ Batch conversion successful');
      if (postResult.data?.totalProcessed) {
        console.log(`   Processed: ${postResult.data.totalProcessed} conversions`);
      }
      if (postResult.data?.results) {
        console.log(`   Results: ${postResult.data.results.length} conversions`);
      }
    } else if (postResult.statusCode === 400) {
      console.log('   ⚠️  Note: 400 Bad Request - Check error details above for validation issues.');
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

// Test additional APIs
async function testAdditionalAPIs() {
  console.log('\n📋 Testing Additional Warehouse APIs...\n');
  
  // Get Inventory Stats
  console.log('📊 Testing Get Inventory Stats');
  const statsResult = await testAPI('Stats', '/inventory/stats', 'GET');
  results.push(statsResult);
  console.log(`   Status: ${statsResult.status} | Code: ${statsResult.statusCode} | Time: ${statsResult.responseTime}ms`);
  
  // Get All Item Masters (Simple)
  console.log('\n📦 Testing Get All Item Masters (Simple)');
  const allItemsResult = await testAPI('GetAllItems', '/inventory', 'GET', undefined, { search: '', warehouseType: 'NORMAL' });
  results.push(allItemsResult);
  console.log(`   Status: ${allItemsResult.status} | Code: ${allItemsResult.statusCode} | Time: ${allItemsResult.responseTime}ms`);
  
  // Get Categories
  console.log('\n📁 Testing Get Categories');
  const categoriesResult = await testAPI('GetCategories', '/inventory/categories', 'GET');
  results.push(categoriesResult);
  console.log(`   Status: ${categoriesResult.status} | Code: ${categoriesResult.statusCode} | Time: ${categoriesResult.responseTime}ms`);
  
  // Get Suppliers (Basic)
  console.log('\n🏢 Testing Get Suppliers (Basic)');
  const suppliersResult = await testAPI('GetSuppliers', '/warehouse/suppliers', 'GET', undefined, { page: 0, size: 10 });
  results.push(suppliersResult);
  console.log(`   Status: ${suppliersResult.status} | Code: ${suppliersResult.statusCode} | Time: ${suppliersResult.responseTime}ms`);
  
  // Get Transaction Stats
  console.log('\n📈 Testing Get Transaction Stats');
  const txStatsResult = await testAPI('TxStats', '/warehouse/transactions/stats', 'GET');
  results.push(txStatsResult);
  console.log(`   Status: ${txStatsResult.status} | Code: ${txStatsResult.statusCode} | Time: ${txStatsResult.responseTime}ms`);
  
  // Test transaction approval workflow (if we have a pending transaction)
  console.log('\n✅ Testing Transaction Approval Workflow');
  try {
    // Get a transaction with PENDING_APPROVAL status
    const txListResponse = await axios.get(`${API_BASE}/warehouse/transactions`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { status: 'PENDING_APPROVAL', page: 0, size: 1 },
    });
    
    let pendingTxId: number | null = null;
    if (txListResponse.data?.content && txListResponse.data.content.length > 0) {
      pendingTxId = txListResponse.data.content[0].transactionId || txListResponse.data.content[0].id;
    }
    
    if (pendingTxId) {
      console.log(`   Found pending transaction ID: ${pendingTxId}`);
      // Test approve
      const approveResult = await testAPI('ApproveTx', `/warehouse/transactions/${pendingTxId}/approve`, 'POST', { notes: 'Test approval' });
      results.push(approveResult);
      console.log(`   Approve Status: ${approveResult.status} | Code: ${approveResult.statusCode}`);
    } else {
      console.log('   ⚠️  No pending transactions found for approval test');
      const skipResult: TestResult = {
        api: 'ApproveTx',
        endpoint: '/warehouse/transactions/{id}/approve',
        method: 'POST',
        status: 'SKIP',
      };
      results.push(skipResult);
    }
  } catch (e) {
    console.log('   ⚠️  Could not test approval workflow');
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
  
  // Additional APIs
  await testAdditionalAPIs();

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

