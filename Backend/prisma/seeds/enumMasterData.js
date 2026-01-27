/**
 * Enum Master Data
 * Static data that can be used for dropdowns and validation
 * This file exports all enum values in a structured format
 */

import {
  Gender,
  ProfileCreatedBy,
  InterestStatus,
  MaritalStatus,
  PhysicalStatus,
  EmploymentType,
  FamilyValues,
  IncomeRange,
  PhotoVisibility,
  EducationLevel,
  DietPreference,
  DrinkingHabit,
  SmokingHabit
} from '../../src/types/enums.js';

/**
 * Gender options with display labels
 */
export const genderOptions = [
  { value: Gender.MALE, label: 'Male' },
  { value: Gender.FEMALE, label: 'Female' },
  { value: Gender.OTHER, label: 'Other' }
];

/**
 * Profile Created By options
 */
export const profileCreatedByOptions = [
  { value: ProfileCreatedBy.SELF, label: 'Self' },
  { value: ProfileCreatedBy.PARENT, label: 'Parent' },
  { value: ProfileCreatedBy.GUARDIAN, label: 'Guardian' }
];

/**
 * Interest Status options
 */
export const interestStatusOptions = [
  { value: InterestStatus.PENDING, label: 'Pending', color: 'warning' },
  { value: InterestStatus.ACCEPTED, label: 'Accepted', color: 'success' },
  { value: InterestStatus.REJECTED, label: 'Rejected', color: 'error' }
];

/**
 * Marital Status options
 */
export const maritalStatusOptions = [
  { value: MaritalStatus.NEVER_MARRIED, label: 'Never Married', priority: 1 },
  { value: MaritalStatus.DIVORCED, label: 'Divorced', priority: 2 },
  { value: MaritalStatus.WIDOWED, label: 'Widowed', priority: 3 },
  { value: MaritalStatus.AWAITING_DIVORCE, label: 'Awaiting Divorce', priority: 4 },
  { value: MaritalStatus.SEPARATED, label: 'Separated', priority: 5 },
  { value: MaritalStatus.ANNULLED, label: 'Annulled', priority: 6 }
];

/**
 * Physical Status options
 */
export const physicalStatusOptions = [
  { value: PhysicalStatus.NORMAL, label: 'Normal', priority: 1 },
  { value: PhysicalStatus.VISUALLY_IMPAIRED, label: 'Visually Impaired', priority: 2 },
  { value: PhysicalStatus.HEARING_IMPAIRED, label: 'Hearing Impaired', priority: 3 },
  { value: PhysicalStatus.MOBILITY_IMPAIRED, label: 'Mobility Impaired', priority: 4 },
  { value: PhysicalStatus.OTHER, label: 'Other', priority: 5 }
];

/**
 * Employment Type options
 */
export const employmentTypeOptions = [
  { value: EmploymentType.GOVERNMENT_JOB, label: 'Government Job', category: 'employed' },
  { value: EmploymentType.PRIVATE_JOB, label: 'Private Job', category: 'employed' },
  { value: EmploymentType.BUSINESS, label: 'Business', category: 'self' },
  { value: EmploymentType.SELF_EMPLOYED, label: 'Self-Employed', category: 'self' },
  { value: EmploymentType.RETIRED, label: 'Retired', category: 'other' },
  { value: EmploymentType.NOT_WORKING, label: 'Not Working', category: 'other' },
  { value: EmploymentType.STUDENT, label: 'Student', category: 'other' }
];

/**
 * Family Values options
 */
export const familyValuesOptions = [
  { value: FamilyValues.ORTHODOX, label: 'Orthodox', description: 'Very traditional values' },
  { value: FamilyValues.TRADITIONAL, label: 'Traditional', description: 'Traditional family values' },
  { value: FamilyValues.MODERATE, label: 'Moderate', description: 'Balance of traditional and modern' },
  { value: FamilyValues.LIBERAL, label: 'Liberal', description: 'Open-minded and flexible' },
  { value: FamilyValues.PROGRESSIVE, label: 'Progressive', description: 'Modern and forward-thinking' }
];

/**
 * Income Range options (in Lakhs per annum)
 */
export const incomeRangeOptions = [
  { value: IncomeRange.BELOW_2L, label: 'Below 2 Lakhs', min: 0, max: 200000 },
  { value: IncomeRange.L2_TO_5L, label: '2 - 5 Lakhs', min: 200000, max: 500000 },
  { value: IncomeRange.L5_TO_10L, label: '5 - 10 Lakhs', min: 500000, max: 1000000 },
  { value: IncomeRange.L10_TO_15L, label: '10 - 15 Lakhs', min: 1000000, max: 1500000 },
  { value: IncomeRange.L15_TO_20L, label: '15 - 20 Lakhs', min: 1500000, max: 2000000 },
  { value: IncomeRange.L20_TO_30L, label: '20 - 30 Lakhs', min: 2000000, max: 3000000 },
  { value: IncomeRange.L30_TO_50L, label: '30 - 50 Lakhs', min: 3000000, max: 5000000 },
  { value: IncomeRange.ABOVE_50L, label: 'Above 50 Lakhs', min: 5000000, max: null }
];

