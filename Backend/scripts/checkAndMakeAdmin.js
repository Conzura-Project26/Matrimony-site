import prisma from '../src/config/prisma.js';

async function checkAndMakeAdmin() {
  const mobileNumber = '9380422508';
  
  console.log(`\n🔍 Checking user: ${mobileNumber}`);
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { mobile_number: mobileNumber },
    include: {
      role: true,
    },
  });
  
  if (!user) {
    console.log('❌ User not found!');
    console.log('Creating admin user...');
    
    // Get ADMIN role
    const adminRole = await prisma.role.findUnique({
      where: { role_name: 'ADMIN' },
    });
    
    if (!adminRole) {
      console.error('❌ ADMIN role not found in database!');
      process.exit(1);
    }
    
    // Hash password
    const bcrypt = await import('bcrypt');
    const password_hash = await bcrypt.hash('Nishanth@2005', 10);
    
    // Create admin user
    const newAdmin = await prisma.user.create({
      data: {
        role_id: adminRole.id,
        mobile_number: mobileNumber,
        password_hash,
        full_name: 'Admin User',
        gender: 'MALE',
        date_of_birth: new Date('1990-01-01'),
        profile_created_by: 'SELF',
        is_mobile_verified: true,
        is_email_verified: false,
        is_active: true,
      },
      include: {
        role: true,
      },
    });
    
    console.log('✅ Admin user created!');
    console.log(`   User ID: ${newAdmin.id}`);
    console.log(`   Role: ${newAdmin.role.role_name}`);
    console.log(`   Mobile: ${newAdmin.mobile_number}`);
    
  } else {
    console.log(`✅ User found!`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Name: ${user.full_name}`);
    console.log(`   Role: ${user.role.role_name}`);
    console.log(`   Active: ${user.is_active}`);
    
    if (user.role.role_name !== 'ADMIN') {
      console.log('\n🔄 User is not ADMIN. Updating role...');
      
      // Get ADMIN role
      const adminRole = await prisma.role.findUnique({
        where: { role_name: 'ADMIN' },
      });
      
      if (!adminRole) {
        console.error('❌ ADMIN role not found in database!');
        process.exit(1);
      }
      
      // Update user role
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { role_id: adminRole.id },
        include: { role: true },
      });
      
      console.log('✅ User role updated to ADMIN!');
      console.log(`   User ID: ${updatedUser.id}`);
      console.log(`   New Role: ${updatedUser.role.role_name}`);
    } else {
      console.log('✅ User is already ADMIN!');
    }
  }
  
  console.log('\n✅ All done!\n');
}

checkAndMakeAdmin()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
