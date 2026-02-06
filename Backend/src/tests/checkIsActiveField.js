/**
 * Check is_active field status
 */

import prisma from '../config/prisma.js';
import logger from '../config/logger.js';

async function checkIsActiveField() {
  try {
    const subs = await prisma.subscription.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            full_name: true,
            mobile_number: true,
          },
        },
        plan: {
          select: {
            display_name: true,
            code: true,
          },
        },
      },
    });

    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('📊 Recent Subscriptions (is_active field check)');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    subs.forEach((sub, idx) => {
      logger.info(`${idx + 1}. ${sub.user.full_name} - ${sub.plan.display_name}`);
      logger.info(`   Status: ${sub.status}`);
      logger.info(`   is_active: ${sub.is_active}`);
      logger.info(`   ${sub.status === 'ACTIVE' && sub.is_active ? '✅ Correct!' : sub.status === 'CANCELLED' && !sub.is_active ? '✅ Correct!' : '❌ MISMATCH!'}\n`);
    });

    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

checkIsActiveField();
