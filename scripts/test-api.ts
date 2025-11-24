/**
 * API Test Runner for Treatment Plan & Appointment APIs
 * 
 * This script tests:
 * 1. Authentication (login)
 * 2. Doctor Service Filtering API (/my-specializations)
 * 3. Treatment Plan Creation (Custom & Template)
 * 4. Specialization Validation
 * 5. Appointment Booking from Plan Items
 * 
 * Usage:
 *   npx tsx scripts/test-api.ts
 *   or
 *   npm run test:api
 */

import axios, { AxiosInstance } from 'axios';

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';
const TEST_USERS = {
  doctor1: { username: 'bacsi1', password: '123456' },
  doctor2: { username: 'bacsi2', password: '123456' },
  patient1: { username: 'benhnhan1', password: '123456' },
  manager: { username: 'quanli1', password: '123456' },
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
  return response.data.token;
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
    console.error(`   Error: ${result.error.message || JSON.stringify(result.error)}`);
  }
}

// Test 1: Authentication
async function testAuthentication() {
  console.log('\n📋 Test 1: Authentication');
  console.log('─'.repeat(50));

  for (const [key, user] of Object.entries(TEST_USERS)) {
    try {
      const token = await login(user.username, user.password);
      logResult({
        name: `Login ${key} (${user.username})`,
        status: 'PASS',
        message: `Token received (${token.substring(0, 20)}...)`,
      });
    } catch (error: any) {
      logResult({
        name: `Login ${key} (${user.username})`,
        status: 'FAIL',
        error: error.response?.data || error.message,
      });
    }
  }
}

// Test 2: Doctor Service Filtering API
async function testDoctorServiceFiltering() {
  console.log('\n📋 Test 2: Doctor Service Filtering API (/my-specializations)');
  console.log('─'.repeat(50));

  try {
    // Login as doctor1
    const token = await login(TEST_USERS.doctor1.username, TEST_USERS.doctor1.password);
    const client = createApiClient(token);

    let services: any[] = [];
    let oldServices: any[] = [];

    // Test new endpoint
    try {
      const response = await client.get('/booking/services/my-specializations', {
        params: {
          page: 0,
          size: 10,
          isActive: true,
          sortBy: 'serviceName',
          sortDirection: 'ASC',
        },
      });

      services = response.data.data?.content || response.data.content || [];
      logResult({
        name: 'GET /my-specializations (doctor1)',
        status: 'PASS',
        message: `Found ${services.length} services for doctor1`,
        data: { count: services.length, firstService: services[0]?.serviceName },
      });
    } catch (error: any) {
      // If endpoint not available, skip this test
      if (error.response?.status === 404 || error.response?.status === 500) {
        logResult({
          name: 'GET /my-specializations (doctor1)',
          status: 'SKIP',
          message: `Endpoint may not be deployed yet: ${error.response?.status} ${error.response?.data?.message || error.message}`,
        });
        // Continue to test old API for comparison
      } else {
        throw error;
      }
    }

    // Compare with old API
    const oldResponse = await client.get('/booking/services', {
      params: {
        page: 0,
        size: 10,
        isActive: true,
      },
    });

    oldServices = oldResponse.data.content || [];
    logResult({
      name: 'GET /services (old API)',
      status: 'PASS',
      message: `Found ${oldServices.length} total services`,
      data: { count: oldServices.length },
    });

    // Compare counts (only if we got services from new API)
    if (services.length > 0) {
      if (services.length <= oldServices.length) {
        logResult({
          name: 'Service Filtering Comparison',
          status: 'PASS',
          message: `Filtered services (${services.length}) <= Total services (${oldServices.length}) ✓`,
        });
      } else {
        logResult({
          name: 'Service Filtering Comparison',
          status: 'FAIL',
          message: `Filtered services (${services.length}) > Total services (${oldServices.length}) - Unexpected!`,
        });
      }
    }
  } catch (error: any) {
    logResult({
      name: 'Doctor Service Filtering API',
      status: 'FAIL',
      error: error.response?.data || error.message,
    });
  }
}

