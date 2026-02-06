import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:3000';

async function testContactEndpoint() {
  try {
    // Login first
    console.log('🔐 Logging in...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: '9380422508',
      password: 'Nishanth@2005',
    });
    
    const token = loginRes.data.data.accessToken;
    const userId = loginRes.data.data.user.id;
    console.log(`✅ Logged in: ${userId}\n`);
    
    // Try viewing target user's contact
    const targetUserId = '5b55465b-9a5b-4bc8-bb47-3bb633c769ad';  // Target user
    
    console.log(`📞 Attempting to view contact: ${targetUserId}`);
    const contactRes = await axios.get(
      `${BASE_URL}/contacts/${targetUserId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✅ Success!');
    console.log(JSON.stringify(contactRes.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:');
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Response:`, error.response?.data);
    console.error(`   Message: ${error.message}`);
    
    if (error.response?.data?.error?.details) {
      console.error('\n📋 Validation Details:');
      error.response.data.error.details.forEach(d => {
        console.error(`   - ${d.field}: ${d.message}`);
      });
    }
  }
}

testContactEndpoint();
