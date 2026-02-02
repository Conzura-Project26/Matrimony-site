import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNmFiMDk0ZS0yOTAwLTQ5N2YtYmIwZC0wMDBjYzkzYTI1ZGIiLCJtb2JpbGVfbnVtYmVyIjoiOTM4MDI0NTQzMyIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzcwMDQ2NDM5LCJleHAiOjE3NzAwNDczMzl9.SLAswerrmuFvVPd4IusNu1EAHme0BNLpSpZxhZcTNzk';

async function debugShortlist() {
  try {
    // First add a profile
    console.log('Adding profile to shortlist...');
    const addResponse = await axios.post(`${BASE_URL}/shortlist/041fe552-f42f-40a5-b5b9-9fcc3b56fdcd`, {}, {
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });
    console.log('Add response:', JSON.stringify(addResponse.data, null, 2));
    
    // Then get the list
    console.log('\nGetting shortlist...');
    const response = await axios.get(`${BASE_URL}/shortlist`, {
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });
    
    console.log('\nFull Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data.profiles.length > 0) {
      console.log('\nFirst profile:', JSON.stringify(response.data.data.profiles[0], null, 2));
    }
  } catch (error) {
    console.error('Error:', JSON.stringify(error.response?.data, null, 2) || error.message);
  }
}

debugShortlist();
