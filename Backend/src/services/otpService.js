import crypto from 'crypto';
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
   * Send OTP via SMS (Mock implementation)
   * In production, integrate with SMS gateway like Twilio, AWS SNS, etc.
   * @param {string} mobileNumber - Recipient's mobile number
   * @param {string} otpCode - OTP to send
   */
  async sendOtpSms(mobileNumber, otpCode) {
    // TODO: Integrate with SMS gateway
    console.log(`[SMS] Sending OTP ${otpCode} to ${mobileNumber}`);
    
    // Mock implementation - in production replace with actual SMS API
    // Example with Twilio:
    // await twilioClient.messages.create({
    //   body: `Your SARVVIVAH OTP is: ${otpCode}. Valid for 10 minutes.`,
    //   to: `+91${mobileNumber}`,
    //   from: process.env.TWILIO_PHONE_NUMBER
    // });

    return true;
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
