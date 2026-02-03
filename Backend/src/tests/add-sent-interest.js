/**
 * Add pending sent interest for withdrawal test
 */

import prisma from '../config/prisma.js';

async function addSentInterest() {
  try {
    console.log('Adding pending sent interest for withdrawal test...\n');

    const testUserId = 'f6ab094e-2900-497f-bb0d-000cc93a25db';

    // Find users who test user hasn't sent interest to yet
    const users = await prisma.user.findMany({
      where: {
        id: { not: testUserId },
        is_active: true
      },
      take: 10
    });

    console.log(`Found ${users.length} potential users`);

    // Check which ones test user hasn't sent interest to
    for (const user of users) {
      const existing = await prisma.interest.findFirst({
        where: {
          sender_id: testUserId,
          receiver_id: user.id
        }
      });

      if (!existing) {
        // Create interest to this user
        const interest = await prisma.interest.create({
          data: {
            sender_id: testUserId,
            receiver_id: user.id,
            status: 'PENDING'
          }
        });

        console.log(`✓ Created sent interest to ${user.full_name} (ID: ${interest.id})`);
        console.log('\n✅ Done! Run the tests again.\n');
        return;
      }
    }

    console.log('⚠ Test user has already sent interests to all users. Cannot create more.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addSentInterest();
