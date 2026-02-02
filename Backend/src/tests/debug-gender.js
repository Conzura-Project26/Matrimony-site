/**
 * Debug Gender Filter Issue
 */

import axios from 'axios';
import prisma from '../config/prisma.js';

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 'f6ab094e-2900-497f-bb0d-000cc93a25db';

async function debugGenderFilter() {
  console.log('🔍 Debugging Gender Filter\n');
  console.log('='.repeat(70));
  
  try {
    // 1. Check user's gender in database
    const user = await prisma.user.findUnique({
      where: { id: TEST_USER_ID },
      select: { gender: true }
    });
    
    console.log(`\n1️⃣ Current User Gender: "${user.gender}"`);
    console.log(`   Data type: ${typeof user.gender}`);
    
    // 2. Check all female users with approved photos
    const femaleCount = await prisma.user.count({
      where: {
        gender: 'Female',
        is_active: true,
        profile_completion_percentage: { gte: 60 },
        photos: { some: { is_approved: true } }
      }
    });
    
    console.log(`\n2️⃣ Female users with 60%+ completion & approved photos: ${femaleCount}`);
    
    // 3. Check gender values in database
    const genderValues = await prisma.user.findMany({
      select: { gender: true },
      distinct: ['gender']
    });
    
    console.log(`\n3️⃣ Distinct gender values in database:`);
    genderValues.forEach(g => {
      console.log(`   "${g.gender}" (type: ${typeof g.gender})`);
    });
    
    // 4. Login and test API
    console.log(`\n4️⃣ Testing API Gender Filter...`);
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: '9380245433',
      password: 'Harsha@2004'
    });
    
    const token = loginResponse.data.data.accessToken;
    
    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Test without gender filter (should use opposite gender auto-filter)
    const noFilterResponse = await api.get('/profiles?limit=10');
    console.log(`\n   No filter: ${noFilterResponse.data.data.profiles.length} profiles`);
    console.log(`   Applied filters:`, JSON.stringify(noFilterResponse.data.data.filters_applied));
    
    // Test with gender=Female
    const femaleResponse = await api.get('/profiles?gender=Female&limit=10');
    console.log(`\n   gender=Female: ${femaleResponse.data.data.profiles.length} profiles`);
    console.log(`   Applied filters:`, JSON.stringify(femaleResponse.data.data.filters_applied));
    
    // Test with gender=FEMALE (uppercase)
    const femaleUpperResponse = await api.get('/profiles?gender=FEMALE&limit=10');
    console.log(`\n   gender=FEMALE: ${femaleUpperResponse.data.data.profiles.length} profiles`);
    console.log(`   Applied filters:`, JSON.stringify(femaleUpperResponse.data.data.filters_applied));
    
    // Test with gender=Male
    const maleResponse = await api.get('/profiles?gender=Male&limit=10');
    console.log(`\n   gender=Male: ${maleResponse.data.data.profiles.length} profiles`);
    console.log(`   Applied filters:`, JSON.stringify(maleResponse.data.data.filters_applied));
    
    // Test with gender=MALE (uppercase)
    const maleUpperResponse = await api.get('/profiles?gender=MALE&limit=10');
    console.log(`\n   gender=MALE: ${maleUpperResponse.data.data.profiles.length} profiles`);
    console.log(`   Applied filters:`, JSON.stringify(maleUpperResponse.data.data.filters_applied));
    
    console.log('\n' + '='.repeat(70));
    console.log('💡 FINDINGS:\n');
    console.log('   If gender filter returns 0 profiles, the issue is likely:');
    console.log('   1. Case mismatch: DB has "Female" but API expects "FEMALE"');
    console.log('   2. The filter query is not matching the database values');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  } finally {
    await prisma.$disconnect();
  }
}

debugGenderFilter();
