/**
 * Test User Setup Script for Task 5.5 - User Reporting
 * Creates or retrieves test users needed for reporting tests
 */

import prisma from '../src/config/prisma.js';
import bcrypt from 'bcrypt';

const TEST_USERS = [
  {
    mobile: '9380245433',
    password: 'Harsha@2004',
    name: 'Harsha Kumar',
    email: 'harsha.reporter@test.com',
    roleId: 1, // USER
    gender: 'MALE',
    dob: new Date('1998-05-15'),
    purpose: 'Reporter User A'
  },
  {
    mobile: '8073550468',
    password: 'Kshitij@2004',
    name: 'Kshitij Sharma',
    email: 'kshitij.reported@test.com',
    roleId: 1, // USER
    gender: 'MALE',
    dob: new Date('1999-08-22'),
    purpose: 'Reported User B'
  },
  {
    mobile: '9380422508',
    password: 'Nishanth@2005',
    name: 'Nishanth Reddy',
    email: 'nishanth.reporter2@test.com',
    roleId: 1, // USER
    gender: 'MALE',
    dob: new Date('2000-03-10'),
    purpose: 'Second Reporter User C'
  },
  {
    mobile: '9902964782',
    password: 'Rahul@2004',
    name: 'Rahul Verma',
    email: 'rahul.moderator@test.com',
    roleId: 2, // MODERATOR
    gender: 'MALE',
    dob: new Date('1997-11-30'),
    purpose: 'Moderator User'
  }
];

async function setupTestUsers() {
  console.log('🚀 Setting up test users for Task 5.5 User Reporting...\n');

  const results = [];

  for (const userData of TEST_USERS) {
    try {
      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { mobile_number: userData.mobile },
        include: { role: true }
      });

      if (user) {
        console.log(`✅ User exists: ${userData.name} (${userData.mobile})`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Role: ${user.role.role_name}`);
        
        // Update role if needed (especially for moderator)
        if (user.role_id !== userData.roleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { role_id: userData.roleId },
            include: { role: true }
          });
          console.log(`   ⚠️  Role updated to: ${user.role.role_name}`);
        }
      } else {
        // Create new user
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        user = await prisma.user.create({
          data: {
            mobile_number: userData.mobile,
            password_hash: hashedPassword,
            full_name: userData.name,
            email: userData.email,
            role_id: userData.roleId,
            gender: userData.gender,
            date_of_birth: userData.dob,
            profile_created_by: 'SELF',
            is_mobile_verified: true,
            is_active: true,
            profile_completion_percentage: 40
          },
          include: { role: true }
        });

        console.log(`✨ Created new user: ${userData.name} (${userData.mobile})`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Role: ${user.role.role_name}`);
      }

      results.push({
        purpose: userData.purpose,
        mobile: userData.mobile,
        userId: user.id,
        name: user.full_name,
        roleName: user.role.role_name
      });

      console.log(`   Purpose: ${userData.purpose}\n`);

    } catch (error) {
      console.error(`❌ Error setting up ${userData.name}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📋 TEST USER SUMMARY\n');
  
  results.forEach((user, index) => {
    console.log(`${index + 1}. ${user.purpose}`);
    console.log(`   Mobile: ${user.mobile}`);
    console.log(`   User ID: ${user.userId}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.roleName}\n`);
  });

  console.log('='.repeat(80));
  console.log('\n💡 Use these details to update test configuration files');
  console.log('   - userReporting.test.js (CONFIG section)');
  console.log('   - manual-test-reporting.js (when prompted)');
  console.log('   - Postman collection variables\n');

  return results;
}

// Run the setup
setupTestUsers()
  .then(() => {
    console.log('✅ Test user setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
