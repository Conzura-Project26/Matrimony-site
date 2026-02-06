/** 
 * Test enum imports
 */

import { AuditAction, AuditActionType, AuditResourceType, AuditStatus } from '../src/types/enums.js';

console.log('=== ENUM VALUES TEST ===\n');

console.log('AuditActionType:', AuditActionType);
console.log('AuditActionType.USER_ACTION:', AuditActionType.USER_ACTION);
console.log('typeof AuditActionType.USER_ACTION:', typeof AuditActionType.USER_ACTION);

console.log('\nAuditAction:', AuditAction);
console.log('AuditAction.PROFILE_PHOTO_UPLOADED:', AuditAction.PROFILE_PHOTO_UPLOADED);

console.log('\nAuditResourceType:', AuditResourceType);
console.log('AuditResourceType.PHOTO:', AuditResourceType.PHOTO);

console.log('\nAuditStatus:', AuditStatus);
console.log('AuditStatus.SUCCESS:', AuditStatus.SUCCESS);

console.log('\n=== TEST COMPLETE ===');
