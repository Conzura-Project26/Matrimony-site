/**
 * Debug JWT token structure
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:3000';

async function debugToken() {
  console.log('\n🔍 Debugging JWT Token Structure\n');
  
  try {
    // Login
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: '9380245433',
      password: 'Harsha@2004'
    });

    const token = response.data.data.accessToken;
    console.log('✅ Login successful\n');
    
    // Decode token (without verification)
    const decoded = jwt.decode(token);
    
    console.log('📦 JWT Token Payload:');
    console.log(JSON.stringify(decoded, null, 2));
    
    console.log('\n🔑 Key Fields:');
    console.log(`userId: ${decoded.userId}`);
    console.log(`role: ${decoded.role}`);
    console.log(`typeof role: ${typeof decoded.role}`);
    
    // Test admin endpoint
    console.log('\n🧪 Testing admin endpoint...\n');
    const testResponse = await axios.get(`${BASE_URL}/admin/users?limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      validateStatus: () => true
    });
    
    console.log(`Status: ${testResponse.status}`);
    console.log(`Response:`, JSON.stringify(testResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

debugToken();
