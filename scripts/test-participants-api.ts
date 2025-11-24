/**
 * Test Script: Participants API Testing
 * 
 * Tests:
 * 1. getEmployees API - Check if assistants/nurses are returned
 * 2. getShifts API - Check if shifts exist for assistants/nurses
 * 3. Participant filtering logic for BookAppointmentFromPlanModal
 * 
 * Run: npm run test:api:participants
 */

import axios from 'axios';

// Configuration - use environment variables if available, otherwise use defaults
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

// Test users
const TEST_USERS = {
  admin: { username: 'admin', password: '123456' },
  doctor1: { username: 'bacsi1', password: '123456' },
  doctor2: { username: 'bacsi2', password: '123456' },
  patient1: { username: 'benhnhan1', password: '123456' },
};

// Default user for testing
const DEFAULT_USER = TEST_USERS.admin;

interface Employee {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  roleName: string;
  isActive: boolean;
  specializations?: any[];
}

interface EmployeeShift {
  employeeShiftId?: number;
  shiftId?: number;
  employeeId: number;
  employeeCode?: string;
  workDate: string;
  work_date?: string;
  startTime?: string;
  endTime?: string;
  workShift?: {
    startTime: string;
    endTime: string;
  };
}

let authToken: string = '';

/**
 * Authenticate and get JWT token
 */
async function authenticate(username: string = DEFAULT_USER.username, password: string = DEFAULT_USER.password): Promise<string> {
  try {
    console.log(`🔐 Authenticating as ${username}...`);
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username,
      password,
    });

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

/**
 * Get all employees
 */
async function getEmployees(): Promise<Employee[]> {
  try {
    console.log('\n📋 Fetching all employees...');
    const response = await axios.get(`${BASE_URL}/employees`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        page: 0,
        size: 1000,
        isActive: true,
        sortBy: 'employeeCode',
        sortDirection: 'ASC',
      },
    });

    const employees = response.data?.data?.content || response.data?.content || [];
    console.log(`✅ Loaded ${employees.length} employees`);

    // Analyze by role
    const byRole: Record<string, number> = {};
    const assistants: Employee[] = [];
    const nurses: Employee[] = [];
    const doctors: Employee[] = [];

    employees.forEach((emp: Employee) => {
      const role = emp.roleName || 'UNKNOWN';
      byRole[role] = (byRole[role] || 0) + 1;

      if (role.includes('ASSISTANT')) {
        assistants.push(emp);
      } else if (role.includes('NURSE')) {
        nurses.push(emp);
      } else if (role.includes('DOCTOR') || role.includes('DENTIST')) {
        doctors.push(emp);
      }
    });

    console.log('\n📊 Employees by Role:');
    Object.entries(byRole).forEach(([role, count]) => {
      console.log(`  - ${role}: ${count}`);
    });

    console.log('\n👥 Medical Staff Breakdown:');
    console.log(`  - Assistants: ${assistants.length}`);
    console.log(`  - Nurses: ${nurses.length}`);
    console.log(`  - Doctors/Dentists: ${doctors.length}`);

    if (assistants.length > 0) {
      console.log('\n📝 Sample Assistants:');
      assistants.slice(0, 5).forEach((emp) => {
        console.log(`  - ${emp.employeeCode}: ${emp.fullName} (${emp.roleName})`);
      });
    }

    if (nurses.length > 0) {
      console.log('\n📝 Sample Nurses:');
      nurses.slice(0, 5).forEach((emp) => {
        console.log(`  - ${emp.employeeCode}: ${emp.fullName} (${emp.roleName})`);
      });
    }

    return employees;
  } catch (error: any) {
    console.error('❌ Failed to fetch employees:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get shifts for an employee
 * Uses /shifts endpoint with employee_id filter
 */
async function getShiftsForEmployee(employeeCode: string, startDate: string, endDate: string): Promise<EmployeeShift[]> {
  try {
    // First, find employee ID from employeeCode
    const employeesResponse = await axios.get(`${BASE_URL}/employees`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        page: 0,
        size: 1000,
        isActive: true,
      },
    });

    const employees = employeesResponse.data?.data?.content || employeesResponse.data?.content || [];
    const employee = employees.find((e: Employee) => e.employeeCode === employeeCode);

    if (!employee) {
      console.warn(`⚠️  Employee ${employeeCode} not found`);
      return [];
    }

    // Get shifts using /shifts endpoint with employee_id
    const response = await axios.get(`${BASE_URL}/shifts`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        employee_id: employee.employeeId,
        start_date: startDate,
        end_date: endDate,
      },
    });

    const shifts = response.data?.data?.content || response.data?.content || [];
    // Normalize shift data
    return Array.isArray(shifts) ? shifts.map((shift: any) => ({
      employeeShiftId: shift.employee_shift_id || shift.employeeShiftId,
      employeeId: shift.employee?.employee_id || shift.employeeId,
      workDate: shift.work_date || shift.workDate,
      workShift: shift.work_shift || shift.workShift,
      startTime: shift.work_shift?.start_time || shift.workShift?.startTime,
      endTime: shift.work_shift?.end_time || shift.workShift?.endTime,
    })) : [];
  } catch (error: any) {
    console.error(`❌ Failed to fetch shifts for ${employeeCode}:`, error.response?.data || error.message);
    return [];
  }
}

