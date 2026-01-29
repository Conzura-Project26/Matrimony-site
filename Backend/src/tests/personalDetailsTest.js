/**
 * Manual Test Suite for Personal Details CRUD
 * Task 2.1 - Phase 2
 * 
 * Run this after logging in to get a valid JWT token
 */

const BASE_URL = 'http://localhost:3000';

// STEP 1: Login first to get JWT token
const loginData = {
  identifier: '+919876543210', // Your test mobile number
  password: 'YourPassword@123'
};

console.log('='.repeat(60));
console.log('TASK 2.1: PERSONAL DETAILS CRUD - MANUAL TEST GUIDE');
console.log('='.repeat(60));

console.log('\n📝 STEP 1: LOGIN TO GET JWT TOKEN');
console.log('POST', `${BASE_URL}/auth/login`);
console.log('Body:', JSON.stringify(loginData, null, 2));

console.log('\n📝 STEP 2: CREATE PERSONAL DETAILS');
console.log('POST', `${BASE_URL}/users/{YOUR_USER_ID}/personal`);
console.log('Headers: Authorization: Bearer {YOUR_JWT_TOKEN}');
console.log('Body:');
console.log(JSON.stringify({
  height_cm: 175,
  weight_kg: 70,
  marital_status: 'Never Married',
  physical_status: 'Normal',
  mother_tongue: 'Hindi',
  complexion: 'Fair',
  body_type: 'Athletic',
  blood_group: 'O+',
  diet_preference: 'Vegetarian',
  drinking_habit: 'Never',
  smoking_habit: 'Never',
  about_me: 'I am a software engineer passionate about technology and travel. Looking for a life partner who shares similar values and interests.'
}, null, 2));

console.log('\n📝 STEP 3: PARTIAL UPDATE');
console.log('PUT', `${BASE_URL}/users/{YOUR_USER_ID}/personal`);
console.log('Headers: Authorization: Bearer {YOUR_JWT_TOKEN}');
console.log('Body:');
console.log(JSON.stringify({
  height_cm: 180,
  weight_kg: 75,
  about_me: 'Updated description with more details.'
}, null, 2));

console.log('\n📝 STEP 4: GET PERSONAL DETAILS');
console.log('GET', `${BASE_URL}/users/{YOUR_USER_ID}/personal`);
console.log('Headers: Authorization: Bearer {YOUR_JWT_TOKEN}');

console.log('\n📝 STEP 5: GET PROFILE COMPLETION');
console.log('GET', `${BASE_URL}/users/{YOUR_USER_ID}/profile-completion`);
console.log('Headers: Authorization: Bearer {YOUR_JWT_TOKEN}');

console.log('\n📝 STEP 6: TEST VALIDATION ERRORS');
console.log('POST', `${BASE_URL}/users/{YOUR_USER_ID}/personal`);
console.log('Headers: Authorization: Bearer {YOUR_JWT_TOKEN}');
console.log('Body (Invalid Height):');
console.log(JSON.stringify({
  height_cm: 100 // Too short - should fail
}, null, 2));

console.log('\n📝 STEP 7: TEST AUTHORIZATION');
console.log('POST', `${BASE_URL}/users/{ANOTHER_USER_ID}/personal`);
console.log('Headers: Authorization: Bearer {YOUR_JWT_TOKEN}');
console.log('Expected: 403 Forbidden (unless you are admin)');

console.log('\n📝 STEP 8: VIEW SWAGGER DOCUMENTATION');
console.log('Open:', `${BASE_URL}/api-docs`);
console.log('Navigate to: User Profile section');

console.log('\n' + '='.repeat(60));
console.log('✅ ALL ENDPOINTS READY FOR TESTING');
console.log('='.repeat(60));

console.log('\n📊 VALIDATION RULES:');
console.log('- Height: 120-250 cm');
console.log('- Weight: 30-200 kg');
console.log('- Mother tongue: 2-50 characters');
console.log('- About me: 10-1000 characters');
console.log('- All enum values must match predefined options');

console.log('\n🔒 AUTHORIZATION:');
console.log('- Users can update their own details');
console.log('- Admins can update any user details');
console.log('- Moderators can update any user details');

console.log('\n📝 AUDIT LOGGING:');
console.log('- All create/update operations logged in audit_logs table');
console.log('- Check: SELECT * FROM audit_logs ORDER BY created_at DESC;');

console.log('\n🎯 PROFILE COMPLETION:');
console.log('- Personal details contribute 20% to overall completion');
console.log('- 12 fields in personal details section');
console.log('- Completion calculated dynamically');

console.log('\n');
