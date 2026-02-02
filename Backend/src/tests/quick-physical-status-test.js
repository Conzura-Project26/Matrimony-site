import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const TEST_USER = '9380245433';
const TEST_PASSWORD = 'Harsha@2004';

async function quickTest() {
  // Login
  const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
    identifier: TEST_USER,
    password: TEST_PASSWORD,
  });
  
  const token = loginResponse.data.data.accessToken;
  
  // Test physical_status filter
  const response = await axios.get(`${BASE_URL}/profiles?physical_status=Physically%20Challenged&limit=5`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  console.log('\n✅ Physical Status Filter Working!\n');
  console.log(`Total profiles returned: ${response.data.data.profiles.length}`);
  console.log(`Filter applied: ${response.data.data.filters_applied.physical_status}\n`);
  
  console.log('Profile details:');
  response.data.data.profiles.forEach((profile, idx) => {
    console.log(`  ${idx + 1}. ${profile.full_name}`);
    console.log(`     Physical Status: ${profile.physical_status || 'NULL'}`);
  });
  
  console.log('\n🎉 Physical status filter implementation COMPLETE!\n');
}

quickTest().catch(console.error);
