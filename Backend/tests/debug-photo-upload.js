/**
 * Debug Photo Upload Test
 * Tests photo upload endpoint and monitors real-time audit log creation
 */

import axios from 'axios';
import prisma from '../src/config/prisma.js';

const BASE_URL = 'http://localhost:3000';

async function debugPhotoUpload() {
  console.log('=== DEBUG PHOTO UPLOAD ===\n');
  
  try {
    // 1. Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: '9380245433',
      password: 'Harsha@2004'
    });
    
    console.log('   Login response data:', JSON.stringify(loginResponse.data, null, 2));
    const userId = loginResponse.data.data.user.id;
    const accessToken = loginResponse.data.data.accessToken;
    console.log(`   ✓ Logged in successfully, User ID: ${userId}`);
    
    // 2. Check audit logs count before upload
    console.log('\n2. Checking audit logs before upload...');
    const logsBefore = await prisma.auditLog.count({
      where: {
        actor_id: userId,
        action: 'PROFILE_PHOTO_UPLOADED'
      }
    });
    console.log(`   Audit logs for PROFILE_PHOTO_UPLOADED: ${logsBefore}`);
    
    // 3. Upload photo
    console.log('\n3. Uploading photo...');
    const uploadResponse = await axios.post(
      `${BASE_URL}/users/${userId}/photos`,
      {
        fileUrl: 'https://utfs.io/f/RoYaBfnm6KSJ123456789TEST.jpg',
        visibility: 'PUBLIC'
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    
    console.log(`   ✓ Upload successful, Photo ID: ${uploadResponse.data.data.id}`);
    console.log(`   Response:`, JSON.stringify(uploadResponse.data, null, 2));
    
    // 4. Wait a bit for async audit log
    console.log('\n4. Waiting 5 seconds for audit log...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 5. Check audit logs after upload
    console.log('\n5. Checking audit logs after upload...');
    const logsAfter = await prisma.auditLog.count({
      where: {
        actor_id: userId,
        action: 'PROFILE_PHOTO_UPLOADED'
      }
    });
    console.log(`   Audit logs for PROFILE_PHOTO_UPLOADED: ${logsAfter}`);
    
    if (logsAfter > logsBefore) {
      console.log('   ✅ AUDIT LOG CREATED!');
      
      const latestLog = await prisma.auditLog.findFirst({
        where: {
          actor_id: userId,
          action: 'PROFILE_PHOTO_UPLOADED'
        },
        orderBy: {
          created_at: 'desc'
        }
      });
      console.log('   Latest log:', JSON.stringify(latestLog, null, 2));
    } else {
      console.log('   ❌ NO AUDIT LOG CREATED');
      
      // Check all recent logs for this user
      const recentLogs = await prisma.auditLog.findMany({
        where: {
          actor_id: userId
        },
        orderBy: {
          created_at: 'desc'
        },
        take: 5
      });
      console.log('   Recent logs for user:', JSON.stringify(recentLogs, null, 2));
    }
    
    // 6. Check if photo exists in database
    console.log('\n6. Checking if photo exists in database...');
    const photo = await prisma.userPhoto.findUnique({
      where: {
        id: uploadResponse.data.data.id
      }
    });
    if (photo) {
      console.log('   ✅ Photo exists in database:', JSON.stringify(photo, null, 2));
    } else {
      console.log('   ❌ Photo NOT found in database');
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPhotoUpload();
