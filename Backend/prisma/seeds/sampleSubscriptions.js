/**
 * Seed Sample Subscriptions
 * Creates test users with subscriptions that persist in database
 */

import prisma from '../../src/config/prisma.js';
import logger from '../../src/config/logger.js';
import bcrypt from 'bcrypt';

async function seedSampleSubscriptions() {
  try {
    logger.info('🌱 Seeding sample subscriptions...');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Get all plans
    const plans = await prisma.subscriptionPlan.findMany({
      where: { is_active: true },
      orderBy: { priority: 'asc' },
    });

    logger.info(`Found ${plans.length} active plans`);

    // Get USER role
    const userRole = await prisma.role.findUnique({
      where: { role_name: 'USER' },
    });

    if (!userRole) {
      throw new Error('USER role not found');
    }

    const hashedPassword = await bcrypt.hash('Test@1234', 10);

    // Create sample users with different plans
    const sampleUsers = [
      {
        name: 'Rahul Sharma',
        mobile: '+919876543210',
        gender: 'Male',
        dob: '1995-03-15',
        planCode: 'FREE_MONTHLY',
      },
      {
        name: 'Priya Patel',
        mobile: '+919876543211',
        gender: 'Female',
        dob: '1997-07-22',
        planCode: 'BASIC_MONTHLY',
      },
      {
        name: 'Amit Kumar',
        mobile: '+919876543212',
        gender: 'Male',
        dob: '1993-11-08',
        planCode: 'PREMIUM_MONTHLY',
      },
      {
        name: 'Sneha Reddy',
        mobile: '+919876543213',
        gender: 'Female',
        dob: '1996-05-30',
        planCode: 'GOLD_MONTHLY',
      },
      {
        name: 'Vikram Singh',
        mobile: '+919876543214',
        gender: 'Male',
        dob: '1994-09-12',
        planCode: 'FREE_MONTHLY',
      },
    ];

    let createdCount = 0;

    for (const userData of sampleUsers) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { mobile_number: userData.mobile },
        });

        if (existingUser) {
          logger.info(`⏭️  User ${userData.name} already exists, skipping...`);
          continue;
        }

        // Find the plan
        const plan = plans.find((p) => p.code === userData.planCode);
        
        if (!plan) {
          logger.warn(`⚠️  Plan ${userData.planCode} not found, skipping ${userData.name}`);
          continue;
        }

        // Create user and subscription in transaction
        const result = await prisma.$transaction(async (tx) => {
          // Create user
          const user = await tx.user.create({
            data: {
              role_id: userRole.id,
              mobile_number: userData.mobile,
              password_hash: hashedPassword,
              full_name: userData.name,
              gender: userData.gender,
              date_of_birth: new Date(userData.dob),
              profile_created_by: 'Self',
              is_mobile_verified: true,
            },
          });

          // Create subscription
          const startDate = new Date();
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + plan.duration_days);

          const subscription = await tx.subscription.create({
            data: {
              user_id: user.id,
              plan_id: plan.id,
              plan_name: plan.display_name,
              start_date: startDate,
              end_date: endDate,
              status: 'ACTIVE',
              auto_renew: plan.priority === 0 ? true : false, // Free auto-renews, paid doesn't
              created_at: new Date(),
              updated_at: new Date(),
            },
          });

          return { user, subscription };
        });

        createdCount++;
        logger.info(`✅ Created: ${userData.name} → ${plan.display_name} (₹${plan.price_amount / 100})`);
      } catch (error) {
        logger.error(`❌ Failed to create ${userData.name}:`, error.message);
      }
    }

    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Show summary
    const totalSubs = await prisma.subscription.count();
    const activeSubs = await prisma.subscription.count({
      where: { status: 'ACTIVE' },
    });

    logger.info('📊 Database Summary:');
    logger.info(`   Total Subscriptions: ${totalSubs}`);
    logger.info(`   Active Subscriptions: ${activeSubs}`);
    logger.info(`   New Users Created: ${createdCount}`);

    // Show all subscriptions
    const allSubs = await prisma.subscription.findMany({
      include: {
        user: {
          select: {
            full_name: true,
            mobile_number: true,
          },
        },
        plan: {
          select: {
            code: true,
            display_name: true,
            price_amount: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('📋 All Subscriptions in Database:');
    allSubs.forEach((sub, idx) => {
      logger.info(
        `   ${idx + 1}. ${sub.user.full_name} (${sub.user.mobile_number}) → ${sub.plan.display_name} (₹${sub.plan.price_amount / 100}) - ${sub.status}`
      );
    });
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('🎉 Sample subscriptions seeded successfully!');
    logger.info('🔍 Check your Supabase table editor - you should see data now!');

  } catch (error) {
    logger.error('❌ Error seeding subscriptions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedSampleSubscriptions()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
