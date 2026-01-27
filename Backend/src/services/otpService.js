import crypto from 'crypto';
import axios from 'axios';
import prisma from '../config/prisma.js';

class OtpService {
  /**
   * Generate a 6-digit OTP
   */
  generateOtp() {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Create and store OTP in database
   * @param {string} mobileNumber - User's mobile number
   * @param {string} purpose - Purpose of OTP (e.g., 'SIGNUP', 'LOGIN')
   * @returns {Promise<string>} - Generated OTP code
   */
  async createOtp(mobileNumber, purpose = 'SIGNUP') {
    const otpCode = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otpLog.create({
      data: {
        otp_code: otpCode,
        purpose,
        expires_at: expiresAt,
        verified: false,
        // Note: user_id is null for signup OTPs (user doesn't exist yet)
      },
    });

    return otpCode;
  }

  /**
   * Verify OTP
   * @param {string} mobileNumber - User's mobile number
   * @param {string} otpCode - OTP to verify
   * @param {string} purpose - Purpose of OTP
   * @returns {Promise<boolean>} - Verification result
   */
  async verifyOtp(mobileNumber, otpCode, purpose = 'SIGNUP') {
    const otpRecord = await prisma.otpLog.findFirst({
      where: {
        otp_code: otpCode,
        purpose,
        verified: false,
        expires_at: {
          gte: new Date(),
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    if (!otpRecord) {
      return false;
    }

    // Mark OTP as verified
    await prisma.otpLog.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    return true;
  }

  /**
   * Send OTP via SMS using Twilio Verify API
   * @param {string} mobileNumber - Recipient's mobile number (10 digits)
   * @param {string} otpCode - OTP to send
   * @param {number} retryCount - Current retry attempt (default: 0)
   * @returns {Promise<boolean>} - Success status
   */
  async sendOtpSms(mobileNumber, otpCode, retryCount = 0) {
    const MAX_RETRIES = 2; // Will try 3 times total (initial + 2 retries)
    const isTestMode = process.env.SMS_TEST_MODE === 'true';

    // Test mode - mock SMS sending
    if (isTestMode) {
      console.log('\n═══════════════════════════════════════════════');
      console.log('📱 [SMS TEST MODE] OTP Message');
      console.log('═══════════════════════════════════════════════');
      console.log(`📞 To: +91${mobileNumber}`);
      console.log(`🔐 OTP: ${otpCode}`);
      console.log(`📝 Message: "Your SARVVIVAH OTP is ${otpCode}. Valid for 10 minutes. Do not share with anyone."`);
      console.log('═══════════════════════════════════════════════\n');
      return true;
    }

    // Production mode - actual Twilio SMS API call
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

      // Validate credentials
      if (!accountSid || !authToken) {
        throw new Error(
          'Twilio credentials are not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env file'
        );
      }

      // Format phone number with country code
      const phoneNumber = `+91${mobileNumber}`;

      // Prepare OTP message
      const message = `Your SARVVIVAH OTP is ${otpCode}. Valid for 10 minutes. Do not share with anyone.`;

      // Twilio SMS API endpoint
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

      // Prepare request body
      const body = new URLSearchParams({
        To: phoneNumber,
        Body: message,
      });

      // Add From number or MessagingServiceSid
      if (messagingServiceSid) {
        body.append('MessagingServiceSid', messagingServiceSid);
      } else {
        // For trial accounts, Twilio will use the trial number automatically
        // For production, you should set TWILIO_PHONE_NUMBER in .env
        const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
        if (twilioPhoneNumber) {
          body.append('From', twilioPhoneNumber);
        }
      }

      // Make API call
      const response = await axios.post(url, body, {
        auth: {
          username: accountSid,
          password: authToken,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000, // 10 seconds timeout
      });

      // Check response
      if (response.data && (response.data.status === 'queued' || response.data.status === 'sent' || response.data.status === 'delivered')) {
        console.log(`✅ [Twilio] OTP sent successfully to ${phoneNumber}`);
        console.log(`📊 [Twilio] Status: ${response.data.status}, SID: ${response.data.sid}`);
        return true;
      } else if (response.status === 201 || response.status === 200) {
        console.log(`✅ [Twilio] OTP sent successfully to ${phoneNumber}`);
        return true;
      } else {
        throw new Error(
          `Twilio API returned unexpected response: ${JSON.stringify(response.data)}`
        );
      }
    } catch (error) {
      console.error(
        `❌ [Twilio] Attempt ${retryCount + 1}/${MAX_RETRIES + 1} failed:`,
        error.response?.data?.message || error.message
      );

      // Retry logic
      if (retryCount < MAX_RETRIES) {
        console.log(`🔄 Retrying... (Attempt ${retryCount + 2}/${MAX_RETRIES + 1})`);
        await this.delay(1000 * (retryCount + 1)); // Progressive delay: 1s, 2s
        return this.sendOtpSms(mobileNumber, otpCode, retryCount + 1);
      }

      // All retries exhausted - throw user-friendly error
      console.error(`❌ [Twilio] All ${MAX_RETRIES + 1} retry attempts failed`);

      if (error.response) {
        // Twilio API error
        const twilioError = error.response.data;
        if (twilioError.code === 60200) {
          throw new Error(
            'Invalid phone number. Please check the number and try again.'
          );
        } else if (twilioError.code === 60203) {
          throw new Error(
            'SMS service temporarily unavailable. Please try again in a few minutes.'
          );
        } else {
          throw new Error(
            `Failed to send OTP SMS: ${twilioError.message || 'Unknown error'}. Please try again later.`
          );
        }
      } else if (error.request) {
        // Network error
        throw new Error(
          'Unable to reach SMS service. Please check your internet connection and try again.'
        );
      } else {
        // Other errors
        throw new Error(`Failed to send OTP: ${error.message}`);
      }
    }
  }

  /**
   * Helper function to add delay for retry logic
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

//   /**
//    * Invalidate all previous OTPs for a mobile number
//    * @param {string} mobileNumber - User's mobile number
//    */
//   async invalidatePreviousOtps(mobileNumber) {
//     // This is a safety measure to prevent OTP reuse
//     // In production, you might want to implement this
//     // For now, we rely on the expires_at and verified flags
//   }
}

export default new OtpService();
