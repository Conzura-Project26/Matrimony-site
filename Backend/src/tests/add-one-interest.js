/**
 * Add one more pending received interest for reject test
 */

import prisma from '../config/prisma.js';

async function addOneMoreInterest() {
  try {
    console.log('Adding one more pending received interest for reject test...\n');

    const testUserId = 'f6ab094e-2900-497f-bb0d-000cc93a25db';

    // Find users who haven't sent interest to test user yet
    const users = await prisma.user.findMany({
      where: {
        id: { not: testUserId },
        is_active: true
      },
      take: 10
    });

    console.log(`Found ${users.length} potential users`);

    // Check which ones haven't sent interest
    for (const user of users) {
      const existing = await prisma.interest.findFirst({
        where: {
          sender_id: user.id,
          receiver_id: testUserId
        }
      });

      if (!existing) {
        // Create interest from this user
        const interest = await prisma.interest.create({
          data: {
            sender_id: user.id,
            receiver_id: testUserId,
            status: 'PENDING'
          }
        });

        console.log(`✓ Created interest from ${user.full_name} (ID: ${interest.id})`);
        console.log('\n✅ Done! Run the tests again.\n');
        return;
      }
    }

    console.log('⚠ All users have already sent interests. Cannot create more.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addOneMoreInterest();
