/**
 * Comprehensive Test Script for All Modules
 * 
 * Tests all major modules: Employee, Account, Role, Permission, Specialization
 * Run with: npm run test:all-modules
 */

import * as dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface TestResult {
  module: string;
  feature: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message?: string;
  error?: any;
}

const results: TestResult[] = [];

// Test credentials
const TEST_USERS = {
  admin: { username: 'admin', password: '123456' },
  doctor1: { username: 'bacsi1', password: '123456' },
};

async function authenticate(username: string, password: string): Promise<string | null> {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      console.error(`❌ Auth failed for ${username}:`, response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data.token || data.accessToken || null;
  } catch (error) {
    console.error(`❌ Auth error for ${username}:`, error);
    return null;
  }
}

async function testFeature(module: string, feature: string, testFn: () => Promise<void>): Promise<void> {
  console.log(`\n🧪 Testing: ${module} - ${feature}`);
  try {
    await testFn();
    results.push({ module, feature, status: 'PASS' });
    console.log(`✅ PASS: ${module} - ${feature}`);
  } catch (error: any) {
    results.push({ 
      module, 
      feature, 
      status: 'FAIL', 
      message: error.message,
      error: error 
    });
    console.error(`❌ FAIL: ${module} - ${feature}`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting Comprehensive Module Tests...\n');
  console.log('='.repeat(60));

  const adminToken = await authenticate(TEST_USERS.admin.username, TEST_USERS.admin.password);
  if (!adminToken) {
    console.error('❌ Cannot proceed without admin token');
    process.exit(1);
  }

  const headers = { 'Authorization': `Bearer ${adminToken}` };

  // ==================== EMPLOYEE MODULE ====================
  await testFeature('Employee', 'Get All Active Employees', async () => {
    const response = await fetch(`${BASE_URL}/employees?page=0&size=10`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (!data.content) throw new Error('Response missing content array');
    console.log(`   Found ${data.content.length} active employees`);
  });

  await testFeature('Employee', 'Get All Employees (Including Deleted)', async () => {
    const response = await fetch(`${BASE_URL}/employees/admin/all?page=0&size=10`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (!data.content) throw new Error('Response missing content array');
    console.log(`   Found ${data.content.length} employees (including deleted)`);
  });

  await testFeature('Employee', 'Get Employee By Code', async () => {
    // First get list to find an employee code
    const listResponse = await fetch(`${BASE_URL}/employees?page=0&size=1`, { headers });
    const listData = await listResponse.json();
    
    if (listData.content && listData.content.length > 0) {
      const employeeCode = listData.content[0].employeeCode;
      const detailResponse = await fetch(`${BASE_URL}/employees/${employeeCode}`, { headers });
      if (!detailResponse.ok) throw new Error(`HTTP ${detailResponse.status}`);
      const detailData = await detailResponse.json();
      if (!detailData.employeeCode) throw new Error('Detail response missing employeeCode');
      console.log(`   Employee: ${detailData.employeeCode}, Name: ${detailData.firstName} ${detailData.lastName}`);
    } else {
      console.log('   ⚠️  No employees found, skipping detail test');
      results.push({ module: 'Employee', feature: 'Get Employee By Code', status: 'SKIP', message: 'No employees available' });
    }
  });

  await testFeature('Employee', 'Get Medical Staff', async () => {
    const response = await fetch(`${BASE_URL}/employees/medical-staff`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Response is not an array');
    console.log(`   Found ${data.length} medical staff members`);
  });

  await testFeature('Employee', 'Get Specializations', async () => {
    const response = await fetch(`${BASE_URL}/employees/specializations`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Response is not an array');
    console.log(`   Found ${data.length} specializations`);
  });

  // ==================== ACCOUNT MODULE ====================
  await testFeature('Account', 'Get Me (Current User)', async () => {
    const response = await fetch(`${BASE_URL}/account/me`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (!data.username) throw new Error('Response missing username');
    console.log(`   User: ${data.username}, Role: ${data.roleName || 'N/A'}`);
  });

  await testFeature('Account', 'Get Profile', async () => {
    const response = await fetch(`${BASE_URL}/account/profile`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (!data.username) throw new Error('Response missing username');
    console.log(`   Profile: ${data.username}`);
  });

  await testFeature('Account', 'Get Permissions', async () => {
    const response = await fetch(`${BASE_URL}/account/permissions`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (!data.permissions) throw new Error('Response missing permissions');
    console.log(`   Found ${data.permissions.length} permissions`);
  });

  await testFeature('Account', 'Get Info', async () => {
    const response = await fetch(`${BASE_URL}/account/info`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (!data.username) throw new Error('Response missing username');
    console.log(`   Info: ${data.username}`);
  });

  // ==================== ROLE MODULE ====================
  await testFeature('Role', 'Get All Roles', async () => {
    const response = await fetch(`${BASE_URL}/roles`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Response is not an array');
    console.log(`   Found ${data.length} roles`);
  });

  await testFeature('Role', 'Get Employee Assignable Roles', async () => {
    const response = await fetch(`${BASE_URL}/roles/employee-assignable`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Response is not an array');
    console.log(`   Found ${data.length} employee-assignable roles`);
  });

  await testFeature('Role', 'Get Role By ID', async () => {
    const response = await fetch(`${BASE_URL}/roles/ROLE_ADMIN`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (!data.roleId) throw new Error('Response missing roleId');
    console.log(`   Role: ${data.roleId}, Name: ${data.roleName || 'N/A'}`);
  });

  await testFeature('Role', 'Get Role Permissions', async () => {
    const response = await fetch(`${BASE_URL}/roles/ROLE_ADMIN/permissions`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Response is not an array');
    console.log(`   Found ${data.length} permissions for ROLE_ADMIN`);
  });

  // ==================== PERMISSION MODULE ====================
  await testFeature('Permission', 'Get All Permissions', async () => {
    const response = await fetch(`${BASE_URL}/permissions`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Response is not an array');
    console.log(`   Found ${data.length} permissions`);
  });

  await testFeature('Permission', 'Get Permissions By Module', async () => {
    const response = await fetch(`${BASE_URL}/permissions/by-module`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (typeof data !== 'object') throw new Error('Response is not an object');
    const moduleCount = Object.keys(data).length;
    console.log(`   Found ${moduleCount} modules with permissions`);
  });

  await testFeature('Permission', 'Get Grouped Permissions', async () => {
    const response = await fetch(`${BASE_URL}/permissions/grouped`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (typeof data !== 'object') throw new Error('Response is not an object');
    const moduleCount = Object.keys(data).length;
    console.log(`   Found ${moduleCount} modules with grouped permissions`);
  });

  // ==================== SPECIALIZATION MODULE ====================
  await testFeature('Specialization', 'Get All Specializations', async () => {
    const response = await fetch(`${BASE_URL}/specializations`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Response is not an array');
    console.log(`   Found ${data.length} specializations`);
  });

  // Print Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary\n');
  
  const byModule = results.reduce((acc, r) => {
    if (!acc[r.module]) acc[r.module] = { passed: 0, failed: 0, skipped: 0 };
    if (r.status === 'PASS') acc[r.module].passed++;
    else if (r.status === 'FAIL') acc[r.module].failed++;
    else acc[r.module].skipped++;
    return acc;
  }, {} as Record<string, { passed: number; failed: number; skipped: number }>);

  Object.entries(byModule).forEach(([module, stats]) => {
    console.log(`${module}:`);
    console.log(`  ✅ Passed: ${stats.passed}`);
    console.log(`  ❌ Failed: ${stats.failed}`);
    console.log(`  ⏭️  Skipped: ${stats.skipped}`);
  });

  const totalPassed = results.filter(r => r.status === 'PASS').length;
  const totalFailed = results.filter(r => r.status === 'FAIL').length;
  const totalSkipped = results.filter(r => r.status === 'SKIP').length;
  
  console.log(`\n📈 Total: ${results.length} tests`);
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`⏭️  Skipped: ${totalSkipped}\n`);

  if (totalFailed > 0) {
    console.log('❌ Failed Tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   - ${r.module} - ${r.feature}: ${r.message || 'Unknown error'}`);
    });
  }

  console.log('='.repeat(60));
  
  // Exit with error code if any tests failed
  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});


