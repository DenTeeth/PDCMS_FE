/**
 * Test Script for Treatment Plan Demo Data
 * 
 * Tests all demo cases from docs/TREATMENT_PLAN_DEMO_DATA.md
 * 
 * Usage:
 *   npx tsx scripts/test-demo-data.ts
 */

import axios, { AxiosInstance } from 'axios';

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';
const TEST_USERS = {
  doctor1: { username: 'bacsi1', password: '123456' }, // EMP001 - Lê Anh Khoa
  doctor2: { username: 'bacsi2', password: '123456' }, // EMP002 - Trịnh Công Thái
};

// Test results
interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message?: string;
  data?: any;
  error?: any;
}

const results: TestResult[] = [];

// Helper: Create axios instance
function createApiClient(token?: string): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  return client;
}

// Helper: Login and get token
async function login(username: string, password: string): Promise<string> {
  const client = createApiClient();
  const response = await client.post('/auth/login', { username, password });
  return response.data.token || response.data.accessToken;
}

// Helper: Log test result
function logResult(result: TestResult) {
  results.push(result);
  const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${icon} ${result.name}`);
  if (result.message) {
    console.log(`   ${result.message}`);
  }
  if (result.error) {
    console.error(`   Error: ${JSON.stringify(result.error, null, 2)}`);
  }
}

// Demo Case 1: Điều trị tủy răng sau (Custom)
async function testDemoCase1() {
  console.log('\n📋 Demo Case 1: Điều trị tủy răng sau (Custom)');
  console.log('─'.repeat(50));

  try {
    const token = await login(TEST_USERS.doctor2.username, TEST_USERS.doctor2.password);
    const client = createApiClient(token);

    const request = {
      planName: 'Lộ trình Điều trị tủy răng sau - Răng 36',
      doctorEmployeeCode: 'EMP002',
      paymentType: 'FULL',
      discountAmount: 0,
      startDate: '2026-02-01',
      expectedEndDate: '2026-02-04',
      phases: [
        {
          phaseNumber: 1,
          phaseName: 'Điều trị tủy răng sau',
          items: [
            {
              serviceCode: 'ENDO_TREAT_POST',
              sequenceNumber: 1,
              quantity: 1,
              // price không gửi - BE sẽ auto-fill từ service default (2,000,000)
            },
          ],
        },
      ],
    };

    console.log('📤 Request:', JSON.stringify(request, null, 2));

    try {
      const response = await client.post('/patients/BN-1004/treatment-plans/custom', request);
      logResult({
        name: 'Demo Case 1: Create Custom Plan - Điều trị tủy răng sau',
        status: 'PASS',
        message: `Plan created: ${response.data.planCode}`,
        data: {
          planCode: response.data.planCode,
          status: response.data.status,
          approvalStatus: response.data.approvalStatus,
        },
      });
    } catch (error: any) {
      logResult({
        name: 'Demo Case 1: Create Custom Plan - Điều trị tủy răng sau',
        status: 'FAIL',
        error: {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        },
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Demo Case 1: Setup',
      status: 'FAIL',
      error: error.response?.data || error.message,
    });
  }
}

// Demo Case 2: Bọc răng sứ Cercon HT (Custom)
async function testDemoCase2() {
  console.log('\n📋 Demo Case 2: Bọc răng sứ Cercon HT (Custom)');
  console.log('─'.repeat(50));

  try {
    const token = await login(TEST_USERS.doctor1.username, TEST_USERS.doctor1.password);
    const client = createApiClient(token);

    const request = {
      planName: 'Lộ trình Bọc răng sứ Cercon HT - Răng 16',
      doctorEmployeeCode: 'EMP001',
      paymentType: 'FULL',
      discountAmount: 0,
      startDate: '2026-02-05',
      expectedEndDate: '2026-02-09',
      phases: [
        {
          phaseNumber: 1,
          phaseName: 'Giai đoạn 1: Mài răng, Lấy dấu & Gắn sứ',
          items: [
            {
              serviceCode: 'CROWN_ZIR_CERCON',
              sequenceNumber: 1,
              quantity: 1,
            },
            {
              serviceCode: 'PROS_CEMENT',
              sequenceNumber: 2,
              quantity: 1,
            },
          ],
        },
      ],
    };

    console.log('📤 Request:', JSON.stringify(request, null, 2));

    try {
      const response = await client.post('/patients/BN-1003/treatment-plans/custom', request);
      logResult({
        name: 'Demo Case 2: Create Custom Plan - Bọc răng sứ Cercon HT',
        status: 'PASS',
        message: `Plan created: ${response.data.planCode}`,
        data: {
          planCode: response.data.planCode,
          status: response.data.status,
          approvalStatus: response.data.approvalStatus,
        },
      });
    } catch (error: any) {
      logResult({
        name: 'Demo Case 2: Create Custom Plan - Bọc răng sứ Cercon HT',
        status: 'FAIL',
        error: {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        },
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Demo Case 2: Setup',
      status: 'FAIL',
      error: error.response?.data || error.message,
    });
  }
}

// Demo Case 3: Niềng răng mắc cài kim loại (Template)
async function testDemoCase3() {
  console.log('\n📋 Demo Case 3: Niềng răng mắc cài kim loại (Template)');
  console.log('─'.repeat(50));

  try {
    const token = await login(TEST_USERS.doctor1.username, TEST_USERS.doctor1.password);
    const client = createApiClient(token);

    const request = {
      planName: 'Lộ trình Niềng răng Mắc cài Kim loại - BN-1001',
      doctorEmployeeCode: 'EMP001',
      paymentType: 'INSTALLMENT',
      discountAmount: 0,
      startDate: '2026-02-10',
      expectedEndDate: '2028-02-10',
      sourceTemplateCode: 'TPL_ORTHO_METAL', // BE expects sourceTemplateCode, not templateCode
    };

    console.log('📤 Request:', JSON.stringify(request, null, 2));

    try {
      const response = await client.post('/patients/BN-1001/treatment-plans', request);
      logResult({
        name: 'Demo Case 3: Create Plan from Template - Niềng răng mắc cài kim loại',
        status: 'PASS',
        message: `Plan created: ${response.data.planCode}`,
        data: {
          planCode: response.data.planCode,
          status: response.data.status,
          approvalStatus: response.data.approvalStatus,
        },
      });
    } catch (error: any) {
      logResult({
        name: 'Demo Case 3: Create Plan from Template - Niềng răng mắc cài kim loại',
        status: 'FAIL',
        error: {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        },
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Demo Case 3: Setup',
      status: 'FAIL',
      error: error.response?.data || error.message,
    });
  }
}

// Demo Case 4: Điều trị tủy răng sau (Template)
async function testDemoCase4() {
  console.log('\n📋 Demo Case 4: Điều trị tủy răng sau (Template)');
  console.log('─'.repeat(50));

  try {
    const token = await login(TEST_USERS.doctor2.username, TEST_USERS.doctor2.password);
    const client = createApiClient(token);

    const request = {
      planName: 'Lộ trình Điều trị tủy răng sau - Răng 36',
      doctorEmployeeCode: 'EMP002',
      paymentType: 'FULL',
      discountAmount: 0,
      startDate: '2026-02-01',
      expectedEndDate: '2026-02-04',
      sourceTemplateCode: 'TPL_ENDO_TREATMENT', // BE expects sourceTemplateCode, not templateCode
    };

    console.log('📤 Request:', JSON.stringify(request, null, 2));

    try {
      const response = await client.post('/patients/BN-1004/treatment-plans', request);
      logResult({
        name: 'Demo Case 4: Create Plan from Template - Điều trị tủy răng sau',
        status: 'PASS',
        message: `Plan created: ${response.data.planCode}`,
        data: {
          planCode: response.data.planCode,
          status: response.data.status,
          approvalStatus: response.data.approvalStatus,
        },
      });
    } catch (error: any) {
      logResult({
        name: 'Demo Case 4: Create Plan from Template - Điều trị tủy răng sau',
        status: 'FAIL',
        error: {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        },
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Demo Case 4: Setup',
      status: 'FAIL',
      error: error.response?.data || error.message,
    });
  }
}

// Demo Case 5: Bọc sứ sau điều trị tủy (Template)
async function testDemoCase5() {
  console.log('\n📋 Demo Case 5: Bọc sứ sau điều trị tủy (Template)');
  console.log('─'.repeat(50));

  try {
    const token = await login(TEST_USERS.doctor1.username, TEST_USERS.doctor1.password);
    const client = createApiClient(token);

    const request = {
      planName: 'Lộ trình Bọc sứ sau điều trị tủy - Răng 16',
      doctorEmployeeCode: 'EMP001',
      paymentType: 'FULL',
      discountAmount: 0,
      startDate: '2026-02-05',
      expectedEndDate: '2026-02-09',
      sourceTemplateCode: 'TPL_CROWN_AFTER_ENDO', // BE expects sourceTemplateCode, not templateCode
    };

    console.log('📤 Request:', JSON.stringify(request, null, 2));

    try {
      const response = await client.post('/patients/BN-1005/treatment-plans', request);
      logResult({
        name: 'Demo Case 5: Create Plan from Template - Bọc sứ sau điều trị tủy',
        status: 'PASS',
        message: `Plan created: ${response.data.planCode}`,
        data: {
          planCode: response.data.planCode,
          status: response.data.status,
          approvalStatus: response.data.approvalStatus,
        },
      });
    } catch (error: any) {
      logResult({
        name: 'Demo Case 5: Create Plan from Template - Bọc sứ sau điều trị tủy',
        status: 'FAIL',
        error: {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        },
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Demo Case 5: Setup',
      status: 'FAIL',
      error: error.response?.data || error.message,
    });
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Demo Data Tests');
  console.log(`📍 API Base URL: ${API_BASE_URL}`);
  console.log('═'.repeat(50));

  try {
    await testDemoCase1();
    await testDemoCase2();
    await testDemoCase3();
    await testDemoCase4();
    await testDemoCase5();

    // Summary
    console.log('\n' + '═'.repeat(50));
    console.log('📊 Test Summary');
    console.log('═'.repeat(50));

    const passed = results.filter((r) => r.status === 'PASS').length;
    const failed = results.filter((r) => r.status === 'FAIL').length;
    const skipped = results.filter((r) => r.status === 'SKIP').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📝 Total: ${results.length}`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      results
        .filter((r) => r.status === 'FAIL')
        .forEach((r) => {
          console.log(`   - ${r.name}`);
          if (r.error) {
            console.log(`     Error: ${JSON.stringify(r.error, null, 2)}`);
          }
        });
    }

    process.exit(failed > 0 ? 1 : 0);
  } catch (error: any) {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  }
}

// Run tests
runTests();

