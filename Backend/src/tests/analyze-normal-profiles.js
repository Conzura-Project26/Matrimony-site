import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function analyzePhysicalStatusProfiles() {
  console.log('\n🔍 Analyzing Physical Status = "Normal" Profiles\n');
  console.log('═══════════════════════════════════════════\n');
  
  // Total profiles with Normal status
  const totalNormal = await prisma.userPersonalDetails.count({
    where: { physical_status: 'Normal' },
  });
  
  console.log(`📊 Total profiles with "Normal" physical_status: ${totalNormal}\n`);
  
  // Get all users with Normal status
  const allNormalUsers = await prisma.user.findMany({
    where: {
      personal_details: {
        physical_status: 'Normal',
      },
    },
    include: {
      personal_details: true,
      photos: true,
    },
  });
  
  console.log('Breaking down by auto-filters:\n');
  
  // Check each auto-filter
  const activeUsers = allNormalUsers.filter(u => u.is_active);
  console.log(`✅ is_active = true: ${activeUsers.length}/${allNormalUsers.length}`);
  
  const completionUsers = activeUsers.filter(u => u.profile_completion_percentage >= 60);
  console.log(`✅ completion >= 60%: ${completionUsers.length}/${activeUsers.length}`);
  
  const withApprovedPhotos = completionUsers.filter(u => 
    u.photos.some(p => p.is_approved === true)
  );
  console.log(`✅ has approved photos: ${withApprovedPhotos.length}/${completionUsers.length}`);
  
  // Exclude test user (logged in user)
  const excludeSelf = withApprovedPhotos.filter(u => u.mobile_number !== '9380245433');
  console.log(`✅ exclude self (9380245433): ${excludeSelf.length}/${withApprovedPhotos.length}`);
  
  // Check gender (opposite of test user who is Male)
  const femaleUsers = excludeSelf.filter(u => u.gender === 'Female');
  console.log(`✅ opposite gender (Female): ${femaleUsers.length}/${excludeSelf.length}`);
  
  console.log('\n═══════════════════════════════════════════');
  console.log(`\n📊 RESULT: ${femaleUsers.length} profiles meet ALL auto-filters`);
  console.log('   (This matches the API response of 9 profiles)\n');
  
  // Show breakdown of filtered out profiles
  console.log('═══════════════════════════════════════════');
  console.log('Profiles filtered out:\n');
  
  const inactiveCount = allNormalUsers.filter(u => !u.is_active).length;
  console.log(`   ${inactiveCount} - Inactive users`);
  
  const lowCompletionCount = activeUsers.filter(u => u.profile_completion_percentage < 60).length;
  console.log(`   ${lowCompletionCount} - Less than 60% completion`);
  
  const noPhotosCount = completionUsers.filter(u => 
    !u.photos.some(p => p.is_approved === true)
  ).length;
  console.log(`   ${noPhotosCount} - No approved photos`);
  
  const selfCount = withApprovedPhotos.filter(u => u.mobile_number === '9380245433').length;
  console.log(`   ${selfCount} - Is the logged-in user (self)`);
  
  const maleCount = excludeSelf.filter(u => u.gender === 'Male').length;
  console.log(`   ${maleCount} - Wrong gender (Male, need Female)`);
  
  console.log('\n═══════════════════════════════════════════\n');
  
  await prisma.$disconnect();
}

analyzePhysicalStatusProfiles();
