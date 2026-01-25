import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

/**
 * @route   POST /auth/send-otp
 * @desc    Send OTP to mobile number for signup
 * @access  Public
 */
router.post('/send-otp', (req, res) => authController.sendOtp(req, res));

/**
 * @route   POST /auth/verify-otp
 * @desc    Verify OTP sent to mobile number
 * @access  Public
 */
router.post('/verify-otp', (req, res) => authController.verifyOtp(req, res));

/**
 * @route   POST /auth/signup
 * @desc    Complete user signup after OTP verification
 * @access  Public (requires verified mobile)
 */
router.post('/signup', (req, res) => authController.signup(req, res));

/**
 * @route   POST /auth/create-admin
 * @desc    Create admin or moderator account (Protected with secret)
 * @access  Protected (requires admin secret)
 */
router.post('/create-admin', (req, res) => authController.createAdmin(req, res));

export default router;
