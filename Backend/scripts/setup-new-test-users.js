/**
 * Create New Test Users for Task 5.5 - User Reporting
 */

import prisma from '../src/config/prisma.js';
import bcrypt from 'bcrypt';

const NEW_TEST_USERS = [
  {
    mobile: '9876543210',
    password: 'TestUser1@2024',
    name: 'Amit Patel',
    email: 'amit.tester@test.com',
    roleId: 3, // USER
    gender: 'Male',
    dob: new Date('1995-01-15'),
    purpose: 'Reporter User A'
  },
  {
    mobile: '9876543211',
    password: 'TestUser2@2024',
    name: 'Priya Singh',
    email: 'priya.tester@test.com',
    roleId: 3, // USER
    gender: 'Female',
    dob: new Date('1996-03-20'),
    purpose: 'Reported User B'
  },
  {
    mobile: '9876543212',
    password: 'TestUser3@2024',
    name: 'Rajesh Kumar',
    email: 'rajesh.tester@test.com',
    roleId: 3, // USER
    gender: 'Male',
    dob: new Date('1997-07-10'),
    purpose: 'Second Reporter User C'
  },
  {
    mobile: '9876543213',
    password: 'TestMod@2024',
    name: 'Sneha Moderator',
    email: 'sneha.mod@test.com',
    roleId: 2, // MODERATOR
    gender: 'Female',
    dob: new Date('1994-11-25'),
    purpose: 'Moderator User'
  }
];

async function createTestUsers() {
  console.log('\n🔧 Creating new test users for Task 5.5 User Reporting...\n');

  const createdUsers = [];

  for (const userData of NEW_TEST_USERS) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { mobile_number: userData.mobile }
      });

      if (existingUser) {
        console.log(`⚠️  User already exists: ${userData.name} (${userData.mobile})`);
        console.log(`   User ID: ${existingUser.id}`);
        console.log(`   Purpose: ${userData.purpose}\n`);
        createdUsers.push(existingUser);
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 10);

      // Create user
      const newUser = await prisma.user.create({
        data: {
          mobile_number: userData.mobile,
          password_hash: passwordHash,
          full_name: userData.name,
          email: userData.email,
          role_id: userData.roleId,
          gender: userData.gender,
          date_of_birth: userData.dob,
          profile_created_by: 'Self',
          is_mobile_verified: true,
          is_active: true
        }
      });

      console.log(`✅ Created: ${userData.name} (${userData.mobile})`);
      console.log(`   User ID: ${newUser.id}`);
      console.log(`   Role: ${userData.roleId === 2 ? 'MODERATOR' : 'USER'}`);
      console.log(`   Purpose: ${userData.purpose}\n`);

      createdUsers.push(newUser);

    } catch (error) {
      console.error(`❌ Error creating ${userData.name}:`, error.message);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📋 TEST USER SUMMARY\n');

  createdUsers.forEach((user, index) => {
    const userData = NEW_TEST_USERS[index];
    console.log(`${index + 1}. ${userData.purpose}`);
    console.log(`   Mobile: ${user.mobile_number}`);
    console.log(`   Password: ${userData.password}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Name: ${user.full_name}`);
    console.log(`   Role: ${user.role_id === 2 ? 'MODERATOR' : 'USER'}\n`);
  });

  console.log('='.repeat(80) + '\n');
  console.log('📝 Use these details to update test configuration files');
  console.log('   - userReporting.test.js (CONFIG section)\n');
  console.log('✅ Test user setup complete!\n');

  await prisma.$disconnect();
}

createTestUsers().catch(console.error);
