import express from 'express';
import authController from '../controllers/authController.js';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Send OTP to mobile number
 *     description: Send a one-time password to the provided mobile number for signup verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile_number
 *             properties:
 *               mobile_number:
 *                 type: string
 *                 pattern: '^\\+91[6-9]\\d{9}$'
 *                 description: Indian mobile number with +91 prefix
 *                 example: '+919876543210'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'OTP sent successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     expiresIn:
 *                       type: integer
 *                       example: 600
 *       400:
 *         description: Validation error or rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/send-otp', asyncHandler((req, res) => authController.sendOtp(req, res)));

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Verify OTP
 *     description: Verify the OTP sent to mobile number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile_number
 *               - otp
 *             properties:
 *               mobile_number:
 *                 type: string
 *                 example: '+919876543210'
 *               otp:
 *                 type: string
 *                 example: '123456'
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Server error
 */
router.post('/verify-otp', asyncHandler((req, res) => authController.verifyOtp(req, res)));

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Complete user signup
 *     description: Complete signup after OTP verification. Returns access token and refresh token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile_number
 *               - password
 *               - full_name
 *               - gender
 *               - date_of_birth
 *               - profile_created_by
 *             properties:
 *               mobile_number:
 *                 type: string
 *                 example: '+919876543210'
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Must contain uppercase, lowercase, number, and special character
 *                 example: 'Password@123'
 *               full_name:
 *                 type: string
 *                 example: 'John Doe'
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *                 example: 'Male'
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 description: 'Format: DD-MM-YYYY or YYYY-MM-DD'
 *                 example: '15-01-1995'
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'john@example.com'
 *               profile_created_by:
 *                 type: string
 *                 enum: [Self, Parents, Guardian, Sibling, Relative, Friend]
 *                 example: 'Self'
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Account created successfully. You are now logged in.'
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or mobile not verified
 *       500:
 *         description: Server error
 */
router.post('/signup', asyncHandler((req, res) => authController.signup(req, res)));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login user
 *     description: Login with mobile number or email and password. Returns access token (15 min) and refresh token (7 days).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Mobile number or email
 *                 example: '+919876543210'
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 'Password@123'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Login successful'
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: JWT token valid for 15 minutes
 *                     refreshToken:
 *                       type: string
 *                       description: Refresh token valid for 7 days
 *                     expiresIn:
 *                       type: integer
 *                       description: Access token expiry in seconds
 *                       example: 900
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: User not found
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account deactivated
 *       500:
 *         description: Server error
 */
router.post('/login', asyncHandler((req, res) => authController.login(req, res)));

/**
 * @swagger
 * /auth/create-admin:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Create admin or moderator account
 *     description: Create admin or moderator account (requires admin secret)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile_number
 *               - password
 *               - full_name
 *               - gender
 *               - date_of_birth
 *               - profile_created_by
 *               - role
 *               - admin_secret
 *             properties:
 *               mobile_number:
 *                 type: string
 *                 example: '+919876543210'
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 'Admin@123'
 *               full_name:
 *                 type: string
 *                 example: 'Admin User'
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *               date_of_birth:
 *                 type: string
 *                 example: '15-01-1990'
 *               email:
 *                 type: string
 *               profile_created_by:
 *                 type: string
 *                 enum: [Self, Parents, Guardian, Sibling, Relative, Friend]
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MODERATOR]
 *                 example: 'ADMIN'
 *               admin_secret:
 *                 type: string
 *                 description: Secret key from environment variable
 *     responses:
 *       201:
 *         description: Admin account created successfully
 *       403:
 *         description: Invalid admin secret
 *       500:
 *         description: Server error
 */
router.post('/create-admin', asyncHandler((req, res) => authController.createAdmin(req, res)));

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Request password reset OTP
 *     description: Send OTP to mobile number for password reset (rate limited to 3 requests per 15 minutes)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile_number
 *             properties:
 *               mobile_number:
 *                 type: string
 *                 example: '+919876543210'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       404:
 *         description: User not found
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Server error
 */
router.post('/forgot-password', (req, res) => authController.forgotPassword(req, res));

/**
 * @swagger
 * /auth/verify-forgot-otp:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Verify forgot password OTP
 *     description: Verify OTP for password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile_number
 *               - otp
 *             properties:
 *               mobile_number:
 *                 type: string
 *                 example: '+919876543210'
 *               otp:
 *                 type: string
 *                 example: '123456'
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Server error
 */
router.post('/verify-forgot-otp', (req, res) => authController.verifyForgotOtp(req, res));

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Reset password
 *     description: Reset password after OTP verification. All existing refresh tokens will be revoked.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile_number
 *               - new_password
 *               - confirm_password
 *             properties:
 *               mobile_number:
 *                 type: string
 *                 example: '+919876543210'
 *               new_password:
 *                 type: string
 *                 format: password
 *                 example: 'NewPassword@123'
 *               confirm_password:
 *                 type: string
 *                 format: password
 *                 example: 'NewPassword@123'
 *     responses:
 *       200:
 *         description: Password reset successfully. All devices logged out.
 *       400:
 *         description: Passwords don't match or verification expired
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/reset-password', (req, res) => authController.resetPassword(req, res));

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Change password (authenticated)
 *     description: Change password for logged-in user. All existing refresh tokens will be revoked, forcing re-login on all devices.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *               - confirm_password
 *             properties:
 *               current_password:
 *                 type: string
 *                 format: password
 *                 example: 'OldPassword@123'
 *               new_password:
 *                 type: string
 *                 format: password
 *                 example: 'NewPassword@123'
 *               confirm_password:
 *                 type: string
 *                 format: password
 *                 example: 'NewPassword@123'
 *     responses:
 *       200:
 *         description: Password changed successfully. All sessions invalidated.
 *       401:
 *         description: Invalid current password or unauthorized
 *       403:
 *         description: Account deactivated
 *       500:
 *         description: Server error
 */
router.post('/change-password', authenticateToken, (req, res) => authController.changePassword(req, res));

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Get new access token using refresh token. Old refresh token will be revoked (token rotation).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: Refresh token received during login
 *                 example: 'a8f5f167f44f4964e6c998dee827110c...'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Token refreshed successfully'
 *                 data:
 *                   $ref: '#/components/schemas/TokenPair'
 *       401:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Server error
 */
router.post('/refresh-token', (req, res) => authController.refreshToken(req, res));

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout from current device
 *     description: Logout from current device by revoking refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 example: 'a8f5f167f44f4964e6c998dee827110c...'
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       500:
 *         description: Server error
 */
router.post('/logout', (req, res) => authController.logout(req, res));

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout from all devices
 *     description: Logout from all devices by revoking all refresh tokens for the user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Successfully logged out from 3 device(s)'
 *                 data:
 *                   type: object
 *                   properties:
 *                     devicesLoggedOut:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/logout-all', authenticateToken, (req, res) => authController.logoutAllDevices(req, res));

export default router;
