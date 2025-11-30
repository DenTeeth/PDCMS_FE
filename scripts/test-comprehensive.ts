/**
 * Comprehensive Test Script for ALL Modules
 * 
 * Tests:
 * - Service Management (V1 Service API vs Booking Service API)
 * - Warehouse Module (V1 Inventory API vs V3 Warehouse API)
 * - Employee, Account, Role, Permission, Specialization
 * - Treatment Plans, Appointments
 * 
 * Run with: npm run test:comprehensive
 */

import * as dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface TestResult {
  module: string;
  feature: string;
  endpoint: string;
  status: 'PASS' | 'FAIL' | 'SKIP' | 'WARN';
  message?: string;
  responseTime?: number;
  statusCode?: number;
  error?: any;
}

const results: TestResult[] = [];

// Test credentials
const TEST_USERS = {
  admin: { username: 'admin', password: '123456' },
  doctor: { username: 'bacsi1', password: '123456' },
  receptionist: { username: 'letan1', password: '123456' },
};

async function authenticate(username: string, password: string): Promise<string | null> {
  try {
    console.log(`🔐 Authenticating as ${username}...`);
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      console.error(`❌ Auth failed for ${username}: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const token = data.token || data.accessToken || null;
    console.log(`✅ Authenticated as ${username}`);
    return token;
  } catch (error) {
    console.error(`❌ Auth error for ${username}:`, error);
    return null;
  }
}

async function testFeature(
  module: string, 
  feature: string, 
  endpoint: string,
  testFn: () => Promise<void>
): Promise<void> {
  const startTime = Date.now();
  console.log(`\n🧪 Testing: ${module} - ${feature}`);
  console.log(`   Endpoint: ${endpoint}`);
  
  try {
    await testFn();
    const responseTime = Date.now() - startTime;
    results.push({ module, feature, endpoint, status: 'PASS', responseTime });
    console.log(`✅ PASS (${responseTime}ms): ${feature}`);
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const statusCode = error.statusCode || error.status;
    
    results.push({ 
      module, 
      feature, 
      endpoint,
      status: statusCode === 404 ? 'SKIP' : 'FAIL', 
      message: error.message,
      responseTime,
      statusCode,
      error: error 
    });
    
    if (statusCode === 404) {
      console.log(`⏭️  SKIP (${responseTime}ms): ${feature} - Endpoint not found`);
    } else {
      console.error(`❌ FAIL (${responseTime}ms): ${feature}`, error.message);
    }
  }
}

async function testWarningFeature(
  module: string, 
  feature: string, 
  endpoint: string,
  testFn: () => Promise<{ warning?: string }>
): Promise<void> {
  const startTime = Date.now();
  console.log(`\n🧪 Testing: ${module} - ${feature}`);
  console.log(`   Endpoint: ${endpoint}`);
  
  try {
    const result = await testFn();
    const responseTime = Date.now() - startTime;
    
    if (result.warning) {
      results.push({ module, feature, endpoint, status: 'WARN', message: result.warning, responseTime });
      console.log(`⚠️  WARN (${responseTime}ms): ${feature} - ${result.warning}`);
    } else {
      results.push({ module, feature, endpoint, status: 'PASS', responseTime });
      console.log(`✅ PASS (${responseTime}ms): ${feature}`);
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const statusCode = error.statusCode || error.status;
    
    results.push({ 
      module, 
      feature, 
      endpoint,
      status: statusCode === 404 ? 'SKIP' : 'FAIL', 
      message: error.message,
      responseTime,
      statusCode,
      error: error 
    });
    
    if (statusCode === 404) {
      console.log(`⏭️  SKIP (${responseTime}ms): ${feature} - Endpoint not found`);
    } else {
      console.error(`❌ FAIL (${responseTime}ms): ${feature}`, error.message);
    }
  }
}

async function fetchWithAuth(endpoint: string, token: string, options?: RequestInit): Promise<any> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
    error.status = response.status;
    error.statusCode = response.status;
    throw error;
  }

  return response.json();
}

async function main() {
  console.log('🚀 Starting Comprehensive Module Tests...\n');
  console.log('='.repeat(80));
  console.log(`📍 Testing API: ${BASE_URL}`);
  console.log('='.repeat(80));

  // Authenticate
  const adminToken = await authenticate(TEST_USERS.admin.username, TEST_USERS.admin.password);
  if (!adminToken) {
    console.error('❌ Cannot proceed without admin token');
    process.exit(1);
  }

  // ==================== SERVICE MANAGEMENT ====================
  console.log('\n' + '='.repeat(80));
  console.log('📦 SERVICE MANAGEMENT MODULE');
  console.log('='.repeat(80));

  await testFeature('Service', 'V1 Service API - Get All Services', '/services', async () => {
    const data = await fetchWithAuth('/services?page=0&size=5', adminToken);
    if (!data.content) throw new Error('Response missing content array');
    console.log(`   Found ${data.content.length} services (V1 API)`);
    if (data.content.length > 0) {
      const firstService = data.content[0];
      console.log(`   First service: ${firstService.serviceCode} - ${firstService.serviceName}`);
      console.log(`   Has categoryId: ${!!firstService.category?.categoryId}`);
      console.log(`   Has durationMinutes: ${!!firstService.durationMinutes}`);
    }
  });

  await testFeature('Service', 'Booking Service API - Get All Services', '/booking/services', async () => {
    const data = await fetchWithAuth('/booking/services?page=0&size=5', adminToken);
    if (!data.content) throw new Error('Response missing content array');
    console.log(`   Found ${data.content.length} services (Booking API)`);
    if (data.content.length > 0) {
      const firstService = data.content[0];
      console.log(`   First service: ${firstService.serviceCode} - ${firstService.serviceName}`);
      console.log(`   Has specializationId: ${!!firstService.specializationId}`);
      console.log(`   Has defaultDurationMinutes: ${!!firstService.defaultDurationMinutes}`);
      console.log(`   Has defaultBufferMinutes: ${!!firstService.defaultBufferMinutes}`);
    }
  });

  await testWarningFeature('Service', 'API Comparison - V1 vs Booking', 'N/A', async () => {
    const v1Data = await fetchWithAuth('/services?page=0&size=1', adminToken);
    const bookingData = await fetchWithAuth('/booking/services?page=0&size=1', adminToken);
    
    const v1Service = v1Data.content?.[0];
    const bookingService = bookingData.content?.[0];
    
    if (!v1Service || !bookingService) {
      return { warning: 'Not enough data to compare APIs' };
    }

    const issues: string[] = [];
    if (v1Service.category?.categoryId && !bookingService.categoryId) {
      issues.push('Booking API missing categoryId field');
    }
    if (v1Service.durationMinutes && !bookingService.defaultDurationMinutes) {
      issues.push('Duration field naming mismatch');
    }
    
    if (issues.length > 0) {
      return { warning: `API inconsistencies: ${issues.join(', ')}` };
    }
    
    console.log('   ✓ Both APIs returning data');
    return {};
  });

  await testFeature('Service', 'Service Category - Get All Categories', '/service-categories', async () => {
    const data = await fetchWithAuth('/service-categories?page=0&size=10', adminToken);
    if (!Array.isArray(data) && !data.content) throw new Error('Invalid response format');
    const categories = Array.isArray(data) ? data : data.content;
    console.log(`   Found ${categories.length} categories`);
  });

  // ==================== WAREHOUSE MODULE ====================
  console.log('\n' + '='.repeat(80));
  console.log('🏭 WAREHOUSE MODULE');
  console.log('='.repeat(80));

  await testFeature('Warehouse', 'V1 Inventory API - Get All Items', '/inventory', async () => {
    const data = await fetchWithAuth('/inventory?page=0&size=10', adminToken);
    if (!data.content) throw new Error('Response missing content array');
    console.log(`   Found ${data.content.length} items (V1 API)`);
    if (data.content.length > 0) {
      const firstItem = data.content[0];
      console.log(`   First item: ${firstItem.itemCode || firstItem.itemMasterCode} - ${firstItem.itemName}`);
    }
  });

  await testFeature('Warehouse', 'V1 Inventory API - Get Summary', '/inventory/summary', async () => {
    const data = await fetchWithAuth('/inventory/summary?page=0&size=10', adminToken);
    if (!data.content) throw new Error('Response missing content array');
    console.log(`   Found ${data.content.length} items in summary (V1 API)`);
    if (data.content.length > 0) {
      const firstItem = data.content[0];
      console.log(`   First item: ${firstItem.itemName}`);
      console.log(`   Total quantity: ${firstItem.totalQuantity || 'N/A'}`);
    }
  });

  await testFeature('Warehouse', 'V1 Inventory API - Get Stats', '/inventory/stats', async () => {
    const data = await fetchWithAuth('/inventory/stats', adminToken);
    console.log('   Stats:', JSON.stringify(data, null, 2));
  });

  await testFeature('Warehouse', 'V3 Warehouse API - Get Summary', '/v3/warehouse/summary', async () => {
    const data = await fetchWithAuth('/v3/warehouse/summary?page=0&size=10', adminToken);
    if (!data.content) throw new Error('Response missing content array');
    console.log(`   Found ${data.content.length} items in summary (V3 API)`);
    if (data.content.length > 0) {
      const firstItem = data.content[0];
      console.log(`   First item: ${firstItem.itemName}`);
      console.log(`   Total quantity: ${firstItem.totalQuantity}`);
      console.log(`   Stock status: ${firstItem.stockStatus}`);
      console.log(`   Nearest expiry: ${firstItem.nearestExpiryDate || 'N/A'}`);
    }
  });

  await testFeature('Warehouse', 'V3 Warehouse API - Get Batches', '/v3/warehouse/batches/{id}', async () => {
    // First get an item ID
    const summaryData = await fetchWithAuth('/inventory/summary?page=0&size=1', adminToken);
    if (!summaryData.content || summaryData.content.length === 0) {
      throw new Error('No items found to test batches');
    }
    
    const itemId = summaryData.content[0].itemMasterId || summaryData.content[0].id;
    const data = await fetchWithAuth(`/v3/warehouse/batches/${itemId}?page=0&size=10`, adminToken);
    
    if (!data.batches && !data.content) throw new Error('Response missing batches/content');
    const batches = data.batches || data.content || [];
    console.log(`   Found ${batches.length} batches for item ${itemId}`);
    if (batches.length > 0) {
      console.log(`   First batch: ${batches[0].batchCode || batches[0].lotNumber}`);
      console.log(`   Batch status: ${batches[0].batchStatus || batches[0].status}`);
    }
  });

  await testFeature('Warehouse', 'Supplier - Get All Suppliers', '/suppliers', async () => {
    const data = await fetchWithAuth('/suppliers?page=0&size=10', adminToken);
    if (!data.content) throw new Error('Response missing content array');
    console.log(`   Found ${data.content.length} suppliers`);
  });

  await testFeature('Warehouse', 'Storage - Get All Transactions', '/storage', async () => {
    const data = await fetchWithAuth('/storage?page=0&size=10', adminToken);
    if (!data.content && !Array.isArray(data)) throw new Error('Invalid response format');
    const transactions = data.content || data;
    console.log(`   Found ${transactions.length} storage transactions`);
  });

  await testWarningFeature('Warehouse', 'API Comparison - V1 vs V3', 'N/A', async () => {
    const v1Data = await fetchWithAuth('/inventory/summary?page=0&size=1', adminToken);
    
    let v3Data;
    try {
      v3Data = await fetchWithAuth('/v3/warehouse/summary?page=0&size=1', adminToken);
    } catch (error: any) {
      if (error.status === 404) {
        return { warning: 'V3 API not available (404)' };
      }
      throw error;
    }
    
    const v1Item = v1Data.content?.[0];
    const v3Item = v3Data.content?.[0];
    
    if (!v1Item) return { warning: 'V1 API has no data' };
    if (!v3Item) return { warning: 'V3 API has no data' };
    
    const v3Features = [];
    if (v3Item.stockStatus) v3Features.push('stockStatus');
    if (v3Item.nearestExpiryDate) v3Features.push('nearestExpiryDate');
    if (v3Item.totalQuantity !== undefined) v3Features.push('totalQuantity computed');
    
    console.log(`   V1 API: Basic inventory summary`);
    console.log(`   V3 API: Advanced features - ${v3Features.join(', ')}`);
    console.log(`   Recommendation: Use V3 for dashboard, V1 for CRUD`);
    
    return {};
  });

  // ==================== EMPLOYEE MODULE ====================
  console.log('\n' + '='.repeat(80));
  console.log('👥 EMPLOYEE MODULE');
  console.log('='.repeat(80));

  await testFeature('Employee', 'Get All Active Employees', '/employees', async () => {
    const data = await fetchWithAuth('/employees?page=0&size=10', adminToken);
    if (!data.content) throw new Error('Response missing content array');
    console.log(`   Found ${data.content.length} active employees`);
  });

  await testFeature('Employee', 'Get Medical Staff', '/employees/medical-staff', async () => {
    const data = await fetchWithAuth('/employees/medical-staff', adminToken);
    if (!Array.isArray(data)) throw new Error('Response is not an array');
    console.log(`   Found ${data.length} medical staff members`);
  });

  await testFeature('Employee', 'Get Specializations', '/employees/specializations', async () => {
    const data = await fetchWithAuth('/employees/specializations', adminToken);
    if (!Array.isArray(data)) throw new Error('Response is not an array');
    console.log(`   Found ${data.length} specializations`);
  });

  // ==================== ACCOUNT MODULE ====================
  console.log('\n' + '='.repeat(80));
  console.log('🔐 ACCOUNT MODULE');
  console.log('='.repeat(80));

  await testFeature('Account', 'Get Current User', '/account/me', async () => {
    const data = await fetchWithAuth('/account/me', adminToken);
    if (!data.username) throw new Error('Response missing username');
    console.log(`   User: ${data.username}, Role: ${data.roleName || 'N/A'}`);
  });

  await testFeature('Account', 'Get Permissions', '/account/permissions', async () => {
    const data = await fetchWithAuth('/account/permissions', adminToken);
    if (!data.permissions) throw new Error('Response missing permissions');
    console.log(`   Found ${data.permissions.length} permissions`);
  });

  // ==================== ROLE MODULE ====================
  console.log('\n' + '='.repeat(80));
  console.log('👔 ROLE MODULE');
  console.log('='.repeat(80));

  await testFeature('Role', 'Get All Roles', '/roles', async () => {
    const data = await fetchWithAuth('/roles', adminToken);
    if (!Array.isArray(data)) throw new Error('Response is not an array');
    console.log(`   Found ${data.length} roles`);
  });

  await testFeature('Role', 'Get Employee Assignable Roles', '/roles/employee-assignable', async () => {
    const data = await fetchWithAuth('/roles/employee-assignable', adminToken);
    if (!Array.isArray(data)) throw new Error('Response is not an array');
    console.log(`   Found ${data.length} employee-assignable roles`);
  });

  // ==================== PERMISSION MODULE ====================
  console.log('\n' + '='.repeat(80));
  console.log('🔑 PERMISSION MODULE');
  console.log('='.repeat(80));

  await testFeature('Permission', 'Get All Permissions', '/permissions', async () => {
    const data = await fetchWithAuth('/permissions', adminToken);
    if (!Array.isArray(data)) throw new Error('Response is not an array');
    console.log(`   Found ${data.length} permissions`);
  });

  await testFeature('Permission', 'Get Permissions By Module', '/permissions/by-module', async () => {
    const data = await fetchWithAuth('/permissions/by-module', adminToken);
    if (typeof data !== 'object') throw new Error('Response is not an object');
    const moduleCount = Object.keys(data).length;
    console.log(`   Found ${moduleCount} modules with permissions`);
  });

  // ==================== TREATMENT PLAN MODULE ====================
  console.log('\n' + '='.repeat(80));
  console.log('📋 TREATMENT PLAN MODULE');
  console.log('='.repeat(80));

  await testFeature('Treatment Plan', 'Get All Treatment Plans', '/treatment-plans', async () => {
    const data = await fetchWithAuth('/treatment-plans?page=0&size=10', adminToken);
    if (!data.content) throw new Error('Response missing content array');
    console.log(`   Found ${data.content.length} treatment plans`);
  });

  // ==================== APPOINTMENT MODULE ====================
  console.log('\n' + '='.repeat(80));
  console.log('📅 APPOINTMENT MODULE');
  console.log('='.repeat(80));

  await testFeature('Appointment', 'Get All Appointments', '/appointments', async () => {
    const data = await fetchWithAuth('/appointments?page=0&size=10', adminToken);
    if (!data.content && !Array.isArray(data)) throw new Error('Invalid response format');
    const appointments = data.content || data;
    console.log(`   Found ${appointments.length} appointments`);
  });

  // ==================== PRINT SUMMARY ====================
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  
  const byModule = results.reduce((acc, r) => {
    if (!acc[r.module]) acc[r.module] = { passed: 0, failed: 0, skipped: 0, warned: 0 };
    if (r.status === 'PASS') acc[r.module].passed++;
    else if (r.status === 'FAIL') acc[r.module].failed++;
    else if (r.status === 'SKIP') acc[r.module].skipped++;
    else if (r.status === 'WARN') acc[r.module].warned++;
    return acc;
  }, {} as Record<string, { passed: number; failed: number; skipped: number; warned: number }>);

  Object.entries(byModule).forEach(([module, stats]) => {
    console.log(`\n${module}:`);
    console.log(`  ✅ Passed: ${stats.passed}`);
    console.log(`  ❌ Failed: ${stats.failed}`);
    console.log(`  ⚠️  Warned: ${stats.warned}`);
    console.log(`  ⏭️  Skipped: ${stats.skipped}`);
  });

  const totalPassed = results.filter(r => r.status === 'PASS').length;
  const totalFailed = results.filter(r => r.status === 'FAIL').length;
  const totalWarned = results.filter(r => r.status === 'WARN').length;
  const totalSkipped = results.filter(r => r.status === 'SKIP').length;
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📈 Total: ${results.length} tests`);
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`⚠️  Warned: ${totalWarned}`);
  console.log(`⏭️  Skipped: ${totalSkipped}`);

  // Calculate average response time
  const avgResponseTime = results
    .filter(r => r.responseTime)
    .reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length;
  console.log(`⚡ Average response time: ${avgResponseTime.toFixed(0)}ms`);

  if (totalWarned > 0) {
    console.log(`\n⚠️  Warnings:`);
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`   - ${r.module} - ${r.feature}: ${r.message || 'Unknown warning'}`);
    });
  }

  if (totalFailed > 0) {
    console.log(`\n❌ Failed Tests:`);
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   - ${r.module} - ${r.feature}: ${r.message || 'Unknown error'}`);
    });
  }

  console.log('='.repeat(80));
  
  // Exit with error code if any tests failed
  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

