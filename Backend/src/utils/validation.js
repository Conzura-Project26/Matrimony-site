import { z } from 'zod';
import { 
  Gender, 
  ProfileCreatedBy,
  MaritalStatus,
  PhysicalStatus,
  DietPreference,
  DrinkingHabit,
  SmokingHabit,
  Complexion,
  BodyType,
  BloodGroup
} from '../types/enums.js';

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

// ============================================
// PERSONAL DETAILS VALIDATION (Phase 2 - Task 2.1)
// ============================================

// Create/Update Personal Details validation
const personalDetailsSchema = z.object({
  height_cm: z.number()
    .int('Height must be a whole number')
    .min(120, 'Height must be at least 120 cm')
    .max(250, 'Height cannot exceed 250 cm')
    .optional(),
  
  weight_kg: z.number()
    .int('Weight must be a whole number')
    .min(30, 'Weight must be at least 30 kg')
    .max(200, 'Weight cannot exceed 200 kg')
    .optional(),
  
  marital_status: z.enum([
    MaritalStatus.NEVER_MARRIED,
    MaritalStatus.DIVORCED,
    MaritalStatus.WIDOWED,
    MaritalStatus.AWAITING_DIVORCE,
    MaritalStatus.SEPARATED,
    MaritalStatus.ANNULLED
  ], {
    errorMap: () => ({ message: 'Invalid marital status' })
  }).optional(),
  
  physical_status: z.enum([
    PhysicalStatus.NORMAL,
    PhysicalStatus.VISUALLY_IMPAIRED,
    PhysicalStatus.HEARING_IMPAIRED,
    PhysicalStatus.MOBILITY_IMPAIRED,
    PhysicalStatus.OTHER
  ], {
    errorMap: () => ({ message: 'Invalid physical status' })
  }).optional(),
  
  mother_tongue: z.string()
    .min(2, 'Mother tongue must be at least 2 characters')
    .max(50, 'Mother tongue cannot exceed 50 characters')
    .optional(),
  
  complexion: z.enum([
    Complexion.VERY_FAIR,
    Complexion.FAIR,
    Complexion.WHEATISH,
    Complexion.WHEATISH_BROWN,
    Complexion.DARK
  ], {
    errorMap: () => ({ message: 'Invalid complexion' })
  }).optional(),
  
  body_type: z.enum([
    BodyType.SLIM,
    BodyType.AVERAGE,
    BodyType.ATHLETIC,
    BodyType.HEAVY
  ], {
    errorMap: () => ({ message: 'Invalid body type' })
  }).optional(),
  
  blood_group: z.enum([
    BloodGroup.A_POSITIVE,
    BloodGroup.A_NEGATIVE,
    BloodGroup.B_POSITIVE,
    BloodGroup.B_NEGATIVE,
    BloodGroup.AB_POSITIVE,
    BloodGroup.AB_NEGATIVE,
    BloodGroup.O_POSITIVE,
    BloodGroup.O_NEGATIVE
  ], {
    errorMap: () => ({ message: 'Invalid blood group' })
  }).optional(),
  
  diet_preference: z.enum([
    DietPreference.VEGETARIAN,
    DietPreference.NON_VEGETARIAN,
    DietPreference.EGGETARIAN,
    DietPreference.VEGAN
  ], {
    errorMap: () => ({ message: 'Invalid diet preference' })
  }).optional(),
  
  drinking_habit: z.enum([
    DrinkingHabit.NEVER,
    DrinkingHabit.OCCASIONALLY,
    DrinkingHabit.SOCIALLY,
    DrinkingHabit.REGULARLY
  ], {
    errorMap: () => ({ message: 'Invalid drinking habit' })
  }).optional(),
  
  smoking_habit: z.enum([
    SmokingHabit.NEVER,
    SmokingHabit.OCCASIONALLY,
    SmokingHabit.SOCIALLY,
    SmokingHabit.REGULARLY
  ], {
    errorMap: () => ({ message: 'Invalid smoking habit' })
  }).optional(),
  
  about_me: z.string()
    .min(10, 'About me must be at least 10 characters')
    .max(1000, 'About me cannot exceed 1000 characters')
    .optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required to update personal details'
});

// ============================================
// CASTE DETAILS VALIDATION (Phase 2 - Task 2.2)
// ============================================

// Create/Update Caste Details validation
const casteDetailsSchema = z.object({
  religion_id: z.number()
    .int('Religion ID must be an integer')
    .positive('Religion ID must be positive')
    .optional(),
  
  caste_id: z.number()
    .int('Caste ID must be an integer')
    .positive('Caste ID must be positive')
    .optional(),
  
  sub_caste_id: z.number()
    .int('Sub-caste ID must be an integer')
    .positive('Sub-caste ID must be positive')
    .optional(),
  
  community_details: z.string()
    .min(10, 'Community details must be at least 10 characters')
    .max(500, 'Community details cannot exceed 500 characters')
    .optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required to update caste details'
});

// ============================================
// EDUCATION DETAILS VALIDATION (Phase 2 - Task 2.3)
// ============================================

/**
 * Maximum number of education entries allowed per user
 * Industry best practice: Limit to prevent data pollution
 */
export const MAX_EDUCATION_ENTRIES = 5;

/**
 * Create Education Entry Validation
 * All three fields are mandatory for meaningful education record
 */
const educationDetailsCreateSchema = z.object({
  highest_qualification: z.string()
    .min(2, 'Qualification must be at least 2 characters')
    .max(150, 'Qualification cannot exceed 150 characters')
    .trim(),
  
  institution_name: z.string()
    .min(3, 'Institution name must be at least 3 characters')
    .max(200, 'Institution name cannot exceed 200 characters')
    .trim(),
  
  year_of_passing: z.number()
    .int('Year must be a whole number')
    .positive('Year must be positive')
    // Note: Min/Max year validation done at controller level 
    // (requires user's birth year from database)
});

/**
 * Update Education Entry Validation
 * Partial updates allowed (PATCH-style)
 * Only provided fields will be validated and updated
 */
const educationDetailsUpdateSchema = z.object({
  highest_qualification: z.string()
    .min(2, 'Qualification must be at least 2 characters')
    .max(150, 'Qualification cannot exceed 150 characters')
    .trim()
    .optional(),
  
  institution_name: z.string()
    .min(3, 'Institution name must be at least 3 characters')
    .max(200, 'Institution name cannot exceed 200 characters')
    .trim()
    .optional(),
  
  year_of_passing: z.number()
    .int('Year must be a whole number')
    .positive('Year must be positive')
    .optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required to update education details'
});

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
  personalDetailsSchema,
  casteDetailsSchema,
  educationDetailsCreateSchema,
  educationDetailsUpdateSchema,
};
