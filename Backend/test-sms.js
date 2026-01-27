import dotenv from 'dotenv';
import otpService from './src/services/otpService.js';

// Load environment variables
dotenv.config();

async function testSMS() {
  console.log('\n🧪 Testing Twilio SMS Service\n');
  console.log('📋 Configuration:');
  console.log(`   - Test Mode: ${process.env.SMS_TEST_MODE}`);
  console.log(`   - Account SID: ${process.env.TWILIO_ACCOUNT_SID ? '✓ Set' : '✗ Not Set'}`);
  console.log(`   - Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? '✓ Set' : '✗ Not Set'}`);
  console.log(`   - Verify Service SID: ${process.env.TWILIO_VERIFY_SERVICE_SID ? '✓ Set' : '✗ Not Set'}`);
  console.log('\n');

  // Test mobile number (use your verified number for testing)
  const testMobile = '8073550468'; // Change this to your test number
  const testOtp = '123456';

  try {
    console.log(`📞 Sending OTP to +91${testMobile}...\n`);
    const result = await otpService.sendOtpSms(testMobile, testOtp);
    
    if (result) {
      console.log('\n✅ SUCCESS: SMS sent successfully!');
      console.log('\n💡 Next Steps:');
      console.log('   1. Check your phone for the OTP message');
      console.log('   2. If in TEST_MODE, check the console output above');
      console.log('   3. For production, set SMS_TEST_MODE=false in .env');
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Verify your Twilio credentials in .env file');
    console.log('   2. Ensure phone number is verified in Twilio (for trial accounts)');
    console.log('   3. Check your Twilio account balance');
    console.log('   4. Verify the Verify Service SID is correct');
  }
}

// Run test
testSMS();
