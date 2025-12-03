/**
 * Test Script for Treatment Plan Template APIs
 * 
 * Tests:
 * - API 6.6: List Treatment Plan Templates
 * - API 5.8: Get Template Detail (with phases and services)
 * 
 * Run with: npx tsx scripts/test-treatment-plan-template.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message?: string;
  data?: any;
  error?: any;
}

const results: TestResult[] = [];

// Test credentials
const TEST_USERS = {
  doctor: { username: 'bacsi1', password: '123456' },
  admin: { username: 'admin', password: '123456' },
};

async function authenticate(username: string, password: string): Promise<string | null> {
  try {
    console.log(`🔐 Authenticating as ${username}...`);
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      console.error(`❌ Auth failed for ${username}: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.token || data.accessToken || null;
  } catch (error) {
    console.error(`❌ Auth error for ${username}:`, error);
    return null;
  }
}

async function testAPI(
  testName: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  token: string | null,
  body?: any
): Promise<TestResult> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const url = `${BASE_URL}${endpoint}`;
    console.log(`\n🧪 Testing: ${testName}`);
    console.log(`   ${method} ${url}`);

    const startTime = Date.now();
    const response = await fetch(url, options);
    const responseTime = Date.now() - startTime;

    const contentType = response.headers.get('content-type');
    let data: any = null;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      return {
        test: testName,
        status: 'FAIL',
        message: `HTTP ${response.status}: ${response.statusText}`,
        error: data,
      };
    }

    return {
      test: testName,
      status: 'PASS',
      message: `Success (${responseTime}ms)`,
      data,
    };
  } catch (error: any) {
    return {
      test: testName,
      status: 'FAIL',
      message: `Error: ${error.message}`,
      error: error,
    };
  }
}

async function runTests() {
  console.log('🚀 Treatment Plan Template API Test');
  console.log('============================================================');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log('============================================================\n');

  // Step 1: Login as Doctor (has CREATE_TREATMENT_PLAN permission)
  console.log('📋 Step 1: Login as Doctor');
  console.log('──────────────────────────────────────────────────');
  const doctorToken = await authenticate(TEST_USERS.doctor.username, TEST_USERS.doctor.password);
  if (!doctorToken) {
    console.error('❌ Failed to authenticate as doctor. Cannot continue.');
    return;
  }
  console.log('✅ Authenticated as doctor\n');

  // Step 2: Test API 6.6 - List Templates
  console.log('📋 Step 2: Test API 6.6 - List Treatment Plan Templates');
  console.log('──────────────────────────────────────────────────');
  const listResult = await testAPI(
    'API 6.6 - List Templates',
    'GET',
    '/treatment-plan-templates?page=0&size=50&sort=templateName,asc',
    doctorToken
  );
  results.push(listResult);

  if (listResult.status === 'PASS') {
    console.log(`✅ ${listResult.test}`);
    console.log(`   ${listResult.message}`);
    
    const templates = listResult.data?.content || [];
    console.log(`   Found ${templates.length} templates`);
    
    if (templates.length > 0) {
      console.log('\n   📋 Template List:');
      templates.forEach((template: any, index: number) => {
        console.log(`   ${index + 1}. ${template.templateCode} - ${template.templateName}`);
        if (template.description) {
          console.log(`      Description: ${template.description}`);
        }
        console.log(`      Active: ${template.isActive ? 'Yes' : 'No'}`);
        if (template.specializationId) {
          console.log(`      Specialization ID: ${template.specializationId}`);
        }
      });
    } else {
      console.log('   ⚠️  No templates found');
    }
  } else {
    console.log(`❌ ${listResult.test}`);
    console.log(`   ${listResult.message}`);
    if (listResult.error) {
      console.log(`   Error:`, JSON.stringify(listResult.error, null, 2));
    }
  }

  // Step 3: Test API 5.8 - Get Template Detail (if we have templates)
  if (listResult.status === 'PASS' && listResult.data?.content?.length > 0) {
    const firstTemplate = listResult.data.content[0];
    const templateCode = firstTemplate.templateCode;

    console.log('\n📋 Step 3: Test API 5.8 - Get Template Detail');
    console.log('──────────────────────────────────────────────────');
    console.log(`   Using template: ${templateCode}`);
    
    const detailResult = await testAPI(
      'API 5.8 - Get Template Detail',
      'GET',
      `/treatment-plan-templates/${templateCode}`,
      doctorToken
    );
    results.push(detailResult);

    if (detailResult.status === 'PASS') {
      console.log(`✅ ${detailResult.test}`);
      console.log(`   ${detailResult.message}`);
      
      const detail = detailResult.data;
      
      // Check template basic info
      console.log(`\n   📋 Template Info:`);
      console.log(`   - Code: ${detail.templateCode}`);
      console.log(`   - Name: ${detail.templateName}`);
      if (detail.description) {
        console.log(`   - Description: ${detail.description}`);
      }
      if (detail.specializationId) {
        console.log(`   - Specialization ID: ${detail.specializationId}`);
      }
      console.log(`   - Active: ${detail.isActive ? 'Yes' : 'No'}`);

      // Check summary
      if (detail.summary) {
        console.log(`\n   📊 Summary:`);
        console.log(`   - Total Phases: ${detail.summary.totalPhases || 0}`);
        console.log(`   - Total Items: ${detail.summary.totalItemsInTemplate || 0}`);
        console.log(`   - Total Services: ${detail.summary.totalServices || 0}`);
      }

      // Check phases
      if (detail.phases && Array.isArray(detail.phases)) {
        console.log(`\n   📦 Phases (${detail.phases.length}):`);
        
        if (detail.phases.length === 0) {
          console.log('   ⚠️  NO PHASES FOUND - This is the issue!');
        } else {
          detail.phases.forEach((phase: any, phaseIndex: number) => {
            console.log(`\n   Phase ${phaseIndex + 1}:`);
            console.log(`   - Phase Name: ${phase.phaseName}`);
            console.log(`   - Step Order: ${phase.stepOrder || 'N/A'}`);
            console.log(`   - Phase Template ID: ${phase.phaseTemplateId || 'N/A'}`);
            
            // Check items in phase
            if (phase.itemsInPhase && Array.isArray(phase.itemsInPhase)) {
              console.log(`   - Items in Phase: ${phase.itemsInPhase.length}`);
              
              if (phase.itemsInPhase.length === 0) {
                console.log('   ⚠️  NO ITEMS IN THIS PHASE - This is the issue!');
              } else {
                phase.itemsInPhase.forEach((item: any, itemIndex: number) => {
                  console.log(`\n     Item ${itemIndex + 1}:`);
                  console.log(`     - Service Code: ${item.serviceCode || 'N/A'}`);
                  console.log(`     - Service Name: ${item.serviceName || 'N/A'}`);
                  console.log(`     - Sequence Number: ${item.sequenceNumber || 'N/A'}`);
                  console.log(`     - Quantity: ${item.quantity || 'N/A'}`);
                  console.log(`     - Price: ${item.price ? `${item.price.toLocaleString('vi-VN')} VND` : 'N/A'}`);
                  if (item.description) {
                    console.log(`     - Description: ${item.description}`);
                  }
                });
              }
            } else {
              console.log('   ⚠️  itemsInPhase is missing or not an array!');
              console.log(`   Phase object keys: ${Object.keys(phase).join(', ')}`);
            }
          });
        }
      } else {
        console.log('   ⚠️  NO PHASES FOUND - phases field is missing or not an array!');
        console.log('   This is the main issue - phases are not being returned by the API');
        console.log(`   Detail object keys: ${Object.keys(detail).join(', ')}`);
        console.log(`   Detail.phases type: ${typeof detail.phases}`);
        console.log(`   Detail.phases value:`, detail.phases);
      }

      // Validate response structure matches FE expectations
      console.log(`\n   🔍 Response Structure Validation:`);
      const requiredFields = ['templateCode', 'templateName', 'phases', 'summary'];
      const missingFields = requiredFields.filter(field => !(field in detail));
      if (missingFields.length > 0) {
        console.log(`   ❌ Missing required fields: ${missingFields.join(', ')}`);
      } else {
        console.log(`   ✅ All required fields present`);
      }

      // Check if structure matches FE TypeScript interface
      console.log(`\n   🔍 TypeScript Interface Validation:`);
      if (Array.isArray(detail.phases)) {
        const firstPhase = detail.phases[0];
        if (firstPhase) {
          const phaseRequiredFields = ['phaseName', 'itemsInPhase'];
          const phaseMissingFields = phaseRequiredFields.filter(field => !(field in firstPhase));
          if (phaseMissingFields.length > 0) {
            console.log(`   ❌ Phase missing fields: ${phaseMissingFields.join(', ')}`);
          } else {
            console.log(`   ✅ Phase structure matches TemplatePhaseDTO`);
          }

          if (Array.isArray(firstPhase.itemsInPhase) && firstPhase.itemsInPhase.length > 0) {
            const firstItem = firstPhase.itemsInPhase[0];
            const itemRequiredFields = ['serviceCode', 'serviceName', 'sequenceNumber', 'quantity'];
            const itemMissingFields = itemRequiredFields.filter(field => !(field in firstItem));
            if (itemMissingFields.length > 0) {
              console.log(`   ❌ Item missing fields: ${itemMissingFields.join(', ')}`);
            } else {
              console.log(`   ✅ Item structure matches TemplateServiceDTO`);
            }
          }
        }
      }

      // Test with another template if available
      if (listResult.data.content.length > 1) {
        const secondTemplate = listResult.data.content[1];
        console.log(`\n📋 Step 4: Test with second template: ${secondTemplate.templateCode}`);
        console.log('──────────────────────────────────────────────────');
        
        const secondDetailResult = await testAPI(
          'API 5.8 - Get Second Template Detail',
          'GET',
          `/treatment-plan-templates/${secondTemplate.templateCode}`,
          doctorToken
        );
        results.push(secondDetailResult);

        if (secondDetailResult.status === 'PASS') {
          const secondDetail = secondDetailResult.data;
          console.log(`✅ Template: ${secondDetail.templateCode}`);
          console.log(`   Phases: ${secondDetail.phases?.length || 0}`);
          console.log(`   Total Items: ${secondDetail.summary?.totalItemsInTemplate || 0}`);
        }
      }
    } else {
      console.log(`❌ ${detailResult.test}`);
      console.log(`   ${detailResult.message}`);
      if (detailResult.error) {
        console.log(`   Error:`, JSON.stringify(detailResult.error, null, 2));
      }
    }
  } else {
    console.log('\n⏭️  Skipping template detail test - no templates available');
  }

  // Summary
  console.log('\n============================================================');
  console.log('📊 TEST SUMMARY');
  console.log('============================================================');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  console.log(`\n📈 Total: ${results.length} tests`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`   - ${r.test}: ${r.message}`);
      });
  }

  // Check for specific issues
  const detailTest = results.find(r => r.test.includes('Get Template Detail'));
  if (detailTest && detailTest.status === 'PASS' && detailTest.data) {
    const hasPhases = detailTest.data.phases && Array.isArray(detailTest.data.phases) && detailTest.data.phases.length > 0;
    const hasItems = detailTest.data.phases?.some((p: any) => 
      p.itemsInPhase && Array.isArray(p.itemsInPhase) && p.itemsInPhase.length > 0
    );

    console.log('\n🔍 ISSUE ANALYSIS:');
    if (!hasPhases) {
      console.log('   ❌ ISSUE DETECTED: Template has NO phases');
      console.log('      This explains why FE cannot load services and phases');
    } else if (!hasItems) {
      console.log('   ❌ ISSUE DETECTED: Template phases have NO items');
      console.log('      Phases exist but are empty');
    } else {
      console.log('   ✅ Template structure looks correct');
      console.log('      If FE still cannot load, check:');
      console.log('      1. Network requests in browser DevTools');
      console.log('      2. Console errors in browser');
      console.log('      3. Response structure matches FE expectations');
    }
  }

  console.log('\n============================================================');
}

// Run tests
runTests().catch(console.error);

