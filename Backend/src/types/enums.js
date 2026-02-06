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
 * User Account Status - For admin user management
 * Phase 5 - Task 5.1: Admin User Management
 */
export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED'
};

/**
 * Admin Bulk Actions
 */
export const AdminBulkAction = {
  ACTIVATE: 'ACTIVATE',
  DEACTIVATE: 'DEACTIVATE',
  SUSPEND: 'SUSPEND',
  VERIFY_PROFILE: 'VERIFY_PROFILE'
};

/**
 * Export Formats for Admin
 */
export const ExportFormat = {
  CSV: 'CSV',
  JSON: 'JSON'
};

/**
 * Report Status - For user report management
 * Phase 5 - Task 5.4: Report Management
 */
export const ReportStatus = {
  OPEN: 'OPEN',
  IN_REVIEW: 'IN_REVIEW',
  ACTION_TAKEN: 'ACTION_TAKEN',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED',
  ESCALATED: 'ESCALATED'
};

/**
 * Report Severity Levels
 * Phase 5 - Task 5.4: Report Management
 */
export const ReportSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Report Category - Types of user reports
 * Phase 5 - Task 5.4: Report Management
 */
export const ReportCategory = {
  FAKE_PROFILE: 'FAKE_PROFILE',
  HARASSMENT: 'HARASSMENT',
  INAPPROPRIATE_PHOTO: 'INAPPROPRIATE_PHOTO',
  INAPPROPRIATE_CONTENT: 'INAPPROPRIATE_CONTENT',
  SPAM: 'SPAM',
  SCAM: 'SCAM',
  UNDERAGE: 'UNDERAGE',
  MARRIED: 'MARRIED',
  DUPLICATE_PROFILE: 'DUPLICATE_PROFILE',
  OFFENSIVE_BEHAVIOR: 'OFFENSIVE_BEHAVIOR',
  OTHER: 'OTHER'
};

/**
 * Report Actions - Moderation actions on reported users
 * Phase 5 - Task 5.4: Report Management
 */
export const ReportAction = {
  NO_ACTION: 'NO_ACTION',
  WARN_USER: 'WARN_USER',
  SUSPEND_USER: 'SUSPEND_USER',
  DEACTIVATE_USER: 'DEACTIVATE_USER',
  DELETE_CONTENT: 'DELETE_CONTENT',
  RESTRICT_FEATURES: 'RESTRICT_FEATURES',
  FLAG_USER: 'FLAG_USER'
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
export const isValidReportStatus = (value) => Object.values(ReportStatus).includes(value);
export const isValidReportSeverity = (value) => Object.values(ReportSeverity).includes(value);
export const isValidReportCategory = (value) => Object.values(ReportCategory).includes(value);
export const isValidReportAction = (value) => Object.values(ReportAction).includes(value);

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
// ============================================
// SUBSCRIPTION PLAN ENUMS (Phase 6 - Task 6.1) ✅
// ============================================

/**
 * Billing Cycle - How often subscription is billed
 */
export const BillingCycle = {
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  YEARLY: 'YEARLY'
};

/**
 * Feature Type - Data type for feature values
 */
export const FeatureType = {
  BOOLEAN: 'BOOLEAN',
  NUMBER: 'NUMBER',
  STRING: 'STRING'
};

/**
 * Reset Period - When feature usage limits reset
 */
export const ResetPeriod = {
  NONE: 'NONE',
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY'
};

/**
 * Subscription Status - Current state of user subscription
 */
export const SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
  TRIAL: 'TRIAL',
  SUSPENDED: 'SUSPENDED',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  TERMINATED_BY_ADMIN: 'TERMINATED_BY_ADMIN'
};

/**
 * Subscription Plan Codes - Standard plan identifiers
 */
export const PlanCode = {
  FREE: 'FREE',
  BASIC: 'BASIC',
  PREMIUM: 'PREMIUM',
  GOLD: 'GOLD'
};

/**
 * Feature Codes - Standard feature identifiers
 * Phase 6 - Task 6.2: Feature Gating
 */
