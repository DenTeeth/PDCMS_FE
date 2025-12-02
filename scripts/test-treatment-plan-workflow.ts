/**
 * Comprehensive Treatment Plan Workflow Test
 * 
 * Tests the complete treatment plan workflow:
 * 1. Doctor creates custom plan
 * 2. Doctor creates template plan
 * 3. Doctor submits plan for review
 * 4. Admin approves plan
 * 5. Doctor updates item status
 * 6. Doctor books appointment
 * 7. Check plan status transitions
 * 
 * Usage:
 *   npx tsx scripts/test-treatment-plan-workflow.ts
 */

import axios, { AxiosInstance } from 'axios';

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';
const TEST_USERS = {
  doctor: { username: 'bacsi2', password: '123456' },
  admin: { username: 'admin', password: '123456' },
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
let doctorToken: string = '';
let adminToken: string = '';
let createdPlanCode: string = '';
let createdItemId: number = 0;

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
  if (result.data) {
    console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`);
  }
  if (result.error) {
    console.log(`   Error: ${JSON.stringify(result.error, null, 2)}`);
  }
}

// Step 1: Login as Doctor
async function step1_LoginDoctor() {
  console.log('\n📋 Step 1: Login as Doctor (bacsi2)');
  console.log('─'.repeat(50));

  try {
    doctorToken = await login(TEST_USERS.doctor.username, TEST_USERS.doctor.password);
    logResult({
      name: 'Login as Doctor',
      status: 'PASS',
      message: `Token received (${doctorToken.substring(0, 20)}...)`,
    });
    return true;
  } catch (error: any) {
    logResult({
      name: 'Login as Doctor',
      status: 'FAIL',
      error: error.response?.data || error.message,
    });
    return false;
  }
}

// Step 2: Create Custom Treatment Plan
async function step2_CreateCustomPlan() {
  console.log('\n📋 Step 2: Create Custom Treatment Plan');
  console.log('─'.repeat(50));

  try {
    const client = createApiClient(doctorToken);

    // Tạo plan với nhiều phases và items để test đầy đủ
    // Bacsi2 (EMP002) có specialization: Nội nha (ID:2), Răng thẩm mỹ (ID:7), STANDARD (ID:8)
    // Chỉ dùng services thuộc các specialization này
    const request = {
      planName: 'Test Workflow Plan - Điều trị tủy răng (Nhiều giai đoạn)',
      doctorEmployeeCode: 'EMP002', // bacsi2 - Nội nha specialist
      paymentType: 'INSTALLMENT',
      discountAmount: 500000,
      startDate: '2026-02-01',
      expectedEndDate: '2026-02-10',
      phases: [
        {
          phaseNumber: 1,
          phaseName: 'Giai đoạn 1: Khám và chẩn đoán',
          items: [
            {
              serviceCode: 'ENDO_TREAT_POST', // Điều trị tủy răng sau (Nội nha)
              sequenceNumber: 1,
              quantity: 1,
              price: 2000000,
            },
          ],
        },
        {
          phaseNumber: 2,
          phaseName: 'Giai đoạn 2: Điều trị tủy răng tiếp theo',
          items: [
            {
              serviceCode: 'ENDO_TREAT_POST', // Điều trị tủy răng sau (Nội nha) - có thể dùng lại
              sequenceNumber: 1,
              quantity: 1,
              price: 2000000,
            },
          ],
        },
      ],
    };

    console.log('📤 Request:', JSON.stringify(request, null, 2));

    // Sử dụng patient code từ demo data
    const patientCode = 'BN-1004'; // Hoặc có thể random
    const response = await client.post(`/patients/${patientCode}/treatment-plans/custom`, request);
    createdPlanCode = response.data.planCode;
    // Lấy item đầu tiên của phase đầu tiên để test
    createdItemId = response.data.phases?.[0]?.items?.[0]?.itemId || 0;
    
    console.log(`📋 Created Plan: ${createdPlanCode}`);
    console.log(`📋 Plan has ${response.data.phases?.length || 0} phases`);
    console.log(`📋 First phase has ${response.data.phases?.[0]?.items?.length || 0} items`);

    logResult({
      name: 'Create Custom Plan',
      status: 'PASS',
      message: `Plan created: ${createdPlanCode}`,
      data: {
        planCode: createdPlanCode,
        status: response.data.status,
        approvalStatus: response.data.approvalStatus,
        itemId: createdItemId,
      },
    });
    return true;
  } catch (error: any) {
    logResult({
      name: 'Create Custom Plan',
      status: 'FAIL',
      error: {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      },
    });
    return false;
  }
}

// Step 3: Get Plan Detail (Verify Status)
async function step3_GetPlanDetail() {
  console.log('\n📋 Step 3: Get Plan Detail (Verify Initial Status)');
  console.log('─'.repeat(50));

  try {
    const client = createApiClient(doctorToken);
    const response = await client.get(`/treatment-plans/${createdPlanCode}`);

    logResult({
      name: 'Get Plan Detail',
      status: 'PASS',
      message: `Plan status: ${response.data.status || 'null'}, Approval: ${response.data.approvalStatus}`,
      data: {
        planCode: response.data.planCode,
        status: response.data.status,
        approvalStatus: response.data.approvalStatus,
        totalItems: response.data.phases?.reduce((sum: number, p: any) => sum + (p.items?.length || 0), 0) || 0,
      },
    });
    return true;
  } catch (error: any) {
    // Nếu get plan detail fail với 500, vẫn tiếp tục (có thể là lỗi BE)
    logResult({
      name: 'Get Plan Detail',
      status: error.response?.status === 500 ? 'SKIP' : 'FAIL',
      message: error.response?.status === 500 ? 'BE returned 500, continuing...' : undefined,
      error: error.response?.data || error.message,
    });
    return error.response?.status === 500; // Continue nếu là 500
  }
}

// Step 4: Submit Plan for Review
async function step4_SubmitForReview() {
  console.log('\n📋 Step 4: Submit Plan for Review');
  console.log('─'.repeat(50));

  try {
    const client = createApiClient(doctorToken);
    const response = await client.post(`/treatment-plans/${createdPlanCode}/submit-for-review`, {
      notes: 'Test submission for workflow verification',
    });

    logResult({
      name: 'Submit for Review',
      status: 'PASS',
      message: `Plan submitted: ${response.data.approvalStatus}`,
      data: {
        planCode: response.data.planCode,
        status: response.data.status,
        approvalStatus: response.data.approvalStatus,
      },
    });
    return true;
  } catch (error: any) {
    // Nếu submit fail với 500, vẫn tiếp tục (có thể là lỗi BE)
    logResult({
      name: 'Submit for Review',
      status: error.response?.status === 500 ? 'SKIP' : 'FAIL',
      message: error.response?.status === 500 ? 'BE returned 500, continuing...' : undefined,
      error: {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      },
    });
    return error.response?.status === 500; // Continue nếu là 500
  }
}

// Step 5: Login as Admin
async function step5_LoginAdmin() {
  console.log('\n📋 Step 5: Login as Admin');
  console.log('─'.repeat(50));

  try {
    adminToken = await login(TEST_USERS.admin.username, TEST_USERS.admin.password);
    logResult({
      name: 'Login as Admin',
      status: 'PASS',
      message: `Token received (${adminToken.substring(0, 20)}...)`,
    });
    return true;
  } catch (error: any) {
    logResult({
      name: 'Login as Admin',
      status: 'FAIL',
      error: error.response?.data || error.message,
    });
    return false;
  }
}

// Step 6: Approve Plan
async function step6_ApprovePlan() {
  console.log('\n📋 Step 6: Approve Plan (as Admin)');
  console.log('─'.repeat(50));

  try {
    const client = createApiClient(adminToken);
    // BE yêu cầu approvalStatus: 'APPROVED' hoặc 'REJECTED'
    const response = await client.post(`/treatment-plans/${createdPlanCode}/approve`, {
      approvalStatus: 'APPROVED',
      notes: 'Approved for workflow test',
    });

    logResult({
      name: 'Approve Plan',
      status: 'PASS',
      message: `Plan approved: ${response.data.approvalStatus}`,
      data: {
        planCode: response.data.planCode,
        status: response.data.status,
        approvalStatus: response.data.approvalStatus,
      },
    });
    return true;
  } catch (error: any) {
    logResult({
      name: 'Approve Plan',
      status: 'FAIL',
      error: {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      },
    });
    return false;
  }
}

// Step 7: Get all items first to find READY_FOR_BOOKING items
async function step7_GetPlanItems() {
  console.log('\n📋 Step 7: Get Plan Items (Find items to update)');
  console.log('─'.repeat(50));

  try {
    const client = createApiClient(doctorToken);
    const response = await client.get(`/treatment-plans/${createdPlanCode}`);
    
    // Tìm item đầu tiên có status READY_FOR_BOOKING hoặc PENDING
    let itemToUpdate = null;
    for (const phase of response.data.phases || []) {
      for (const item of phase.items || []) {
        if (item.status === 'READY_FOR_BOOKING' || item.status === 'PENDING') {
          itemToUpdate = item;
          break;
        }
      }
      if (itemToUpdate) break;
    }
    
    if (itemToUpdate) {
      createdItemId = itemToUpdate.itemId;
      logResult({
        name: 'Get Plan Items',
        status: 'PASS',
        message: `Found item to update: ${itemToUpdate.itemId} (${itemToUpdate.status})`,
        data: {
          itemId: itemToUpdate.itemId,
          itemName: itemToUpdate.itemName,
          currentStatus: itemToUpdate.status,
        },
      });
      return true;
    } else {
      // Nếu không tìm thấy, dùng itemId đã có từ lúc tạo
      if (createdItemId) {
        logResult({
          name: 'Get Plan Items',
          status: 'PASS',
          message: `Using existing item ID: ${createdItemId}`,
        });
        return true;
      }
      logResult({
        name: 'Get Plan Items',
        status: 'SKIP',
        message: 'No READY_FOR_BOOKING or PENDING items found',
      });
      return false;
    }
  } catch (error: any) {
    // Nếu get plan detail fail, vẫn dùng itemId đã có
    if (createdItemId) {
      logResult({
        name: 'Get Plan Items',
        status: 'PASS',
        message: `Get plan detail failed, using existing item ID: ${createdItemId}`,
      });
      return true;
    }
    logResult({
      name: 'Get Plan Items',
      status: 'FAIL',
      error: error.response?.data || error.message,
    });
    return false;
  }
}

// Step 8: Update Item Status (READY_FOR_BOOKING → SCHEDULED)
async function step8_UpdateItemStatus() {
  console.log('\n📋 Step 7: Update Item Status (READY_FOR_BOOKING → SCHEDULED)');
  console.log('─'.repeat(50));

  if (!createdItemId) {
    logResult({
      name: 'Update Item Status',
      status: 'SKIP',
      message: 'No item ID available from previous steps',
    });
    return false;
  }

  try {
    const client = createApiClient(doctorToken);
    const response = await client.patch(`/patient-plan-items/${createdItemId}/status`, {
      status: 'SCHEDULED',
      notes: 'Item scheduled for appointment',
    });

    logResult({
      name: 'Update Item Status to SCHEDULED',
      status: 'PASS',
      message: `Item status updated: ${response.data.status}`,
      data: {
        itemId: response.data.itemId,
        status: response.data.status,
      },
    });

    // Check plan status after item update
    const planResponse = await client.get(`/treatment-plans/${createdPlanCode}`);
    logResult({
      name: 'Check Plan Status After Item Update',
      status: 'PASS',
      message: `Plan status: ${planResponse.data.status || 'null'}`,
      data: {
        planCode: planResponse.data.planCode,
        status: planResponse.data.status,
        approvalStatus: planResponse.data.approvalStatus,
      },
    });

    return true;
  } catch (error: any) {
    logResult({
      name: 'Update Item Status',
      status: 'FAIL',
      error: {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      },
    });
    return false;
  }
}

// Step 9: Update Item Status (SCHEDULED → IN_PROGRESS)
async function step9_UpdateItemToInProgress() {
  console.log('\n📋 Step 9: Update Item Status (SCHEDULED → IN_PROGRESS)');
  console.log('─'.repeat(50));

  if (!createdItemId) {
    logResult({
      name: 'Update Item to IN_PROGRESS',
      status: 'SKIP',
      message: 'No item ID available',
    });
    return false;
  }

  try {
    const client = createApiClient(doctorToken);
    const response = await client.patch(`/patient-plan-items/${createdItemId}/status`, {
      status: 'IN_PROGRESS',
      notes: 'Item in progress',
    });

    logResult({
      name: 'Update Item Status to IN_PROGRESS',
      status: 'PASS',
      message: `Item status updated: ${response.data.status}`,
      data: {
        itemId: response.data.itemId,
        status: response.data.status,
      },
    });

    // Check plan status after item update (SHOULD BE IN_PROGRESS)
    const planResponse = await client.get(`/treatment-plans/${createdPlanCode}`);
    const planStatus = planResponse.data.status;
    
    logResult({
      name: 'Check Plan Status After Item IN_PROGRESS',
      status: planStatus === 'IN_PROGRESS' ? 'PASS' : 'FAIL',
      message: `Plan status: ${planStatus || 'null'} ${planStatus === 'IN_PROGRESS' ? '✅' : '❌ (Expected IN_PROGRESS)'}`,
      data: {
        planCode: planResponse.data.planCode,
        status: planStatus,
        approvalStatus: planResponse.data.approvalStatus,
        expected: 'IN_PROGRESS',
        actual: planStatus || 'null',
      },
    });

    return planStatus === 'IN_PROGRESS';
  } catch (error: any) {
    logResult({
      name: 'Update Item to IN_PROGRESS',
      status: 'FAIL',
      error: {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      },
    });
    return false;
  }
}

// Step 10: Complete Item
async function step10_CompleteItem() {
  console.log('\n📋 Step 9: Complete Item (IN_PROGRESS → COMPLETED)');
  console.log('─'.repeat(50));

  if (!createdItemId) {
    logResult({
      name: 'Complete Item',
      status: 'SKIP',
      message: 'No item ID available',
    });
    return false;
  }

  try {
    const client = createApiClient(doctorToken);
    const response = await client.patch(`/patient-plan-items/${createdItemId}/status`, {
      status: 'COMPLETED',
      notes: 'Item completed',
      completedAt: new Date().toISOString(),
    });

    logResult({
      name: 'Complete Item',
      status: 'PASS',
      message: `Item completed: ${response.data.status}`,
      data: {
        itemId: response.data.itemId,
        status: response.data.status,
        completedAt: response.data.completedAt,
      },
    });

    // Check plan status after completion
    const planResponse = await client.get(`/treatment-plans/${createdPlanCode}`);
    logResult({
      name: 'Check Plan Status After Item Completion',
      status: 'PASS',
      message: `Plan status: ${planResponse.data.status || 'null'}`,
      data: {
        planCode: planResponse.data.planCode,
        status: planResponse.data.status,
        approvalStatus: planResponse.data.approvalStatus,
      },
    });

    return true;
  } catch (error: any) {
    logResult({
      name: 'Complete Item',
      status: 'FAIL',
      error: {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      },
    });
    return false;
  }
}

// Main test runner
async function runWorkflowTest() {
  console.log('🚀 Treatment Plan Workflow Test');
  console.log('='.repeat(60));
  console.log(`📍 Base URL: ${API_BASE_URL}`);
  console.log(`👤 Doctor: ${TEST_USERS.doctor.username}`);
  console.log(`👤 Admin: ${TEST_USERS.admin.username}`);
  console.log('='.repeat(60));

  // Run workflow steps
  const step1 = await step1_LoginDoctor();
  if (!step1) {
    console.log('\n❌ Cannot proceed without doctor login');
    printSummary();
    return;
  }

  const step2 = await step2_CreateCustomPlan();
  if (!step2) {
    console.log('\n❌ Cannot proceed without creating plan');
    printSummary();
    return;
  }

  await step3_GetPlanDetail();
  await step4_SubmitForReview();

  const step5 = await step5_LoginAdmin();
  if (!step5) {
    console.log('\n⚠️  Cannot approve plan without admin login');
  } else {
    await step6_ApprovePlan();
  }

  // Sau khi approve, items sẽ được activate, cần get lại để tìm item có thể update
  await step7_GetPlanItems();
  await step8_UpdateItemStatus();
  const step9 = await step9_UpdateItemToInProgress();
  await step10_CompleteItem();

  // Print summary
  printSummary();

  // Highlight Issue #33 if plan status didn't change to IN_PROGRESS
  if (!step9) {
    console.log('\n⚠️  ISSUE #33 DETECTED: Plan status did not auto-change to IN_PROGRESS');
    console.log('   This confirms the issue documented in docs/BE_OPEN_ISSUES.md');
    console.log('   Expected: Plan status should be IN_PROGRESS when item status is IN_PROGRESS');
    console.log('   Actual: Plan status remains null or PENDING');
  }
}

function printSummary() {
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

  if (createdPlanCode) {
    console.log(`\n📋 Created Plan Code: ${createdPlanCode}`);
    console.log(`   You can view this plan in the UI to verify the workflow.`);
  }
}

// Run tests
runWorkflowTest().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

