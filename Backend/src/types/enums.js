// TypeScript-style enums for application-level type safety
// These match the CHECK constraints in the database

// ============================================
// BASIC ENUMS (Phase 1 - Task 1.10) ✅
// ============================================

export const Gender = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other'
};

export const ProfileCreatedBy = {
  SELF: 'Self',
  PARENT: 'Parent',
  GUARDIAN: 'Guardian'
};

export const InterestStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED'
};

/**
 * Match Type - Categorizes different types of matches
 * Phase 3 - Task 3.4: Matchmaking Algorithm
 */
export const MatchType = {
  DAILY_MATCH: 'DAILY_MATCH',       // Daily curated matches
  RECOMMENDATION: 'RECOMMENDATION',  // General recommendations
  NEW_MATCH: 'NEW_MATCH'            // Newly discovered matches
};

/**
 * Match Score Thresholds - Minimum scores required for each match type
 */
export const MatchScoreThreshold = {
  DAILY_MATCH: 60,      // ≥ 60% for daily matches
  RECOMMENDATION: 50,   // ≥ 50% for recommendations
  NEW_MATCH: 40        // ≥ 40% for new matches
};

/**
 * Match Interaction Actions - User actions on matches
 */
export const MatchAction = {
  VIEWED: 'VIEWED',
  SKIPPED: 'SKIPPED',
  INTERESTED: 'INTERESTED'
};

/**
 * Profile Completion Requirements for Matchmaking
 */
export const ProfileCompletionRequirement = {
  TO_APPEAR_IN_MATCHES: 70,  // Minimum 70% to appear in recommendations
  TO_VIEW_MATCHES: 50        // Minimum 50% to view recommendations
};

/**
 * Match Configuration Constants
 */
export const MatchConfig = {
  DEFAULT_RECOMMENDATIONS_PER_PAGE: 20,
  DAILY_MATCHES_COUNT: 10,
  MATCH_RESHOWN_COOLDOWN_DAYS: 30,
  MATCH_CACHE_TTL_MINUTES: 30,
  NEW_MATCHES_LOOKBACK_DAYS: 30
};

// ============================================
// EXTENDED ENUMS (Phase 1 - Task 1.11) ✅
// ============================================

/**
 * Marital Status options
 */
export const MaritalStatus = {
  NEVER_MARRIED: 'Never Married',
  DIVORCED: 'Divorced',
  WIDOWED: 'Widowed',
  AWAITING_DIVORCE: 'Awaiting Divorce',
  SEPARATED: 'Separated',
  ANNULLED: 'Annulled'
};

/**
 * Physical Status options
 */
export const PhysicalStatus = {
  NORMAL: 'Normal',
  VISUALLY_IMPAIRED: 'Visually Impaired',
  HEARING_IMPAIRED: 'Hearing Impaired',
  MOBILITY_IMPAIRED: 'Mobility Impaired',
  OTHER: 'Other'
};

/**
 * Employment Type options
 */
export const EmploymentType = {
  GOVERNMENT_JOB: 'Government Job',
  PRIVATE_JOB: 'Private Job',
  BUSINESS: 'Business',
  SELF_EMPLOYED: 'Self-Employed',
  FREELANCER_CONSULTANT: 'Freelancer / Consultant',
  HOMEMAKER: 'Homemaker',
  STUDENT: 'Student',
  RETIRED: 'Retired',
  NOT_WORKING: 'Not Working'
};

/**
 * Family Values options
 */
export const FamilyValues = {
  ORTHODOX: 'Orthodox',
  TRADITIONAL: 'Traditional',
  MODERATE: 'Moderate',
  LIBERAL: 'Liberal',
  PROGRESSIVE: 'Progressive'
};

/**
 * Income Range options (in Lakhs per annum)
 */
export const IncomeRange = {
  BELOW_2L: 'Below 2 Lakhs',
  L2_TO_5L: '2 - 5 Lakhs',
  L5_TO_10L: '5 - 10 Lakhs',
  L10_TO_15L: '10 - 15 Lakhs',
  L15_TO_20L: '15 - 20 Lakhs',
  L20_TO_30L: '20 - 30 Lakhs',
  L30_TO_50L: '30 - 50 Lakhs',
  ABOVE_50L: 'Above 50 Lakhs'
};

/**
 * Work Location Type options
 */
export const WorkLocationType = {
  ON_SITE: 'On-Site',
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  MULTIPLE_LOCATIONS: 'Multiple Locations',
  OVERSEAS: 'Overseas'
};

