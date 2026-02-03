/**
 * Setup Test Data for Interest Management Tests
 * Creates pending interests for testing cases 6, 8, 9, 10
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

// Test users
const USER1 = {
  phone: '9380245433',
  password: 'Harsha@2004',
  userId: 'f6ab094e-2900-497f-bb0d-000cc93a25db'
};

const USER2 = {
  phone: '9876543210', // MAT00000009
  password: 'Test@1234',
  userId: null // Will be fetched
};

async function setupTestData() {
  try {
    console.log('🔧 Setting up test data for interest management tests...\n');

    // Step 1: Login as User 1
    console.log('1️⃣  Logging in as User 1 (9380245433)...');
    const user1Login = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: USER1.phone,
      password: USER1.password
    });
    const user1Token = user1Login.data.data.accessToken;
    console.log('   ✓ User 1 logged in\n');

    // Step 2: Send a pending interest from User 1 (for withdrawal test - case 9)
    console.log('2️⃣  Sending interest from User 1 to create pending sent interest...');
    try {
      // Find a user to send interest to (not self, not already sent)
      // Let's try to find another user by checking matchmaking
      const matchmaking = await axios.get(`${BASE_URL}/matchmaking`, {
        headers: { Authorization: `Bearer ${user1Token}` },
        params: { limit: 10 }
      });
      
      if (matchmaking.data.data && matchmaking.data.data.length > 0) {
        const targetUser = matchmaking.data.data.find(u => 
          u.user_id !== USER1.userId && 
          !u.interest_sent
        );
        
        if (targetUser) {
          const sendResult = await axios.post(
            `${BASE_URL}/interests/${targetUser.user_id}`,
            { message: 'Test interest for withdrawal test' },
            { headers: { Authorization: `Bearer ${user1Token}` } }
          );
          console.log(`   ✓ Sent interest to ${targetUser.full_name} (ID: ${sendResult.data.data.interest_id})\n`);
        } else {
          console.log('   ⚠ No suitable user found to send interest\n');
        }
      }
    } catch (error) {
      console.log(`   ⚠ Could not send interest: ${error.response?.data?.message || error.message}\n`);
    }

    // Step 3: Login as User 2 (MAT00000009)
    console.log('3️⃣  Logging in as User 2 (9876543210 - MAT00000009)...');
    try {
      const user2Login = await axios.post(`${BASE_URL}/auth/login`, {
        identifier: USER2.phone,
        password: USER2.password
      });
      const user2Token = user2Login.data.data.accessToken;
      USER2.userId = user2Login.data.data.user.id;
      console.log(`   ✓ User 2 logged in (ID: ${USER2.userId})\n`);

      // Step 4: Send interest from User 2 to User 1 (for accept/reject tests - cases 6, 8)
      console.log('4️⃣  Sending interest from User 2 to User 1...');
      try {
        const sendResult = await axios.post(
          `${BASE_URL}/interests/${USER1.userId}`,
          { message: 'Test interest for accept/reject tests' },
          { headers: { Authorization: `Bearer ${user2Token}` } }
        );
        console.log(`   ✓ Sent interest (ID: ${sendResult.data.data.interest_id})\n`);
      } catch (error) {
        console.log(`   ⚠ Could not send interest: ${error.response?.data?.message || error.message}\n`);
      }
    } catch (error) {
      console.log(`   ⚠ Could not login as User 2: ${error.response?.data?.message || error.message}`);
      console.log('   ℹ This is expected if User 2 credentials are not set up\n');
    }

    // Step 5: Verify the setup
    console.log('5️⃣  Verifying setup...');
    const sentInterests = await axios.get(
      `${BASE_URL}/interests/sent?status=PENDING&limit=10`,
      { headers: { Authorization: `Bearer ${user1Token}` } }
    );
    const receivedInterests = await axios.get(
      `${BASE_URL}/interests/received?status=PENDING&limit=10`,
      { headers: { Authorization: `Bearer ${user1Token}` } }
    );

    console.log(`   ✓ User 1 has ${sentInterests.data.data.length} pending sent interests`);
    console.log(`   ✓ User 1 has ${receivedInterests.data.data.length} pending received interests\n`);

    console.log('✅ Test data setup complete!');
    console.log('📝 You can now run the interest management tests.\n');

  } catch (error) {
    console.error('❌ Error setting up test data:', error.response?.data || error.message);
  }
}

setupTestData();
