/**
 * Test Script: Excel Export Functionality
 * 
 * Tests export Excel functionality from:
 * 1. Warehouse Reports (inventory, transactions, expiring alerts)
 * 2. Dashboard Statistics (all tabs)
 * 
 * Usage:
 *   npx tsx scripts/test-excel-export.ts
 * 
 * Or with ts-node:
 *   npx ts-node scripts/test-excel-export.ts
 */

import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://pdcms.duckdns.org/api/v1';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '123456';
const OUTPUT_DIR = path.join(process.cwd(), 'test-exports');

// Test results
interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  fileSize?: number;
  fileName?: string;
}

const results: TestResult[] = [];

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Login and get token
async function login(): Promise<string> {
  console.log('🔐 Logging in as admin...');
  
  try {
    const response = await api.post('/auth/login', {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    });

    const data = response.data;
    let token: string;

    // Handle FormatRestResponse wrapper
    if (data && typeof data === 'object' && 'data' in data) {
      token = data.data.accessToken || data.data.token;
    } else {
      token = data.accessToken || data.token;
    }

    if (!token) {
      throw new Error('No token received from login');
    }

    // Set token in default headers
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    console.log('✅ Login successful');
    return token;
  } catch (error: any) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

// Ensure output directory exists
function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created output directory: ${OUTPUT_DIR}`);
  }
}

// Test warehouse export
async function testWarehouseExport(
  name: string,
  endpoint: string,
  params: Record<string, any> = {}
): Promise<TestResult> {
  console.log(`\n📤 Testing ${name}...`);
  console.log(`   Endpoint: ${endpoint}`);
  console.log(`   Params:`, params);

  try {
    const response = await api.get(endpoint, {
      params,
      responseType: 'arraybuffer', // Use arraybuffer for file download
    });

    // Check if response is Excel file
    const contentType = response.headers['content-type'] || '';
    const isExcel = contentType.includes('spreadsheetml') || 
                    contentType.includes('application/vnd.openxmlformats');

    if (!isExcel && response.data.byteLength < 100) {
      // Might be JSON error response
      const text = Buffer.from(response.data).toString('utf-8');
      try {
        const json = JSON.parse(text);
        throw new Error(json.message || 'Invalid response format');
      } catch {
        throw new Error('Response is not a valid Excel file');
      }
    }

    // Save file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.xlsx`;
    const filePath = path.join(OUTPUT_DIR, fileName);

    fs.writeFileSync(filePath, Buffer.from(response.data));
    const fileSize = fs.statSync(filePath).size;

    console.log(`   ✅ Success! File saved: ${fileName} (${fileSize} bytes)`);

    return {
      name,
      success: true,
      fileSize,
      fileName,
    };
  } catch (error: any) {
    let errorMessage = error.message || 'Unknown error';
    
    if (error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText;
      
      // Try to parse error message from response
      if (error.response.data) {
        if (Buffer.isBuffer(error.response.data) || error.response.data instanceof ArrayBuffer) {
          // Response is binary, try to parse as text
          try {
            const text = Buffer.from(error.response.data).toString('utf-8');
            const json = JSON.parse(text);
            errorMessage = json.message || json.error || text.substring(0, 200);
          } catch {
            errorMessage = `Server error (${status} ${statusText})`;
          }
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = JSON.stringify(error.response.data).substring(0, 200);
        }
      } else {
        errorMessage = `Server error: ${status} ${statusText}`;
      }
    }

    console.error(`   ❌ Failed: ${errorMessage}`);
    console.error(`   Status: ${error.response?.status || 'N/A'}`);
    if (error.response?.status === 500) {
      console.error(`   ⚠️  This is a BE issue - check BE logs for details`);
    }

    return {
      name,
      success: false,
      error: errorMessage,
    };
  }
}

