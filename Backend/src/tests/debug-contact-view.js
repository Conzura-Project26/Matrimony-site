import axios from 'axios';

async function testContactView() {
  try {
    // Login as FREE user
    const loginResponse = await axios.post('http://127.0.0.1:3000/auth/login', {
      identifier: '9380245433',
      password: 'Test@123'
    });
    
    console.log('✓ Login successful');
    console.log('Token:', loginResponse.data.data.accessToken.substring(0, 50) + '...');
    
    const token = loginResponse.data.data.accessToken;
    const targetUserId = '5b55465b-9a5b-4bc8-bb47-3bb633c769ad';
    
    // Try to view contact
    const viewResponse = await axios.get(
      `http://127.0.0.1:3000/contacts/${targetUserId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✓ Contact view successful');
    console.log('Response:', JSON.stringify(viewResponse.data, null, 2));
    
  } catch (error) {
    console.error('✗ Error occurred:');
    console.error('Status:', error.response?.status);
    console.error('Error:', JSON.stringify(error.response?.data, null, 2));
    console.error('Full error:', error.message);
  }
}

testContactView();
