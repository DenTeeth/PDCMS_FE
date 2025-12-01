/**
 * Quick test script to check /my-specializations API response format
 * 
 * Usage:
 *   npx tsx scripts/test-service-api.ts
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

async function testServiceAPI() {
  try {
    // Step 1: Login as doctor
    console.log('🔐 Step 1: Login as bacsi1...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'bacsi1',
      password: '123456',
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...');
    
    // Step 2: Test old API
    console.log('\n📋 Step 2: Test OLD API /services...');
    const oldResponse = await axios.get(`${API_BASE_URL}/booking/services`, {
      params: { page: 0, size: 5, isActive: true },
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Response structure:', {
      hasContent: !!oldResponse.data.content,
      hasData: !!oldResponse.data.data,
      keys: Object.keys(oldResponse.data),
      firstItem: oldResponse.data.content?.[0] || oldResponse.data.data?.content?.[0],
    });
    
    // Step 3: Test new API
    console.log('\n📋 Step 3: Test NEW API /my-specializations...');
    try {
      const newResponse = await axios.get(`${API_BASE_URL}/booking/services/my-specializations`, {
        params: { page: 0, size: 5, isActive: true },
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('✅ API call successful!');
      console.log('Response structure:', {
        hasContent: !!newResponse.data.content,
        hasData: !!newResponse.data.data,
        keys: Object.keys(newResponse.data),
        message: newResponse.data.message,
        status: newResponse.data.status,
        firstItem: newResponse.data.content?.[0] || newResponse.data.data?.content?.[0],
      });
      
      // Show services count
      const services = newResponse.data.data?.content || newResponse.data.content || [];
      console.log(`\n📊 Found ${services.length} services for doctor`);
      if (services.length > 0) {
        console.log('First service:', {
          code: services[0].serviceCode,
          name: services[0].serviceName,
          price: services[0].price,
          specialization: services[0].specializationName,
        });
      }
    } catch (error: any) {
      console.error('❌ API call failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message,
        error: error.response?.data?.error,
        data: error.response?.data,
      });
    }
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testServiceAPI();

