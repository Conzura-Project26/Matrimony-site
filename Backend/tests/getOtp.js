/**
 * Helper function to retrieve the latest OTP for a mobile number from database
 * This is for testing purposes only
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get the latest OTP code for a purpose (defaults to SIGNUP)
 * @param {string} purpose - Purpose of OTP ('SIGNUP', 'LOGIN', 'FORGOT_PASSWORD')
 * @returns {Promise<string|null>} - OTP code or null if not found
 */
export async function getLatestOtp(purpose = 'SIGNUP') {
  try {
    // Get the most recent unverified OTP for the given purpose
    // Note: OtpLog doesn't have created_at, so we order by id (autoincrement)
    const otpRecord = await prisma.otpLog.findFirst({
      where: {
        purpose,
        verified: false,
        expires_at: {
          gte: new Date(), // Not expired
        },
      },
      orderBy: {
        id: 'desc', // Latest ID = most recent
      },
      select: {
        otp_code: true,
        id: true,
        expires_at: true,
      },
    });

    if (otpRecord && otpRecord.otp_code) {
      console.log(`✓ Found OTP: ${otpRecord.otp_code} (ID: ${otpRecord.id}, expires in ${Math.round((otpRecord.expires_at - new Date()) / 1000)}s)`);
      return otpRecord.otp_code;
    }

    console.log('✗ No valid OTP found');
    return null;
  } catch (error) {
    console.error('Error fetching OTP:', error.message);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

// If run directly, show latest OTP
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const purpose = process.argv[2] || 'SIGNUP';
  console.log(`Looking for latest ${purpose} OTP...`);
  const otp = await getLatestOtp(purpose);
  if (!otp) {
    console.log('No OTP found. Run send-otp endpoint first.');
  }
}

export default getLatestOtp;
