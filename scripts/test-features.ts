/**
 * Frontend Features Test Script
 * 
 * Tests all major features in Treatment Plan and Appointment modules
 * Run with: npm run test:features
 */

import * as dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface TestResult {
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
  doctor2: { username: 'bacsi2', password: '123456' },
  patient1: { username: 'benhnhan1', password: '123456' },
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

async function testFeature(name: string, testFn: () => Promise<void>): Promise<void> {
  console.log(`\n🧪 Testing: ${name}`);
  try {
    await testFn();
    results.push({ feature: name, status: 'PASS' });
    console.log(`✅ PASS: ${name}`);
  } catch (error: any) {
    results.push({ 
      feature: name, 
      status: 'FAIL', 
      message: error.message,
      error: error 
    });
    console.error(`❌ FAIL: ${name}`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting Frontend Features Test...\n');
  console.log('='.repeat(60));

  // Test 1: Authentication
  await testFeature('Authentication - Admin', async () => {
    const token = await authenticate(TEST_USERS.admin.username, TEST_USERS.admin.password);
    if (!token) throw new Error('Admin authentication failed');
  });

  await testFeature('Authentication - Doctor', async () => {
    const token = await authenticate(TEST_USERS.doctor1.username, TEST_USERS.doctor1.password);
    if (!token) throw new Error('Doctor authentication failed');
  });

  await testFeature('Authentication - Patient', async () => {
    const token = await authenticate(TEST_USERS.patient1.username, TEST_USERS.patient1.password);
    if (!token) throw new Error('Patient authentication failed');
  });

  // Test 2: Treatment Plan APIs
  let adminToken: string | null = null;
  await testFeature('Get Treatment Plans List (Admin)', async () => {
    adminToken = await authenticate(TEST_USERS.admin.username, TEST_USERS.admin.password);
    if (!adminToken) throw new Error('Need admin token');

    const response = await fetch(`${BASE_URL}/treatment-plans?page=0&size=10`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (!data.content) throw new Error('Response missing content array');
    console.log(`   Found ${data.content.length} plans`);
  });

  await testFeature('Get Treatment Plan Detail', async () => {
    if (!adminToken) {
      adminToken = await authenticate(TEST_USERS.admin.username, TEST_USERS.admin.password);
    }
    if (!adminToken) throw new Error('Need admin token');

    // First get list to find a plan code
    const listResponse = await fetch(`${BASE_URL}/treatment-plans?page=0&size=1`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    const listData = await listResponse.json();
    
    if (listData.content && listData.content.length > 0) {
      const planCode = listData.content[0].planCode;
      const detailResponse = await fetch(`${BASE_URL}/treatment-plans/${planCode}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });

      if (!detailResponse.ok) throw new Error(`HTTP ${detailResponse.status}`);
      const detailData = await detailResponse.json();
      if (!detailData.planCode) throw new Error('Detail response missing planCode');
      console.log(`   Plan: ${detailData.planName}, Phases: ${detailData.phases?.length || 0}`);
    } else {
      console.log('   ⚠️  No plans found, skipping detail test');
      results.push({ feature: 'Get Treatment Plan Detail', status: 'SKIP', message: 'No plans available' });
    }
  });

  // Test 3: Appointment APIs
  await testFeature('Get Appointments List', async () => {
    if (!adminToken) {
      adminToken = await authenticate(TEST_USERS.admin.username, TEST_USERS.admin.password);
    }
    if (!adminToken) throw new Error('Need admin token');

    const response = await fetch(`${BASE_URL}/appointments?page=0&size=10`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (!data.content) throw new Error('Response missing content array');
    console.log(`   Found ${data.content.length} appointments`);
  });

  await testFeature('Get Appointment Detail', async () => {
    if (!adminToken) {
      adminToken = await authenticate(TEST_USERS.admin.username, TEST_USERS.admin.password);
    }
    if (!adminToken) throw new Error('Need admin token');

    // First get list to find an appointment code
    const listResponse = await fetch(`${BASE_URL}/appointments?page=0&size=1`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    const listData = await listResponse.json();
    
    if (listData.content && listData.content.length > 0) {
      const appointmentCode = listData.content[0].appointmentCode;
      const detailResponse = await fetch(`${BASE_URL}/appointments/${appointmentCode}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });

      if (!detailResponse.ok) throw new Error(`HTTP ${detailResponse.status}`);
      const detailData = await detailResponse.json();
      if (!detailData.appointmentCode) throw new Error('Detail response missing appointmentCode');
      
      // Check if services are populated
      if (!detailData.services || detailData.services.length === 0) {
        console.log('   ⚠️  Services array is empty (known issue - BE TODO)');
      } else {
        console.log(`   Services: ${detailData.services.length}`);
      }
      
      console.log(`   Appointment: ${detailData.appointmentCode}, Status: ${detailData.status}`);
    } else {
      console.log('   ⚠️  No appointments found, skipping detail test');
      results.push({ feature: 'Get Appointment Detail', status: 'SKIP', message: 'No appointments available' });
    }
  });

  // Test 4: Services API
  await testFeature('Get Services List', async () => {
    if (!adminToken) {
      adminToken = await authenticate(TEST_USERS.admin.username, TEST_USERS.admin.password);
    }
    if (!adminToken) throw new Error('Need admin token');

    const response = await fetch(`${BASE_URL}/services?page=0&size=10`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (!data.content) throw new Error('Response missing content array');
    console.log(`   Found ${data.content.length} services`);
  });

  // Test 5: Doctor Services Filtering
  await testFeature('Get Services for Current Doctor', async () => {
    const doctorToken = await authenticate(TEST_USERS.doctor1.username, TEST_USERS.doctor1.password);
    if (!doctorToken) throw new Error('Need doctor token');

    const response = await fetch(`${BASE_URL}/services/my-specializations?page=0&size=10`, {
      headers: { 'Authorization': `Bearer ${doctorToken}` },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    
    // Handle wrapped response format
    const services = data.data?.content || data.content || [];
    console.log(`   Found ${services.length} services for doctor's specializations`);
  });

  // Test 6: Employees API
  await testFeature('Get Employees List', async () => {
    if (!adminToken) {
      adminToken = await authenticate(TEST_USERS.admin.username, TEST_USERS.admin.password);
    }
    if (!adminToken) throw new Error('Need admin token');

    const response = await fetch(`${BASE_URL}/employees?page=0&size=10`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (!data.content) throw new Error('Response missing content array');
    console.log(`   Found ${data.content.length} employees`);
  });

  // Print Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary\n');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📈 Total: ${results.length}\n`);

  if (failed > 0) {
    console.log('❌ Failed Tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   - ${r.feature}: ${r.message || 'Unknown error'}`);
    });
  }

  if (skipped > 0) {
    console.log('⏭️  Skipped Tests:');
    results.filter(r => r.status === 'SKIP').forEach(r => {
      console.log(`   - ${r.feature}: ${r.message || 'No reason'}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  
  // Exit with error code if any tests failed
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});


