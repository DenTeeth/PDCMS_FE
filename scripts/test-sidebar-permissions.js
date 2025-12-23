// Test script để verify permissions và sidebar
// Chạy: node scripts/test-sidebar-permissions.js

console.log('🔍 Testing Sidebar Permissions Logic\n');

// Mock data giống như BE sẽ trả về
const mockAdminUser = {
  username: 'admin',
  baseRole: 'admin',
  roles: ['ROLE_ADMIN'],
  permissions: [
    'VIEW_ACCOUNT',
    'CREATE_ACCOUNT',
    'VIEW_EMPLOYEE',
    'VIEW_OVERTIME_ALL',
    'APPROVE_OVERTIME',
    'VIEW_LEAVE_TYPE',
    'MANAGE_LEAVE_TYPE',
    'VIEW_WAREHOUSE',
    'VIEW_ROOM',
    'VIEW_SERVICE',
    'VIEW_APPOINTMENT_ALL',
    'VIEW_TREATMENT_PLAN_ALL',
    'VIEW_WORK_SHIFTS',
    'VIEW_REGISTRATION_ALL',
    'VIEW_SHIFTS_ALL',
    'VIEW_TIMEOFF_ALL',
    'VIEW_SPECIALIZATION',
    'VIEW_ROLE',
    'VIEW_PERMISSION',
  ],
  groupedPermissions: {
    'ACCOUNT': ['VIEW_ACCOUNT', 'CREATE_ACCOUNT', 'UPDATE_ACCOUNT', 'DELETE_ACCOUNT'],
    'EMPLOYEE': ['VIEW_EMPLOYEE', 'CREATE_EMPLOYEE', 'UPDATE_EMPLOYEE', 'DELETE_EMPLOYEE'],
    'SYSTEM_CONFIGURATION': ['VIEW_ROLE', 'VIEW_PERMISSION', 'VIEW_SPECIALIZATION'],
    'SCHEDULE_MANAGEMENT': ['VIEW_WORK_SHIFTS', 'VIEW_REGISTRATION_ALL', 'VIEW_SHIFTS_ALL'],
    'LEAVE_MANAGEMENT': ['VIEW_OVERTIME_ALL', 'APPROVE_OVERTIME', 'VIEW_TIMEOFF_ALL', 'VIEW_LEAVE_TYPE', 'MANAGE_LEAVE_TYPE'],
    'ROOM_MANAGEMENT': ['VIEW_ROOM', 'CREATE_ROOM'],
    'SERVICE_MANAGEMENT': ['VIEW_SERVICE', 'CREATE_SERVICE'],
    'APPOINTMENT': ['VIEW_APPOINTMENT_ALL', 'CREATE_APPOINTMENT'],
    'CUSTOMER_MANAGEMENT': ['VIEW_CONTACT', 'CREATE_CONTACT'],
  }
};

const mockEmployeeUser = {
  username: 'employee1',
  baseRole: 'employee',
  roles: ['ROLE_EMPLOYEE'],
  employmentType: 'FULL_TIME',
  permissions: [
    'VIEW_APPOINTMENT_OWN',
    'VIEW_TREATMENT_PLAN_OWN',
    'VIEW_SHIFTS_OWN',
    'VIEW_REGISTRATION_OWN',
    'VIEW_FIXED_REGISTRATIONS_OWN',
    'CREATE_OVERTIME',
    'VIEW_OVERTIME_OWN',
    'CANCEL_OVERTIME_OWN',
  ],
  groupedPermissions: {
    'APPOINTMENT': ['VIEW_APPOINTMENT_OWN'],
    'SCHEDULE_MANAGEMENT': ['VIEW_SHIFTS_OWN', 'VIEW_REGISTRATION_OWN', 'VIEW_FIXED_REGISTRATIONS_OWN'],
    'LEAVE_MANAGEMENT': ['CREATE_OVERTIME', 'VIEW_OVERTIME_OWN', 'CANCEL_OVERTIME_OWN'],
    'CUSTOMER_MANAGEMENT': ['VIEW_CONTACT'],
  }
};

