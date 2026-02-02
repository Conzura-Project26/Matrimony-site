import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: '9380245433',
      password: 'Harsha@2004'
    });
    
    console.log('Login successful!');
    console.log('\nFull response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data) {
      console.log('\nUser ID:', response.data.data.user?.id || response.data.data.userId);
      console.log('Access Token:', response.data.data.accessToken);
    } else {
      console.log('\nUser ID:', response.data.user?.id || response.data.userId);
      console.log('Access Token:', response.data.accessToken);
    }
  } catch (error) {
    console.error('Login failed:', JSON.stringify(error.response?.data, null, 2) || error.message);
  }
}

login();
