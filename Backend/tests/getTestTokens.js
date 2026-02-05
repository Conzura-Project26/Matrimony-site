import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

/**
 * This script helps you get JWT tokens for testing
 * Update the credentials below with actual user data from your database
 */

async function getToken(credentials, role) {
  try {
    console.log(`\n🔐 Getting ${role} token...`);
    console.log(`Mobile: ${credentials.mobile_number}`);

    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      mobile_number: credentials.mobile_number,
      password: credentials.password,
    });
    
    if (response.data.success && response.data.data.access_token) {
      console.log(`✅ ${role} Token Retrieved:`);
      console.log(response.data.data.access_token);
      console.log('');
      return response.data.data.access_token;
    } else {
      console.log(`❌ Unexpected response format:`, response.data);
    }
  } catch (error) {
    console.error(`❌ Failed to get ${role} token:`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Response:`, error.response.data);
    } else {
      console.log(error.message);
    }
    console.log('');
  }
  return null;
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           GET TEST AUTHENTICATION TOKENS                       ║
║                                                                ║
║  Update credentials below and run: node tests/getTestTokens.js ║
╚════════════════════════════════════════════════════════════════╝
  `);

  console.log('📝 INSTRUCTIONS:');
  console.log('1. Find ADMIN and USER mobile numbers from your database');
  console.log('2. Update the credentials below in this file');
  console.log('3. Run this script again\n');

  // ⚠️ UPDATE THESE WITH YOUR ACTUAL DATABASE USER CREDENTIALS
  const ADMIN_CREDENTIALS = {
    mobile_number: '9999999999',  // Replace with admin mobile from DB
    password: 'Admin@123',        // Replace with admin password
  };

  const USER_CREDENTIALS = {
    mobile_number: '9876543210',  // Replace with user mobile from DB
    password: 'User@123',         // Replace with user password
  };

  const adminToken = await getToken(ADMIN_CREDENTIALS, 'ADMIN');
  const userToken = await getToken(USER_CREDENTIALS, 'USER');

  console.log('\n' + '='.repeat(70));
  console.log('📋 COPY THESE TO tests/planManagement.test.js:');
  console.log('='.repeat(70) + '\n');
  
  if (adminToken) {
    console.log('const ADMIN_TOKEN = \'' + adminToken + '\';');
  } else {
    console.log('const ADMIN_TOKEN = \'YOUR_ADMIN_TOKEN_HERE\';  // ❌ Failed to get token');
  }
  
  if (userToken) {
    console.log('const USER_TOKEN = \'' + userToken + '\';');
  } else {
    console.log('const USER_TOKEN = \'YOUR_USER_TOKEN_HERE\';   // ❌ Failed to get token');
  }
  
  console.log('\n' + '='.repeat(70));
  
  if (!adminToken || !userToken) {
    console.log('\n⚠️  TO FIX:');
    console.log('1. Query your database: SELECT mobile_number, role_id FROM users WHERE role_id IN (1,2);');
    console.log('2. Find an ADMIN user (role_id = 1) and a regular USER (role_id = 3)');
    console.log('3. Update credentials in this file and run again');
    console.log('');
    console.log('OR create test users:');
    console.log('- Register via /api/auth/register');
    console.log('- Update role_id in database to 1 for admin');
  }
}

main();