// Test helper functions
function hasPermissionGroup(groupedPermissions, requiredGroup) {
  if (!groupedPermissions) return false;
  return groupedPermissions[requiredGroup] && groupedPermissions[requiredGroup].length > 0;
}

function hasPermissions(userPermissions, requiredPermissions, requireAll = false) {
  if (requireAll) {
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  } else {
    return requiredPermissions.some(permission => userPermissions.includes(permission));
  }
}

// Test cases
const adminMenuTests = [
  {
    name: 'Quản lý tài khoản',
    requiredPermissionGroup: 'ACCOUNT',
    shouldShow: true
  },
  {
    name: 'Cấu hình hệ thống',
    requiredPermissionGroup: 'SYSTEM_CONFIGURATION',
    shouldShow: true
  },
  {
    name: 'Quản lý lịch làm việc',
    requiredPermissionGroup: 'SCHEDULE_MANAGEMENT',
    shouldShow: true
  },
  {
    name: 'Quản lý yêu cầu',
    requiredPermissionGroup: 'LEAVE_MANAGEMENT',
    shouldShow: true
  },
  {
    name: 'Quản lý kho',
    requiredPermissions: ['VIEW_WAREHOUSE'],
    shouldShow: true
  },
  {
    name: 'Liên hệ khách hàng',
    requiredPermissionGroup: 'CUSTOMER_MANAGEMENT',
    shouldShow: true
  }
];

const employeeMenuTests = [
  {
    name: 'Quản lý lịch',
    requiredPermissions: ['VIEW_APPOINTMENT_OWN', 'VIEW_APPOINTMENT_ALL'],
    requireAll: false,
    shouldShow: true
  },
  {
    name: 'Kế hoạch điều trị',
    requiredPermissions: ['VIEW_TREATMENT_PLAN_ALL', 'VIEW_TREATMENT_PLAN_OWN'],
    requireAll: false,
    shouldShow: true
  },
  {
    name: 'Quản lý lịch làm việc',
    requiredPermissions: ['VIEW_SHIFTS_OWN', 'VIEW_REGISTRATION_OWN', 'VIEW_FIXED_REGISTRATIONS_OWN'],
    requireAll: false,
    shouldShow: true
  },
  {
    name: 'Quản lý yêu cầu',
    requiredPermissionGroup: 'LEAVE_MANAGEMENT',
    shouldShow: true
  },
  {
    name: 'Quản lý khách hàng',
    requiredPermissionGroup: 'CUSTOMER_MANAGEMENT',
    shouldShow: true
  },
  {
    name: 'Quản lý kho (không có quyền)',
    requiredPermissions: ['VIEW_WAREHOUSE'],
    shouldShow: false
  }
];

console.log('=== TESTING ADMIN USER ===\n');
let passed = 0, failed = 0;

adminMenuTests.forEach(test => {
  let show = true;

  if (test.requiredPermissionGroup) {
    show = hasPermissionGroup(mockAdminUser.groupedPermissions, test.requiredPermissionGroup);
  } else if (test.requiredPermissions) {
    show = hasPermissions(mockAdminUser.permissions, test.requiredPermissions, test.requireAll);
  }

  const result = show === test.shouldShow ? '✅ PASS' : '❌ FAIL';
  if (show === test.shouldShow) passed++; else failed++;

  console.log(`${result} - ${test.name}`);
  console.log(`  Expected: ${test.shouldShow}, Got: ${show}`);
  if (test.requiredPermissionGroup) {
    console.log(`  Permission Group: ${test.requiredPermissionGroup}`);
    console.log(`  Has Group: ${hasPermissionGroup(mockAdminUser.groupedPermissions, test.requiredPermissionGroup)}`);
  }
  if (test.requiredPermissions) {
    console.log(`  Required Permissions: ${test.requiredPermissions.join(', ')}`);
    console.log(`  User has: ${test.requiredPermissions.filter(p => mockAdminUser.permissions.includes(p)).join(', ') || 'none'}`);
  }
  console.log('');
});

