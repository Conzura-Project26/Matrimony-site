import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNmFiMDk0ZS0yOTAwLTQ5N2YtYmIwZC0wMDBjYzkzYTI1ZGIiLCJtb2JpbGVfbnVtYmVyIjoiOTM4MDI0NTQzMyIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzcwMDQ2NDM5LCJleHAiOjE3NzAwNDczMzl9.SLAswerrmuFvVPd4IusNu1EAHme0BNLpSpZxhZcTNzk';
const TARGET_USER_ID = '041fe552-f42f-40a5-b5b9-9fcc3b56fdcd';

async function debugStatus() {
  try {
    // First add to shortlist
    console.log('Adding to shortlist...');
    const addResponse = await axios.post(`${BASE_URL}/shortlist/${TARGET_USER_ID}`, {}, {
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });
    console.log('Add response:', JSON.stringify(addResponse.data, null, 2));
    
    // Then check status
    console.log('\nChecking status...');
    const statusResponse = await axios.get(`${BASE_URL}/shortlist/${TARGET_USER_ID}/status`, {
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });
    console.log('Status response:', JSON.stringify(statusResponse.data, null, 2));
  } catch (error) {
    console.error('Error:', JSON.stringify(error.response?.data, null, 2) || error.message);
  }
}

debugStatus();