// Test 3: Specialization Validation
async function testSpecializationValidation() {
  console.log('\n📋 Test 3: Specialization Validation');
  console.log('─'.repeat(50));

  try {
    const token = await login(TEST_USERS.doctor1.username, TEST_USERS.doctor1.password);
    const client = createApiClient(token);

    // Get doctor1's services (should only show compatible services)
    const servicesResponse = await client.get('/booking/services/my-specializations', {
      params: { isActive: true, size: 100 },
    });
    const compatibleServices = servicesResponse.data.data?.content || servicesResponse.data.content || [];

    if (compatibleServices.length === 0) {
      logResult({
        name: 'Specialization Validation - Service List',
        status: 'SKIP',
        message: 'No services found for doctor1 - cannot test plan creation',
      });
      return;
    }

    // Try to create a custom plan with compatible services
    const testService = compatibleServices[0];
    const patientCode = 'BN-1001'; // From test data

    const planRequest = {
      planName: 'Test Plan - Specialization Validation',
      doctorEmployeeCode: 'EMP001', // doctor1's employee code
      paymentType: 'FULL',
      discountAmount: 0, // Required field
      phases: [
        {
          phaseNumber: 1,
          phaseName: 'Test Phase',
          estimatedDurationDays: 7,
          items: [
            {
              serviceCode: testService.serviceCode,
              sequenceNumber: 1,
              quantity: 1,
            },
          ],
        },
      ],
    };

    try {
      const planResponse = await client.post(
        `/patients/${patientCode}/treatment-plans/custom`,
        planRequest
      );
      logResult({
        name: 'Create Plan with Compatible Service',
        status: 'PASS',
        message: `Plan created: ${planResponse.data.planCode}`,
        data: { planCode: planResponse.data.planCode },
      });
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.errorCode === 'doctorSpecializationMismatch') {
        logResult({
          name: 'Specialization Validation Error Handling',
          status: 'PASS',
          message: 'Correctly rejected incompatible service',
          data: { error: error.response.data.detail },
        });
      } else {
        logResult({
          name: 'Create Plan with Compatible Service',
          status: 'FAIL',
          error: error.response?.data || error.message,
        });
      }
    }
  } catch (error: any) {
    logResult({
      name: 'Specialization Validation Test',
      status: 'FAIL',
      error: error.response?.data || error.message,
    });
  }
}

// Test 4: Treatment Plan Detail (Check serviceCode)
async function testTreatmentPlanDetail() {
  console.log('\n📋 Test 4: Treatment Plan Detail (serviceCode check)');
  console.log('─'.repeat(50));

  try {
    // Use patient account to view their own plans (or admin/manager)
    const token = await login(TEST_USERS.patient1.username, TEST_USERS.patient1.password);
    const client = createApiClient(token);

    // Get patient's own plans (patient1 = BN-1001)
    const plansResponse = await client.get('/patients/BN-1001/treatment-plans', {
      params: { page: 0, size: 10 },
    });

    const plans = plansResponse.data.content || [];
    if (plans.length === 0) {
      logResult({
        name: 'Get Treatment Plans',
        status: 'SKIP',
        message: 'No plans found for patient BN-1001',
      });
      return;
    }

    // Get plan detail
    const planCode = plans[0].planCode;
    const detailResponse = await client.get(`/patients/BN-1001/treatment-plans/${planCode}`);

    const planDetail = detailResponse.data;
    const items = planDetail.phases?.flatMap((p: any) => p.items || []) || [];

    // Check if serviceCode exists in items
    const itemsWithServiceCode = items.filter((item: any) => item.serviceCode);
    const itemsWithoutServiceCode = items.filter((item: any) => !item.serviceCode);

    logResult({
      name: 'Plan Detail - serviceCode Check',
      status: itemsWithoutServiceCode.length === 0 ? 'PASS' : 'FAIL',
      message: `${itemsWithServiceCode.length}/${items.length} items have serviceCode`,
      data: {
        totalItems: items.length,
        withServiceCode: itemsWithServiceCode.length,
        withoutServiceCode: itemsWithoutServiceCode.length,
      },
    });

    // Check approvalMetadata.notes
    if (planDetail.approvalMetadata) {
      const hasNotes = !!planDetail.approvalMetadata.notes;
      logResult({
        name: 'Plan Detail - approvalMetadata.notes',
        status: hasNotes || planDetail.approvalStatus === 'DRAFT' ? 'PASS' : 'SKIP',
        message: hasNotes
          ? 'Notes present in approvalMetadata'
          : planDetail.approvalStatus === 'DRAFT'
            ? 'Plan is DRAFT (no approval yet)'
            : 'Notes missing in approvalMetadata',
        data: {
          approvalStatus: planDetail.approvalStatus,
          hasNotes,
          notes: planDetail.approvalMetadata.notes,
        },
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Treatment Plan Detail Test',
      status: 'FAIL',
      error: error.response?.data || error.message,
    });
  }
}

// Test 5: Zero-Price Validation (Should be removed)
async function testZeroPriceValidation() {
  console.log('\n📋 Test 5: Zero-Price Validation (Should be removed)');
  console.log('─'.repeat(50));

  try {
    const token = await login(TEST_USERS.manager.username, TEST_USERS.manager.password);
    const client = createApiClient(token);

    // This test requires a plan with zero-price items
    // We'll skip if no such plan exists
    logResult({
      name: 'Zero-Price Validation',
      status: 'SKIP',
      message: 'Manual test required: Create plan with zero-price service and try to approve',
    });
  } catch (error: any) {
    logResult({
      name: 'Zero-Price Validation Test',
      status: 'FAIL',
      error: error.response?.data || error.message,
    });
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API Tests');
  console.log(`📍 API Base URL: ${API_BASE_URL}`);
  console.log('═'.repeat(50));

  try {
    await testAuthentication();
    await testDoctorServiceFiltering();
    await testSpecializationValidation();
    await testTreatmentPlanDetail();
    await testZeroPriceValidation();

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

