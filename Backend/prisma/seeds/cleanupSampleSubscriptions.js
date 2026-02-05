/**
 * Cleanup Sample Subscriptions
 * Removes the test users created by sampleSubscriptions.js
 */

import prisma from '../../src/config/prisma.js';
import logger from '../../src/config/logger.js';

async function cleanupSampleSubscriptions() {
  try {
    logger.info('🧹 Cleaning up sample subscriptions...');

    const sampleMobiles = [
      '+919876543210',
      '+919876543211',
      '+919876543212',
      '+919876543213',
      '+919876543214',
    ];

    // Get user IDs
    const users = await prisma.user.findMany({
      where: {
        mobile_number: {
          in: sampleMobiles,
        },
      },
      select: { id: true },
    });

    const userIds = users.map((u) => u.id);

    // Delete subscriptions first
    const subsDeleted = await prisma.subscription.deleteMany({
      where: {
        user_id: {
          in: userIds,
        },
      },
    });

    // Then delete users
    const usersDeleted = await prisma.user.deleteMany({
      where: {
        mobile_number: {
          in: sampleMobiles,
        },
      },
    });

    logger.info(`✅ Deleted ${subsDeleted.count} subscriptions and ${usersDeleted.count} users`);
    logger.info('🎉 Cleanup complete!');
  } catch (error) {
    logger.error('❌ Error cleaning up:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupSampleSubscriptions()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
