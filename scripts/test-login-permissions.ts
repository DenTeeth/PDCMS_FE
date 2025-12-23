/**
 * Test script to diagnose login and permission issues
 * Run with: npm run test:login
 */

import axios from 'axios';

const API_BASE_URL = 'https://pdcms.duckdns.org/api/v1';

interface LoginResponse {
  token: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  groupedPermissions?: Record<string, string[]>;
  baseRole: string;
  employmentType?: string;
  mustChangePassword: boolean;
  tokenExpiresAt: number;
  refreshTokenExpiresAt: number;
}

async function testLogin() {
  console.log('🧪 Testing Login Flow and Permissions...\n');

  try {
    // Test 1: Login with admin credentials
    console.log('📝 Test 1: Admin Login');
    const adminLogin = await axios.post<LoginResponse>(
      `${API_BASE_URL}/auth/login`,
      {
        username: 'admin',
        password: 'admin123', // Change this to your admin password
      },
      {
        withCredentials: true,
      }
    );

    console.log('✅ Login successful!');
    console.log('📊 Response structure:');
    console.log(JSON.stringify(adminLogin.data, null, 2));

    // Check if permissions exist
    if (adminLogin.data.permissions) {
      console.log(`\n✅ Permissions found: ${adminLogin.data.permissions.length} permissions`);
      console.log('📋 Sample permissions:', adminLogin.data.permissions.slice(0, 10));
    } else {
      console.log('\n❌ WARNING: No permissions array in response!');
    }

    // Check groupedPermissions
    if (adminLogin.data.groupedPermissions) {
      const groups = Object.keys(adminLogin.data.groupedPermissions);
      console.log(`\n✅ GroupedPermissions found: ${groups.length} groups`);
      console.log('📁 Groups:', groups);
    } else {
      console.log('\n⚠️  No groupedPermissions in response');
    }

    // Check baseRole
    if (adminLogin.data.baseRole) {
      console.log(`\n✅ BaseRole found: ${adminLogin.data.baseRole}`);
    } else {
      console.log('\n❌ WARNING: No baseRole in response!');
    }

    // Test 2: Try login with employee credentials
    console.log('\n\n📝 Test 2: Employee Login');
    const employeeLogin = await axios.post<LoginResponse>(
      `${API_BASE_URL}/auth/login`,
      {
        username: 'dentist01', // Change this to your employee username
        password: 'dentist123', // Change this to your employee password
      },
      {
        withCredentials: true,
      }
    );

    console.log('✅ Login successful!');
    if (employeeLogin.data.permissions) {
      console.log(`✅ Permissions found: ${employeeLogin.data.permissions.length} permissions`);
      console.log('📋 Sample permissions:', employeeLogin.data.permissions.slice(0, 10));
    } else {
      console.log('❌ WARNING: No permissions array in response!');
    }

    // Test 3: Check CORS headers
    console.log('\n\n📝 Test 3: Checking CORS Headers');
    console.log('Response headers:', {
      'access-control-allow-origin': adminLogin.headers['access-control-allow-origin'],
      'access-control-allow-credentials': adminLogin.headers['access-control-allow-credentials'],
      'set-cookie': adminLogin.headers['set-cookie'] ? 'Present' : 'Missing',
    });

    // Summary
    console.log('\n\n📊 DIAGNOSTIC SUMMARY:');
    console.log('='.repeat(50));
    console.log('1. Login API works:', adminLogin.status === 200 ? '✅' : '❌');
    console.log('2. Permissions array exists:', adminLogin.data.permissions ? '✅' : '❌');
    console.log('3. BaseRole exists:', adminLogin.data.baseRole ? '✅' : '❌');
    console.log('4. GroupedPermissions exists:', adminLogin.data.groupedPermissions ? '✅' : '⚠️ (Optional)');
    console.log('5. Token exists:', adminLogin.data.token ? '✅' : '❌');
    console.log('='.repeat(50));

    if (!adminLogin.data.permissions || adminLogin.data.permissions.length === 0) {
      console.log('\n🔴 CRITICAL ISSUE FOUND:');
      console.log('Backend is not returning permissions array!');
      console.log('This will cause all permission checks to fail on frontend.');
      console.log('\n💡 SOLUTION:');
      console.log('1. Check Backend AuthenticationService.login() method');
      console.log('2. Ensure LoginResponse includes permissions array');
      console.log('3. Verify role_permissions table has data for the user\'s roles');
    }

    if (!adminLogin.data.baseRole) {
      console.log('\n🟡 WARNING:');
      console.log('Backend is not returning baseRole!');
      console.log('This will cause navigation issues on frontend.');
      console.log('\n💡 SOLUTION:');
      console.log('1. Check Backend AuthenticationService.login() method');
      console.log('2. Add baseRole to LoginResponse');
      console.log('3. baseRole should be one of: "admin", "employee", "patient"');
    }

  } catch (error: any) {
    console.error('\n❌ LOGIN FAILED!');
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Message:', error.response?.data?.message || error.message);
      console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    } else {
      console.error(error);
    }

    console.log('\n💡 POSSIBLE CAUSES:');
    console.log('1. Backend is not running');
    console.log('2. Wrong credentials');
    console.log('3. CORS issues');
    console.log('4. Database connection issues');
    console.log('5. Missing seed data in database');
  }
}

// Run the test
testLogin();
