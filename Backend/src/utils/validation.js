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
  EducationLevel,
  WorkLocationType,
  UserStatus,
  AdminBulkAction,
  ExportFormat,
  ReportStatus,
  ReportSeverity,
  ReportCategory,
  ReportAction
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
  
  work_location_type: z.enum([
    WorkLocationType.ON_SITE,
    WorkLocationType.REMOTE,
    WorkLocationType.HYBRID,
    WorkLocationType.MULTIPLE_LOCATIONS,
    WorkLocationType.OVERSEAS
  ], {
    errorMap: () => ({ message: 'Invalid work location type' })
  }).optional(),
  
  work_state: sanitizeTextInput('Work state')
    .min(2, 'Work state must be at least 2 characters')
    .max(100, 'Work state cannot exceed 100 characters')
    .optional(),
  
  work_city: sanitizeTextInput('Work city')
    .min(2, 'Work city must be at least 2 characters')
    .max(100, 'Work city cannot exceed 100 characters')
    .optional()
}).refine((data) => {
  // If work_city is provided, work_state must also be provided
  if (data.work_city && !data.work_state) {
    return false;
  }
  return true;
}, {
  message: 'Work state is required when work city is provided',
  path: ['work_state']
}).refine((data) => {
  // If work_location_type is REMOTE, work_state and work_city must be null/undefined
  if (data.work_location_type === WorkLocationType.REMOTE) {
    if (data.work_state || data.work_city) {
      return false;
    }
  }
  return true;
}, {
  message: 'Work state and work city must not be provided when location type is Remote',
  path: ['work_location_type']
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
  
  work_location_type: z.enum([
    WorkLocationType.ON_SITE,
    WorkLocationType.REMOTE,
    WorkLocationType.HYBRID,
    WorkLocationType.MULTIPLE_LOCATIONS,
    WorkLocationType.OVERSEAS
  ], {
    errorMap: () => ({ message: 'Invalid work location type' })
  }).optional(),
  
  work_state: sanitizeTextInput('Work state')
    .min(2, 'Work state must be at least 2 characters')
    .max(100, 'Work state cannot exceed 100 characters')
    .optional(),
  
  work_city: sanitizeTextInput('Work city')
    .min(2, 'Work city must be at least 2 characters')
    .max(100, 'Work city cannot exceed 100 characters')
    .optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required to update professional details'
}).refine((data) => {
  // If work_city is provided, work_state must also be provided
  if (data.work_city && !data.work_state) {
    return false;
  }
  return true;
}, {
  message: 'Work state is required when work city is provided',
  path: ['work_state']
}).refine((data) => {
  // If work_location_type is REMOTE, work_state and work_city must be null/undefined
  if (data.work_location_type === WorkLocationType.REMOTE) {
    if (data.work_state || data.work_city) {
      return false;
    }
  }
  return true;
}, {
  message: 'Work state and work city must not be provided when location type is Remote',
  path: ['work_location_type']
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
  
  // Weight preferences (Soft Score - 5%)
  min_weight: z.number()
    .int('Minimum weight must be a whole number')
    .min(30, 'Minimum weight must be at least 30 kg')
    .max(200, 'Minimum weight cannot exceed 200 kg')
    .optional(),
  
  max_weight: z.number()
    .int('Maximum weight must be a whole number')
    .min(30, 'Maximum weight must be at least 30 kg')
    .max(200, 'Maximum weight cannot exceed 200 kg')
    .optional(),
  
  // Religion preferences (Scored - 17%) - References Religion.id
  religion_preference: z.array(
    z.number()
      .int('Religion ID must be an integer')
      .positive('Religion ID must be positive')
  ).optional(),
  
  // Caste preferences (Scored - 11%) - References Caste.id
  caste_preference: z.array(
    z.number()
      .int('Caste ID must be an integer')
      .positive('Caste ID must be positive')
  ).optional(),
  
  // Education preferences (Scored - 11%)
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
  
  // Location preferences (Scored - 17%) - JSONB format: {"Karnataka": ["Bangalore", "Mysore"], "Gujarat": []}
  // Empty array means "any city in that state"
  preferred_location: z.record(
    z.string().min(2, 'State name must be at least 2 characters').max(100, 'State name cannot exceed 100 characters'),
    z.array(
      z.string().min(2, 'City name must be at least 2 characters').max(100, 'City name cannot exceed 100 characters')
    )
  ).optional().nullable(),
    // Physical Status preferences (Scored - 5%)
  physical_status: z.array(
    z.enum([
      PhysicalStatus.NORMAL,
      PhysicalStatus.VISUALLY_IMPAIRED,
      PhysicalStatus.HEARING_IMPAIRED,
      PhysicalStatus.MOBILITY_IMPAIRED,
      PhysicalStatus.OTHER
    ])
  ).optional(),
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
}).refine((data) => {
  // Validate: min_weight < max_weight (if both provided)
  if (data.min_weight !== undefined && data.max_weight !== undefined) {
    return data.min_weight < data.max_weight;
  }
  return true;
}, {
  message: 'Minimum weight must be less than maximum weight',
  path: ['min_weight']
});

