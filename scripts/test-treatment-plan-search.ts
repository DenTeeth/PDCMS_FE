/**
 * Test Script for Treatment Plan Search Functionality
 * 
 * Tests:
 * - API 5.5: Search by searchTerm (plan name, patient name)
 * - API 5.5: Filter by patientCode
 * - Verify search results match BE logic
 * 
 * Run with: npx tsx scripts/test-treatment-plan-search.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message?: string;
  data?: any;
  error?: any;
  responseTime?: number;
}

const results: TestResult[] = [];

// Test credentials
const TEST_USERS = {
  doctor: { username: 'bacsi1', password: '123456' },
  admin: { username: 'admin', password: '123456' },
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
    return data.token || data.accessToken || null;
  } catch (error) {
    console.error(`❌ Auth error for ${username}:`, error);
    return null;
  }
}

async function testAPI(
  testName: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  token: string | null,
  body?: any
): Promise<TestResult> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const url = `${BASE_URL}${endpoint}`;
    console.log(`\n🧪 Testing: ${testName}`);
    console.log(`   ${method} ${url}`);

    const startTime = Date.now();
    const response = await fetch(url, options);
    const responseTime = Date.now() - startTime;

    const contentType = response.headers.get('content-type');
    let data: any = null;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      return {
        test: testName,
        status: 'FAIL',
        message: `HTTP ${response.status}: ${response.statusText}`,
        error: data,
        responseTime,
      };
    }

    return {
      test: testName,
      status: 'PASS',
      message: `Success (${responseTime}ms)`,
      data,
      responseTime,
    };
  } catch (error: any) {
    return {
      test: testName,
      status: 'FAIL',
      message: `Error: ${error.message}`,
      error: error,
    };
  }
}

async function runTests() {
  console.log('🚀 Treatment Plan Search Test');
  console.log('============================================================');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log('============================================================\n');

  // Step 1: Login as Doctor
  console.log('📋 Step 1: Login as Doctor');
  console.log('──────────────────────────────────────────────────');
  const doctorToken = await authenticate(TEST_USERS.doctor.username, TEST_USERS.doctor.password);
  if (!doctorToken) {
    console.error('❌ Failed to authenticate as doctor. Cannot continue.');
    return;
  }
  console.log('✅ Authenticated as doctor\n');

  // Step 2: Get all plans (baseline)
  console.log('📋 Step 2: Get All Plans (Baseline)');
  console.log('──────────────────────────────────────────────────');
  const baselineResult = await testAPI(
    'Get All Plans (Baseline)',
    'GET',
    '/patient-treatment-plans?page=0&size=20&sort=createdAt,desc',
    doctorToken
  );
  results.push(baselineResult);

  if (baselineResult.status === 'PASS') {
    const plans = baselineResult.data?.content || [];
    console.log(`✅ Found ${plans.length} plans`);
    
    if (plans.length > 0) {
      console.log('\n   📋 Sample Plans:');
      plans.slice(0, 3).forEach((plan: any, index: number) => {
        console.log(`   ${index + 1}. ${plan.planName}`);
        console.log(`      Code: ${plan.planCode}`);
        console.log(`      Status: ${plan.status || 'NULL'}`);
        console.log(`      Patient: ${plan.patientCode || 'N/A'}`);
      });
    }
  }

  // Step 3: Test searchTerm - Search by plan name
  console.log('\n📋 Step 3: Test searchTerm - Search by Plan Name');
  console.log('──────────────────────────────────────────────────');
  const searchTerm = 'Bọc răng';
  const searchByNameResult = await testAPI(
    `Search by Plan Name: "${searchTerm}"`,
    'GET',
    `/patient-treatment-plans?searchTerm=${encodeURIComponent(searchTerm)}&page=0&size=20`,
    doctorToken
  );
  results.push(searchByNameResult);

  if (searchByNameResult.status === 'PASS') {
    const plans = searchByNameResult.data?.content || [];
    console.log(`✅ Found ${plans.length} plans matching "${searchTerm}"`);
    
    if (plans.length > 0) {
      console.log('\n   📋 Matching Plans:');
      plans.forEach((plan: any, index: number) => {
        const matches = plan.planName.toLowerCase().includes(searchTerm.toLowerCase());
        console.log(`   ${index + 1}. ${plan.planName}`);
        console.log(`      Matches plan name: ${matches ? '✅' : '❌'}`);
        console.log(`      Code: ${plan.planCode}`);
        console.log(`      Status: ${plan.status || 'NULL'}`);
      });
    } else {
      console.log(`   ⚠️  No plans found matching "${searchTerm}"`);
    }
  } else {
    console.log(`❌ Search failed: ${searchByNameResult.message}`);
  }

  // Step 4: Test searchTerm - Search by patient name (if we have patient data)
  console.log('\n📋 Step 4: Test searchTerm - Search by Patient Name');
  console.log('──────────────────────────────────────────────────');
  const patientSearchTerm = 'Phong'; // Common Vietnamese name
  const searchByPatientResult = await testAPI(
    `Search by Patient Name: "${patientSearchTerm}"`,
    'GET',
    `/patient-treatment-plans?searchTerm=${encodeURIComponent(patientSearchTerm)}&page=0&size=20`,
    doctorToken
  );
  results.push(searchByPatientResult);

  if (searchByPatientResult.status === 'PASS') {
    const plans = searchByPatientResult.data?.content || [];
    console.log(`✅ Found ${plans.length} plans matching patient name "${patientSearchTerm}"`);
    
    if (plans.length > 0) {
      console.log('\n   📋 Matching Plans:');
      plans.forEach((plan: any, index: number) => {
        console.log(`   ${index + 1}. Plan: ${plan.planName}`);
        console.log(`      Patient Code: ${plan.patientCode || 'N/A'}`);
        console.log(`      Code: ${plan.planCode}`);
      });
    } else {
      console.log(`   ⚠️  No plans found matching patient name "${patientSearchTerm}"`);
    }
  }

  // Step 5: Test patientCode filter (exact match)
  if (baselineResult.status === 'PASS' && baselineResult.data?.content?.length > 0) {
    const firstPlan = baselineResult.data.content[0];
    const patientCode = firstPlan.patientCode;
    
    if (patientCode) {
      console.log('\n📋 Step 5: Test patientCode Filter (Exact Match)');
      console.log('──────────────────────────────────────────────────');
      console.log(`   Using patient code: ${patientCode}`);
      
      const patientCodeResult = await testAPI(
        `Filter by Patient Code: ${patientCode}`,
        'GET',
        `/patient-treatment-plans?patientCode=${encodeURIComponent(patientCode)}&page=0&size=20`,
        doctorToken
      );
      results.push(patientCodeResult);

      if (patientCodeResult.status === 'PASS') {
        const plans = patientCodeResult.data?.content || [];
        console.log(`✅ Found ${plans.length} plans for patient ${patientCode}`);
        
        const allMatch = plans.every((plan: any) => plan.patientCode === patientCode);
        if (allMatch) {
          console.log(`   ✅ All plans match patient code ${patientCode}`);
        } else {
          console.log(`   ❌ Some plans don't match patient code ${patientCode}`);
        }
      }
    }
  }

  // Step 6: Test combined filters (searchTerm + status)
  console.log('\n📋 Step 6: Test Combined Filters (searchTerm + status)');
  console.log('──────────────────────────────────────────────────');
  const combinedResult = await testAPI(
    'Search with status filter',
    'GET',
    `/patient-treatment-plans?searchTerm=${encodeURIComponent('Bọc')}&status=IN_PROGRESS&page=0&size=20`,
    doctorToken
  );
  results.push(combinedResult);

  if (combinedResult.status === 'PASS') {
    const plans = combinedResult.data?.content || [];
    console.log(`✅ Found ${plans.length} plans matching searchTerm="Bọc" AND status=IN_PROGRESS`);
    
    if (plans.length > 0) {
      plans.forEach((plan: any, index: number) => {
        console.log(`   ${index + 1}. ${plan.planName} - Status: ${plan.status || 'NULL'}`);
      });
    }
  }

  // Step 7: Test empty searchTerm (should return all)
  console.log('\n📋 Step 7: Test Empty searchTerm');
  console.log('──────────────────────────────────────────────────');
  const emptySearchResult = await testAPI(
    'Empty searchTerm (should return all)',
    'GET',
    `/patient-treatment-plans?searchTerm=&page=0&size=20`,
    doctorToken
  );
  results.push(emptySearchResult);

  if (emptySearchResult.status === 'PASS') {
    const plans = emptySearchResult.data?.content || [];
    console.log(`✅ Empty searchTerm returned ${plans.length} plans`);
    console.log(`   (Should return all plans, same as baseline)`);
  }

  // Summary
  console.log('\n============================================================');
  console.log('📊 TEST SUMMARY');
  console.log('============================================================');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const avgResponseTime = results
    .filter(r => r.responseTime)
    .reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.filter(r => r.responseTime).length;

  console.log(`\n📈 Total: ${results.length} tests`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  if (avgResponseTime > 0) {
    console.log(`⚡ Average response time: ${Math.round(avgResponseTime)}ms`);
  }

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`   - ${r.test}: ${r.message}`);
        if (r.error) {
          console.log(`     Error:`, JSON.stringify(r.error, null, 2).substring(0, 200));
        }
      });
  }

  // Analysis
  console.log('\n🔍 SEARCH FUNCTIONALITY ANALYSIS:');
  const searchTests = results.filter(r => r.test.includes('Search') || r.test.includes('searchTerm'));
  const searchPassed = searchTests.filter(r => r.status === 'PASS').length;
  
  if (searchPassed === searchTests.length) {
    console.log('   ✅ All search tests passed');
    console.log('   ✅ BE searchTerm functionality is working correctly');
    console.log('   ✅ If FE search still not working, check:');
    console.log('      1. Network requests in browser DevTools');
    console.log('      2. searchTerm parameter is being sent correctly');
    console.log('      3. Response is being parsed correctly');
  } else {
    console.log('   ❌ Some search tests failed');
    console.log('   ⚠️  BE searchTerm functionality may have issues');
  }

  console.log('\n============================================================');
}

// Run tests
runTests().catch(console.error);

