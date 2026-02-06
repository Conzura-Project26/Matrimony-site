/**
 * Direct AuditService Test
 */

import AuditService from '../src/services/auditService.js';
import { AuditAction, AuditActionType, AuditResourceType, AuditStatus } from '../src/types/enums.js';
import prisma from '../src/config/prisma.js';

async function testAuditService() {
  console.log('=== AUDIT SERVICE DIRECT TEST ===\n');
  
  try {
    console.log('1. Testing audit log creation...');
    console.log('   Parameters:');
    console.log('   - action:', AuditAction.PROFILE_PHOTO_UPLOADED);
    console.log('   - actionType:', AuditActionType.USER_ACTION);
    console.log('   - actorId: 1a89ca75-de89-43f6-80c9-85f2628f3df7');
    console.log('   - resourceType:', AuditResourceType.PHOTO);
    console.log('   - resourceId: 999');
    console.log('   - status:', AuditStatus.SUCCESS);
    
    const result = await AuditService.log({
      action: AuditAction.PROFILE_PHOTO_UPLOADED,
      actionType: AuditActionType.USER_ACTION,
      actorId: '1a89ca75-de89-43f6-80c9-85f2628f3df7',
      resourceType: AuditResourceType.PHOTO,
      resourceId: '999',
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      },
      ipAddress: '127.0.0.1',
      userAgent: 'TestAgent/1.0',
      status: AuditStatus.SUCCESS
    });
    
    console.log('\n2. AuditService.log() returned:', result);
    
    // Wait for async creation
    console.log('\n3. Waiting 3 seconds for async audit log creation...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if log was created
    console.log('\n4. Checking database for created log...');
    const createdLog = await prisma.auditLog.findFirst({
      where: {
        action: 'PROFILE_PHOTO_UPLOADED',
        resource_id: '999'
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    if (createdLog) {
      console.log('   ✅ Audit log created successfully!');
      console.log('   Log:', JSON.stringify(createdLog, null, 2));
    } else {
      console.log('   ❌ Audit log NOT created');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testAuditService();
