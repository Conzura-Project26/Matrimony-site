import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import otpService from '../services/otpService.js';
import tokenService from '../services/tokenService.js';
import {
  sendOtpSchema,
  verifyOtpSchema,
  signupSchema,
  createAdminSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyForgotOtpSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema,
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

// Rate limiting for OTP requests (3 per 15 minutes)
// In production, use Redis for this
const otpRateLimits = new Map();

// Store for verified forgot-password sessions (valid for 30 minutes)
const verifiedForgotPassword = new Map();

class AuthController {
  /**
   * Parse date string supporting DD-MM-YYYY and YYYY-MM-DD formats
   * @param {string} dateStr - Date string to parse
   * @returns {Date} - Parsed date object
   */
  parseDateOfBirth(dateStr) {
    const ddmmyyyyPattern = /^(\d{2})-(\d{2})-(\d{4})$/;
    const match = dateStr.match(ddmmyyyyPattern);
    if (match) {
      const [, day, month, year] = match;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return new Date(dateStr);
  }

  /**
   * Hash password with bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} - Hashed password
   */
  async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

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
    const password_hash = await this.hashPassword(password);

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
            date_of_birth: this.parseDateOfBirth(userData.date_of_birth),
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

    // Generate access token and refresh token
    const tokens = await tokenService.generateTokenPair({
      id: newUser.id,
      mobile_number: newUser.mobile_number,
      role: newUser.role.role_name,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully. You are now logged in.',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 900, // 15 minutes in seconds
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

    // Generate access token and refresh token
    const tokens = await tokenService.generateTokenPair({
      id: user.id,
      mobile_number: user.mobile_number,
      role: user.role.role_name,
    });

    logAuth.login(identifier, true, { userId: user.id, role: user.role.role_name });
    logAuth.tokenGenerated(user.id);

    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 900, // 15 minutes in seconds
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

    // Check if any admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: {
          role_name: 'ADMIN'
        }
      }
    });

    // If admins exist, require ADMIN authentication
    if (existingAdmin) {
      if (!req.user || req.user.role !== 'ADMIN') {
        throw new ForbiddenError('Only existing admins can create new admin or moderator accounts');
      }
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
    const password_hash = await this.hashPassword(password);

    // Create admin/moderator
    const newAdmin = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            role_id: requestedRole.id,
            mobile_number,
            password_hash,
            full_name: userData.full_name,
            gender: userData.gender,
            date_of_birth: this.parseDateOfBirth(userData.date_of_birth),
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

    // Generate access token and refresh token
    const tokens = await tokenService.generateTokenPair({
      id: newAdmin.id,
      mobile_number: newAdmin.mobile_number,
      role: newAdmin.role.role_name,
    });

    res.status(201).json({
      success: true,
      message: `${role} account created successfully`,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 900, // 15 minutes in seconds
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

  /**
   * Check OTP rate limit (3 requests per 15 minutes)
   * @param {string} mobile_number - Mobile number to check
   * @returns {Object} - { allowed: boolean, remainingTime: number }
   */
  checkOtpRateLimit(mobile_number) {
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    const rateLimit = otpRateLimits.get(mobile_number);

    if (!rateLimit) {
      // First request
      otpRateLimits.set(mobile_number, {
        count: 1,
        firstRequest: now,
      });
      return { allowed: true };
    }

    // Check if 15 minutes have passed
    if (now - rateLimit.firstRequest > fifteenMinutes) {
      // Reset counter
      otpRateLimits.set(mobile_number, {
        count: 1,
        firstRequest: now,
      });
      return { allowed: true };
    }

    // Within 15-minute window
    if (rateLimit.count >= 3) {
      const remainingTime = Math.ceil((fifteenMinutes - (now - rateLimit.firstRequest)) / 1000 / 60);
      return {
        allowed: false,
        remainingTime,
      };
    }

    // Increment counter
    rateLimit.count += 1;
    return { allowed: true };
  }

  /**
   * Forgot Password - Step 1: Send OTP
   * POST /auth/forgot-password
   */
  async forgotPassword(req, res) {
    try {
      // Validate request body
      const { mobile_number } = forgotPasswordSchema.parse(req.body);

      // Check rate limit
      const rateLimitCheck = this.checkOtpRateLimit(mobile_number);
      if (!rateLimitCheck.allowed) {
        return res.status(429).json({
          success: false,
          message: `Too many OTP requests. Please try again in ${rateLimitCheck.remainingTime} minutes.`,
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { mobile_number },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this mobile number.',
        });
      }

      // Invalidate any previous OTPs for this mobile number
      await prisma.otpLog.updateMany({
        where: {
          purpose: 'FORGOT_PASSWORD',
          verified: false,
        },
        data: {
          verified: true, // Mark as used to invalidate
        },
      });

      // Generate and store OTP
      const otpCode = await otpService.createOtp(mobile_number, 'FORGOT_PASSWORD');

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

      console.error('Forgot Password Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.',
      });
    }
  }

  /**
   * Forgot Password - Step 2: Verify OTP
   * POST /auth/verify-forgot-otp
   */
  async verifyForgotOtp(req, res) {
    try {
      // Validate request body
      const { mobile_number, otp_code } = verifyForgotOtpSchema.parse(req.body);

      // Verify OTP
      const isValid = await otpService.verifyOtp(mobile_number, otp_code, 'FORGOT_PASSWORD');

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP',
        });
      }

      // Store verified session (valid for 30 minutes)
      verifiedForgotPassword.set(mobile_number, {
        verified: true,
        timestamp: Date.now(),
      });

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully. You can now reset your password.',
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

      console.error('Verify Forgot OTP Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify OTP. Please try again.',
      });
    }
  }

  /**
   * Forgot Password - Step 3: Reset Password
   * POST /auth/reset-password
   */
  async resetPassword(req, res) {
    try {
      // Validate request body
      const { mobile_number, new_password } = resetPasswordSchema.parse(req.body);

      // Check if OTP was verified
      const verification = verifiedForgotPassword.get(mobile_number);
      if (!verification || !verification.verified) {
        return res.status(400).json({
          success: false,
          message: 'Please verify OTP first before resetting password.',
        });
      }

      // Check if verification is still valid (30 minutes)
      const timeDiff = Date.now() - verification.timestamp;
      if (timeDiff > 30 * 60 * 1000) {
        verifiedForgotPassword.delete(mobile_number);
        return res.status(400).json({
          success: false,
          message: 'OTP verification expired. Please request a new OTP.',
        });
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { mobile_number },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }

      // Hash new password
      const password_hash = await this.hashPassword(new_password);

      // Update password
      await prisma.user.update({
        where: { mobile_number },
        data: { password_hash },
      });

      // Revoke all refresh tokens for this user (force re-login on all devices)
      await tokenService.revokeAllUserTokens(user.id);

      // Remove from verified forgot password map
      verifiedForgotPassword.delete(mobile_number);

      // Send notification SMS
      try {
        const notificationMessage = `Your SARVVIVAH account password has been changed successfully. If you did not make this change, please contact support immediately.`;
        await otpService.sendOtpSms(mobile_number, notificationMessage, 0, true);
      } catch (smsError) {
        console.error('Failed to send password reset notification:', smsError);
        // Don't fail the request if SMS fails
      }

      res.status(200).json({
        success: true,
        message: 'Password reset successfully. Please login with your new password.',
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      console.error('Reset Password Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset password. Please try again.',
      });
    }
  }

  /**
   * Change Password (for logged-in users)
   * POST /auth/change-password
   * Requires JWT authentication
   */
  async changePassword(req, res) {
    try {
      // User ID comes from JWT middleware (req.user)
      const userId = req.user.userId;

      // Validate request body
      const { current_password, new_password } = changePasswordSchema.parse(req.body);

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          mobile_number: true,
          password_hash: true,
          is_active: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated.',
        });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(current_password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect.',
        });
      }

      // Hash new password
      const password_hash = await this.hashPassword(new_password);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password_hash },
      });

      // Revoke all refresh tokens for this user (force re-login on all devices)
      await tokenService.revokeAllUserTokens(userId);

      // Send notification SMS
      try {
        const notificationMessage = `Your SARVVIVAH account password has been changed successfully. If you did not make this change, please contact support immediately.`;
        await otpService.sendOtpSms(user.mobile_number, notificationMessage, 0, true);
      } catch (smsError) {
        console.error('Failed to send password change notification:', smsError);
        // Don't fail the request if SMS fails
      }

      res.status(200).json({
        success: true,
        message: 'Password changed successfully. Please login again with your new password.',
        data: {
          note: 'All existing sessions have been invalidated. Please login again.',
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

      console.error('Change Password Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password. Please try again.',
      });
    }
  }

  /**
   * Refresh access token using refresh token
   * POST /auth/refresh-token
   */
  async refreshToken(req, res) {
    try {
      // Validate request body
      const { refresh_token } = refreshTokenSchema.parse(req.body);

      // Verify refresh token and get user data
      const tokenRecord = await tokenService.verifyRefreshToken(refresh_token);
      
      if (!tokenRecord) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token. Please login again.',
        });
      }

      // Generate new token pair
      const tokens = await tokenService.generateTokenPair({
        id: tokenRecord.user.id,
        mobile_number: tokenRecord.user.mobile_number,
        role: tokenRecord.user.role?.role_name,
      });

      // Revoke old refresh token (token rotation for security)
      await tokenService.revokeToken(refresh_token);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: 900, // 15 minutes in seconds
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

      console.error('Refresh Token Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to refresh token. Please try again.',
      });
    }
  }

  /**
   * Logout from current device
   * POST /auth/logout
   */
  async logout(req, res) {
    try {
      // Validate request body
      const { refresh_token } = refreshTokenSchema.parse(req.body);

      // Revoke the refresh token
      await tokenService.revokeToken(refresh_token);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      console.error('Logout Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to logout. Please try again.',
      });
    }
  }

  /**
   * Logout from all devices (Protected)
   * POST /auth/logout-all
   */
  async logoutAllDevices(req, res) {
    try {
      const userId = req.user.userId;

      // Revoke all refresh tokens for this user
      const count = await tokenService.revokeAllUserTokens(userId);

      res.status(200).json({
        success: true,
        message: `Successfully logged out from ${count} device(s)`,
        data: {
          devicesLoggedOut: count,
        },
      });
    } catch (error) {
      console.error('Logout All Devices Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to logout from all devices. Please try again.',
      });
    }
  }
}

export default new AuthController();