/**
 * Test participant availability for a specific date
 */
async function testParticipantAvailability(
  employees: Employee[],
  planDoctorCode: string,
  testDate: string
): Promise<void> {
  console.log(`\n🔍 Testing participant availability for date: ${testDate}`);
  console.log(`   Plan Doctor: ${planDoctorCode}`);

  // Filter eligible participants (same logic as BookAppointmentFromPlanModal)
  const eligibleParticipants = employees.filter((emp) => {
    // Exclude the plan's primary doctor
    if (emp.employeeCode === planDoctorCode) {
      return false;
    }

    // Must be ASSISTANT, NURSE, DOCTOR, or DENTIST
    const isAssistant = emp.roleName?.includes('ASSISTANT') || emp.roleName?.includes('NURSE');
    const isDoctor = emp.roleName?.includes('DOCTOR') || emp.roleName?.includes('DENTIST');
    if (!isAssistant && !isDoctor) return false;

    return true; // We'll check shifts separately
  });

  console.log(`\n📊 Eligible Participants (before shift check): ${eligibleParticipants.length}`);
  console.log(`   - Assistants/Nurses: ${eligibleParticipants.filter(e => 
    e.roleName?.includes('ASSISTANT') || e.roleName?.includes('NURSE')
  ).length}`);
  console.log(`   - Doctors/Dentists: ${eligibleParticipants.filter(e => 
    e.roleName?.includes('DOCTOR') || e.roleName?.includes('DENTIST')
  ).length}`);

  // Check shifts for each eligible participant
  const participantsWithShifts: Array<{ employee: Employee; shifts: EmployeeShift[] }> = [];

  console.log('\n⏳ Checking shifts for eligible participants...');
  for (const emp of eligibleParticipants.slice(0, 10)) { // Limit to first 10 for testing
    const shifts = await getShiftsForEmployee(emp.employeeCode, testDate, testDate);
    if (shifts.length > 0) {
      participantsWithShifts.push({ employee: emp, shifts });
      console.log(`  ✅ ${emp.employeeCode} (${emp.fullName}): ${shifts.length} shift(s)`);
    }
  }

  console.log(`\n✅ Participants with shifts on ${testDate}: ${participantsWithShifts.length}`);
  if (participantsWithShifts.length > 0) {
    console.log('\n📝 Available Participants:');
    participantsWithShifts.forEach(({ employee, shifts }) => {
      console.log(`  - ${employee.employeeCode}: ${employee.fullName} (${employee.roleName})`);
      shifts.forEach((shift) => {
        const startTime = shift.startTime || shift.workShift?.startTime || 'N/A';
        const endTime = shift.endTime || shift.workShift?.endTime || 'N/A';
        console.log(`    └─ ${startTime} - ${endTime}`);
      });
    });
  } else {
    console.log('\n⚠️  No participants have shifts on this date');
    console.log('   This explains why the dropdown is empty in BookAppointmentFromPlanModal');
  }

  // Also check plan doctor's shifts
  console.log(`\n👨‍⚕️ Checking plan doctor (${planDoctorCode}) shifts...`);
  const doctorShifts = await getShiftsForEmployee(planDoctorCode, testDate, testDate);
  if (doctorShifts.length > 0) {
    console.log(`  ✅ Plan doctor has ${doctorShifts.length} shift(s) on ${testDate}`);
    doctorShifts.forEach((shift) => {
      const startTime = shift.startTime || shift.workShift?.startTime || 'N/A';
      const endTime = shift.endTime || shift.workShift?.endTime || 'N/A';
      console.log(`    └─ ${startTime} - ${endTime}`);
    });
  } else {
    console.log(`  ⚠️  Plan doctor has NO shifts on ${testDate}`);
    console.log('   This means no participants will be shown (doctor must have shift first)');
  }
}

/**
 * Test with multiple dates
 */
