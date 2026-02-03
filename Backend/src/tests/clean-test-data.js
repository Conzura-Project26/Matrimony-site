/**
 * Clean Test Data
 * Removes any existing interests sent by the test user
 */

import prisma from '../src/config/prisma.js';

const TEST_USER_ID = 'f6ab094e-2900-497f-bb0d-000cc93a25db';

async function cleanTestData() {
  console.log('🧹 Cleaning test data...\n');

  try {
    // Delete all interests sent by test user
    const deletedInterests = await prisma.interest.deleteMany({
      where: { sender_id: TEST_USER_ID }
    });
    console.log(`✓ Deleted ${deletedInterests.count} interests sent by test user`);

    // Delete all interests received by test user
    const deletedReceivedInterests = await prisma.interest.deleteMany({
      where: { receiver_id: TEST_USER_ID }
    });
    console.log(`✓ Deleted ${deletedReceivedInterests.count} interests received by test user`);

    // Delete notifications for test user
    const deletedNotifications = await prisma.notification.deleteMany({
      where: { 
        OR: [
          { user_id: TEST_USER_ID },
          { related_user_id: TEST_USER_ID }
        ]
      }
    });
    console.log(`✓ Deleted ${deletedNotifications.count} notifications for test user`);

    console.log('\n✅ Test data cleaned successfully!\n');
  } catch (error) {
    console.error('❌ Error cleaning test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestData();
