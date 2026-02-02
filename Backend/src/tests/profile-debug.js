/**
 * Simple debug test for profile listing endpoint
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNmFiMDk0ZS0yOTAwLTQ5N2YtYmIwZC0wMDBjYzkzYTI1ZGIiLCJtb2JpbGVfbnVtYmVyIjoiOTM4MDI0NTQzMyIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzcwMDIwOTk2LCJleHAiOjE3NzAwMjE4OTZ9.D2VSlDh6tN-ZSrdMRbv2EdNeQKRnjfZxOs4csBtahm8';

console.log('🔍 Testing profile listing endpoint...\n');
console.log(`URL: ${BASE_URL}/profiles`);
console.log(`Token: ${ACCESS_TOKEN.substring(0, 30)}...`);
console.log('\n');

try {
  const response = await axios.get(`${BASE_URL}/profiles`, {
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    timeout: 10000
  });
  
  console.log('✅ Request successful!');
  console.log('Status:', response.status);
  console.log('Success:', response.data.success);
  console.log('Profile count:', response.data.data.profiles.length);
  console.log('Total profiles:', response.data.data.pagination.total);
  console.log('\nFirst profile:');
  console.log(JSON.stringify(response.data.data.profiles[0], null, 2));
  
} catch (error) {
  console.error('❌ Request failed!\n');
  console.error('Error type:', error.constructor.name);
  console.error('Message:', error.message);
  
  if (error.response) {
    console.error('\nResponse data:');
    console.error('Status:', error.response.status);
    console.error('Data:', JSON.stringify(error.response.data, null, 2));
  } else if (error.request) {
    console.error('\nNo response received');
    console.error('Request was made but no response');
  } else {
    console.error('\nRequest setup error');
    console.error(error.stack);
  }
}
