/**
 * API Test File
 * Test all master data endpoints
 * Run with: node src/tests/masterDataTest.js
 */

const BASE_URL = 'http://localhost:3000';

async function testAPI(endpoint, description) {
  try {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`   Endpoint: GET ${endpoint}`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    
    if (data.success) {
      console.log(`   ✅ Success`);
      
      if (Array.isArray(data.data)) {
        console.log(`   📊 Count: ${data.data.length} items`);
        if (data.data.length > 0) {
          console.log(`   📝 Sample:`, data.data[0]);
        }
      } else if (typeof data.data === 'object') {
        const keys = Object.keys(data.data);
        console.log(`   📊 Keys: ${keys.length}`);
        console.log(`   📝 Available data:`, keys.slice(0, 5).join(', '), '...');
      }
    } else {
      console.log(`   ❌ Failed: ${data.message}`);
    }
    
    return data;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════');
  console.log('   SarvVivah Master Data API Tests');
  console.log('═══════════════════════════════════════════════');
  
  // Test 1: Get all enums
  await testAPI('/master/enums', 'Get All Enums');
  
  // Test 2: Get all religions
  const religions = await testAPI('/master/religions', 'Get All Religions');
  
  // Test 3: Get castes by religion (if religions exist)
  if (religions?.data?.length > 0) {
    const religionId = religions.data[0].id;
    await testAPI(`/master/castes/${religionId}`, `Get Castes for Religion ID ${religionId}`);
    
    // Test 4: Get religion hierarchy
    await testAPI(`/master/religions/${religionId}/hierarchy`, `Get Religion Hierarchy for ID ${religionId}`);
  }
  
  // Test 5: Get caste 1 sub-castes (assuming caste ID 1 exists)
  await testAPI('/master/sub-castes/1', 'Get Sub-Castes for Caste ID 1');
  
  // Test 6: Get all master data
  await testAPI('/master/all', 'Get All Master Data (Combined)');
  
  console.log('\n═══════════════════════════════════════════════');
  console.log('   ✅ All tests completed!');
  console.log('═══════════════════════════════════════════════\n');
}

// Run tests
runTests().catch(console.error);
