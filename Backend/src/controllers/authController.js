import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import otpService from '../services/otpService.js';
import {
  sendOtpSchema,
  verifyOtpSchema,
  signupSchema,
  createAdminSchema,
  loginSchema,
} from '../utils/validation.js';
import { Gender, ProfileCreatedBy } from '../types/enums.js';
import { 
  BadRequestError, 
  UnauthorizedError, 
  ForbiddenError,
  ConflictError 
} from '../utils/errors.js';
import { logAuth, logDatabase } from '../utils/logUtils.js';

// In-memory store for verified mobile numbers (valid for 30 minutes)
// In production, use Redis for this
const verifiedMobiles = new Map();

class AuthController {
  /**
   * Send OTP to mobile number
   * POST /auth/send-otp
   */
  async sendOtp(req, res) {
    // Validate request body (Zod errors will be auto-handled by global error handler)
    const { mobile_number } = sendOtpSchema.parse(req.body);

    // Check if mobile number already exists in database
    const existingUser = await prisma.user.findUnique({
      where: { mobile_number },
    });

    if (existingUser) {
      logAuth.otpSent(mobile_number, 'SIGNUP', { status: 'failed', reason: 'already_registered' });
      throw new ConflictError('Mobile number already registered. Please login.');
    }

    // Generate and store OTP
    const otpCode = await otpService.createOtp(mobile_number, 'SIGNUP');

    // Send OTP via SMS
    await otpService.sendOtpSms(mobile_number, otpCode);

    logAuth.otpSent(mobile_number, 'SIGNUP', { status: 'success' });

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your mobile number',
      data: {
        mobile_number,
        expires_in: '10 minutes',
      },
    });
  }

  /**
   * Verify OTP
   * POST /auth/verify-otp
   */
  async verifyOtp(req, res) {
    // Validate request body
    const { mobile_number, otp_code } = verifyOtpSchema.parse(req.body);

    // Verify OTP
    const isValid = await otpService.verifyOtp(mobile_number, otp_code, 'SIGNUP');

    if (!isValid) {
      logAuth.otpVerify(mobile_number, false);
      throw new BadRequestError('Invalid or expired OTP');
    }

    // Store verified mobile in memory (valid for 30 minutes)
    verifiedMobiles.set(mobile_number, {
      verified: true,
      timestamp: Date.now(),
    });

    // Clean up old entries (older than 30 minutes)
    this.cleanupVerifiedMobiles();

    logAuth.otpVerify(mobile_number, true);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You can now complete signup.',
      data: {
        mobile_number,
        verified: true,
      },
    });
  }

  /**
   * Complete user signup (after OTP verification)
   * POST /auth/signup
   */
  async signup(req, res) {
    // Validate request body
    const validatedData = signupSchema.parse(req.body);
    const { mobile_number, password, ...userData } = validatedData;

    // Check if mobile number was verified
    const verification = verifiedMobiles.get(mobile_number);
    if (!verification || !verification.verified) {
      throw new BadRequestError('Mobile number not verified. Please verify OTP first.');
    }

    // Check if verification is still valid (30 minutes)
    const timeDiff = Date.now() - verification.timestamp;
    if (timeDiff > 30 * 60 * 1000) {
      verifiedMobiles.delete(mobile_number);
      throw new BadRequestError('OTP verification expired. Please request a new OTP.');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { mobile_number },
    });

    if (existingUser) {
      throw new ConflictError('User already exists with this mobile number');
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

    logAuth.signup(mobile_number, true, { userId: newUser.id, fullName: newUser.full_name });

    res.status(201).json({
      success: true,
      message: 'Account created successfully. You can now login.',
      data: {
        user: newUser,
      },
    });
  }

  /**
   * Login user with email or mobile number
   * POST /auth/login
   */
  async login(req, res) {
    // Validate request body
    const { identifier, password } = loginSchema.parse(req.body);

    // Determine if identifier is email or mobile number
    const isEmail = identifier.includes('@');
    const whereClause = isEmail
      ? { email: identifier }
      : { mobile_number: identifier };

    // Find user by email or mobile number
    const user = await prisma.user.findUnique({
      where: whereClause,
      select: {
        id: true,
        full_name: true,
        mobile_number: true,
        email: true,
        password_hash: true,
        gender: true,
        date_of_birth: true,
        profile_created_by: true,
        is_mobile_verified: true,
        is_email_verified: true,
        is_active: true,
        created_at: true,
        role: {
          select: {
            role_name: true,
          },
        },
      },
    });

    // Check if user exists
    if (!user) {
      logAuth.login(identifier, false, { reason: 'user_not_found' });
      throw new UnauthorizedError('Account does not exist. Please sign up first.');
    }

    // Check if account is active
    if (!user.is_active) {
      logAuth.login(identifier, false, { reason: 'account_deactivated', userId: user.id });
      throw new ForbiddenError('Your account has been deactivated. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      logAuth.login(identifier, false, { reason: 'invalid_password', userId: user.id });
      throw new UnauthorizedError('Invalid credentials. Please check your password and try again.');
    }

    // Generate JWT token 
    const token = jwt.sign(
      {
        user_id: user.id,
        mobile_number: user.mobile_number,
        role: user.role.role_name,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRATION || '24h',
      }
    );

    logAuth.login(identifier, true, { userId: user.id, role: user.role.role_name });
    logAuth.tokenGenerated(user.id);

    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userWithoutPassword,
      },
    });
  }

  /**
   * Create Admin or Moderator account (Protected)
   * POST /auth/create-admin 
   */
  async createAdmin(req, res) {
    // Validate request body
    const validatedData = createAdminSchema.parse(req.body);
    const { mobile_number, password, admin_secret, role, ...userData } = validatedData;

    // Verify admin secret
    if (admin_secret !== process.env.ADMIN_CREATION_SECRET) {
      throw new ForbiddenError('Invalid admin secret');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { mobile_number },
    });

    if (existingUser) {
      throw new ConflictError('User already exists with this mobile number');
    }

    // Get requested role
    const requestedRole = await prisma.role.findUnique({
      where: { role_name: role },
    });

    if (!requestedRole) {
      throw new BadRequestError(`${role} role not found in database`);
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
