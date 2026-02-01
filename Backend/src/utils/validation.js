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
  BloodGroup,
  EmploymentType,
  IncomeRange,
  EducationLevel
} from '../types/enums.js';
import { rasiOptions, nakshatraOptions } from '../../prisma/seeds/enumMasterData.js';

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

// Horoscope Details validation
// Time format helper - accepts "HH:MM AM/PM" and converts to ISO-8601 DateTime for Prisma
// Prisma requires full DateTime even for TIME columns, using epoch date 1970-01-01
const parseTimeOfBirth = (timeStr) => {
  if (!timeStr || timeStr.trim() === '') return null;
  
  // Match "HH:MM AM/PM" format (e.g., "02:30 PM", "11:45 AM")
  const timePattern = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s*(AM|PM)$/i;
  const match = timeStr.trim().match(timePattern);
  
  if (!match) {
    throw new Error('Time must be in format "HH:MM AM/PM" (e.g., "02:30 PM")');
  }
  
  let [, hours, minutes, period] = match;
  hours = parseInt(hours);
  minutes = parseInt(minutes);
  
  // Convert to 24-hour format
  if (period.toUpperCase() === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }
  
  // Return ISO-8601 DateTime string for Prisma (uses epoch date 1970-01-01)
  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');
  return `1970-01-01T${hoursStr}:${minutesStr}:00.000Z`;
};

const createHoroscopeDetailsSchema = z.object({
  rasi: z.string()
    .refine((val) => rasiOptions.includes(val), {
      message: `Rasi must be one of: ${rasiOptions.join(', ')}`
    })
    .optional(),
  nakshatra: z.string()
    .refine((val) => nakshatraOptions.includes(val), {
      message: `Nakshatra must be one of: ${nakshatraOptions.join(', ')}`
    })
    .optional(),
  time_of_birth: z.union([
    z.string()
      .regex(/^(0?[1-9]|1[0-2]):([0-5][0-9])\s*(AM|PM)$/i, 'Time must be in format "HH:MM AM/PM" (e.g., "02:30 PM")')
      .transform(parseTimeOfBirth),
    z.literal('').transform(() => null),
    z.undefined()
  ]).optional(),
  place_of_birth: z.string().max(150, 'Place of birth must not exceed 150 characters').optional(),
});