/**
 * Photo Visibility options
 */
export const PhotoVisibility = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
  ON_REQUEST: 'ON_REQUEST',
  PROTECTED: 'PROTECTED' // Visible after interest accepted
};

/**
 * Education Level options
 */
export const EducationLevel = {
  HIGH_SCHOOL: 'High School',
  DIPLOMA: 'Diploma',
  BACHELORS: "Bachelor's Degree",
  MASTERS: "Master's Degree",
  DOCTORATE: 'Doctorate/PhD',
  PROFESSIONAL_DEGREE: 'Professional Degree'
};

/**
 * Diet Preference options
 */
export const DietPreference = {
  VEGETARIAN: 'Vegetarian',
  NON_VEGETARIAN: 'Non-Vegetarian',
  EGGETARIAN: 'Eggetarian',
  VEGAN: 'Vegan'
};

/**
 * Drinking Habit options
 */
export const DrinkingHabit = {
  NEVER: 'Never',
  OCCASIONALLY: 'Occasionally',
  SOCIALLY: 'Socially',
  REGULARLY: 'Regularly'
};

/**
 * Smoking Habit options
 */
export const SmokingHabit = {
  NEVER: 'Never',
  OCCASIONALLY: 'Occasionally',
  SOCIALLY: 'Socially',
  REGULARLY: 'Regularly'
};

/**
 * Complexion options
 */
export const Complexion = {
  VERY_FAIR: 'Very Fair',
  FAIR: 'Fair',
  WHEATISH: 'Wheatish',
  WHEATISH_BROWN: 'Wheatish Brown',
  DARK: 'Dark'
};

/**
 * Body Type options
 */
export const BodyType = {
  SLIM: 'Slim',
  AVERAGE: 'Average',
  ATHLETIC: 'Athletic',
  HEAVY: 'Heavy'
};

/**
 * Blood Group options
 */
export const BloodGroup = {
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB-',
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O-'
};

// ============================================
// VALIDATION HELPERS
// ============================================

// Basic Enums Validators
export const isValidGender = (value) => Object.values(Gender).includes(value);
export const isValidProfileCreatedBy = (value) => Object.values(ProfileCreatedBy).includes(value);
export const isValidInterestStatus = (value) => Object.values(InterestStatus).includes(value);

// Extended Enums Validators
export const isValidMaritalStatus = (value) => Object.values(MaritalStatus).includes(value);
export const isValidPhysicalStatus = (value) => Object.values(PhysicalStatus).includes(value);
export const isValidEmploymentType = (value) => Object.values(EmploymentType).includes(value);
export const isValidFamilyValues = (value) => Object.values(FamilyValues).includes(value);
export const isValidIncomeRange = (value) => Object.values(IncomeRange).includes(value);
export const isValidWorkLocationType = (value) => Object.values(WorkLocationType).includes(value);
export const isValidPhotoVisibility = (value) => Object.values(PhotoVisibility).includes(value);
export const isValidEducationLevel = (value) => Object.values(EducationLevel).includes(value);
export const isValidDietPreference = (value) => Object.values(DietPreference).includes(value);
export const isValidDrinkingHabit = (value) => Object.values(DrinkingHabit).includes(value);
export const isValidSmokingHabit = (value) => Object.values(SmokingHabit).includes(value);
export const isValidComplexion = (value) => Object.values(Complexion).includes(value);
export const isValidBodyType = (value) => Object.values(BodyType).includes(value);
export const isValidBloodGroup = (value) => Object.values(BloodGroup).includes(value);
export const isValidMatchType = (value) => Object.values(MatchType).includes(value);
export const isValidMatchAction = (value) => Object.values(MatchAction).includes(value);

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get all values from an enum object
 * @param {Object} enumObj - The enum object
 * @returns {Array} Array of enum values
 */
export const getEnumValues = (enumObj) => Object.values(enumObj);

/**
 * Get all keys from an enum object
 * @param {Object} enumObj - The enum object
 * @returns {Array} Array of enum keys
 */
export const getEnumKeys = (enumObj) => Object.keys(enumObj);

/**
 * Check if a value exists in any enum
 * @param {Object} enumObj - The enum object
 * @param {any} value - The value to check
 * @returns {boolean} True if value exists in enum
 */
export const isValidEnum = (enumObj, value) => Object.values(enumObj).includes(value);