// Test dashboard export
async function testDashboardExport(
  tab: string,
  params: { month?: string; startDate?: string; endDate?: string } = {}
): Promise<TestResult> {
  const name = `Dashboard ${tab}`;
  console.log(`\n📤 Testing ${name}...`);
  console.log(`   Endpoint: /dashboard/export/${tab}`);
  console.log(`   Params:`, params);

  try {
    const response = await api.get(`/dashboard/export/${tab}`, {
      params,
      responseType: 'arraybuffer',
    });

    // Check if response is Excel file
    const contentType = response.headers['content-type'] || '';
    const isExcel = contentType.includes('spreadsheetml') || 
                    contentType.includes('application/vnd.openxmlformats');

    if (!isExcel && response.data.byteLength < 100) {
      // Might be JSON error response
      const text = Buffer.from(response.data).toString('utf-8');
      try {
        const json = JSON.parse(text);
        throw new Error(json.message || 'Invalid response format');
      } catch {
        throw new Error('Response is not a valid Excel file');
      }
    }

    // Save file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const monthStr = params.month || params.startDate || 'all';
    const fileName = `dashboard-${tab}-${monthStr}-${timestamp}.xlsx`;
    const filePath = path.join(OUTPUT_DIR, fileName);

    fs.writeFileSync(filePath, Buffer.from(response.data));
    const fileSize = fs.statSync(filePath).size;

    console.log(`   ✅ Success! File saved: ${fileName} (${fileSize} bytes)`);

    return {
      name,
      success: true,
      fileSize,
      fileName,
    };
  } catch (error: any) {
    let errorMessage = error.message || 'Unknown error';
    
    if (error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText;
      
      // Try to parse error message from response
      if (error.response.data) {
        if (Buffer.isBuffer(error.response.data) || error.response.data instanceof ArrayBuffer) {
          // Response is binary, try to parse as text
          try {
            const text = Buffer.from(error.response.data).toString('utf-8');
            const json = JSON.parse(text);
            errorMessage = json.message || json.error || text.substring(0, 200);
          } catch {
            errorMessage = `Server error (${status} ${statusText})`;
          }
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = JSON.stringify(error.response.data).substring(0, 200);
        }
      } else {
        errorMessage = `Server error: ${status} ${statusText}`;
      }
    }

    console.error(`   ❌ Failed: ${errorMessage}`);
    console.error(`   Status: ${error.response?.status || 'N/A'}`);
    if (error.response?.status === 500) {
      console.error(`   ⚠️  This is a BE issue - check BE logs for details`);
    }

    return {
      name,
      success: false,
      error: errorMessage,
    };
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Excel Export Tests');
  console.log('=' .repeat(60));
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Output Directory: ${OUTPUT_DIR}`);
  console.log('=' .repeat(60));

  try {
    // Login
    await login();

    // Ensure output directory exists
    ensureOutputDir();

    // Test Warehouse Exports
    console.log('\n📦 Testing Warehouse Exports');
    console.log('-'.repeat(60));

    // 1. Inventory Summary Export
    results.push(await testWarehouseExport(
      'Warehouse Inventory Summary',
      '/warehouse/summary/export',
      {
        warehouseType: 'NORMAL',
      }
    ));

    // 2. Expiring Alerts Export
    results.push(await testWarehouseExport(
      'Warehouse Expiring Alerts',
      '/warehouse/alerts/expiring/export',
      {
        days: 30,
        warehouseType: 'NORMAL',
      }
    ));

    // 3. Transaction History Export
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    results.push(await testWarehouseExport(
      'Warehouse Transaction History',
      '/warehouse/transactions/export',
      {
        fromDate: startDate.toISOString().split('T')[0],
        toDate: now.toISOString().split('T')[0],
        sortBy: 'transactionDate',
        sortDir: 'desc',
      }
    ));

    // Test Dashboard Exports
    console.log('\n📊 Testing Dashboard Exports');
    console.log('-'.repeat(60));

    // Get current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];

    // Test all dashboard tabs
    const dashboardTabs = [
      'overview',
      'revenue-expenses',
      'employees',
      'warehouse',
      'transactions',
      'feedbacks',
    ];

    for (const tab of dashboardTabs) {
      // Test with month parameter
      results.push(await testDashboardExport(tab, { month: currentMonth }));
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 Test Summary');
    console.log('='.repeat(60));

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Total Tests: ${results.length}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);

    if (successful > 0) {
      console.log('\n✅ Successful Exports:');
      results
        .filter(r => r.success)
        .forEach(r => {
          console.log(`   - ${r.name}: ${r.fileName} (${r.fileSize} bytes)`);
        });
    }

    if (failed > 0) {
      console.log('\n❌ Failed Exports:');
      results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   - ${r.name}: ${r.error}`);
        });
    }

    console.log(`\n📁 All exported files saved to: ${OUTPUT_DIR}`);

    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
  } catch (error: any) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();