// ========================
// SEARCH VALIDATION SCHEMAS
// ========================

/**
 * Simple Search Schema (GET request - query params)
 * For basic search with limited filters
 */
const simpleSearchSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  keyword: z.string().trim().min(2).max(100).optional(),
  mother_tongue: z.string().trim().optional(),
  min_height: z.coerce.number().int().min(100).max(250).optional(),
  max_height: z.coerce.number().int().min(100).max(250).optional(),
  rasi: z.string().trim().optional(),
  nakshatra: z.string().trim().optional(),
}).refine((data) => {
  // Validate: min_height <= max_height (if both provided)
  if (data.min_height !== undefined && data.max_height !== undefined) {
    return data.min_height <= data.max_height;
  }
  return true;
}, {
  message: 'Minimum height cannot be greater than maximum height',
  path: ['min_height']
});

/**
 * Advanced Search Schema (POST request - body)
 * For complex search with multiple filters
 */
const advancedSearchSchema = z.object({
  // Pagination
  page: z.number().int().min(1).optional().default(1),
  
  // Height filter (numeric min/max only)
  min_height: z.number().int().min(100).max(250).optional(),
  max_height: z.number().int().min(100).max(250).optional(),
  
  // Mother tongue filter (array for multiple selection)
  mother_tongue: z.array(z.string().trim()).min(1).max(10).optional(),
  
  // Horoscope filters
  rasi: z.array(z.string().trim()).min(1).max(12).optional(),
  nakshatra: z.array(z.string().trim()).min(1).max(27).optional(),
  
  // Keyword search in profile (full-text search)
  keyword: z.string().trim().min(2).max(100).optional(),
  
}).refine((data) => {
  // Validate: min_height <= max_height (if both provided)
  if (data.min_height !== undefined && data.max_height !== undefined) {
    return data.min_height <= data.max_height;
  }
  return true;
}, {
  message: 'Minimum height cannot be greater than maximum height',
  path: ['min_height']
}).refine((data) => {
  // Ensure at least one search criterion is provided
  const hasFilter = data.keyword || 
                    data.mother_tongue || 
                    data.rasi || 
                    data.nakshatra || 
                    data.min_height !== undefined || 
                    data.max_height !== undefined;
  return hasFilter;
}, {
  message: 'At least one search filter must be provided',
  path: ['keyword']
});

/**
 * Profile ID Search Schema
 * For searching by custom profile ID
 */
const profileIdSearchSchema = z.object({
  profile_id: z.string().trim().min(5).max(20),
});

// ============================================
// MATCHMAKING VALIDATION SCHEMAS (Phase 3 - Task 3.4)
// ============================================

/**
 * Get Recommended Profiles Query Schema
 */
const getRecommendedSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
  min_score: z.coerce.number().min(0).max(100).optional().default(50),
  regenerate: z.coerce.boolean().optional().default(false)
});

/**
 * Get New Matches Query Schema
 */
const getNewMatchesSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(20)
});

/**
 * Record Match Interaction Params Schema
 */
const recordMatchViewSchema = z.object({
  matchId: z.string().uuid('Invalid match ID format')
});

// ============================================
// ADMIN SCHEMAS (Phase 5 - Task 5.1) ✅
// ============================================

/**
 * Admin: Get All Users - Query Filters
 */
const adminGetUsersSchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  
  // Text search (searches name, email, profile_id, mobile)
  q: z.string().trim().optional(),
  
  // Status filters
  is_active: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
  is_profile_verified: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
  is_email_verified: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
  is_mobile_verified: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
  
  // Role filter
  role: z.enum(['USER', 'ADMIN', 'MODERATOR']).optional(),
  
  // Date filters
  created_from: z.string().datetime().optional(),
  created_to: z.string().datetime().optional(),
  last_active_from: z.string().datetime().optional(),
  last_active_to: z.string().datetime().optional(),
  
  // Other filters
  gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]).optional(),
  age_min: z.coerce.number().int().min(18).max(100).optional(),
  age_max: z.coerce.number().int().min(18).max(100).optional(),
  profile_completion_min: z.coerce.number().int().min(0).max(100).optional(),
  
  // Sorting (whitelisted only)
  sort_by: z.enum(['created_at', 'last_active_at', 'profile_completion_percentage', 'full_name']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

/**
 * Admin: Update User Status
 */
const adminUpdateUserStatusSchema = z.object({
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED]),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500)
});

/**
 * Admin: Delete User (Soft Delete)
 */
const adminDeleteUserSchema = z.object({
  reason: z.string().min(10, 'Deletion reason must be at least 10 characters').max(500)
});

/**
 * Admin: Verify User Profile
 */
const adminVerifyProfileSchema = z.object({
  is_profile_verified: z.boolean()
});

/**
 * Admin: Export Users
 */
const adminExportUsersSchema = z.object({
  format: z.enum([ExportFormat.CSV, ExportFormat.JSON]).default(ExportFormat.CSV),
  filters: z.object({
    is_active: z.boolean().optional(),
    is_profile_verified: z.boolean().optional(),
    role: z.enum(['USER', 'ADMIN', 'MODERATOR']).optional(),
    gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]).optional()
  }).optional()
});

/**
 * Admin: Bulk Operations
 */
const adminBulkOperationSchema = z.object({
  action: z.enum([
    AdminBulkAction.ACTIVATE,
    AdminBulkAction.DEACTIVATE,
    AdminBulkAction.SUSPEND,
    AdminBulkAction.VERIFY_PROFILE
  ]),
  user_ids: z.array(z.string().uuid()).min(1, 'At least one user ID required').max(100, 'Maximum 100 users per bulk operation'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500)
});

/**
 * Photo Moderation: Bulk Approve Photos
 */
const bulkApprovePhotosSchema = z.object({
  photo_ids: z.array(z.number().int().positive())
    .min(1, 'At least one photo ID required')
    .max(50, 'Maximum 50 photos per bulk operation')
});

/**
 * Photo Moderation: Reject Photo (Individual)
 */
const rejectPhotoSchema = z.object({
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must not exceed 500 characters')
});

/**
 * Photo Moderation: Bulk Reject Photos
 */
const bulkRejectPhotosSchema = z.object({
  photo_ids: z.array(z.number().int().positive())
    .min(1, 'At least one photo ID required')
    .max(50, 'Maximum 50 photos per bulk operation'),
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must not exceed 500 characters')
});

// ============================================
// STATISTICS SCHEMAS (Phase 5 - Task 5.2) ✅
// ============================================

/**
 * Statistics: Registrations Query
 */
const statsRegistrationsSchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  group_by: z.enum(['none', 'gender', 'religion', 'created_by', 'completion_bucket']).default('none'),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
}).refine((data) => {
  // If both from and to are provided, validate range
  if (data.from && data.to) {
    const from = new Date(data.from);
    const to = new Date(data.to);
    const diffDays = (to - from) / (1000 * 60 * 60 * 24);
    
    // Max range: 90 days for daily, 365 days for weekly/monthly
    if (data.period === 'daily' && diffDays > 90) {
      return false;
    }
    if (data.period === 'weekly' && diffDays > 365) {
      return false;
    }
    if (data.period === 'monthly' && diffDays > 730) {
      return false;
    }
  }
  return true;
}, {
  message: 'Date range too large. Max: 90 days (daily), 365 days (weekly), 730 days (monthly)'
});

/**
 * Statistics: Active Users Query
 */
const statsActiveUsersSchema = z.object({
  window: z.enum(['1d', '7d', '30d']).default('7d')
});

/**
 * Statistics: Active Users Trend Query
 */
const statsActiveUsersTrendSchema = z.object({
  window: z.enum(['1d', '7d', '30d']).default('7d'),
  period: z.enum(['daily', 'weekly', 'monthly']).default('daily')
});

/**
 * Statistics: Location Query
 */
const statsLocationSchema = z.object({
  top_cities: z.coerce.number().int().min(5).max(20).default(10)
});

// ============================================
// REPORT MANAGEMENT SCHEMAS (Phase 5 - Task 5.4) ✅
// ============================================

/**
 * Admin: Get All Reports - Query Filters
 */
const adminGetReportsSchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  // Status filter
  status: z.enum([
    ReportStatus.OPEN,
    ReportStatus.IN_REVIEW,
    ReportStatus.ACTION_TAKEN,
    ReportStatus.RESOLVED,
    ReportStatus.DISMISSED,
    ReportStatus.ESCALATED
  ]).optional(),

  // Severity filter
  severity: z.enum([
    ReportSeverity.LOW,
    ReportSeverity.MEDIUM,
    ReportSeverity.HIGH,
    ReportSeverity.CRITICAL
  ]).optional(),

  // Category filter
  category: z.enum([
    ReportCategory.FAKE_PROFILE,
    ReportCategory.HARASSMENT,
    ReportCategory.INAPPROPRIATE_PHOTO,
    ReportCategory.INAPPROPRIATE_CONTENT,
    ReportCategory.SPAM,
    ReportCategory.SCAM,
    ReportCategory.UNDERAGE,
    ReportCategory.MARRIED,
    ReportCategory.DUPLICATE_PROFILE,
    ReportCategory.OFFENSIVE_BEHAVIOR,
    ReportCategory.OTHER
  ]).optional(),

  // User filters
  reported_by: z.string().uuid().optional(),
  reported_user: z.string().uuid().optional(),

  // Date filters
  created_from: z.string().datetime().optional(),
  created_to: z.string().datetime().optional(),

  // Boolean filters
  has_action: z.coerce.boolean().optional(), // Reports with action_taken
  escalated: z.coerce.boolean().optional(), // Only ESCALATED status

  // Text search
  q: z.string().max(100).optional(),

  // Sorting
  sort_by: z.enum(['created_at', 'updated_at', 'severity']).default('severity'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

/**
 * Admin: Update Report Status
 */
const adminUpdateReportStatusSchema = z.object({
  status: z.enum([
    ReportStatus.OPEN,
    ReportStatus.IN_REVIEW,
    ReportStatus.ACTION_TAKEN,
    ReportStatus.RESOLVED,
    ReportStatus.DISMISSED,
    ReportStatus.ESCALATED
  ]),
  admin_notes: z.string().max(1000).optional()
});

/**
 * Admin: Take Action on Reported User
 */
const adminTakeReportActionSchema = z.object({
  action: z.enum([
    ReportAction.NO_ACTION,
    ReportAction.WARN_USER,
    ReportAction.SUSPEND_USER,
    ReportAction.DEACTIVATE_USER,
    ReportAction.DELETE_CONTENT,
    ReportAction.RESTRICT_FEATURES,
    ReportAction.FLAG_USER
  ]),
  metadata: z.object({
    // For SUSPEND_USER
    suspension_days: z.number().int().min(1).max(365).optional(),
    
    // For DELETE_CONTENT
    content_type: z.enum(['photo', 'message', 'bio', 'all']).optional(),
    content_ids: z.array(z.number().int()).optional(),
    
    // For RESTRICT_FEATURES
    restricted_features: z.array(z.enum(['chat', 'interest', 'upload', 'search'])).optional(),
    restriction_days: z.number().int().min(1).max(90).optional(),
    
    // General notes
    notes: z.string().max(1000).optional()
  }).optional(),
  admin_notes: z.string().max(1000).optional()
});

// ============================================
// USER REPORTING VALIDATION SCHEMAS (Task 5.5)
// ============================================

/**
 * User: Create Report
 */
const userCreateReportSchema = z.object({
  category: z.enum([
    ReportCategory.FAKE_PROFILE,
    ReportCategory.HARASSMENT,
    ReportCategory.INAPPROPRIATE_PHOTO,
    ReportCategory.INAPPROPRIATE_CONTENT,
    ReportCategory.SPAM,
    ReportCategory.SCAM,
    ReportCategory.UNDERAGE,
    ReportCategory.MARRIED,
    ReportCategory.DUPLICATE_PROFILE,
    ReportCategory.OFFENSIVE_BEHAVIOR,
    ReportCategory.OTHER
  ]),
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(1000, 'Reason must not exceed 1000 characters')
});

/**
 * User: Get My Reports
 */
const userGetMyReportsSchema = z.object({
  // Report type filter
  type: z.enum(['made', 'received', 'all']).default('all'),

  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),

  // Status filter
  status: z.enum([
    ReportStatus.OPEN,
    ReportStatus.IN_REVIEW,
    ReportStatus.ACTION_TAKEN,
    ReportStatus.RESOLVED,
    ReportStatus.DISMISSED,
    ReportStatus.ESCALATED
  ]).optional(),

  // Category filter
  category: z.enum([
    ReportCategory.FAKE_PROFILE,
    ReportCategory.HARASSMENT,
    ReportCategory.INAPPROPRIATE_PHOTO,
    ReportCategory.INAPPROPRIATE_CONTENT,
    ReportCategory.SPAM,
    ReportCategory.SCAM,
    ReportCategory.UNDERAGE,
    ReportCategory.MARRIED,
    ReportCategory.DUPLICATE_PROFILE,
    ReportCategory.OFFENSIVE_BEHAVIOR,
    ReportCategory.OTHER
  ]).optional(),

  // Date filters
  created_from: z.string().datetime().optional(),
  created_to: z.string().datetime().optional(),

  // Sorting
  sort_by: z.enum(['created_at', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
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
  simpleSearchSchema,
  advancedSearchSchema,
  profileIdSearchSchema,
  getRecommendedSchema,
  getNewMatchesSchema,
  recordMatchViewSchema,
  adminGetUsersSchema,
  adminUpdateUserStatusSchema,
  adminDeleteUserSchema,
  adminVerifyProfileSchema,
  adminExportUsersSchema,
  adminBulkOperationSchema,
  bulkApprovePhotosSchema,
  rejectPhotoSchema,
  bulkRejectPhotosSchema,
  statsRegistrationsSchema,
  statsActiveUsersSchema,
  statsActiveUsersTrendSchema,
  statsLocationSchema,
  adminGetReportsSchema,
  adminUpdateReportStatusSchema,
  adminTakeReportActionSchema,
  userCreateReportSchema,
  userGetMyReportsSchema
};