async function testMultipleDates(employees: Employee[], planDoctorCode: string): Promise<void> {
  console.log('\n📅 Testing multiple dates to find dates with participants...\n');

  const today = new Date();
  const datesToTest: string[] = [];

  // Test next 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    datesToTest.push(date.toISOString().split('T')[0]);
  }

  for (const testDate of datesToTest) {
    console.log(`\n${'='.repeat(60)}`);
    await testParticipantAvailability(employees, planDoctorCode, testDate);
  }
}

/**
 * Main test function
 */
async function main() {
  try {
    console.log('🧪 Starting Participants API Tests\n');
    console.log('='.repeat(60));

    // Step 1: Authenticate with admin to get all employees (doctors don't have permission)
    console.log('\n📌 Step 1: Getting employees list with ADMIN user\n');
    await authenticate(TEST_USERS.admin.username, TEST_USERS.admin.password);
    const employees = await getEmployees();

    if (employees.length === 0) {
      console.log('\n⚠️  No employees found. Cannot test participants.');
      return;
    }

    // Step 2: Authenticate with bacsi2 to get their employee info
    console.log('\n📌 Step 2: Authenticating with DOCTOR2 (bacsi2) to get their employee code\n');
    const doctor2Token = await authenticate(TEST_USERS.doctor2.username, TEST_USERS.doctor2.password);
    
    // Get current user info to find their employee code
    let planDoctor: Employee | undefined;
    
    try {
      // Try to get current user info from /auth/me or similar endpoint
      const currentUserResponse = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${doctor2Token}` },
      });
      
      const currentUser = currentUserResponse.data?.data || currentUserResponse.data;
      const currentEmployeeCode = currentUser?.employeeCode || currentUser?.employee?.employeeCode;
      
      if (currentEmployeeCode) {
        planDoctor = employees.find((emp) => emp.employeeCode === currentEmployeeCode);
        console.log(`\n👤 Current logged-in doctor (bacsi2): ${currentEmployeeCode}`);
      }
    } catch (error: any) {
      console.log('\n⚠️  Could not get current user info from /auth/me');
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
      console.log('   Will try to find doctor with shifts (EMP002, EMP003, or EMP004)...');
    }
    
    // If not found, find a doctor with shifts (prefer EMP002, EMP003, or EMP004 from previous test)
    if (!planDoctor) {
      // Test with EMP002 (Trịnh Công Thái) - had shifts in previous test
      planDoctor = employees.find((emp) => emp.employeeCode === 'EMP002');
      
      if (!planDoctor) {
        // Fallback to any doctor with shifts
        planDoctor = employees.find(
          (emp) => (emp.roleName?.includes('DOCTOR') || emp.roleName?.includes('DENTIST')) && emp.isActive
        );
      }
    }

    if (!planDoctor) {
      console.log('\n⚠️  No active doctor found. Cannot test participants.');
      return;
    }

    console.log(`\n👨‍⚕️ Using plan doctor: ${planDoctor.employeeCode} (${planDoctor.fullName})`);
    
    // Step 3: Use admin token to check shifts (doctors don't have permission to view other employees' shifts)
    console.log('\n📌 Step 3: Using ADMIN token to check shifts (doctors have limited permissions)\n');
    await authenticate(TEST_USERS.admin.username, TEST_USERS.admin.password);
    
    // Verify this doctor has shifts
    const todayDate = new Date().toISOString().split('T')[0];
    const doctorShifts = await getShiftsForEmployee(planDoctor.employeeCode, todayDate, todayDate);
    console.log(`   Shifts on ${todayDate}: ${doctorShifts.length}`);
    if (doctorShifts.length > 0) {
      console.log(`   ✅ Plan doctor has shifts - participants should be available!`);
      doctorShifts.forEach((shift) => {
        const startTime = shift.startTime || shift.workShift?.startTime || 'N/A';
        const endTime = shift.endTime || shift.workShift?.endTime || 'N/A';
        console.log(`      └─ ${startTime} - ${endTime}`);
      });
    } else {
      console.log(`   ⚠️  Plan doctor has no shifts today - testing with next 7 days...`);
    }

    // Test with today's date
    await testParticipantAvailability(employees, planDoctor.employeeCode, todayDate);

    // Test with multiple dates to find dates with participants
    console.log('\n' + '='.repeat(60));
    console.log('📅 Testing multiple dates to find dates with participants...\n');
    await testMultipleDates(employees, planDoctor.employeeCode);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed!');
    console.log('\n💡 Summary:');
    console.log('   - Check the logs above to see if assistants/nurses are available');
    console.log('   - If no participants found, possible reasons:');
    console.log('     1. No assistants/nurses in the system');
    console.log('     2. Assistants/nurses have no shifts on tested dates');
    console.log('     3. API getEmployees not returning assistants/nurses');
    console.log('     4. API getShifts not returning shifts for assistants/nurses');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run tests
main();

