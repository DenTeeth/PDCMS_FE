/**
 * Automated Test Script: Reschedule Appointment
 * 
 * Tests reschedule appointment functionality automatically:
 * 1. Standalone appointments (not from treatment plan)
 * 2. Treatment plan appointments (with plan items linked)
 * 
 * Usage:
 *   npx tsx scripts/test-reschedule-appointment.ts
 * 
 * Environment Variables (optional):
 *   NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
 *   TEST_USERNAME=admin
 *   TEST_PASSWORD=123456
 */

import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

// ============================================================================
// Configuration
// ============================================================================

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';
const TEST_USERNAME = process.env.TEST_USERNAME || 'admin';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '123456';

let authToken: string = '';
let apiClient: AxiosInstance;

// ============================================================================
// Helper Functions
// ============================================================================

function log(message: string, data?: any) {
  console.log(`[TEST] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function logSuccess(message: string) {
  console.log(`✅ [PASS] ${message}`);
}

function logError(message: string, error?: any) {
  console.error(`❌ [FAIL] ${message}`);
  if (error) {
    if (error.response) {
      console.error('Response:', error.response.status, error.response.data);
    } else {
      console.error(error.message || error);
    }
  }
}

function logInfo(message: string) {
  console.log(`ℹ️  [INFO] ${message}`);
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Authentication
// ============================================================================

async function authenticate(): Promise<string> {
  try {
    logInfo(`Authenticating as ${TEST_USERNAME}...`);
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
    });

    // Handle different response formats
    let token: string | null = null;
    if (response.data?.data?.token) {
      token = response.data.data.token;
    } else if (response.data?.token) {
      token = response.data.token;
    } else if (response.data?.accessToken) {
      token = response.data.accessToken;
    }

    if (!token) {
      throw new Error('No token in response');
    }

    authToken = token;
    apiClient = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    logSuccess('Authentication successful');
    return token;
  } catch (error: any) {
    logError('Authentication failed', error);
    throw error;
  }
}

// ============================================================================
// Find Test Appointments
// ============================================================================

interface AppointmentSummary {
  appointmentCode: string;
  appointmentId: number;
  status: string;
  appointmentStartTime: string;
  patientPlanItemIds?: number[];
  employee?: { employeeCode: string };
  room?: { roomCode: string };
}

async function findAppointmentsForTesting(): Promise<{
  standalone?: AppointmentSummary;
  treatmentPlan?: AppointmentSummary;
}> {
  try {
    logInfo('Finding appointments for testing...');

    // Get list of appointments
    const response = await apiClient.get('/appointments', {
      params: {
        page: 0,
        size: 50,
        status: 'SCHEDULED,CHECKED_IN', // Only reschedulable statuses
      },
    });

    const appointments: AppointmentSummary[] = response.data?.content || 
                                                response.data?.data?.content || 
                                                response.data || [];

    log(`Found ${appointments.length} appointments`);

    // Find standalone appointment (no plan items)
    const standalone = appointments.find(
      (apt: any) => !apt.patientPlanItemIds || apt.patientPlanItemIds.length === 0
    );

    // Find treatment plan appointment (has plan items)
    const treatmentPlan = appointments.find(
      (apt: any) => apt.patientPlanItemIds && apt.patientPlanItemIds.length > 0
    );

    return { standalone, treatmentPlan };
  } catch (error: any) {
    logError('Failed to find appointments', error);
    return {};
  }
}

// ============================================================================
// Test Case 1: Reschedule Standalone Appointment
// ============================================================================

async function testRescheduleStandaloneAppointment(appointment: AppointmentSummary): Promise<boolean> {
  log('='.repeat(60));
  log('TEST CASE 1: Reschedule Standalone Appointment');
  log('='.repeat(60));

  try {
    logInfo(`Testing with appointment: ${appointment.appointmentCode}`);

    // Get appointment details first
    const oldApptResponse = await apiClient.get(`/appointments/${appointment.appointmentCode}`);
    const oldAppt = oldApptResponse.data?.data || oldApptResponse.data;

    log('Old appointment:', {
      code: oldAppt.appointmentCode,
      status: oldAppt.status,
      startTime: oldAppt.appointmentStartTime,
      doctor: oldAppt.employee?.employeeCode,
      room: oldAppt.room?.roomCode,
      hasPlanItems: !!(oldAppt.patientPlanItemIds && oldAppt.patientPlanItemIds.length > 0),
    });

    if (oldAppt.patientPlanItemIds && oldAppt.patientPlanItemIds.length > 0) {
      logError('Appointment has plan items - this is not a standalone appointment!');
      return false;
    }

    // Calculate new start time (1 day later, same time)
    const oldStartTime = new Date(oldAppt.appointmentStartTime);
    const newStartTime = new Date(oldStartTime);
    newStartTime.setDate(newStartTime.getDate() + 1);
    const newStartTimeStr = newStartTime.toISOString().slice(0, 16).replace('T', 'T');

    // Get available doctors and rooms
    const doctorsResponse = await apiClient.get('/employees', {
      params: { role: 'DOCTOR', page: 0, size: 10 },
    });
    const doctors = doctorsResponse.data?.content || doctorsResponse.data?.data?.content || [];
    const newDoctor = doctors.find((d: any) => d.employeeCode !== oldAppt.employee?.employeeCode) || doctors[0];

    const roomsResponse = await apiClient.get('/rooms', {
      params: { page: 0, size: 10 },
    });
    const rooms = roomsResponse.data?.content || roomsResponse.data?.data?.content || [];
    const newRoom = rooms.find((r: any) => r.roomCode !== oldAppt.room?.roomCode) || rooms[0];

    if (!newDoctor || !newRoom) {
      logError('Cannot find alternative doctor or room for reschedule');
      return false;
    }

    // Prepare reschedule request
    const rescheduleRequest = {
      newStartTime: newStartTimeStr,
      newEmployeeCode: newDoctor.employeeCode,
      newRoomCode: newRoom.roomCode,
      reasonCode: 'PATIENT_REQUEST',
      cancelNotes: 'Automated test - reschedule standalone appointment',
    };

    logInfo('Rescheduling appointment...');
    log('Request:', rescheduleRequest);

    // Reschedule
    const response = await apiClient.post(
      `/appointments/${appointment.appointmentCode}/reschedule`,
      rescheduleRequest
    );

    const result = response.data?.data || response.data;

    // Verify response
    if (!result.cancelledAppointment || !result.newAppointment) {
      logError('Response missing required fields');
      return false;
    }

    logSuccess('Reschedule request successful');

    // Verify cancelled appointment
    if (result.cancelledAppointment.status !== 'CANCELLED') {
      logError(`Cancelled appointment status is ${result.cancelledAppointment.status}, expected CANCELLED`);
      return false;
    }

    logSuccess('Cancelled appointment verified');

    // Verify new appointment
    const newAppt = result.newAppointment;
    if (newAppt.status !== 'SCHEDULED') {
      logError(`New appointment status is ${newAppt.status}, expected SCHEDULED`);
      return false;
    }

    if (newAppt.appointmentStartTime !== newStartTimeStr) {
      logError('New appointment start time mismatch');
      return false;
    }

    if (newAppt.employee?.employeeCode !== newDoctor.employeeCode) {
      logError('New appointment doctor mismatch');
      return false;
    }

    if (newAppt.room?.roomCode !== newRoom.roomCode) {
      logError('New appointment room mismatch');
      return false;
    }

    // Verify no plan items (standalone)
    if (newAppt.patientPlanItemIds && newAppt.patientPlanItemIds.length > 0) {
      logError('New appointment should not have plan items (standalone)');
      return false;
    }

    logSuccess('New appointment verified');

    // Wait and verify via API
    await delay(1000);
    const verifyOld = await apiClient.get(`/appointments/${appointment.appointmentCode}`);
    const verifyOldData = verifyOld.data?.data || verifyOld.data;

    if (verifyOldData.status !== 'CANCELLED') {
      logError('Old appointment not cancelled in database');
      return false;
    }

    logSuccess('Old appointment verified via API');

    logSuccess('✅ TEST CASE 1 PASSED: Standalone appointment rescheduled successfully');
    return true;

  } catch (error: any) {
    logError('TEST CASE 1 FAILED', error);
    return false;
  }
}

// ============================================================================
// Test Case 2: Reschedule Treatment Plan Appointment
// ============================================================================

async function testRescheduleTreatmentPlanAppointment(appointment: AppointmentSummary): Promise<boolean> {
  log('='.repeat(60));
  log('TEST CASE 2: Reschedule Treatment Plan Appointment');
  log('='.repeat(60));

  try {
    logInfo(`Testing with appointment: ${appointment.appointmentCode}`);

    // Get appointment details first
    const oldApptResponse = await apiClient.get(`/appointments/${appointment.appointmentCode}`);
    const oldAppt = oldApptResponse.data?.data || oldApptResponse.data;

    log('Old appointment:', {
      code: oldAppt.appointmentCode,
      status: oldAppt.status,
      planItemIds: oldAppt.patientPlanItemIds,
      hasPlanItems: !!(oldAppt.patientPlanItemIds && oldAppt.patientPlanItemIds.length > 0),
    });

    if (!oldAppt.patientPlanItemIds || oldAppt.patientPlanItemIds.length === 0) {
      logError('Appointment has no plan items - this is not a treatment plan appointment!');
      return false;
    }

    const oldPlanItemIds = oldAppt.patientPlanItemIds;

    // Calculate new start time
    const oldStartTime = new Date(oldAppt.appointmentStartTime);
    const newStartTime = new Date(oldStartTime);
    newStartTime.setDate(newStartTime.getDate() + 1);
    const newStartTimeStr = newStartTime.toISOString().slice(0, 16).replace('T', 'T');

    // Get available doctors and rooms
    const doctorsResponse = await apiClient.get('/employees', {
      params: { role: 'DOCTOR', page: 0, size: 10 },
    });
    const doctors = doctorsResponse.data?.content || doctorsResponse.data?.data?.content || [];
    const newDoctor = doctors.find((d: any) => d.employeeCode !== oldAppt.employee?.employeeCode) || doctors[0];

    const roomsResponse = await apiClient.get('/rooms', {
      params: { page: 0, size: 10 },
    });
    const rooms = roomsResponse.data?.content || roomsResponse.data?.data?.content || [];
    const newRoom = rooms.find((r: any) => r.roomCode !== oldAppt.room?.roomCode) || rooms[0];

    if (!newDoctor || !newRoom) {
      logError('Cannot find alternative doctor or room for reschedule');
      return false;
    }

    // Prepare reschedule request
    const rescheduleRequest = {
      newStartTime: newStartTimeStr,
      newEmployeeCode: newDoctor.employeeCode,
      newRoomCode: newRoom.roomCode,
      reasonCode: 'DOCTOR_UNAVAILABLE',
      cancelNotes: 'Automated test - reschedule treatment plan appointment',
    };

    logInfo('Rescheduling appointment...');
    log('Request:', rescheduleRequest);

    // Reschedule
    const response = await apiClient.post(
      `/appointments/${appointment.appointmentCode}/reschedule`,
      rescheduleRequest
    );

    const result = response.data?.data || response.data;

    // Verify response
    if (!result.cancelledAppointment || !result.newAppointment) {
      logError('Response missing required fields');
      return false;
    }

    logSuccess('Reschedule request successful');

    // Verify new appointment has plan items (Issue #39 fix)
    const newAppt = result.newAppointment;
    const newPlanItemIds = newAppt.patientPlanItemIds || [];

    if (newPlanItemIds.length === 0) {
      logError('New appointment has no plan items - Issue #39 fix may not be working!');
      return false;
    }

    if (JSON.stringify(oldPlanItemIds.sort()) !== JSON.stringify(newPlanItemIds.sort())) {
      logError('Plan items not re-linked correctly', {
        old: oldPlanItemIds,
        new: newPlanItemIds,
      });
      return false;
    }

    logSuccess('Plan items re-linked to new appointment (Issue #39 fix verified)');
    logSuccess('No validation errors - plan items status reset worked (Issue #42 fix verified)');

    // Verify new appointment details
    if (newAppt.status !== 'SCHEDULED') {
      logError(`New appointment status is ${newAppt.status}, expected SCHEDULED`);
      return false;
    }

    if (newAppt.appointmentStartTime !== newStartTimeStr) {
      logError('New appointment start time mismatch');
      return false;
    }

    logSuccess('New appointment details verified');

    // Wait and verify via API
    await delay(1000);
    const verifyNew = await apiClient.get(`/appointments/${newAppt.appointmentCode}`);
    const verifyNewData = verifyNew.data?.data || verifyNew.data;

    if (verifyNewData.patientPlanItemIds?.length !== oldPlanItemIds.length) {
      logError('New appointment plan items count mismatch');
      return false;
    }

    logSuccess('Verification via API passed');

    logSuccess('✅ TEST CASE 2 PASSED: Treatment plan appointment rescheduled successfully');
    return true;

  } catch (error: any) {
    logError('TEST CASE 2 FAILED', error);

    // Check if error is related to Issue #42
    if (error.response?.data?.message?.includes('not ready for booking') ||
        error.response?.data?.errorCode === 'PLAN_ITEMS_NOT_READY') {
      logError('⚠️  Issue #42 may not be fixed - plan items validation failed');
    }

    return false;
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runAllTests() {
  console.log('\n');
  console.log('🚀 Starting Automated Reschedule Appointment Tests');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Username: ${TEST_USERNAME}`);
  console.log('='.repeat(60));
  console.log('\n');

  try {
    // Step 1: Authenticate
    await authenticate();
    console.log('\n');

    // Step 2: Find appointments
    const appointments = await findAppointmentsForTesting();
    console.log('\n');

    if (!appointments.standalone && !appointments.treatmentPlan) {
      logError('No suitable appointments found for testing');
      logInfo('Please ensure you have:');
      logInfo('  - At least 1 standalone appointment with status SCHEDULED or CHECKED_IN');
      logInfo('  - At least 1 treatment plan appointment with status SCHEDULED or CHECKED_IN');
      process.exit(1);
    }

    const results: { name: string; passed: boolean }[] = [];

    // Test Case 1: Standalone Appointment
    if (appointments.standalone) {
      const test1 = await testRescheduleStandaloneAppointment(appointments.standalone);
      results.push({ name: 'Test Case 1: Standalone Appointment', passed: test1 });
      console.log('\n');
      await delay(2000); // Wait between tests
    } else {
      logInfo('⚠️  Skipping Test Case 1: No standalone appointment found');
      results.push({ name: 'Test Case 1: Standalone Appointment', passed: false });
    }

    // Test Case 2: Treatment Plan Appointment
    if (appointments.treatmentPlan) {
      const test2 = await testRescheduleTreatmentPlanAppointment(appointments.treatmentPlan);
      results.push({ name: 'Test Case 2: Treatment Plan Appointment', passed: test2 });
      console.log('\n');
    } else {
      logInfo('⚠️  Skipping Test Case 2: No treatment plan appointment found');
      results.push({ name: 'Test Case 2: Treatment Plan Appointment', passed: false });
    }

    // Summary
    console.log('='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    results.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL / SKIP';
      console.log(`${index + 1}. ${result.name}: ${status}`);
    });

    const totalPassed = results.filter(r => r.passed).length;
    const totalTests = results.length;

    console.log('='.repeat(60));
    console.log(`Total: ${totalPassed}/${totalTests} tests passed`);
    console.log('='.repeat(60));

    if (totalPassed === totalTests) {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed or were skipped. Please review the output above.');
      process.exit(1);
    }

  } catch (error: any) {
    logError('Fatal error during test execution', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export {
  testRescheduleStandaloneAppointment,
  testRescheduleTreatmentPlanAppointment,
  runAllTests,
};