export const FeatureCode = {
  // Engagement Limits (Daily reset)
  PROFILE_VIEW_LIMIT_DAILY: 'PROFILE_VIEW_LIMIT_DAILY',
  INTEREST_LIMIT_DAILY: 'INTEREST_LIMIT_DAILY',
  MESSAGE_LIMIT_DAILY: 'MESSAGE_LIMIT_DAILY',
  DAILY_MATCH_LIMIT: 'DAILY_MATCH_LIMIT',
  
  // High-Value Limits (Monthly reset)
  CONTACT_VIEW_LIMIT_MONTHLY: 'CONTACT_VIEW_LIMIT_MONTHLY',
  
  // Boolean Premium Features
  PROTECTED_PHOTO_ACCESS: 'PROTECTED_PHOTO_ACCESS',
  ADVANCED_FILTERS: 'ADVANCED_FILTERS',
  UNLIMITED_CHAT: 'UNLIMITED_CHAT',
  PRIORITY_SUPPORT: 'PRIORITY_SUPPORT',
  PROFILE_BOOST: 'PROFILE_BOOST',
  READ_RECEIPTS: 'READ_RECEIPTS',
  VIP_BADGE: 'VIP_BADGE',
  DEDICATED_MANAGER: 'DEDICATED_MANAGER',
  PRIORITY_MATCHING: 'PRIORITY_MATCHING'
};

/**
 * Feature Gating Error Codes
 * Phase 6 - Task 6.2: Feature Gating
 */
export const FeatureGatingError = {
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE',           // Feature not in plan
  FEATURE_LIMIT_REACHED: 'FEATURE_LIMIT_REACHED',           // Limit exceeded
  PLAN_RESTRICTION: 'PLAN_RESTRICTION',                     // Plan doesn't allow this
  NO_ACTIVE_SUBSCRIPTION: 'NO_ACTIVE_SUBSCRIPTION',         // User has no subscription
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED'              // Subscription expired
};

/**
 * Feature Flags - Phased Rollout Control
 * Phase 6 - Task 6.2: Feature Gating
 */
export const FeatureFlag = {
  // Phase 0 - Logging only
  LOGGING_ONLY: 'LOGGING_ONLY',
  
  // Phase 1 - Hard-gated features
  GATE_CONTACT_VIEWS: 'GATE_CONTACT_VIEWS',
  GATE_PROTECTED_PHOTOS: 'GATE_PROTECTED_PHOTOS',
  GATE_ADVANCED_FILTERS: 'GATE_ADVANCED_FILTERS',
  
  // Phase 2 - Soft-gated features
  GATE_INTERESTS: 'GATE_INTERESTS',
  GATE_MESSAGING: 'GATE_MESSAGING',
  GATE_PROFILE_VIEWS: 'GATE_PROFILE_VIEWS',
  
  // Phase 3 - Additional features
  GATE_DAILY_MATCHES: 'GATE_DAILY_MATCHES'
};

/**
 * Subscription Plan Configuration
 */
export const SubscriptionConfig = {
  MIN_PRICE_PAISE: 0,              // ₹0 for free plans
  MAX_PRICE_PAISE: 10000000,       // ₹1,00,000 max
  MAX_TRIAL_DAYS: 90,              // Maximum trial period
  MIN_DURATION_DAYS: 1,            // Minimum subscription duration
  MAX_DURATION_DAYS: 3650,         // Maximum 10 years
  UNLIMITED_VALUE: -1,             // Represents unlimited feature usage
  FREE_PLAN_PRIORITY: 0,           // Priority for free plans
  MAX_PLAN_PRIORITY: 100           // Maximum plan priority
};

// ============================================
// AUDIT LOGGING ENUMS (Phase 5 - Task 5.6) ✅
// ============================================

/**
 * Audit Action Types - Categories of auditable actions
 * Phase 5 - Task 5.6: Audit Logging
 */
export const AuditActionType = {
  ADMIN_ACTION: 'ADMIN_ACTION',
  USER_ACTION: 'USER_ACTION',
  SYSTEM_ACTION: 'SYSTEM_ACTION',
  AUTH_EVENT: 'AUTH_EVENT'
};

