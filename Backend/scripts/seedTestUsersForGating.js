import prisma from '../src/config/prisma.js';
import bcrypt from 'bcrypt';

async function seedTestUsers() {
  console.log('\n🌱 Seeding test users for feature gating tests...\n');

  // Get all plans
  const plans = await prisma.subscriptionPlan.findMany({
    where: {
      code: { in: ['FREE', 'BASIC', 'PREMIUM', 'GOLD'] },
      is_active: true,
    },
  });

  const planMap = {};
  plans.forEach(p => planMap[p.code] = p);

  console.log(`✅ Found ${plans.length} plans\n`);

  // Admin user (already exists as ADMIN role)
  const admin = await prisma.user.findUnique({
    where: { mobile_number: '9380422508' },
    include: { subscriptions: { where: { is_active: true } } },
  });

  if (admin) {
    console.log(`✅ Admin user exists: ${admin.mobile_number}`);
    // Update admin to GOLD plan if not already
    if (!admin.subscriptions.find(s => s.plan_id === planMap.GOLD.id)) {
      await prisma.subscription.updateMany({
        where: { user_id: admin.id, is_active: true },
        data: { is_active: false },
      });
      
      await prisma.subscription.create({
        data: {
          user_id: admin.id,
          plan_id: planMap.GOLD.id,
          plan_name: planMap.GOLD.display_name,
          start_date: new Date(),
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          is_active: true,
        },
      });
      console.log(`   ✅ Assigned GOLD plan to admin`);
    }
  }

  // Get USER role
  const userRole = await prisma.role.findUnique({
    where: { role_name: 'USER' },
  });

  // Test users to create/update
  const testUsers = [
    { mobile: '9380245433', name: 'Harsha Kumar M R', plan: 'FREE', password: 'Test@123' },
    { mobile: '9380245434', name: 'Basic Test User', plan: 'BASIC', password: 'Test@123' },
    { mobile: '9380245435', name: 'Premium Test User', plan: 'PREMIUM', password: 'Test@123' },
    { mobile: '9380245436', name: 'Gold Test User', plan: 'GOLD', password: 'Test@123' },
    { mobile: '9380245437', name: 'Target User', plan: 'FREE', password: 'Test@123' },
  ];

  for (const testUser of testUsers) {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { mobile_number: testUser.mobile },
      include: { subscriptions: { where: { is_active: true } } },
    });

    if (!user) {
      // Create user
      const password_hash = await bcrypt.hash(testUser.password, 10);
      
      user = await prisma.user.create({
        data: {
          role_id: userRole.id,
          mobile_number: testUser.mobile,
          password_hash,
          full_name: testUser.name,
          gender: 'Male',
          date_of_birth: new Date('1990-01-01'),
          profile_created_by: 'Self',
          is_mobile_verified: true,
          is_active: true,
        },
      });
      console.log(`✅ Created user: ${testUser.mobile} (${testUser.name})`);
    } else {
      console.log(`✅ User exists: ${testUser.mobile} (${user.full_name})`);
      
      // Reset password to Test@123 for consistency
      const password_hash = await bcrypt.hash(testUser.password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password_hash },
      });
      console.log(`   ✅ Password reset to Test@123`);
    }

    // Update subscription to target plan
    const targetPlan = planMap[testUser.plan];
    if (!user.subscriptions?.find(s => s.plan_id === targetPlan.id)) {
      // Deactivate existing subscriptions
      await prisma.subscription.updateMany({
        where: { user_id: user.id, is_active: true },
        data: { is_active: false },
      });

      // Create new subscription
      await prisma.subscription.create({
        data: {
          user_id: user.id,
          plan_id: targetPlan.id,
          plan_name: targetPlan.display_name,
          start_date: new Date(),
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          is_active: true,
        },
      });
      console.log(`   ✅ Assigned ${testUser.plan} plan`);
    } else {
      console.log(`   ✅ Already has ${testUser.plan} plan`);
    }
  }

  console.log('\n✅ Test users seeded successfully!\n');
  console.log('Test Credentials:');
  console.log('  Admin:   9380422508 / Nishanth@2005  (GOLD)');
  console.log('  FREE:    9380245433 / Test@123       (FREE)');
  console.log('  BASIC:   9380245434 / Test@123       (BASIC)');
  console.log('  PREMIUM: 9380245435 / Test@123       (PREMIUM)');
  console.log('  GOLD:    9380245436 / Test@123       (GOLD)');
  console.log('  Target:  9380245437 / Test@123       (FREE)\n');
}

seedTestUsers()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
