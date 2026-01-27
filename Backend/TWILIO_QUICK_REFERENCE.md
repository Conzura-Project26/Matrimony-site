# Twilio Quick Reference

## 🔑 Getting Your Credentials

1. **Go to**: https://console.twilio.com
2. **Dashboard** → Copy:
   - Account SID (starts with `AC...`)
   - Auth Token (click eye icon to reveal)

3. **Create Verify Service**:
   - Navigate to: Verify → Services
   - Click "Create new"
   - Name: "SARVVIVAH OTP"
   - Copy Service SID (starts with `VA...`)

## 📋 Add to .env File

```env
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_VERIFY_SERVICE_SID="VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
SMS_TEST_MODE="true"
```

## ✅ Verify Test Phone Number (Trial Account)

1. Go to: Phone Numbers → Verified Caller IDs
2. Add your number: +919876543210
3. Choose SMS verification
4. Enter code received

## 🧪 Test Commands

```bash
# Test in development (no SMS sent)
SMS_TEST_MODE="true"
node test-sms.js

# Test with real SMS
SMS_TEST_MODE="false"
node test-sms.js

# Test via API
curl -X POST http://localhost:3000/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile_number":"9876543210"}'
```

## 🎯 Production Checklist

- [ ] Get Twilio credentials
- [ ] Create Verify Service
- [ ] Add credentials to .env
- [ ] Verify test phone number
- [ ] Test in TEST_MODE=true
- [ ] Test with real SMS (TEST_MODE=false)
- [ ] Test signup flow end-to-end
- [ ] Upgrade to paid account (for production)
- [ ] Set TEST_MODE=false in production

## 📞 Important Links

- Console: https://console.twilio.com
- Verify Dashboard: https://console.twilio.com/us1/develop/verify/services
- Verified Numbers: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
- Logs: https://console.twilio.com/us1/monitor/logs/sms
