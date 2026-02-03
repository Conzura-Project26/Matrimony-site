/**
 * Create Test Interests Directly in Database
 * For testing cases 6, 8, 9, 10
 */

import prisma from '../config/prisma.js';

async function createTestInterests() {
  try {
    console.log('🔧 Creating test interests in database...\n');
    console.log('Prisma client:', typeof prisma, prisma ? 'loaded' : 'undefined');

    // Our test user
    const testUserId = 'f6ab094e-2900-497f-bb0d-000cc93a25db';

    // Step 1: Get all users
    console.log('1️⃣  Finding available users...');
    const users = await prisma.user.findMany({
      where: {
        id: { not: testUserId },
        is_active: true
      },
      take: 5,
      select: {
        id: true,
        full_name: true,
        profile_id: true
      }
    });

    console.log(`   ✓ Found ${users.length} other users\n`);

    if (users.length === 0) {
      console.log('❌ No other users found. Cannot create test data.');
      return;
    }

    // Step 2: Create a pending SENT interest (for withdrawal test - case 9)
    console.log('2️⃣  Creating pending SENT interest...');
    const targetUser1 = users[0];
    
    // Check if already exists
    const existingSent = await prisma.interest.findFirst({
      where: {
        sender_id: testUserId,
        receiver_id: targetUser1.id,
        status: 'PENDING'
      }
    });

    let sentInterestId;
    if (existingSent) {
      console.log(`   ℹ Pending sent interest already exists (ID: ${existingSent.id})`);
      sentInterestId = existingSent.id;
    } else {
      const sentInterest = await prisma.interest.create({
        data: {
          sender_id: testUserId,
          receiver_id: targetUser1.id,
          status: 'PENDING'
        }
      });      sentInterestId = sentInterest.id;
      console.log(`   ✓ Created sent interest to ${targetUser1.full_name} (ID: ${sentInterestId})`);
    }

    // Step 3: Create a pending RECEIVED interest (for accept test - case 6)
    console.log('\n3️⃣  Creating pending RECEIVED interest (for accept)...');
    const targetUser2 = users.length > 1 ? users[1] : users[0];
    
    const existingReceived1 = await prisma.interest.findFirst({
      where: {
        sender_id: targetUser2.id,
        receiver_id: testUserId,
        status: 'PENDING'
      }
    });

    let receivedInterestId1;
    if (existingReceived1) {
      console.log(`   ℹ Pending received interest already exists (ID: ${existingReceived1.id})`);
      receivedInterestId1 = existingReceived1.id;
    } else {
      const receivedInterest1 = await prisma.interest.create({
        data: {
          sender_id: targetUser2.id,
          receiver_id: testUserId,
          status: 'PENDING'
        }
      });
      receivedInterestId1 = receivedInterest1.id;
      console.log(`   ✓ Created received interest from ${targetUser2.full_name} (ID: ${receivedInterestId1})`);
    }

    // Step 4: Create another pending RECEIVED interest (for reject test - case 8)
    console.log('\n4️⃣  Creating pending RECEIVED interest (for reject)...');
    const targetUser3 = users.length > 2 ? users[2] : users[0];
    
    const existingReceived2 = await prisma.interest.findFirst({
      where: {
        sender_id: targetUser3.id,
        receiver_id: testUserId,
        status: 'PENDING'
      }
    });

    let receivedInterestId2;
    if (existingReceived2) {
      console.log(`   ℹ Pending received interest already exists (ID: ${existingReceived2.id})`);
      receivedInterestId2 = existingReceived2.id;
    } else {
      const receivedInterest2 = await prisma.interest.create({
        data: {
          sender_id: targetUser3.id,
          receiver_id: testUserId,
          status: 'PENDING'
        }
      });
      receivedInterestId2 = receivedInterest2.id;
      console.log(`   ✓ Created received interest from ${targetUser3.full_name} (ID: ${receivedInterestId2})`);
    }

    // Step 5: Verify
    console.log('\n5️⃣  Verifying test data...');
    const sentCount = await prisma.interest.count({
      where: {
        sender_id: testUserId,
        status: 'PENDING'
      }
    });
    const receivedCount = await prisma.interest.count({
      where: {
        receiver_id: testUserId,
        status: 'PENDING'
      }
    });

    console.log(`   ✓ Test user has ${sentCount} pending sent interests`);
    console.log(`   ✓ Test user has ${receivedCount} pending received interests`);

    console.log('\n✅ Test data created successfully!');
    console.log('\n📝 Test Interest IDs:');
    console.log(`   - Sent (for withdrawal): ${sentInterestId}`);
    console.log(`   - Received (for accept): ${receivedInterestId1}`);
    console.log(`   - Received (for reject): ${receivedInterestId2}`);
    console.log('\n🚀 You can now run: node src/tests/interest-management.test.js\n');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

createTestInterests();