const updateHoroscopeDetailsSchema = createHoroscopeDetailsSchema;

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
    .optional(),
  
  state: z.string()
    .min(2, 'State must be at least 2 characters')
    .max(100, 'State cannot exceed 100 characters')
    .optional(),
  
  city: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City cannot exceed 100 characters')
    .optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required to update personal details'
}).refine((data) => {
  // If city is provided, state must also be provided
  if (data.city && !data.state) {
    return false;
  }
  return true;
}, {
  message: 'State is required when city is provided',
  path: ['state']
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
 * Qualification must be from EducationLevel enum
 */
const educationDetailsCreateSchema = z.object({
  qualification: z.enum([
    EducationLevel.HIGH_SCHOOL,
    EducationLevel.DIPLOMA,
    EducationLevel.BACHELORS,
    EducationLevel.MASTERS,
    EducationLevel.DOCTORATE,
    EducationLevel.PROFESSIONAL_DEGREE
  ], {
    errorMap: () => ({ message: 'Invalid qualification. Must be one of: High School, Diploma, Bachelor\'s Degree, Master\'s Degree, Doctorate/PhD, Professional Degree' })
  }),
  
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
  qualification: z.enum([
    EducationLevel.HIGH_SCHOOL,
    EducationLevel.DIPLOMA,
    EducationLevel.BACHELORS,
    EducationLevel.MASTERS,
    EducationLevel.DOCTORATE,
    EducationLevel.PROFESSIONAL_DEGREE
  ], {
    errorMap: () => ({ message: 'Invalid qualification. Must be one of: High School, Diploma, Bachelor\'s Degree, Master\'s Degree, Doctorate/PhD, Professional Degree' })
  }).optional(),
  
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

// ============================================
// PROFESSIONAL DETAILS VALIDATION (Phase 2 - Task 2.4)
// ============================================

/**
 * Sanitization helper for text fields
 * Prevents XSS, SQL injection, and script injection
 * Allows: A-Z a-z 0-9 space . , & - / ( ) '
 * Blocks: <script>, HTML tags, special characters
 */
const sanitizeTextInput = (fieldName) => {
  return z.string()
    .trim()
    .refine(
      (val) => !/[<>{}[\]\\`~!@#$%^*+=|;:"?]/.test(val),
      { message: `${fieldName} contains invalid characters. Only letters, numbers, and basic punctuation (.,&-/()')  are allowed` }
    )
    .refine(
      (val) => !/<script|<iframe|javascript:|onerror=|onclick=/i.test(val),
      { message: `${fieldName} contains potentially malicious content` }
    );
};

/**
 * Create Professional Details Validation
 * All fields optional but recommended for profile completion
 * Hybrid approach: Free text for occupation with category mapping
 */
const professionalDetailsCreateSchema = z.object({
  occupation: sanitizeTextInput('Occupation')
    .min(2, 'Occupation must be at least 2 characters')
    .max(150, 'Occupation cannot exceed 150 characters')
    .optional(),
  
  employment_type: z.enum([
    EmploymentType.GOVERNMENT_JOB,
    EmploymentType.PRIVATE_JOB,
    EmploymentType.BUSINESS,
    EmploymentType.SELF_EMPLOYED,
    EmploymentType.FREELANCER_CONSULTANT,
    EmploymentType.HOMEMAKER,
    EmploymentType.STUDENT,
    EmploymentType.RETIRED,
    EmploymentType.NOT_WORKING
  ], {
    errorMap: () => ({ message: 'Invalid employment type' })
  }).optional(),
  
  company_name: sanitizeTextInput('Company name')
    .min(2, 'Company name must be at least 2 characters')
    .max(200, 'Company name cannot exceed 200 characters')
    .optional(),
  
  designation: sanitizeTextInput('Designation')
    .min(2, 'Designation must be at least 2 characters')
    .max(150, 'Designation cannot exceed 150 characters')
    .optional(),
  
  years_of_experience: z.number()
    .int('Years of experience must be a whole number')
    .min(0, 'Years of experience cannot be negative')
    .max(60, 'Years of experience cannot exceed 60')
    .optional(),
  
  annual_income_range: z.enum([
    IncomeRange.BELOW_2L,
    IncomeRange.L2_TO_5L,
    IncomeRange.L5_TO_10L,
    IncomeRange.L10_TO_15L,
    IncomeRange.L15_TO_20L,
    IncomeRange.L20_TO_30L,
    IncomeRange.L30_TO_50L,
    IncomeRange.ABOVE_50L
  ], {
    errorMap: () => ({ message: 'Invalid income range' })
  }).optional(),
  
  work_location: sanitizeTextInput('Work location')
    .min(2, 'Work location must be at least 2 characters')
    .max(150, 'Work location cannot exceed 150 characters')
    .optional()
});

/**
 * Update Professional Details Validation (Full Replacement - PUT)
 * Same as create schema but requires at least one field
 */
const professionalDetailsUpdateSchema = z.object({
  occupation: sanitizeTextInput('Occupation')
    .min(2, 'Occupation must be at least 2 characters')
    .max(150, 'Occupation cannot exceed 150 characters')
    .optional(),
  
  employment_type: z.enum([
    EmploymentType.GOVERNMENT_JOB,
    EmploymentType.PRIVATE_JOB,
    EmploymentType.BUSINESS,
    EmploymentType.SELF_EMPLOYED,
    EmploymentType.FREELANCER_CONSULTANT,
    EmploymentType.HOMEMAKER,
    EmploymentType.STUDENT,
    EmploymentType.RETIRED,
    EmploymentType.NOT_WORKING
  ], {
    errorMap: () => ({ message: 'Invalid employment type' })
  }).optional(),
  
  company_name: sanitizeTextInput('Company name')
    .min(2, 'Company name must be at least 2 characters')
    .max(200, 'Company name cannot exceed 200 characters')
    .optional(),
  
  designation: sanitizeTextInput('Designation')
    .min(2, 'Designation must be at least 2 characters')
    .max(150, 'Designation cannot exceed 150 characters')
    .optional(),
  
  years_of_experience: z.number()
    .int('Years of experience must be a whole number')
    .min(0, 'Years of experience cannot be negative')
    .max(60, 'Years of experience cannot exceed 60')
    .optional(),
  
  annual_income_range: z.enum([
    IncomeRange.BELOW_2L,
    IncomeRange.L2_TO_5L,
    IncomeRange.L5_TO_10L,
    IncomeRange.L10_TO_15L,
    IncomeRange.L15_TO_20L,
    IncomeRange.L20_TO_30L,
    IncomeRange.L30_TO_50L,
    IncomeRange.ABOVE_50L
  ], {
    errorMap: () => ({ message: 'Invalid income range' })
  }).optional(),
  
  work_location: sanitizeTextInput('Work location')
    .min(2, 'Work location must be at least 2 characters')
    .max(150, 'Work location cannot exceed 150 characters')
    .optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required to update professional details'
});

/**
 * Patch Professional Details Validation (Partial Update - PATCH)
 * Identical to update schema - allows partial field updates
 */
const professionalDetailsPatchSchema = professionalDetailsUpdateSchema;

// ============================================
// PARTNER PREFERENCES VALIDATION (Phase 2 - Task 2.7)
// ============================================

/**
 * Create/Update Partner Preferences Validation
 * All fields are optional (user can have open preferences)
 * Supports multiple values for flexible matching
 */
const partnerPreferencesSchema = z.object({
  // Age preferences (Hard Filter - must match)
  min_age: z.number()
    .int('Minimum age must be a whole number')
    .min(18, 'Minimum age must be at least 18')
    .max(100, 'Minimum age cannot exceed 100')
    .optional(),
  
  max_age: z.number()
    .int('Maximum age must be a whole number')
    .min(18, 'Maximum age must be at least 18')
    .max(100, 'Maximum age cannot exceed 100')
    .optional(),
  
  // Height preferences (Soft Score - 5%)
  min_height: z.number()
    .int('Minimum height must be a whole number')
    .min(120, 'Minimum height must be at least 120 cm')
    .max(250, 'Minimum height cannot exceed 250 cm')
    .optional(),
  
  max_height: z.number()
    .int('Maximum height must be a whole number')
    .min(120, 'Maximum height must be at least 120 cm')
    .max(250, 'Maximum height cannot exceed 250 cm')
    .optional(),
  
  // Religion preferences (Scored - 18%) - References Religion.id
  religion_preference: z.array(
    z.number()
      .int('Religion ID must be an integer')
      .positive('Religion ID must be positive')
  ).optional(),
  
  // Caste preferences (Scored - 12%) - References Caste.id
  caste_preference: z.array(
    z.number()
      .int('Caste ID must be an integer')
      .positive('Caste ID must be positive')
  ).optional(),
  
  // Education preferences (Scored - 12%)
  education_preference: z.array(
    z.string()
      .min(2, 'Education preference must be at least 2 characters')
      .max(150, 'Education preference cannot exceed 150 characters')
  ).optional(),
  
  // Employment Type preferences (Scored - 15%)
  employment_type_preference: z.array(
    z.enum([
      EmploymentType.GOVERNMENT_JOB,
      EmploymentType.PRIVATE_JOB,
      EmploymentType.BUSINESS,
      EmploymentType.SELF_EMPLOYED,
      EmploymentType.FREELANCER_CONSULTANT,
      EmploymentType.HOMEMAKER,
      EmploymentType.STUDENT,
      EmploymentType.RETIRED,
      EmploymentType.NOT_WORKING
    ])
  ).optional(),
  
  // Location preferences (Scored - 18%) - JSONB format: {"Karnataka": ["Bangalore", "Mysore"], "Gujarat": []}
  // Empty array means "any city in that state"
  preferred_location: z.record(
    z.string().min(2, 'State name must be at least 2 characters').max(100, 'State name cannot exceed 100 characters'),
    z.array(
      z.string().min(2, 'City name must be at least 2 characters').max(100, 'City name cannot exceed 100 characters')
    )
  ).optional().nullable(),
  
  // Marital Status preferences
  marital_status_preference: z.array(
    z.enum([
      MaritalStatus.NEVER_MARRIED,
      MaritalStatus.DIVORCED,
      MaritalStatus.WIDOWED,
      MaritalStatus.AWAITING_DIVORCE,
      MaritalStatus.SEPARATED,
      MaritalStatus.ANNULLED
    ])
  ).optional(),
  
  // Mother Tongue preferences
  mother_tongue_preference: z.array(
    z.string()
      .min(2, 'Mother tongue preference must be at least 2 characters')
      .max(50, 'Mother tongue preference cannot exceed 50 characters')
  ).optional(),
  
  // Income preferences (Range)
  income_preference_min: z.enum([
    IncomeRange.BELOW_2L,
    IncomeRange.L2_TO_5L,
    IncomeRange.L5_TO_10L,
    IncomeRange.L10_TO_15L,
    IncomeRange.L15_TO_20L,
    IncomeRange.L20_TO_30L,
    IncomeRange.L30_TO_50L,
    IncomeRange.ABOVE_50L
  ]).optional(),
  
  income_preference_max: z.enum([
    IncomeRange.BELOW_2L,
    IncomeRange.L2_TO_5L,
    IncomeRange.L5_TO_10L,
    IncomeRange.L10_TO_15L,
    IncomeRange.L15_TO_20L,
    IncomeRange.L20_TO_30L,
    IncomeRange.L30_TO_50L,
    IncomeRange.ABOVE_50L
  ]).optional(),
  
  // Diet preferences
  diet_preference: z.array(
    z.enum([
      DietPreference.VEGETARIAN,
      DietPreference.NON_VEGETARIAN,
      DietPreference.EGGETARIAN,
      DietPreference.VEGAN
    ])
  ).optional(),
  
  // Drinking habit preferences
  drinking_habit_preference: z.array(
    z.enum([
      DrinkingHabit.NEVER,
      DrinkingHabit.OCCASIONALLY,
      DrinkingHabit.SOCIALLY,
      DrinkingHabit.REGULARLY
    ])
  ).optional(),
  
  // Smoking habit preferences
  smoking_habit_preference: z.array(
    z.enum([
      SmokingHabit.NEVER,
      SmokingHabit.OCCASIONALLY,
      SmokingHabit.SOCIALLY,
      SmokingHabit.REGULARLY
    ])
  ).optional()
}).refine((data) => {
  // Validate: min_age < max_age (if both provided)
  if (data.min_age !== undefined && data.max_age !== undefined) {
    return data.min_age < data.max_age;
  }
  return true;
}, {
  message: 'Minimum age must be less than maximum age',
  path: ['min_age']
}).refine((data) => {
  // Validate: min_height < max_height (if both provided)
  if (data.min_height !== undefined && data.max_height !== undefined) {
    return data.min_height < data.max_height;
  }
  return true;
}, {
  message: 'Minimum height must be less than maximum height',
  path: ['min_height']
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
  createHoroscopeDetailsSchema,
  updateHoroscopeDetailsSchema,
  personalDetailsSchema,
  casteDetailsSchema,
  educationDetailsCreateSchema,
  educationDetailsUpdateSchema,
  professionalDetailsCreateSchema,
  professionalDetailsUpdateSchema,
  professionalDetailsPatchSchema,
  partnerPreferencesSchema,
};