/**
 * Audit Resource Types - Types of resources affected by actions
 * Phase 5 - Task 5.6: Audit Logging
 */
export const AuditResourceType = {
  USER: 'USER',
  PHOTO: 'PHOTO',
  REPORT: 'REPORT',
  SUBSCRIPTION: 'SUBSCRIPTION',
  INTEREST: 'INTEREST',
  MESSAGE: 'MESSAGE',
  PROFILE: 'PROFILE',
  SHORTLIST: 'SHORTLIST',
  BLOCK: 'BLOCK',
  MATCH: 'MATCH',
  PLAN: 'PLAN',
  SESSION: 'SESSION',
  SYSTEM: 'SYSTEM'
};

/**
 * Audit Status - Result status of audited action
 * Phase 5 - Task 5.6: Audit Logging
 */
export const AuditStatus = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  PARTIAL: 'PARTIAL'
};

/**
 * Audit Actions - Comprehensive list of auditable actions
 * Phase 5 - Task 5.6: Audit Logging
 */
export const AuditAction = {
  // Authentication & Security (AUTH_EVENT)
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SESSION_INVALIDATED: 'SESSION_INVALIDATED',
  SUSPICIOUS_LOGIN_DETECTED: 'SUSPICIOUS_LOGIN_DETECTED',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',
  
  // Password & Credentials (AUTH_EVENT)
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  FORGOT_PASSWORD_REQUESTED: 'FORGOT_PASSWORD_REQUESTED',
  PASSWORD_RESET_SUCCESS: 'PASSWORD_RESET_SUCCESS',
  EXCESSIVE_OTP_ATTEMPTS: 'EXCESSIVE_OTP_ATTEMPTS',
  
  // Verification (AUTH_EVENT)
  OTP_REQUESTED: 'OTP_REQUESTED',
  OTP_VERIFIED_SUCCESS: 'OTP_VERIFIED_SUCCESS',
  OTP_VERIFIED_FAILURE: 'OTP_VERIFIED_FAILURE',
  EMAIL_VERIFIED: 'EMAIL_VERIFIED',
  MOBILE_VERIFIED: 'MOBILE_VERIFIED',
  VERIFICATION_REVOKED: 'VERIFICATION_REVOKED',
  
  // Profile & Identity (USER_ACTION)
  PERSONAL_DETAILS_UPDATED: 'PERSONAL_DETAILS_UPDATED',
  CONTACT_INFO_UPDATED: 'CONTACT_INFO_UPDATED',
  PROFILE_PHOTO_UPLOADED: 'PROFILE_PHOTO_UPLOADED',
  PROFILE_PHOTO_DELETED: 'PROFILE_PHOTO_DELETED',
  PROFILE_PHOTO_CHANGED: 'PROFILE_PHOTO_CHANGED',
  CASTE_DETAILS_UPDATED: 'CASTE_DETAILS_UPDATED',
  EDUCATION_DETAILS_UPDATED: 'EDUCATION_DETAILS_UPDATED',
  PROFESSIONAL_DETAILS_UPDATED: 'PROFESSIONAL_DETAILS_UPDATED',
  FAMILY_DETAILS_UPDATED: 'FAMILY_DETAILS_UPDATED',
  HOROSCOPE_DETAILS_UPDATED: 'HOROSCOPE_DETAILS_UPDATED',
  PARTNER_PREFERENCES_UPDATED: 'PARTNER_PREFERENCES_UPDATED',
  
  // Privacy & Safety (USER_ACTION)
  USER_BLOCKED: 'USER_BLOCKED',
  USER_UNBLOCKED: 'USER_UNBLOCKED',
  USER_REPORTED: 'USER_REPORTED',
  REPORT_WITHDRAWN: 'REPORT_WITHDRAWN',
  APPEAL_SUBMITTED: 'APPEAL_SUBMITTED',
  
  // Subscriptions & Payments (USER_ACTION)
  SUBSCRIPTION_PURCHASED: 'SUBSCRIPTION_PURCHASED',
  SUBSCRIPTION_UPGRADED: 'SUBSCRIPTION_UPGRADED',
  SUBSCRIPTION_DOWNGRADED: 'SUBSCRIPTION_DOWNGRADED',
  SUBSCRIPTION_CANCELLED: 'SUBSCRIPTION_CANCELLED',
  AUTO_RENEW_ENABLED: 'AUTO_RENEW_ENABLED',
  AUTO_RENEW_DISABLED: 'AUTO_RENEW_DISABLED',
  PAYMENT_FAILURE: 'PAYMENT_FAILURE',
  SUBSCRIPTION_MANUAL_OVERRIDE: 'SUBSCRIPTION_MANUAL_OVERRIDE',
  
  // Account Lifecycle (USER_ACTION)
  ACCOUNT_SELF_DEACTIVATED: 'ACCOUNT_SELF_DEACTIVATED',
  ACCOUNT_REACTIVATED: 'ACCOUNT_REACTIVATED',
  ACCOUNT_DELETION_REQUESTED: 'ACCOUNT_DELETION_REQUESTED',
  DATA_EXPORT_REQUESTED: 'DATA_EXPORT_REQUESTED',
  
  // Admin - User Management (ADMIN_ACTION)
  ADMIN_USER_STATUS_CHANGED: 'ADMIN_USER_STATUS_CHANGED',
  ADMIN_USER_VERIFIED: 'ADMIN_USER_VERIFIED',
  ADMIN_USER_UNVERIFIED: 'ADMIN_USER_UNVERIFIED',
  ADMIN_USER_DELETED: 'ADMIN_USER_DELETED',
  ADMIN_USER_EXPORTED: 'ADMIN_USER_EXPORTED',
  ADMIN_BULK_OPERATION: 'ADMIN_BULK_OPERATION',
  
  // Admin - Photo Moderation (ADMIN_ACTION)
  ADMIN_PHOTO_APPROVED: 'ADMIN_PHOTO_APPROVED',
  ADMIN_PHOTO_REJECTED: 'ADMIN_PHOTO_REJECTED',
  ADMIN_PHOTO_DELETED: 'ADMIN_PHOTO_DELETED',
  ADMIN_PHOTO_BULK_APPROVED: 'ADMIN_PHOTO_BULK_APPROVED',
  ADMIN_PHOTO_BULK_REJECTED: 'ADMIN_PHOTO_BULK_REJECTED',
  
  // Admin - Report Management (ADMIN_ACTION)
  ADMIN_REPORT_STATUS_UPDATED: 'ADMIN_REPORT_STATUS_UPDATED',
  ADMIN_REPORT_ACTION_TAKEN: 'ADMIN_REPORT_ACTION_TAKEN',
  ADMIN_REPORT_RESOLVED: 'ADMIN_REPORT_RESOLVED',
  ADMIN_REPORT_DISMISSED: 'ADMIN_REPORT_DISMISSED',
  ADMIN_REPORT_ESCALATED: 'ADMIN_REPORT_ESCALATED',
  
  // Admin - Subscription Management (ADMIN_ACTION)
  ADMIN_PLAN_CREATED: 'ADMIN_PLAN_CREATED',
  ADMIN_PLAN_UPDATED: 'ADMIN_PLAN_UPDATED',
  ADMIN_PLAN_DEACTIVATED: 'ADMIN_PLAN_DEACTIVATED',
  ADMIN_PLAN_ACTIVATED: 'ADMIN_PLAN_ACTIVATED',
  ADMIN_FEATURE_CREATED: 'ADMIN_FEATURE_CREATED',
  ADMIN_FEATURE_UPDATED: 'ADMIN_FEATURE_UPDATED',
  
  // Admin - Moderation Actions (ADMIN_ACTION)
  ADMIN_USER_WARNED: 'ADMIN_USER_WARNED',
  ADMIN_USER_SUSPENDED: 'ADMIN_USER_SUSPENDED',
  ADMIN_USER_DEACTIVATED: 'ADMIN_USER_DEACTIVATED',
  ADMIN_CONTENT_DELETED: 'ADMIN_CONTENT_DELETED',
  ADMIN_FEATURES_RESTRICTED: 'ADMIN_FEATURES_RESTRICTED',
  ADMIN_USER_FLAGGED: 'ADMIN_USER_FLAGGED',
  
  // Admin - Auth Events (ADMIN_ACTION)
  ADMIN_LOGIN: 'ADMIN_LOGIN',
  ADMIN_LOGOUT: 'ADMIN_LOGOUT',
  
  // System Actions (SYSTEM_ACTION)
  SYSTEM_SUBSCRIPTION_EXPIRED: 'SYSTEM_SUBSCRIPTION_EXPIRED',
  SYSTEM_SUBSCRIPTION_RENEWED: 'SYSTEM_SUBSCRIPTION_RENEWED',
  SYSTEM_AUTO_CLEANUP: 'SYSTEM_AUTO_CLEANUP',
  SYSTEM_DATA_ARCHIVED: 'SYSTEM_DATA_ARCHIVED',
  SYSTEM_SCHEDULED_TASK: 'SYSTEM_SCHEDULED_TASK'
};

