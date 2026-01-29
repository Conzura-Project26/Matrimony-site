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

// Date validation helper - accepts both YYYY-MM-DD and DD-MM-YYYY formats
const parseDateOfBirth = (dateStr) => {
  // Try DD-MM-YYYY format first
  const ddmmyyyyPattern = /^(\d{2})-(\d{2})-(\d{4})$/;
  const ddmmyyyyMatch = dateStr.match(ddmmyyyyPattern);
  
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    // JavaScript Date months are 0-indexed
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Try YYYY-MM-DD format (ISO 8601)
  const yyyymmddPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
  const yyyymmddMatch = dateStr.match(yyyymmddPattern);
  
  if (yyyymmddMatch) {
    return new Date(dateStr);
  }
  
  // If neither format matches, return invalid date
  return new Date('invalid');
};

// Signup validation
const signupSchema = z.object({
  mobile_number: mobileSchema,
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(150),
  gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]),
  date_of_birth: z.string().refine((date) => {
    const dob = parseDateOfBirth(date);
    
    // Check if date is valid
    if (isNaN(dob.getTime())) {
      return false;
    }
    
    // Calculate age
    const age = (new Date() - dob) / (1000 * 60 * 60 * 24 * 365);
    return age >= 18 && age <= 100;
  }, 'Invalid date format. Use DD-MM-YYYY or YYYY-MM-DD. Age must be between 18 and 100 years'),
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
  role: z.enum(['ADMIN', 'MODERATOR']), // Match database role names
  admin_secret: z.string().min(1, 'Admin secret is required'),
});

// Login validation
const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or mobile number is required'),
  password: z.string().min(1, 'Password is required'),
});

// Forgot password - Step 1: Request OTP
const forgotPasswordSchema = z.object({
  mobile_number: mobileSchema,
});

// Forgot password - Step 2: Verify OTP
const verifyForgotOtpSchema = z.object({
  mobile_number: mobileSchema,
  otp_code: z.string().length(6, 'OTP must be 6 digits'),
});

// Forgot password - Step 3: Reset password with confirmation
const resetPasswordSchema = z.object({
  mobile_number: mobileSchema,
  new_password: passwordSchema,
  confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

// Change password (for logged-in users)
const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: passwordSchema,
  confirm_password: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'New passwords do not match',
  path: ['confirm_password'],
}).refine((data) => data.current_password !== data.new_password, {
  message: 'New password must be different from current password',
  path: ['new_password'],
});

// Refresh token validation
const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

// ============================================
// PROFILE MANAGEMENT VALIDATIONS (Phase 2)
// ============================================

// Family Details validation
const createFamilyDetailsSchema = z.object({
  father_occupation: z.string().max(150, 'Father occupation must not exceed 150 characters').optional(),
  mother_occupation: z.string().max(150, 'Mother occupation must not exceed 150 characters').optional(),
  siblings_details: z.string().optional(),
  family_values: z.enum([
    'Orthodox',
    'Traditional',
    'Moderate',
    'Liberal',
    'Progressive'
  ], {
    errorMap: () => ({ message: 'Family values must be one of: Orthodox, Traditional, Moderate, Liberal, Progressive' })
  }).optional(),
});

const updateFamilyDetailsSchema = createFamilyDetailsSchema;

export {
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
  createFamilyDetailsSchema,
  updateFamilyDetailsSchema,
};
