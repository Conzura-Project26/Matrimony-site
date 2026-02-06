import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function deleteOldestPhoto() {
  try {
    const userId = '1a89ca75-de89-43f6-80c9-85f2628f3df7';
    
    // Find oldest photo for this user
    const photo = await prisma.userPhoto.findFirst({
      where: { user_id: userId },
      orderBy: { uploaded_at: 'asc' }
    });
    
    if (photo) {
      console.log('🗑️  Deleting photo:');
      console.log('   Photo ID:', photo.id);
      console.log('   Uploaded:', photo.uploaded_at);
      
      await prisma.userPhoto.delete({
        where: { id: photo.id }
      });
      
      console.log('✅ Photo deleted successfully!');
      
      // Count remaining photos
      const count = await prisma.userPhoto.count({
        where: { user_id: userId }
      });
      console.log('   Remaining photos:', count);
    } else {
      console.log('❌ No photos found for user');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteOldestPhoto();
