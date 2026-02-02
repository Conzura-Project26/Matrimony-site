/**
 * Fix Inactive Test Profiles
 * Sets all MAT* profile_ids to is_active=true
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixInactiveProfiles() {
  try {
    console.log('🔧 Updating test profiles to is_active=true...\n');
    
    const result = await prisma.user.updateMany({
      where: {
        profile_id: {
          startsWith: 'MAT'
        }
      },
      data: {
        is_active: true
      }
    });
    
    console.log(`✅ Updated ${result.count} profiles to is_active=true`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixInactiveProfiles();