console.log('\n=== TESTING EMPLOYEE USER ===\n');

employeeMenuTests.forEach(test => {
  let show = true;

  if (test.requiredPermissionGroup) {
    show = hasPermissionGroup(mockEmployeeUser.groupedPermissions, test.requiredPermissionGroup);
  } else if (test.requiredPermissions) {
    show = hasPermissions(mockEmployeeUser.permissions, test.requiredPermissions, test.requireAll);
  }

  const result = show === test.shouldShow ? '✅ PASS' : '❌ FAIL';
  if (show === test.shouldShow) passed++; else failed++;

  console.log(`${result} - ${test.name}`);
  console.log(`  Expected: ${test.shouldShow}, Got: ${show}`);
  if (test.requiredPermissionGroup) {
    console.log(`  Permission Group: ${test.requiredPermissionGroup}`);
    console.log(`  Has Group: ${hasPermissionGroup(mockEmployeeUser.groupedPermissions, test.requiredPermissionGroup)}`);
  }
  if (test.requiredPermissions) {
    console.log(`  Required Permissions: ${test.requiredPermissions.join(', ')}`);
    console.log(`  User has: ${test.requiredPermissions.filter(p => mockEmployeeUser.permissions.includes(p)).join(', ') || 'none'}`);
  }
  console.log('');
});

console.log(`\n=== SUMMARY ===`);
console.log(`Total tests: ${passed + failed}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Success rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

// Test specific permission issues
console.log('\n=== KNOWN ISSUES CHECK ===\n');

console.log('1. Checking if BE returns permissions array:');
console.log(`   Admin has permissions: ${mockAdminUser.permissions && mockAdminUser.permissions.length > 0 ? `✅ YES (${mockAdminUser.permissions.length} permissions)` : '❌ NO - THIS IS THE PROBLEM!'}`);
console.log(`   Employee has permissions: ${mockEmployeeUser.permissions && mockEmployeeUser.permissions.length > 0 ? `✅ YES (${mockEmployeeUser.permissions.length} permissions)` : '❌ NO - THIS IS THE PROBLEM!'}`);

console.log('\n2. Checking permission naming (old vs new):');
const oldPermissions = mockAdminUser.permissions.filter(p => p.includes('_OT') && !p.includes('OVERTIME'));
const oldLeavePermissions = mockAdminUser.permissions.filter(p => p.includes('TIMEOFF_TYPE'));
console.log(`   Old overtime permissions: ${oldPermissions.length > 0 ? `⚠️ FOUND: ${oldPermissions.join(', ')}` : '✅ NONE'}`);
console.log(`   Old leave type permissions: ${oldLeavePermissions.length > 0 ? `⚠️ FOUND: ${oldLeavePermissions.join(', ')}` : '✅ NONE'}`);

console.log('\n3. Checking groupedPermissions:');
console.log(`   Admin has groupedPermissions: ${mockAdminUser.groupedPermissions ? `✅ YES (${Object.keys(mockAdminUser.groupedPermissions).length} groups)` : '❌ NO'}`);
console.log(`   Employee has groupedPermissions: ${mockEmployeeUser.groupedPermissions ? `✅ YES (${Object.keys(mockEmployeeUser.groupedPermissions).length} groups)` : '❌ NO'}`);

console.log('\n✅ Test complete!\n');
console.log('📝 Note: This is a mock test. Real issue might be:');
console.log('   1. BE not returning permissions array in login response');
console.log('   2. BE using old permission names (VIEW_OT_ALL instead of VIEW_OVERTIME_ALL)');
console.log('   3. groupedPermissions not matching permission group names in navigationConfig');
console.log('   4. User role missing permissions in database\n');
