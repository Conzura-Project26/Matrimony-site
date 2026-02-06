import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:3000';

async function getToken() {
  console.log('🔑 Getting authentication token...\n');
  
  try {
    // Try to login
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: '9380422508',
      password: 'Nishanth@2005',
    });
    
    console.log('✅ Login successful!\n');
    console.log('Your token:');
    console.log('─'.repeat(80));
    console.log(response.data.token);
    console.log('─'.repeat(80));
    console.log('\nUser ID:', response.data.user.user_id || response.data.user.id);
    console.log('Role:', response.data.user.role);
    console.log('\n📝 Copy the token above and paste it into featureGating.test.js');
    console.log('   Update the ADMIN_TOKEN variable at the top of the file.');
    
  } catch (error) {
    console.error('❌ Login failed!');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  SERVER IS NOT RUNNING!');
      console.error('   Please start the server first:');
      console.error('   → cd Backend');
      console.error('   → npm run dev');
      console.error('\n   Then run this script again.');
    } else if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Error:', error.message);
    }
    
    process.exit(1);
  }
}

getToken();