/**
 * Photo Visibility options
 */
export const photoVisibilityOptions = [
  { 
    value: PhotoVisibility.PUBLIC, 
    label: 'Public', 
    description: 'Visible to all users',
    icon: 'public'
  },
  { 
    value: PhotoVisibility.PRIVATE, 
    label: 'Private', 
    description: 'Only visible to you',
    icon: 'lock'
  },
  { 
    value: PhotoVisibility.ON_REQUEST, 
    label: 'On Request', 
    description: 'Visible after you approve request',
    icon: 'visibility'
  },
  { 
    value: PhotoVisibility.PROTECTED, 
    label: 'Protected', 
    description: 'Visible after interest is accepted',
    icon: 'shield'
  }
];

/**
 * Education Level options
 */
export const educationLevelOptions = [
  { value: EducationLevel.HIGH_SCHOOL, label: 'High School', level: 1 },
  { value: EducationLevel.DIPLOMA, label: 'Diploma', level: 2 },
  { value: EducationLevel.BACHELORS, label: "Bachelor's Degree", level: 3 },
  { value: EducationLevel.MASTERS, label: "Master's Degree", level: 4 },
  { value: EducationLevel.DOCTORATE, label: 'Doctorate/PhD', level: 5 },
  { value: EducationLevel.PROFESSIONAL_DEGREE, label: 'Professional Degree (CA, CS, etc.)', level: 4 }
];

/**
 * Diet Preference options
 */
export const dietPreferenceOptions = [
  { value: DietPreference.VEGETARIAN, label: 'Vegetarian', icon: '🥗' },
  { value: DietPreference.NON_VEGETARIAN, label: 'Non-Vegetarian', icon: '🍗' },
  { value: DietPreference.EGGETARIAN, label: 'Eggetarian', icon: '🥚' },
  { value: DietPreference.VEGAN, label: 'Vegan', icon: '🌱' }
];

/**
 * Drinking Habit options
 */
export const drinkingHabitOptions = [
  { value: DrinkingHabit.NEVER, label: 'Never', severity: 0 },
  { value: DrinkingHabit.OCCASIONALLY, label: 'Occasionally', severity: 1 },
  { value: DrinkingHabit.SOCIALLY, label: 'Socially', severity: 2 },
  { value: DrinkingHabit.REGULARLY, label: 'Regularly', severity: 3 }
];

/**
 * Smoking Habit options
 */
export const smokingHabitOptions = [
  { value: SmokingHabit.NEVER, label: 'Never', severity: 0 },
  { value: SmokingHabit.OCCASIONALLY, label: 'Occasionally', severity: 1 },
  { value: SmokingHabit.SOCIALLY, label: 'Socially', severity: 2 },
  { value: SmokingHabit.REGULARLY, label: 'Regularly', severity: 3 }
];

/**
 * Height ranges (in cm) for search filters
 */
export const heightRanges = [
  { label: "Below 4'6\" (137 cm)", min: 0, max: 137 },
  { label: "4'6\" - 4'11\" (137-150 cm)", min: 137, max: 150 },
  { label: "5'0\" - 5'4\" (152-163 cm)", min: 152, max: 163 },
  { label: "5'5\" - 5'8\" (165-173 cm)", min: 165, max: 173 },
  { label: "5'9\" - 6'0\" (175-183 cm)", min: 175, max: 183 },
  { label: "6'1\" - 6'4\" (185-193 cm)", min: 185, max: 193 },
  { label: "Above 6'4\" (193+ cm)", min: 193, max: 250 }
];

/**
 * Age ranges for search filters
 */
export const ageRanges = [
  { label: '18-21', min: 18, max: 21 },
  { label: '22-25', min: 22, max: 25 },
  { label: '26-30', min: 26, max: 30 },
  { label: '31-35', min: 31, max: 35 },
  { label: '36-40', min: 36, max: 40 },
  { label: '41-45', min: 41, max: 45 },
  { label: '46-50', min: 46, max: 50 },
  { label: '50+', min: 50, max: 100 }
];

/**
 * Mother Tongue options (Common Indian languages)
 */
export const motherTongueOptions = [
  'Hindi',
  'English',
  'Bengali',
  'Telugu',
  'Marathi',
  'Tamil',
  'Gujarati',
  'Urdu',
  'Kannada',
  'Malayalam',
  'Odia',
  'Punjabi',
  'Assamese',
  'Maithili',
  'Sanskrit',
  'Konkani',
  'Nepali',
  'Sindhi',
  'Kashmiri',
  'Other'
];

/**
 * Rasi (Moon Sign) options
 */
export const rasiOptions = [
  'Mesha (Aries)',
  'Vrishabha (Taurus)',
  'Mithuna (Gemini)',
  'Karka (Cancer)',
  'Simha (Leo)',
  'Kanya (Virgo)',
  'Tula (Libra)',
  'Vrishchika (Scorpio)',
  'Dhanu (Sagittarius)',
  'Makara (Capricorn)',
  'Kumbha (Aquarius)',
  'Meena (Pisces)'
];

/**
 * Nakshatra (Birth Star) options
 */
export const nakshatraOptions = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati'
];
