/**
 * Script to Assign Profile IDs to Existing Users
 * 
 * This script generates unique MAT profile IDs for users who don't have one.
 * Run this once after deploying the search feature.
 * 
 * Usage:
 *   node scripts/assign-profile-ids.js
 */

import prisma from '../src/config/prisma.js';
import { generateProfileId } from '../src/services/searchService.js';
import logger from '../src/config/logger.js';

async function assignProfileIds() {
  console.log('🚀 Starting profile ID assignment...\n');
  
  try {
    // Get all users without profile_id
    const usersWithoutProfileId = await prisma.user.findMany({
      where: {
        profile_id: null,
      },
      select: {
        id: true,
        full_name: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'asc', // Oldest users first
      },
    });
    
    const totalUsers = usersWithoutProfileId.length;
    
    if (totalUsers === 0) {
      console.log('✅ All users already have profile IDs!');
      return;
    }
    
    console.log(`📊 Found ${totalUsers} users without profile IDs\n`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Process each user
    for (let i = 0; i < usersWithoutProfileId.length; i++) {
      const user = usersWithoutProfileId[i];
      
      try {
        // Generate unique profile ID
        const profileId = await generateProfileId();
        
        // Update user with profile ID
        await prisma.user.update({
          where: { id: user.id },
          data: { profile_id: profileId },
        });
        
        successCount++;
        console.log(`✅ [${i + 1}/${totalUsers}] Assigned ${profileId} to ${user.full_name}`);
        
        // Log success
        logger.info('Profile ID assigned', {
          userId: user.id,
          profileId,
          userName: user.full_name,
        });
        
      } catch (error) {
        errorCount++;
        errors.push({
          userId: user.id,
          userName: user.full_name,
          error: error.message,
        });
        
        console.error(`❌ [${i + 1}/${totalUsers}] Failed for ${user.full_name}: ${error.message}`);
        
        // Log error
        logger.error('Profile ID assignment failed', {
          userId: user.id,
          userName: user.full_name,
          error: error.message,
          stack: error.stack,
        });
      }
      
      // Small delay to avoid overwhelming the database
      if (i < usersWithoutProfileId.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 ASSIGNMENT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Users:      ${totalUsers}`);
    console.log(`✅ Success:       ${successCount}`);
    console.log(`❌ Failed:        ${errorCount}`);
    console.log(`⚡ Success Rate:  ${((successCount / totalUsers) * 100).toFixed(2)}%`);
    console.log('='.repeat(60));
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. User: ${err.userName} (${err.userId})`);
        console.log(`     Error: ${err.error}\n`);
      });
    }
    
    if (successCount === totalUsers) {
      console.log('\n🎉 All profile IDs assigned successfully!');
    } else {
      console.log(`\n⚠️  ${errorCount} assignment(s) failed. Check logs for details.`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error during profile ID assignment:', error);
    logger.error('Fatal error in assign-profile-ids script', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  } finally {
    // Disconnect from database
    await prisma.$disconnect();
    console.log('\n👋 Database connection closed.');
  }
}

// Run the script
assignProfileIds()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
