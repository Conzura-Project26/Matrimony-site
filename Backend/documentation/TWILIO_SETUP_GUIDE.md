# Twilio SMS Integration Setup Guide

## 📚 Overview
This guide will help you set up Twilio Verify API for sending OTP SMS in the SARVVIVAH backend.

---

## 🚀 Step-by-Step Setup

### Step 1: Create Twilio Account

1. **Sign Up**
   - Visit: https://www.twilio.com/try-twilio
   - Click "Sign up for free"
   - Enter your email and create a password
   - Complete the registration

2. **Verify Your Information**
   - Verify your email address
   - Verify your phone number
   - You'll receive **$15 free trial credit**

---

### Step 2: Get Your Credentials

After logging in to Twilio Console (https://console.twilio.com):

1. **Account SID & Auth Token**
   - On the dashboard, you'll see:
     - **Account SID**: Starts with `AC...` (e.g., `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
     - **Auth Token**: Click the eye icon to reveal
   - Copy both values

2. **Create a Verify Service**
   - Navigate to: **Explore Products** → **Verify** → **Services**
   - Or directly: https://console.twilio.com/us1/develop/verify/services
   - Click **"Create new"** button
   - Enter details:
     - **Friendly Name**: `SARVVIVAH OTP` (or any name you prefer)
     - **Code Length**: 6 digits
     - **Verification Code TTL**: 600 seconds (10 minutes)
   - Click **Create**
   - Copy the **Service SID** (starts with `VA...`)

---

### Step 3: Configure Environment Variables

Update your `.env` file in the Backend folder:

```env
# Twilio Configuration (for OTP SMS)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_VERIFY_SERVICE_SID="VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
SMS_TEST_MODE="true"
```

**Important Notes:**
- Replace the placeholder values with your actual credentials
- Keep `SMS_TEST_MODE="true"` for development/testing
- Set `SMS_TEST_MODE="false"` only when going to production

---

### Step 4: Trial Account - Verify Phone Numbers

**⚠️ Trial Account Limitation**: Twilio trial accounts can only send SMS to verified phone numbers.

To verify a phone number:

1. Go to: **Phone Numbers** → **Verified Caller IDs**
   - Or: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Click **"Add a new Caller ID"**
3. Enter your Indian mobile number: `+919876543210`
4. Choose **"SMS"** as verification method
5. Enter the verification code you receive
6. Your number is now verified!

---

### Step 5: Test the Integration

1. **Test in Development Mode** (no SMS sent, just console output):
   ```bash
   # In .env file, ensure:
   SMS_TEST_MODE="true"
   
   # Run test script:
   node test-sms.js
   ```

2. **Test with Real SMS** (Twilio API will be called):
   ```bash
   # In .env file, set:
   SMS_TEST_MODE="false"
   TWILIO_ACCOUNT_SID="your_actual_account_sid"
   TWILIO_AUTH_TOKEN="your_actual_auth_token"
   TWILIO_VERIFY_SERVICE_SID="your_actual_service_sid"
   
   # Update test-sms.js with your verified phone number
   const testMobile = '9876543210'; // Your verified number
   
   # Run test:
   node test-sms.js
   ```

3. **Test via API Endpoint**:
   ```bash
   # Start your server
   node index.js
   
   # Send POST request to send-otp endpoint
   curl -X POST http://localhost:3000/auth/send-otp \
     -H "Content-Type: application/json" \
     -d '{"mobile_number":"9876543210"}'
   ```

---

## 📊 Features Implemented

✅ **Twilio Verify API Integration**
- Uses Twilio's specialized Verify API for OTP
- Custom OTP code support (uses your database-generated OTP)
- Hardcoded +91 country code for Indian numbers

✅ **Test Mode**
- Toggle between test and production mode
- Console output in test mode (no API calls, no SMS charges)
- Easy switching via `SMS_TEST_MODE` environment variable

✅ **Retry Logic**
- Automatically retries up to 3 times (initial + 2 retries)
- Progressive delay between retries (1s, 2s)
- Comprehensive error messages

✅ **Error Handling**
- Validates credentials before making API calls
- User-friendly error messages
- Specific error handling for common Twilio errors:
  - Invalid phone number (Error 60200)
  - Service unavailable (Error 60203)
  - Network errors
  - Configuration errors

---

## 🔍 How It Works

### Flow Diagram:
```
User requests OTP
       ↓
Backend generates 6-digit OTP
       ↓
Saves OTP in database (otp_logs table)
       ↓
Calls sendOtpSms(mobileNumber, otpCode)
       ↓
  [TEST MODE?]
   ↓         ↓
  YES       NO
   ↓         ↓
Console   Twilio API
Output    (Verify API)
   ↓         ↓
  Done    SMS Sent
            ↓
User receives OTP on phone
```

### Database Storage:
- OTP is stored in `otp_logs` table
- Verification happens against database (not Twilio)
- Twilio only handles SMS delivery

---

## 💰 Pricing Information

**Trial Account:**
- $15 free credit
- ~1000 SMS messages in India
- Only send to verified numbers

**Production Account:**
- Twilio Verify API: ~$0.05 per verification
- Pay-as-you-go pricing
- No monthly fees
- Add payment method to remove trial restrictions

**India SMS Pricing:**
- Approximately ₹0.50 - ₹2.00 per SMS
- Varies by carrier and message type

---

## 🐛 Troubleshooting

### Error: "Twilio credentials are not configured"
**Solution**: Ensure all three variables are set in `.env`:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`

### Error: "Invalid phone number"
**Solution**: 
1. Check number format (should be 10 digits)
2. For trial accounts, verify the number in Twilio Console first

### Error: "Unable to reach SMS service"
**Solution**: 
1. Check internet connection
2. Verify Twilio service status: https://status.twilio.com
3. Check firewall settings

### Error: "SMS service temporarily unavailable"
**Solution**:
1. Wait a few minutes and retry
2. Check Twilio account balance
3. Verify Verify Service is active

### No SMS Received:
1. Verify phone number in Twilio (trial accounts)
2. Check Twilio Console → Logs for delivery status
3. Ensure SMS_TEST_MODE is set to "false"
4. Check if number is blocked/DND registered

---

## 🔐 Security Best Practices

1. **Never commit `.env` file** to git
2. **Rotate credentials** regularly
3. **Use different credentials** for dev/staging/production
4. **Monitor usage** in Twilio Console
5. **Set up alerts** for unusual activity
6. **Implement rate limiting** to prevent abuse

---

## 📝 Next Steps

After successful setup:

1. **Test thoroughly** with different phone numbers
2. **Implement rate limiting** for OTP requests
3. **Add logging** for failed SMS attempts
4. **Set up monitoring** in Twilio Console
5. **Upgrade to paid account** when ready for production
6. **Implement for other OTP types** (login, forgot password)

---

## 📞 Support

- **Twilio Documentation**: https://www.twilio.com/docs/verify/api
- **Twilio Support**: https://support.twilio.com
- **Community**: https://www.twilio.com/community

---

*Last Updated: January 26, 2026*
