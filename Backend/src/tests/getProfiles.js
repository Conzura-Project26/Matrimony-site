import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNmFiMDk0ZS0yOTAwLTQ5N2YtYmIwZC0wMDBjYzkzYTI1ZGIiLCJtb2JpbGVfbnVtYmVyIjoiOTM4MDI0NTQzMyIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzcwMDQ2NDM5LCJleHAiOjE3NzAwNDczMzl9.SLAswerrmuFvVPd4IusNu1EAHme0BNLpSpZxhZcTNzk';

async function getProfiles() {
  try {
    const response = await axios.get(`${BASE_URL}/profiles?limit=5`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    });
    
    console.log('Profiles found:', response.data.data.profiles.length);
    console.log('\nFirst profile structure:', JSON.stringify(response.data.data.profiles[0], null, 2));
    response.data.data.profiles.forEach((profile, index) => {
      console.log(`\n${index + 1}. ${profile.full_name}`);
      console.log(`   User ID: ${profile.user_id || profile.id}`);
      console.log(`   Gender: ${profile.gender}, Age: ${profile.age}`);
    });
  } catch (error) {
    console.error('Error:', JSON.stringify(error.response?.data, null, 2) || error.message);
  }
}

getProfiles();
