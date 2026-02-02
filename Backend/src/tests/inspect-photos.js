/**
 * Deep dive into photos table
 */

import prisma from '../config/prisma.js';

async function inspectPhotos() {
  console.log('📸 Detailed Photo Inspection\n');
  console.log('='.repeat(70));
  
  try {
    // Get all photos with user details
    const allPhotos = await prisma.userPhoto.findMany({
      include: {
        user: {
          select: {
            full_name: true,
            gender: true,
            profile_completion_percentage: true
          }
        }
      },
      orderBy: {
        user_id: 'asc'
      }
    });
    
    console.log(`\n📊 Total Photos: ${allPhotos.length}\n`);
    
    // Group by user
    const photosByUser = {};
    allPhotos.forEach(photo => {
      if (!photosByUser[photo.user_id]) {
        photosByUser[photo.user_id] = {
          user: photo.user,
          photos: []
        };
      }
      photosByUser[photo.user_id].photos.push(photo);
    });
    
    console.log('📋 Photos by User:\n');
    
    Object.entries(photosByUser).forEach(([userId, data], index) => {
      const approved = data.photos.filter(p => p.is_approved).length;
      const primary = data.photos.find(p => p.is_primary);
      
      console.log(`${index + 1}. ${data.user.full_name}`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Gender: ${data.user.gender}`);
      console.log(`   Completion: ${data.user.profile_completion_percentage}%`);
      console.log(`   Total Photos: ${data.photos.length}`);
      console.log(`   Approved: ${approved}`);
      console.log(`   Has Primary: ${primary ? 'Yes' : 'No'}`);
      
      data.photos.forEach((photo, i) => {
        console.log(`   Photo ${i + 1}:`);
        console.log(`      ID: ${photo.id}`);
        console.log(`      URL: ${photo.photo_url.substring(0, 50)}...`);
        console.log(`      Approved: ${photo.is_approved ? '✅' : '❌'}`);
        console.log(`      Primary: ${photo.is_primary ? '✅' : '❌'}`);
        console.log(`      Visibility: ${photo.visibility}`);
      });
      console.log('');
    });
    
    // Summary
    console.log('='.repeat(70));
    console.log('\n📊 SUMMARY:\n');
    
    const totalApproved = allPhotos.filter(p => p.is_approved).length;
    const totalUnapproved = allPhotos.filter(p => !p.is_approved).length;
    const usersWithApprovedPhotos = Object.values(photosByUser).filter(
      data => data.photos.some(p => p.is_approved)
    ).length;
    
    console.log(`Total Photos: ${allPhotos.length}`);
    console.log(`Approved Photos: ${totalApproved}`);
    console.log(`Unapproved Photos: ${totalUnapproved}`);
    console.log(`Users with at least 1 approved photo: ${usersWithApprovedPhotos}`);
    
    // Check users with 60%+ completion and approved photos
    const qualifiedUsers = Object.values(photosByUser).filter(
      data => data.user.profile_completion_percentage >= 60 && 
              data.photos.some(p => p.is_approved)
    );
    
    console.log(`\n✅ Users with 60%+ completion AND approved photos: ${qualifiedUsers.length}`);
    
    if (qualifiedUsers.length > 0) {
      console.log('\n👤 Qualified Users:');
      qualifiedUsers.forEach(data => {
        console.log(`   - ${data.user.full_name} (${data.user.gender}, ${data.user.profile_completion_percentage}%)`);
      });
    }
    
    // Check if there are photos but with wrong approval status
    const photosInDB = await prisma.userPhoto.count();
    console.log(`\n🔍 Raw photo count from DB: ${photosInDB}`);
    
    // Check the actual is_approved column values
    console.log('\n📋 Checking is_approved values:');
    const approvedCheck = await prisma.userPhoto.findMany({
      select: {
        id: true,
        user_id: true,
        is_approved: true
      }
    });
    
    const trueCount = approvedCheck.filter(p => p.is_approved === true).length;
    const falseCount = approvedCheck.filter(p => p.is_approved === false).length;
    const nullCount = approvedCheck.filter(p => p.is_approved === null).length;
    
    console.log(`   is_approved = true: ${trueCount}`);
    console.log(`   is_approved = false: ${falseCount}`);
    console.log(`   is_approved = null: ${nullCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

inspectPhotos();