/**
 * Audit Retention Configuration
 * Phase 5 - Task 5.6: Audit Logging
 */
export const AuditRetentionConfig = {
  RETENTION_MONTHS_MIN: 12,    // Minimum 12 months
  RETENTION_MONTHS_MAX: 24,    // Maximum 24 months
  EXPORT_ENABLED: true,        // Audit logs can be exported
  PII_MASKING: true           // Always mask PII in audit logs
};

/**
 * Feature Limits by Plan
 * Phase 6 - Task 6.2: Feature Gating
 */
export const FeatureLimits = {
  FREE: {
    PROFILE_VIEWS_DAILY: 50,
    CONTACT_VIEWS_MONTHLY: 5,  // Give free users a taste
    INTERESTS_DAILY: 5,
    MESSAGES_DAILY: 10,
    DAILY_MATCHES: 10,
    PROTECTED_PHOTOS: false,
    ADVANCED_FILTERS: false,
    UNLIMITED_CHAT: false
  },
  BASIC: {
    PROFILE_VIEWS_DAILY: 200,
    CONTACT_VIEWS_MONTHLY: 30,
    INTERESTS_DAILY: 15,
    MESSAGES_DAILY: -1,  // Unlimited
    DAILY_MATCHES: 20,
    PROTECTED_PHOTOS: false,
    ADVANCED_FILTERS: false,
    UNLIMITED_CHAT: true
  },
  PREMIUM: {
    PROFILE_VIEWS_DAILY: -1,  // Unlimited
    CONTACT_VIEWS_MONTHLY: 75,
    INTERESTS_DAILY: 50,
    MESSAGES_DAILY: -1,  // Unlimited
    DAILY_MATCHES: 50,
    PROTECTED_PHOTOS: true,
    ADVANCED_FILTERS: true,
    UNLIMITED_CHAT: true
  },
  GOLD: {
    PROFILE_VIEWS_DAILY: -1,  // Unlimited
    CONTACT_VIEWS_MONTHLY: -1,  // Unlimited
    INTERESTS_DAILY: -1,  // Unlimited
    MESSAGES_DAILY: -1,  // Unlimited
    DAILY_MATCHES: -1,  // Unlimited
    PROTECTED_PHOTOS: true,
    ADVANCED_FILTERS: true,
    UNLIMITED_CHAT: true
  }
};

// Subscription Plan Validators
export const isValidBillingCycle = (value) => Object.values(BillingCycle).includes(value);
export const isValidFeatureType = (value) => Object.values(FeatureType).includes(value);
export const isValidResetPeriod = (value) => Object.values(ResetPeriod).includes(value);
export const isValidSubscriptionStatus = (value) => Object.values(SubscriptionStatus).includes(value);
export const isValidPlanCode = (value) => Object.values(PlanCode).includes(value);
export const isValidFeatureCode = (value) => Object.values(FeatureCode).includes(value);
export const isValidFeatureFlag = (value) => Object.values(FeatureFlag).includes(value);
export const isValidFeatureGatingError = (value) => Object.values(FeatureGatingError).includes(value);
