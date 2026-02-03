/**
 * Setup multiple test interests for comprehensive testing
 * Creates 2 pending received interests and 2 pending sent interests
 */

import prisma from '../config/prisma.js';

async function setupMultipleInterests() {
  try {
    console.log('🔧 Setting up multiple test interests...\n');

    const testUserId = 'f6ab094e-2900-497f-bb0d-000cc93a25db';

    // Get all available users
    const users = await prisma.user.findMany({
      where: {
        id: { not: testUserId },
        is_active: true
      },
      take: 10
    });

    console.log(`Found ${users.length} potential users\n`);

    // Add 2 pending RECEIVED interests (for accept and reject tests)
    console.log('Adding 2 pending RECEIVED interests...');
    let receivedCount = 0;
    for (const user of users) {
      if (receivedCount >= 2) break;

      const existing = await prisma.interest.findFirst({
        where: {
          sender_id: user.id,
          receiver_id: testUserId
        }
      });

      if (!existing) {
        const interest = await prisma.interest.create({
          data: {
            sender_id: user.id,
            receiver_id: testUserId,
            status: 'PENDING'
          }
        });
        console.log(`  ✓ ${receivedCount + 1}. From ${user.full_name} (ID: ${interest.id})`);
        receivedCount++;
      }
    }

    // Add 2 pending SENT interests (for withdrawal tests)
    console.log('\nAdding 2 pending SENT interests...');
    let sentCount = 0;
    for (const user of users) {
      if (sentCount >= 2) break;

      const existing = await prisma.interest.findFirst({
        where: {
          sender_id: testUserId,
          receiver_id: user.id
        }
      });

      if (!existing) {
        const interest = await prisma.interest.create({
          data: {
            sender_id: testUserId,
            receiver_id: user.id,
            status: 'PENDING'
          }
        });
        console.log(`  ✓ ${sentCount + 1}. To ${user.full_name} (ID: ${interest.id})`);
        sentCount++;
      }
    }

    // Verify
    console.log('\n📊 Verification:');
    const pendingSent = await prisma.interest.count({
      where: { sender_id: testUserId, status: 'PENDING' }
    });
    const pendingReceived = await prisma.interest.count({
      where: { receiver_id: testUserId, status: 'PENDING' }
    });

    console.log(`  ✓ ${pendingSent} pending sent interests`);
    console.log(`  ✓ ${pendingReceived} pending received interests`);

    console.log('\n✅ Setup complete! Run tests now.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupMultipleInterests();
