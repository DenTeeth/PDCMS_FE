/**
 * Test Patient Account Creation
 * 
 * Run with: npx tsx scripts/test-patient-creation.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

async function authenticate(username: string, password: string): Promise<string | null> {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      console.error(`❌ Auth failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.token || data.accessToken || null;
  } catch (error) {
    console.error(`❌ Auth error:`, error);
    return null;
  }
}

async function testPatientCreation() {
  console.log('🧪 Testing Patient Account Creation...\n');
  console.log('='.repeat(60));

  // Login as admin
  console.log('🔐 Step 1: Authenticating as admin...');
  const adminToken = await authenticate('admin', '123456');
  if (!adminToken) {
    console.error('❌ Cannot proceed without admin token');
    process.exit(1);
  }
  console.log('✅ Authenticated successfully\n');

  // Test patient data - Start with minimal required fields
  const timestamp = Date.now();
  
  // Test 1: Minimal fields only
  console.log('\n📝 Test 1: Minimal Required Fields Only...');
  const minimalPatient = {
    username: `patient${timestamp}`,
    password: 'Test123456',
    email: `patient${timestamp}@test.com`,
    firstName: 'Test',
    lastName: 'Patient',
  };
  
  console.log('Minimal Data:', JSON.stringify(minimalPatient, null, 2));
  
  try {
    const minResponse = await fetch(`${BASE_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify(minimalPatient),
    });
    
    console.log(`Response: ${minResponse.status} ${minResponse.statusText}`);
    
    if (minResponse.ok) {
      const data = await minResponse.json();
      console.log('✅ SUCCESS with minimal fields!');
      console.log('Patient Code:', data.patientCode);
      return true;
    } else {
      const errorData = await minResponse.json();
      console.log('❌ FAILED with minimal fields:', JSON.stringify(errorData, null, 2));
    }
  } catch (error: any) {
    console.log('💥 Exception with minimal fields:', error.message);
  }
  
  // Test 2: With all fields
  console.log('\n📝 Test 2: With All Fields...');
  const testPatient = {
    username: `testpatient${timestamp}`,
    password: 'Test123456',
    email: `testpatient${timestamp}@example.com`,
    firstName: 'Test',
    lastName: 'Patient',
    phone: '0901234567',
    dateOfBirth: '1990-01-01',
    address: '123 Test Street, Test City',
    gender: 'MALE',
    medicalHistory: 'No significant medical history',
    allergies: 'None',
    emergencyContactName: 'Emergency Contact',
    emergencyContactPhone: '0909999999',
  };

  console.log('📝 Step 2: Testing Create Patient Endpoint...');
  console.log('Patient Data:', JSON.stringify(testPatient, null, 2));

  try {
    const response = await fetch(`${BASE_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify(testPatient),
    });

    console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ FAILED - Error Response:', JSON.stringify(errorData, null, 2));
      
      if (response.status === 400) {
        console.log('\n🔍 Analyzing 400 Error:');
        console.log('- Check if username already exists');
        console.log('- Check if email already exists');
        console.log('- Check required fields validation');
        console.log('- Check field format (email, phone, date)');
      } else if (response.status === 403) {
        console.log('\n🔍 Permission Issue:');
        console.log('- Check if admin has CREATE_PATIENT permission');
      } else if (response.status === 500) {
        console.log('\n🔍 Server Error:');
        console.log('- Check BE logs for exception');
        console.log('- Check DB connection');
      }
      
      return false;
    }

    const data = await response.json();
    console.log('\n✅ SUCCESS - Patient Created!');
    console.log('Response Data:', JSON.stringify(data, null, 2));

    // Verify data
    console.log('\n🔍 Verifying Created Patient...');
    if (data.patientCode) {
      console.log(`✅ Patient Code: ${data.patientCode}`);
      
      // Try to get patient detail
      const detailResponse = await fetch(`${BASE_URL}/patients/${data.patientCode}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      
      if (detailResponse.ok) {
        const patientDetail = await detailResponse.json();
        console.log('✅ Patient detail retrieved successfully');
        console.log('Full Name:', `${patientDetail.firstName} ${patientDetail.lastName}`);
        console.log('Email:', patientDetail.email);
        console.log('Phone:', patientDetail.phone);
        console.log('Is Active:', patientDetail.isActive);
      } else {
        console.log('⚠️ Could not retrieve patient detail');
      }
    } else {
      console.log('⚠️ No patientCode in response');
    }

    return true;
  } catch (error: any) {
    console.error('\n💥 Exception during test:', error.message);
    return false;
  }
}

async function main() {
  const success = await testPatientCreation();
  
  console.log('\n' + '='.repeat(60));
  if (success) {
    console.log('✅ Patient Creation Test: PASSED');
  } else {
    console.log('❌ Patient Creation Test: FAILED');
  }
  console.log('='.repeat(60));
  
  process.exit(success ? 0 : 1);
}

main();

