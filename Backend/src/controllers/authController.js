import bcrypt from 'bcrypt';
import prisma from '../config/prisma.js';
import otpService from '../services/otpService.js';
import {
  sendOtpSchema,
  verifyOtpSchema,
  signupSchema,
  createAdminSchema,
} from '../utils/validation.js';
import { Gender, ProfileCreatedBy } from '../types/enums.js';

// In-memory store for verified mobile numbers (valid for 30 minutes)
// In production, use Redis for this
const verifiedMobiles = new Map();

class AuthController {
  /**
   * Send OTP to mobile number
   * POST /auth/send-otp
   */
  async sendOtp(req, res) {
    try {
      // Validate request body
      const { mobile_number } = sendOtpSchema.parse(req.body);

      // Check if mobile number already exists in database
      const existingUser = await prisma.user.findUnique({
        where: { mobile_number },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number already registered. Please login.',
        });
      }

      // Generate and store OTP
      const otpCode = await otpService.createOtp(mobile_number, 'SIGNUP');

      // Send OTP via SMS
      await otpService.sendOtpSms(mobile_number, otpCode);

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully to your mobile number',
        data: {
          mobile_number,
          expires_in: '10 minutes',
        },
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      console.error('Send OTP Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.',
      });
    }
  }

  /**
   * Verify OTP
   * POST /auth/verify-otp
   */
  async verifyOtp(req, res) {
    try {
      // Validate request body
      const { mobile_number, otp_code } = verifyOtpSchema.parse(req.body);

      // Verify OTP
      const isValid = await otpService.verifyOtp(mobile_number, otp_code, 'SIGNUP');

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP',
        });
      }

      // Store verified mobile in memory (valid for 30 minutes)
      verifiedMobiles.set(mobile_number, {
        verified: true,
        timestamp: Date.now(),
      });

      // Clean up old entries (older than 30 minutes)
      this.cleanupVerifiedMobiles();

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully. You can now complete signup.',
        data: {
          mobile_number,
          verified: true,
        },
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      console.error('Verify OTP Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify OTP. Please try again.',
      });
    }
  }

  /**
   * Complete user signup (after OTP verification)
   * POST /auth/signup
   */
  async signup(req, res) {
    try {
      // Validate request body
      const validatedData = signupSchema.parse(req.body);
      const { mobile_number, password, ...userData } = validatedData;

      // Check if mobile number was verified
      const verification = verifiedMobiles.get(mobile_number);
      if (!verification || !verification.verified) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number not verified. Please verify OTP first.',
        });
      }

      // Check if verification is still valid (30 minutes)
      const timeDiff = Date.now() - verification.timestamp;
      if (timeDiff > 30 * 60 * 1000) {
        verifiedMobiles.delete(mobile_number);
        return res.status(400).json({
          success: false,
          message: 'OTP verification expired. Please request a new OTP.',
        });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { mobile_number },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this mobile number',
        });
      }

      // Get USER role ID
      const userRole = await prisma.role.findUnique({
        where: { role_name: 'USER' },
      });

      if (!userRole) {
        throw new Error('USER role not found in database');
      }

      // Hash password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Create user in transaction
      const newUser = await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            role_id: userRole.id,
            mobile_number,
            password_hash,
            full_name: userData.full_name,
            gender: userData.gender,
            date_of_birth: new Date(userData.date_of_birth),
            email: userData.email || null,
            profile_created_by: userData.profile_created_by,
            is_mobile_verified: true,
            is_email_verified: false,
          },
          select: {
            id: true,
            full_name: true,
            mobile_number: true,
            email: true,
            gender: true,
            date_of_birth: true,
            profile_created_by: true,
            is_mobile_verified: true,
            is_email_verified: true,
            created_at: true,
            role: {
              select: {
                role_name: true,
              },
            },
          },
        });

        return user;
      });

      // Remove from verified mobiles map
      verifiedMobiles.delete(mobile_number);

      res.status(201).json({
        success: true,
        message: 'Account created successfully. You can now login.',
        data: {
          user: newUser,
        },
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this mobile number or email',
        });
      }

      console.error('Signup Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create account. Please try again.',
      });
    }
  }

  /**
   * Create Admin or Moderator account (Protected)
   * POST /auth/create-admin
   */
  async createAdmin(req, res) {
    try {
      // Validate request body
      const validatedData = createAdminSchema.parse(req.body);
      const { mobile_number, password, admin_secret, role, ...userData } = validatedData;

      // Verify admin secret
      if (admin_secret !== process.env.ADMIN_CREATION_SECRET) {
        return res.status(403).json({
          success: false,
          message: 'Invalid admin secret',
        });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { mobile_number },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this mobile number',
        });
      }

      // Get requested role
      const requestedRole = await prisma.role.findUnique({
        where: { role_name: role },
      });

      if (!requestedRole) {
        return res.status(400).json({
          success: false,
          message: `${role} role not found in database`,
        });
      }

      // Hash password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Create admin/moderator
      const newAdmin = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            role_id: requestedRole.id,
            mobile_number,
            password_hash,
            full_name: userData.full_name,
            gender: userData.gender,
            date_of_birth: new Date(userData.date_of_birth),
            email: userData.email || null,
            profile_created_by: userData.profile_created_by,
            is_mobile_verified: true, // Auto-verified for admin creation
            is_email_verified: false,
          },
          select: {
            id: true,
            full_name: true,
            mobile_number: true,
            email: true,
            created_at: true,
            role: {
              select: {
                role_name: true,
                description: true,
              },
            },
          },
        });

        return user;
      });

      res.status(201).json({
        success: true,
        message: `${role} account created successfully`,
        data: {
          user: newAdmin,
        },
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this mobile number or email',
        });
      }

      console.error('Create Admin Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create admin account. Please try again.',
      });
    }
  }

  /**
   * Clean up expired verified mobile entries (older than 30 minutes)
   */
  cleanupVerifiedMobiles() {
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;

    for (const [mobile, data] of verifiedMobiles.entries()) {
      if (now - data.timestamp > thirtyMinutes) {
        verifiedMobiles.delete(mobile);
      }
    }
  }
}

export default new AuthController();
