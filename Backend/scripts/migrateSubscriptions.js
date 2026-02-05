import prisma from '../src/config/prisma.js';
import logger from '../src/config/logger.js';

/**
 * Safe Migration Script: Backfill plan_id in subscriptions table
 * 
 * This script safely migrates existing subscriptions from plan_name (string)
 * to plan_id (foreign key) without downtime.
 * 
 * Steps:
 * 1. Find all subscriptions with plan_name but no plan_id
 * 2. Match plan_name to subscription_plans.code
 * 3. Update plan_id
 * 4. Validate migration
 * 
 * Run this AFTER:
 * - Prisma migration has added plan_id column (nullable)
 * - subscription_plans table is populated with default plans
 */

async function migratePlanNameToPlanId() {
  try {
    logger.info('🔄 Starting subscription migration: plan_name → plan_id');

    // Step 1: Get all subscriptions that need migration
    const subscriptionsToMigrate = await prisma.subscription.findMany({
      where: {
        plan_id: null,
        plan_name: {
          not: null,
        },
      },
      select: {
        id: true,
        user_id: true,
        plan_name: true,
      },
    });

    logger.info(`Found ${subscriptionsToMigrate.length} subscriptions to migrate`);

    if (subscriptionsToMigrate.length === 0) {
      logger.info('✅ No subscriptions need migration. All done!');
      return;
    }

    // Step 2: Get all plans for mapping
    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        version: 1, // Latest version only
      },
      select: {
        id: true,
        code: true,
        display_name: true,
      },
    });

    // Create plan_name → plan_id mapping
    const planMap = {};
    plans.forEach((plan) => {
      // Map both code and display_name to plan_id
      planMap[plan.code.toUpperCase()] = plan.id;
      planMap[plan.display_name.toUpperCase()] = plan.id;
    });

    logger.info(`Created mapping for ${plans.length} plans`);

    // Step 3: Migrate subscriptions
    let successCount = 0;
    let failCount = 0;
    const failures = [];

    for (const subscription of subscriptionsToMigrate) {
      try {
        const planNameUpper = subscription.plan_name.toUpperCase();
        const planId = planMap[planNameUpper];

        if (!planId) {
          failCount++;
          failures.push({
            subscription_id: subscription.id,
            plan_name: subscription.plan_name,
            reason: 'Plan not found',
          });
          logger.warn(`⚠️ No plan found for subscription ${subscription.id} with plan_name: ${subscription.plan_name}`);
          continue;
        }

        // Update subscription with plan_id
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            plan_id: planId,
          },
        });

        successCount++;
        logger.info(`✅ Migrated subscription ${subscription.id}: ${subscription.plan_name} → ${planId}`);
      } catch (error) {
        failCount++;
        failures.push({
          subscription_id: subscription.id,
          plan_name: subscription.plan_name,
          reason: error.message,
        });
        logger.error(`❌ Failed to migrate subscription ${subscription.id}:`, error.message);
      }
    }

    // Step 4: Summary
    logger.info('\n📊 Migration Summary:');
    logger.info(`✅ Successfully migrated: ${successCount}`);
    logger.info(`❌ Failed: ${failCount}`);

    if (failures.length > 0) {
      logger.warn('\n⚠️ Failed subscriptions:');
      console.table(failures);
    }

    // Step 5: Validation
    const remainingUnmigrated = await prisma.subscription.count({
      where: {
        plan_id: null,
        plan_name: {
          not: null,
        },
      },
    });

    logger.info(`\n🔍 Validation: ${remainingUnmigrated} subscriptions still need migration`);

    if (remainingUnmigrated === 0) {
      logger.info('🎉 Migration completed successfully! All subscriptions have been migrated.');
      logger.info('\n📝 Next steps:');
      logger.info('1. Review the migration results');
      logger.info('2. Test subscription-related features');
      logger.info('3. Once verified, you can make plan_id NOT NULL in a future migration');
      logger.info('4. Eventually remove the plan_name column (after backup)');
    } else {
      logger.warn('⚠️ Some subscriptions could not be migrated. Please review failures above.');
    }

    return {
      total: subscriptionsToMigrate.length,
      success: successCount,
      failed: failCount,
      failures,
    };
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Rollback function (if needed)
 * Clears plan_id for all subscriptions that were just migrated
 */
async function rollbackMigration() {
  try {
    logger.info('⏪ Rolling back migration...');

    const result = await prisma.subscription.updateMany({
      where: {
        plan_id: {
          not: null,
        },
      },
      data: {
        plan_id: null,
      },
    });

    logger.info(`✅ Rolled back ${result.count} subscriptions`);
  } catch (error) {
    logger.error('❌ Rollback failed:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    if (command === 'rollback') {
      await rollbackMigration();
    } else {
      await migratePlanNameToPlanId();
    }
  } catch (error) {
    logger.error('Migration script error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
