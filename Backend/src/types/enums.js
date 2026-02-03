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
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN'
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
// ============================================
// PROFILE VIEWS ENUMS (Phase 3 - Task 3.5) ✅
// ============================================

/**
 * View Source - Where the profile view originated from
 */
export const ViewSource = {
  SEARCH: 'SEARCH',             // From search results
  MATCH: 'MATCH',               // From match recommendations
  RECOMMENDATION: 'RECOMMENDATION',  // From matchmaking
  DIRECT: 'DIRECT',             // Direct profile link
  SHORTLIST: 'SHORTLIST',       // From shortlisted profiles
  INTEREST: 'INTEREST'          // From interest sent/received
};

/**
 * Profile View Rate Limiting Configuration
 */
export const ViewRateLimitConfig = {
  MAX_VIEWS_PER_HOUR: 3,        // Max 3 view records per viewer-profile pair per hour
  RATE_LIMIT_WINDOW_HOURS: 1,  // Window size in hours
  MAX_DURATION_SECONDS: 600     // Cap view duration at 10 minutes
};

/**
 * Profile View Display Configuration
 */
export const ViewDisplayConfig = {
  ACTIVE_NOW_THRESHOLD_MINUTES: 5,     // "Active now" if last_active < 5 min
  ACTIVE_TODAY_THRESHOLD_HOURS: 24,    // "Active today" if last_active < 24h
  ACTIVE_THIS_WEEK_THRESHOLD_DAYS: 7,  // "Active this week" if last_active < 7 days
  HIDE_AFTER_DAYS: 30,                  // Don't show last_active if > 30 days
  DEFAULT_VIEWERS_PER_PAGE: 20,         // Default pagination size
  MAX_VIEWERS_PER_PAGE: 50,             // Maximum pagination size
  RECENT_VIEW_CACHE_TTL_MINUTES: 10,    // Cache recent viewers for 10 min
  VIEW_COUNT_CACHE_TTL_HOURS: 1         // Cache view counts for 1 hour
};

/**
 * Last Active Update Configuration
 */
export const LastActiveConfig = {
  UPDATE_THROTTLE_MINUTES: 5,    // Update max once per 5 minutes
  MEANINGFUL_ACTIONS: [           // Actions that trigger last_active update
    'LOGIN',
    'PROFILE_VIEW',
    'SEARCH',
    'MESSAGE_SEND',
    'INTEREST_SEND',
    'MATCH_VIEW'
  ]
};

/**
 * View Analytics Tracking
 */
export const ViewAnalyticsConfig = {
  TRACK_DURATION: true,           // Track how long user viewed profile
  TRACK_IP_ADDRESS: true,         // Track IP for security/analytics
  TRACK_USER_AGENT: true,         // Track device/browser info
  LINK_TO_SEARCH: true,           // Link views to search logs when applicable
  ANONYMIZE_AFTER_DAYS: 90        // Anonymize old views after 90 days
};

/**
 * Profile View Notification Settings
 */
export const ViewNotificationConfig = {
  ENABLED: true,                  // Enable profile view notifications
  TYPE: 'DAILY_DIGEST',          // REAL_TIME, DAILY_DIGEST, WEEKLY_DIGEST
  DIGEST_TIME_HOUR: 20,          // Send daily digest at 8 PM
  MIN_VIEWS_TO_NOTIFY: 1,        // Minimum views to trigger notification
  INCLUDE_ANONYMOUS: false        // Include anonymous views in notifications (future)
};

// ============================================
// INTEREST & NOTIFICATION ENUMS (Phase 4 - Task 4.1) ✅
// ============================================

/**
 * Notification Type - Categories of in-app notifications
 */
export const NotificationType = {
  INTEREST_RECEIVED: 'INTEREST_RECEIVED',
  INTEREST_ACCEPTED: 'INTEREST_ACCEPTED',
  INTEREST_REJECTED: 'INTEREST_REJECTED',
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
  PROFILE_VIEW: 'PROFILE_VIEW',
  MATCH_FOUND: 'MATCH_FOUND'
};

/**
 * Interest Configuration Constants
 */
export const InterestConfig = {
  REJECTION_COOLDOWN_DAYS: 30,          // Days before can re-send after rejection
  MIN_PROFILE_COMPLETION_TO_SEND: 60,   // Minimum 60% completion to send interest
  AUTO_ACCEPT_MUTUAL: true,             // Auto-accept when both send interest
  MAX_PENDING_INTERESTS: 100            // Maximum pending outgoing interests
};

// Notification Type Validator
export const isValidNotificationType = (value) => Object.values(NotificationType).includes(value);