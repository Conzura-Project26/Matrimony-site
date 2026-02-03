import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testLogin() {
  try {
    console.log('Testing login with mobile: 9380245433');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      mobile_number: '9380245433',
      password: 'Test@123'
    });
    console.log('Login successful:', response.data);
  } catch (error) {
    console.error('Login failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data);
  }
}

testLogin();
