import { z } from 'zod';
import { Gender, ProfileCreatedBy } from '../types/enums.js';

// Password validation schema - Industry best practice
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Mobile number validation (Indian format)
const mobileSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Invalid mobile number format');

// Send OTP validation
const sendOtpSchema = z.object({
  mobile_number: mobileSchema,
});

// Verify OTP validation
const verifyOtpSchema = z.object({
  mobile_number: mobileSchema,
  otp_code: z.string().length(6, 'OTP must be 6 digits'),
});

// Signup validation
const signupSchema = z.object({
  mobile_number: mobileSchema,
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(150),
  gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]),
  date_of_birth: z.string().refine((date) => {
    const dob = new Date(date);
    const age = (new Date() - dob) / (1000 * 60 * 60 * 24 * 365);
    return age >= 18 && age <= 100;
  }, 'User must be between 18 and 100 years old'),
  email: z.string().email('Invalid email format').optional(),
  password: passwordSchema,
  profile_created_by: z.enum([
    ProfileCreatedBy.SELF,
    ProfileCreatedBy.PARENT,
    ProfileCreatedBy.GUARDIAN,
  ]),
});

// Admin creation validation
const createAdminSchema = z.object({
  mobile_number: mobileSchema,
  full_name: z.string().min(2).max(150),
  gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]),
  date_of_birth: z.string(),
  email: z.string().email().optional(),
  password: passwordSchema,
  profile_created_by: z.enum([
    ProfileCreatedBy.SELF,
    ProfileCreatedBy.PARENT,
    ProfileCreatedBy.GUARDIAN,
  ]),
  role: z.enum(['ADMIN', 'MODERATOR']),
  admin_secret: z.string().min(1, 'Admin secret is required'),
});

export {
  sendOtpSchema,
  verifyOtpSchema,
  signupSchema,
  createAdminSchema,
};
